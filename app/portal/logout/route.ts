import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  getStudentSession,
} from "@/lib/student-auth";

import {
  createAdminClient,
} from "@/lib/supabase/admin";

import {
  createClient,
} from "@/lib/supabase/server";

export async function GET(
  request: NextRequest,
) {
  const session =
    await getStudentSession();

  if (session) {
    const admin =
      createAdminClient();

    const now =
      new Date()
        .toISOString();

    await admin
      .from("student_portal_links")
      .update({
        revoked_at: now,
        updated_at: now,
      })
      .eq(
        "student_id",
        session.student.id,
      )
      .eq(
        "access_kind",
        "authenticated_session",
      )
      .is(
        "revoked_at",
        null,
      );
  }

  const supabase =
    await createClient();

  await supabase.auth.signOut();

  return NextResponse.redirect(
    new URL(
      "/portal/login",
      request.url,
    ),
  );
}
