import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  getTutorSession,
} from "@/lib/tutor-auth";

import {
  createAdminClient,
} from "@/lib/supabase/admin";

import {
  LEARNING_MATERIAL_BUCKET,
  cleanText,
  materialPathBelongsTo,
  materialStoragePath,
  safeFilename,
  sameOrigin,
  splitStoragePath,
  uuidPattern,
  validCategory,
  validateLearningFile,
} from "@/lib/learning-materials";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type UploadBody = {
  studentId?: string;
  engagementId?: string;
  sessionId?: string | null;

  filename?: string;
  mimeType?: string;
  sizeBytes?: number;

  title?: string;
  description?: string;
  category?: string;

  storagePath?: string;
};

async function validateTutorAccess(input: {
  tutorId: string;
  studentId: string;
  engagementId: string;
  sessionId?: string | null;
}) {
  const supabase =
    createAdminClient();

  const {
    data: engagement,
    error,
  } = await supabase
    .from("tutoring_engagements")
    .select("id,student_id,tutor_id")
    .eq("id", input.engagementId)
    .eq("student_id", input.studentId)
    .eq("tutor_id", input.tutorId)
    .maybeSingle();

  if (error || !engagement) {
    return false;
  }

  if (input.sessionId) {
    const {
      data: session,
      error: sessionError,
    } = await supabase
      .from("tutoring_sessions")
      .select("id")
      .eq("id", input.sessionId)
      .eq(
        "engagement_id",
        input.engagementId,
      )
      .eq(
        "tutor_id",
        input.tutorId,
      )
      .maybeSingle();

    if (
      sessionError ||
      !session
    ) {
      return false;
    }
  }

  return true;
}

export async function POST(
  request: NextRequest,
) {
  if (!sameOrigin(request)) {
    return NextResponse.json(
      { error: "Invalid origin." },
      { status: 403 },
    );
  }

  if (
    Number(
      request.headers.get(
        "content-length",
      ) || 0,
    ) > 30_000
  ) {
    return NextResponse.json(
      { error: "Request too large." },
      { status: 413 },
    );
  }

  const session =
    await getTutorSession();

  if (!session) {
    return NextResponse.json(
      { error: "Unauthorized." },
      { status: 401 },
    );
  }

  let body: UploadBody;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request." },
      { status: 400 },
    );
  }

  const studentId =
    cleanText(body.studentId, 100);

  const engagementId =
    cleanText(body.engagementId, 100);

  const sessionId =
    cleanText(body.sessionId, 100) ||
    null;

  if (
    !uuidPattern.test(studentId) ||
    !uuidPattern.test(engagementId) ||
    (
      sessionId &&
      !uuidPattern.test(sessionId)
    )
  ) {
    return NextResponse.json(
      {
        error:
          "Invalid student, engagement or session.",
      },
      { status: 400 },
    );
  }

  const hasAccess =
    await validateTutorAccess({
      tutorId: session.tutor.id,
      studentId,
      engagementId,
      sessionId,
    });

  if (!hasAccess) {
    return NextResponse.json(
      { error: "Student workspace not found." },
      { status: 404 },
    );
  }

  const filename =
    safeFilename(body.filename);

  const mimeType =
    cleanText(
      body.mimeType,
      200,
    ) ||
    "application/octet-stream";

  const sizeBytes =
    Number(body.sizeBytes);

  const validationError =
    validateLearningFile({
      filename,
      mimeType,
      sizeBytes,
    });

  if (validationError) {
    return NextResponse.json(
      { error: validationError },
      { status: 400 },
    );
  }

  const path =
    materialStoragePath({
      studentId,
      engagementId,
      role: "tutor",
      filename,
    });

  const supabase =
    createAdminClient();

  const {
    data,
    error,
  } = await supabase.storage
    .from(
      LEARNING_MATERIAL_BUCKET,
    )
    .createSignedUploadUrl(
      path,
    );

  if (error || !data?.token) {
    console.error(
      "Could not create tutor material upload URL:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Could not prepare the file upload.",
      },
      { status: 500 },
    );
  }

  return NextResponse.json(
    {
      bucket:
        LEARNING_MATERIAL_BUCKET,
      path,
      token: data.token,
      filename,
    },
    {
      headers: {
        "Cache-Control":
          "private, no-store",
      },
    },
  );
}

export async function PUT(
  request: NextRequest,
) {
  if (!sameOrigin(request)) {
    return NextResponse.json(
      { error: "Invalid origin." },
      { status: 403 },
    );
  }

  const session =
    await getTutorSession();

  if (!session) {
    return NextResponse.json(
      { error: "Unauthorized." },
      { status: 401 },
    );
  }

  let body: UploadBody;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request." },
      { status: 400 },
    );
  }

  const studentId =
    cleanText(body.studentId, 100);

  const engagementId =
    cleanText(body.engagementId, 100);

  const sessionId =
    cleanText(body.sessionId, 100) ||
    null;

  const storagePath =
    cleanText(
      body.storagePath,
      1000,
    );

  if (
    !uuidPattern.test(studentId) ||
    !uuidPattern.test(engagementId) ||
    (
      sessionId &&
      !uuidPattern.test(sessionId)
    ) ||
    !storagePath
  ) {
    return NextResponse.json(
      { error: "Invalid material." },
      { status: 400 },
    );
  }

  const hasAccess =
    await validateTutorAccess({
      tutorId: session.tutor.id,
      studentId,
      engagementId,
      sessionId,
    });

  if (!hasAccess) {
    return NextResponse.json(
      { error: "Student workspace not found." },
      { status: 404 },
    );
  }

  if (
    !materialPathBelongsTo({
      path: storagePath,
      studentId,
      engagementId,
      role: "tutor",
    })
  ) {
    return NextResponse.json(
      { error: "Invalid file path." },
      { status: 400 },
    );
  }

  const filename =
    safeFilename(body.filename);

  const mimeType =
    cleanText(
      body.mimeType,
      200,
    ) ||
    "application/octet-stream";

  const sizeBytes =
    Number(body.sizeBytes);

  const validationError =
    validateLearningFile({
      filename,
      mimeType,
      sizeBytes,
    });

  if (validationError) {
    return NextResponse.json(
      { error: validationError },
      { status: 400 },
    );
  }

  const pathParts =
    splitStoragePath(
      storagePath,
    );

  if (!pathParts) {
    return NextResponse.json(
      { error: "Invalid file path." },
      { status: 400 },
    );
  }

  const supabase =
    createAdminClient();

  const {
    data: storageFiles,
    error: storageError,
  } = await supabase.storage
    .from(
      LEARNING_MATERIAL_BUCKET,
    )
    .list(
      pathParts.folder,
      {
        limit: 10,
        search:
          pathParts.filename,
      },
    );

  if (
    storageError ||
    !storageFiles?.some(
      (item) =>
        item.name ===
        pathParts.filename,
    )
  ) {
    return NextResponse.json(
      {
        error:
          "The uploaded file could not be verified.",
      },
      { status: 400 },
    );
  }

  const title =
    cleanText(
      body.title,
      200,
    ) ||
    filename;

  const description =
    cleanText(
      body.description,
      3000,
    ) ||
    null;

  const {
    data: material,
    error,
  } = await supabase
    .from(
      "learning_materials",
    )
    .insert({
      student_id:
        studentId,

      engagement_id:
        engagementId,

      session_id:
        sessionId,

      uploaded_by_role:
        "tutor",

      uploaded_by_tutor_id:
        session.tutor.id,

      created_by_user_id:
        session.user.id,

      portal_link_id:
        null,

      material_type:
        "file",

      category:
        validCategory(
          body.category,
        ),

      title,
      description,

      original_filename:
        filename,

      storage_bucket:
        LEARNING_MATERIAL_BUCKET,

      storage_path:
        storagePath,

      mime_type:
        mimeType,

      size_bytes:
        sizeBytes,

      visible_to_student:
        true,

      visible_to_tutor:
        true,

      status:
        "active",
    })
    .select(
      "id,title,category,original_filename,mime_type,size_bytes,created_at",
    )
    .single();

  if (error || !material) {
    console.error(
      "Could not record tutor material:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "The file uploaded, but its learning record could not be created.",
      },
      { status: 500 },
    );
  }

  return NextResponse.json(
    {
      ok: true,
      material,
    },
    {
      headers: {
        "Cache-Control":
          "private, no-store",
      },
    },
  );
}
