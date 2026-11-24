import { NextRequest, NextResponse } from "next/server";
import { resolvePortalLink, safeExternalUrl } from "@/lib/student-portal";
import { createAdminClient } from "@/lib/supabase/admin";

type Params = Promise<{ token: string; homeworkId: string }>;
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function sameOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    return new URL(origin).host === request.headers.get("host");
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest, { params }: { params: Params }) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Invalid origin." }, { status: 403 });
  if (Number(request.headers.get("content-length") || 0) > 25_000) {
    return NextResponse.json({ error: "Request too large." }, { status: 413 });
  }

  const { token, homeworkId } = await params;
  if (!uuidPattern.test(homeworkId)) return NextResponse.json({ error: "Invalid homework item." }, { status: 400 });

  const link = await resolvePortalLink(token);
  if (!link) return NextResponse.json({ error: "Portal link is invalid or expired." }, { status: 404 });

  let body: { note?: string; submissionUrl?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const note = String(body.note || "").trim().slice(0, 3000) || null;
  const rawUrl = String(body.submissionUrl || "").trim().slice(0, 2000);
  const submissionUrl = rawUrl ? safeExternalUrl(rawUrl) : null;
  if (rawUrl && !submissionUrl) return NextResponse.json({ error: "Please use a valid http or https link." }, { status: 400 });

  const supabase = createAdminClient();
  const { data: homework, error: homeworkError } = await supabase
    .from("homework")
    .select("id,engagement_id,status")
    .eq("id", homeworkId)
    .maybeSingle();

  if (homeworkError || !homework) return NextResponse.json({ error: "Homework item not found." }, { status: 404 });

  const { data: engagement } = await supabase
    .from("tutoring_engagements")
    .select("id")
    .eq("id", homework.engagement_id)
    .eq("student_id", link.student_id)
    .maybeSingle();

  if (!engagement) return NextResponse.json({ error: "Homework item not found." }, { status: 404 });

  const now = new Date().toISOString();
  const { error } = await supabase.from("homework_submissions").upsert(
    {
      homework_id: homeworkId,
      student_id: link.student_id,
      portal_link_id: link.id,
      note,
      submission_url: submissionUrl,
      submitted_at: now,
      updated_at: now,
    },
    { onConflict: "homework_id,student_id" },
  );

  if (error) return NextResponse.json({ error: "Could not save submission." }, { status: 500 });

  if (
    ["assigned", "reviewed"].includes(
      homework.status
    )
  ) {
    await supabase
      .from("homework")
      .update({
        status: "submitted",
        updated_at: now,
      })
      .eq("id", homeworkId);
  }

  return NextResponse.json({ ok: true });
}
