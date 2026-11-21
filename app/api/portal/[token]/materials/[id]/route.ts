import {
  NextResponse,
} from "next/server";

import {
  resolvePortalLink,
} from "@/lib/student-portal";

import {
  createAdminClient,
} from "@/lib/supabase/admin";

import {
  uuidPattern,
} from "@/lib/learning-materials";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Params = Promise<{
  token: string;
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
  const {
    token,
    id,
  } = await params;

  if (!uuidPattern.test(id)) {
    return NextResponse.json(
      {
        error:
          "Invalid material.",
      },
      { status: 400 },
    );
  }

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
      "id,student_id,material_type,original_filename,storage_bucket,storage_path,status,visible_to_student",
    )
    .eq("id", id)
    .eq(
      "student_id",
      link.student_id,
    )
    .maybeSingle();

  if (
    error ||
    !material ||
    material.status !==
      "active" ||
    material.material_type !==
      "file" ||
    material.visible_to_student !==
      true ||
    !material.storage_bucket ||
    !material.storage_path
  ) {
    return NextResponse.json(
      {
        error:
          "Material not found.",
      },
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
