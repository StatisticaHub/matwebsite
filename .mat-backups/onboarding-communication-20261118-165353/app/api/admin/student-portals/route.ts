import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import {
  generatePortalToken,
  hashPortalToken,
  portalTokenPreview,
  type StudentPortalLink,
} from "@/lib/student-portal";
import { createAdminClient } from "@/lib/supabase/admin";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const allowedExpiryDays = new Set([30, 90, 180, 365]);

function sameOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    return new URL(origin).host === request.headers.get("host");
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Invalid origin." }, { status: 403 });

  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  let body: { studentId?: string; expiryDays?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const studentId = String(body.studentId || "");
  const expiryDays = Number(body.expiryDays || 180);
  if (!uuidPattern.test(studentId) || !allowedExpiryDays.has(expiryDays)) {
    return NextResponse.json({ error: "Invalid student or expiry." }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data: student, error: studentError } = await supabase
    .from("students")
    .select("id,name")
    .eq("id", studentId)
    .maybeSingle();

  if (studentError || !student) return NextResponse.json({ error: "Student not found." }, { status: 404 });

  const now = new Date();
  await supabase
    .from("student_portal_links")
    .update({ revoked_at: now.toISOString(), updated_at: now.toISOString() })
    .eq("student_id", studentId)
    .is("revoked_at", null);

  const token = generatePortalToken();
  const expiresAt = new Date(now.getTime() + expiryDays * 24 * 60 * 60 * 1000).toISOString();
  const { data: linkData, error } = await supabase
    .from("student_portal_links")
    .insert({
      student_id: studentId,
      token_hash: hashPortalToken(token),
      token_preview: portalTokenPreview(token),
      expires_at: expiresAt,
      created_by_email: session.user.email || null,
      label: "Student learning portal",
    })
    .select("id,student_id,token_preview,expires_at,created_at,last_accessed_at")
    .single();

  if (error || !linkData) {
    return NextResponse.json({ error: error?.message || "Could not create portal link." }, { status: 500 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || request.nextUrl.origin;
  const portalUrl = `${baseUrl}/portal/${token}`;

  return NextResponse.json({ portalUrl, link: linkData as StudentPortalLink });
}

export async function DELETE(request: NextRequest) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Invalid origin." }, { status: 403 });

  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  let body: { linkId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const linkId = String(body.linkId || "");
  if (!uuidPattern.test(linkId)) return NextResponse.json({ error: "Invalid link." }, { status: 400 });

  const supabase = createAdminClient();
  const now = new Date().toISOString();
  const { error } = await supabase
    .from("student_portal_links")
    .update({ revoked_at: now, updated_at: now })
    .eq("id", linkId)
    .is("revoked_at", null);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
