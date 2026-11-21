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
  generatePortalToken,
  hashPortalToken,
  portalTokenPreview,
} from "@/lib/student-portal";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
) {
  const session =
    await getStudentSession();

  if (!session) {
    return NextResponse.redirect(
      new URL(
        "/portal/login?unauthorized=1",
        request.url,
      ),
    );
  }

  const admin =
    createAdminClient();

  const now =
    new Date();

  const nowIso =
    now.toISOString();

  /*
   * Remove any previous temporary portal
   * link created by authenticated login.
   * Existing admin-issued student links
   * are left untouched.
   */
  await admin
    .from("student_portal_links")
    .update({
      revoked_at: nowIso,
      updated_at: nowIso,
    })
    .eq(
      "student_id",
      session.student.id,
    )
    .eq(
      "label",
      "Authenticated student login",
    )
    .is(
      "revoked_at",
      null,
    );

  const token =
    generatePortalToken();

  /*
   * Compatibility token lasts one hour.
   * The student's real account remains
   * protected by Supabase authentication.
   */
  const expiresAt =
    new Date(
      now.getTime() +
        60 * 60 * 1000,
    ).toISOString();

  const {
    error,
  } = await admin
    .from("student_portal_links")
    .insert({
      student_id:
        session.student.id,

      token_hash:
        hashPortalToken(token),

      token_preview:
        portalTokenPreview(token),

      expires_at:
        expiresAt,

      created_by_email:
        session.user.email ||
        null,

      label:
        "Authenticated student login",
    });

  if (error) {
    throw new Error(
      error.message,
    );
  }

  return NextResponse.redirect(
    new URL(
      `/portal/${token}`,
      request.url,
    ),
  );
}
