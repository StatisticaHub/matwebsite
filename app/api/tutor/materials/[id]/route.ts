import {
  NextResponse,
} from "next/server";

import {
  getTutorSession,
} from "@/lib/tutor-auth";

import {
  createAdminClient,
} from "@/lib/supabase/admin";

import {
  uuidPattern,
} from "@/lib/learning-materials";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Params = Promise<{
  id: string;
}>;

export async function GET(
  _request: Request,
  {
    params,
  }: {
    params: Params;
  },
) {
  const session =
    await getTutorSession();

  if (!session) {
    return NextResponse.json(
      { error: "Unauthorized." },
      { status: 401 },
    );
  }

  const {
    id,
  } = await params;

  if (!uuidPattern.test(id)) {
    return NextResponse.json(
      { error: "Invalid material." },
      { status: 400 },
    );
  }

  const supabase =
    createAdminClient();

  const {
    data: material,
    error,
  } = await supabase
    .from(
      "learning_materials",
    )
    .select(
      "id,engagement_id,student_id,material_type,original_filename,storage_bucket,storage_path,status,visible_to_tutor",
    )
    .eq("id", id)
    .maybeSingle();

  if (
    error ||
    !material ||
    material.status !==
      "active" ||
    material.material_type !==
      "file" ||
    material.visible_to_tutor !==
      true ||
    !material.engagement_id ||
    !material.storage_bucket ||
    !material.storage_path
  ) {
    return NextResponse.json(
      { error: "Material not found." },
      { status: 404 },
    );
  }

  const {
    data: engagement,
  } = await supabase
    .from(
      "tutoring_engagements",
    )
    .select("id")
    .eq(
      "id",
      material.engagement_id,
    )
    .eq(
      "student_id",
      material.student_id,
    )
    .eq(
      "tutor_id",
      session.tutor.id,
    )
    .maybeSingle();

  if (!engagement) {
    return NextResponse.json(
      { error: "Material not found." },
      { status: 404 },
    );
  }

  const {
    data,
    error: signedError,
  } = await supabase.storage
    .from(
      material.storage_bucket,
    )
    .createSignedUrl(
      material.storage_path,
      120,
      {
        download:
          material.original_filename ||
          true,
      },
    );

  if (
    signedError ||
    !data?.signedUrl
  ) {
    return NextResponse.json(
      {
        error:
          "Could not open this file.",
      },
      { status: 500 },
    );
  }

  const response =
    NextResponse.redirect(
      data.signedUrl,
      302,
    );

  response.headers.set(
    "Cache-Control",
    "private, no-store",
  );

  return response;
}
