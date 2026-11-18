import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { intakeInvitationDraft, sendStudentIntakeInvitation } from "@/lib/email/student";
import { recordStudentCommunication } from "@/lib/student-communications";
import { generateIntakeToken, hashIntakeToken, intakeTokenPreview } from "@/lib/student-onboarding";
import { createAdminClient } from "@/lib/supabase/admin";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const allowedExpiryDays = new Set([7, 14, 30, 60]);

function sameOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try { return new URL(origin).host === request.headers.get("host"); } catch { return false; }
}

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Invalid origin." }, { status: 403 });
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  let body: { studentId?: string; expiryDays?: number; sendEmail?: boolean };
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }

  const studentId = String(body.studentId || "");
  const expiryDays = Number(body.expiryDays || 14);
  const sendEmail = body.sendEmail === true;
  if (!uuidPattern.test(studentId) || !allowedExpiryDays.has(expiryDays)) return NextResponse.json({ error: "Invalid student or expiry." }, { status: 400 });

  const supabase = createAdminClient();
  const { data: student, error: studentError } = await supabase.from("students").select("id,name,email").eq("id", studentId).maybeSingle();
  if (studentError || !student) return NextResponse.json({ error: "Student not found." }, { status: 404 });

  const now = new Date();
  await supabase.from("student_intake_links").update({ revoked_at: now.toISOString(), updated_at: now.toISOString() }).eq("student_id", studentId).is("revoked_at", null);

  const token = generateIntakeToken();
  const expiresAt = new Date(now.getTime() + expiryDays * 24 * 60 * 60 * 1000).toISOString();
  const { data: link, error } = await supabase
    .from("student_intake_links")
    .insert({
      student_id: studentId,
      token_hash: hashIntakeToken(token),
      token_preview: intakeTokenPreview(token),
      expires_at: expiresAt,
      created_by_email: session.user.email || null,
      label: "Student learning intake",
    })
    .select("id,student_id,token_preview,expires_at,created_at,last_accessed_at")
    .single();
  if (error || !link) return NextResponse.json({ error: error?.message || "Could not create intake link." }, { status: 500 });

  await supabase.from("student_onboarding").upsert({ student_id: studentId, status: "awaiting_intake", updated_at: now.toISOString() }, { onConflict: "student_id" });

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || request.nextUrl.origin;
  const intakeUrl = `${baseUrl}/intake/${token}`;
  const draft = intakeInvitationDraft({ name: student.name, email: student.email, intakeUrl, expiresAt });
  let email: Awaited<ReturnType<typeof sendStudentIntakeInvitation>> | null = null;

  if (sendEmail) {
    email = await sendStudentIntakeInvitation({ name: student.name, email: student.email, linkId: link.id, intakeUrl, expiresAt });
    await recordStudentCommunication({
      studentId,
      type: "intake_invitation",
      recipient: student.email,
      subject: draft.subject,
      result: email,
      createdByEmail: session.user.email || null,
    });
  }

  return NextResponse.json({ intakeUrl, emailSubject: draft.subject, emailBody: draft.text, link, email });
}

export async function DELETE(request: NextRequest) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Invalid origin." }, { status: 403 });
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  let body: { linkId?: string };
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }
  const linkId = String(body.linkId || "");
  if (!uuidPattern.test(linkId)) return NextResponse.json({ error: "Invalid link." }, { status: 400 });
  const supabase = createAdminClient();
  const now = new Date().toISOString();
  const { error } = await supabase.from("student_intake_links").update({ revoked_at: now, updated_at: now }).eq("id", linkId).is("revoked_at", null);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
