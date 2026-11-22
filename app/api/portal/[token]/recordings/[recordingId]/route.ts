import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { resolvePortalLink } from "@/lib/student-portal";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = Promise<{
  token: string;
  recordingId: string;
}>;

const allowedFileTypes = new Set(["MP4", "M4A", "VTT", "TRANSCRIPT"]);

function safeRecordingUrl(value: string | null) {
  if (!value) return null;

  try {
    const url = new URL(value);
    if (url.protocol !== "https:") return null;
    return url;
  } catch {
    return null;
  }
}

export async function GET(
  _request: Request,
  { params }: { params: Params }
) {
  const { token, recordingId } = await params;
  const link = await resolvePortalLink(token);

  if (!link) {
    return NextResponse.json({ error: "Recording not found." }, { status: 404 });
  }

  const supabase = createAdminClient();

  const { data: recording, error: recordingError } = await supabase
    .from("session_recordings")
    .select("id,session_id,file_type,status,student_visible,play_url,download_url")
    .eq("id", recordingId)
    .eq("student_visible", true)
    .eq("status", "completed")
    .maybeSingle();

  if (recordingError || !recording) {
    return NextResponse.json({ error: "Recording not found." }, { status: 404 });
  }

  const fileType = String(recording.file_type || "").toUpperCase();
  if (!allowedFileTypes.has(fileType)) {
    return NextResponse.json({ error: "Recording not available." }, { status: 404 });
  }

  const { data: sessionRow, error: sessionError } = await supabase
    .from("tutoring_sessions")
    .select("id,tutoring_engagements(student_id)")
    .eq("id", recording.session_id)
    .maybeSingle();

  if (sessionError || !sessionRow) {
    return NextResponse.json({ error: "Recording not found." }, { status: 404 });
  }

  const relation = sessionRow.tutoring_engagements as unknown as
    | { student_id: string }
    | null;

  if (!relation || relation.student_id !== link.student_id) {
    return NextResponse.json({ error: "Recording not found." }, { status: 404 });
  }

  const target =
    safeRecordingUrl(recording.play_url) ||
    safeRecordingUrl(recording.download_url);

  if (!target) {
    return NextResponse.json(
      { error: "Recording link is unavailable." },
      { status: 404 }
    );
  }

  const response = NextResponse.redirect(target, 302);
  response.headers.set("Cache-Control", "private, no-store, max-age=0");
  response.headers.set("Referrer-Policy", "no-referrer");
  return response;
}
