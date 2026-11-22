import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  resolvePortalLink,
} from "@/lib/student-portal";

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

type Params = Promise<{
  token: string;
}>;

type UploadBody = {
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

async function validateStudentAccess(input: {
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
    .select("id,student_id")
    .eq("id", input.engagementId)
    .eq(
      "student_id",
      input.studentId,
    )
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
  {
    params,
  }: {
    params: Params;
  },
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

  const {
    token,
  } = await params;

  const link =
    await resolvePortalLink(
      token,
    );

  if (!link) {
    return NextResponse.json(
      {
        error:
          "Portal link is invalid or expired.",
      },
      { status: 404 },
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

  const engagementId =
    cleanText(
      body.engagementId,
      100,
    );

  const sessionId =
    cleanText(
      body.sessionId,
      100,
    ) ||
    null;

  if (
    !uuidPattern.test(
      engagementId,
    ) ||
    (
      sessionId &&
      !uuidPattern.test(
        sessionId,
      )
    )
  ) {
    return NextResponse.json(
      {
        error:
          "Invalid learning workspace.",
      },
      { status: 400 },
    );
  }

  const hasAccess =
    await validateStudentAccess({
      studentId:
        link.student_id,
      engagementId,
      sessionId,
    });

  if (!hasAccess) {
    return NextResponse.json(
      {
        error:
          "Learning workspace not found.",
      },
      { status: 404 },
    );
  }

  const filename =
    safeFilename(
      body.filename,
    );

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
      {
        error:
          validationError,
      },
      { status: 400 },
    );
  }

  const path =
    materialStoragePath({
      studentId:
        link.student_id,

      engagementId,

      role:
        "student",

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

  if (
    error ||
    !data?.token
  ) {
    console.error(
      "Could not create student material upload URL:",
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
  {
    params,
  }: {
    params: Params;
  },
) {
  if (!sameOrigin(request)) {
    return NextResponse.json(
      { error: "Invalid origin." },
      { status: 403 },
    );
  }

  const {
    token,
  } = await params;

  // MAT_ASSIGNMENT_ATTACHMENT_LINK
  const assignmentHomeworkRaw =
    new URL(request.url).searchParams.get("homework") || "";

  const assignmentHomeworkId =
    uuidPattern.test(assignmentHomeworkRaw)
      ? assignmentHomeworkRaw
      : null;


  const link =
    await resolvePortalLink(
      token,
    );

  if (!link) {
    return NextResponse.json(
      {
        error:
          "Portal link is invalid or expired.",
      },
      { status: 404 },
    );
  }

  let body: UploadBody;

  try {
    body =
      await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request." },
      { status: 400 },
    );
  }

  const engagementId =
    cleanText(
      body.engagementId,
      100,
    );

  const sessionId =
    cleanText(
      body.sessionId,
      100,
    ) ||
    null;

  const storagePath =
    cleanText(
      body.storagePath,
      1000,
    );

  if (
    !uuidPattern.test(
      engagementId,
    ) ||
    (
      sessionId &&
      !uuidPattern.test(
        sessionId,
      )
    ) ||
    !storagePath
  ) {
    return NextResponse.json(
      {
        error:
          "Invalid material.",
      },
      { status: 400 },
    );
  }

  const hasAccess =
    await validateStudentAccess({
      studentId:
        link.student_id,

      engagementId,
      sessionId,
    });

  if (!hasAccess) {
    return NextResponse.json(
      {
        error:
          "Learning workspace not found.",
      },
      { status: 404 },
    );
  }

  if (
    !materialPathBelongsTo({
      path:
        storagePath,

      studentId:
        link.student_id,

      engagementId,

      role:
        "student",
    })
  ) {
    return NextResponse.json(
      {
        error:
          "Invalid file path.",
      },
      { status: 400 },
    );
  }

  const filename =
    safeFilename(
      body.filename,
    );

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
      {
        error:
          validationError,
      },
      { status: 400 },
    );
  }

  const pathParts =
    splitStoragePath(
      storagePath,
    );

  if (!pathParts) {
    return NextResponse.json(
      {
        error:
          "Invalid file path.",
      },
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
        link.student_id,

      engagement_id:
        engagementId,

      session_id:
        sessionId,

      uploaded_by_role:
        "student",

      uploaded_by_tutor_id:
        null,

      created_by_user_id:
        null,

      portal_link_id:
        link.id,

      material_type:
        "file",

      category:
        validCategory(
          body.category ||
            "submission",
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

  if (
    error ||
    !material
  ) {
    console.error(
      "Could not record student material:",
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


  if (assignmentHomeworkId) {
    const {
      data: homework,
      error: homeworkError,
    } = await supabase
      .from("homework")
      .select("id,engagement_id,status")
      .eq("id", assignmentHomeworkId)
      .eq("engagement_id", engagementId)
      .maybeSingle();

    if (homeworkError || !homework) {
      return NextResponse.json(
        { error: "Assignment not found." },
        { status: 404 },
      );
    }

    const {
      data: engagement,
      error: engagementError,
    } = await supabase
      .from("tutoring_engagements")
      .select("id")
      .eq("id", engagementId)
      .eq("student_id", link.student_id)
      .maybeSingle();

    if (engagementError || !engagement) {
      return NextResponse.json(
        { error: "Assignment not found." },
        { status: 404 },
      );
    }

    const {
      data: linkedMaterial,
      error: materialLinkError,
    } = await supabase
      .from("learning_materials")
      .update({ homework_id: assignmentHomeworkId })
      .eq("engagement_id", engagementId)
      .eq("storage_path", storagePath)
      .select("id")
      .maybeSingle();

    if (materialLinkError || !linkedMaterial) {
      console.error(
        "Could not link uploaded file to assignment:",
        materialLinkError,
      );

      return NextResponse.json(
        {
          error:
            "The file uploaded, but it could not be attached to the assignment.",
        },
        { status: 500 },
      );
    }

    const submittedAt = new Date().toISOString();

    const {
      data: existingSubmission,
      error: existingSubmissionError,
    } = await supabase
      .from("homework_submissions")
      .select("homework_id")
      .eq("homework_id", assignmentHomeworkId)
      .eq("student_id", link.student_id)
      .maybeSingle();

    if (existingSubmissionError) {
      console.error(
        "Could not check assignment submission:",
        existingSubmissionError,
      );
    } else if (existingSubmission) {
      const { error: submissionUpdateError } = await supabase
        .from("homework_submissions")
        .update({
          submitted_at: submittedAt,
          updated_at: submittedAt,
        })
        .eq("homework_id", assignmentHomeworkId)
        .eq("student_id", link.student_id);

      if (submissionUpdateError) {
        console.error(
          "Could not update assignment submission:",
          submissionUpdateError,
        );
      }
    } else {
      const { error: submissionInsertError } = await supabase
        .from("homework_submissions")
        .insert({
          homework_id: assignmentHomeworkId,
          student_id: link.student_id,
          portal_link_id: link.id,
          note: null,
          submission_url: null,
          submitted_at: submittedAt,
          updated_at: submittedAt,
        });

      if (submissionInsertError) {
        console.error(
          "Could not create assignment submission:",
          submissionInsertError,
        );
      }
    }

    if (homework.status === "assigned") {
      await supabase
        .from("homework")
        .update({
          status: "submitted",
          updated_at: submittedAt,
        })
        .eq("id", assignmentHomeworkId);
    }
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
