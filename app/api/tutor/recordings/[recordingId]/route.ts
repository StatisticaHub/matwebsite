import { NextResponse } from "next/server";

import { getTutorSession } from "@/lib/tutor-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = Promise<{
  recordingId: string;
}>;

const allowedFileTypes = new Set([
  "MP4",
  "M4A",
  "VTT",
  "TRANSCRIPT",
]);

function safeZoomUrl(value: string | null) {
  if (!value) return null;

  try {
    const url = new URL(value);

    if (url.protocol !== "https:") {
      return null;
    }

    return url;
  } catch {
    return null;
  }
}

export async function GET(
  _request: Request,
  { params }: { params: Params }
) {
  const auth = await getTutorSession();

  if (!auth) {
    return NextResponse.json(
      { error: "Unauthorized." },
      { status: 401 }
    );
  }

  const { recordingId } = await params;
  const supabase = createAdminClient();

  const { data: recording, error: recordingError } = await supabase
    .from("session_recordings")
    .select(
      "id,session_id,file_type,status,tutor_visible,play_url,download_url,play_passcode"
    )
    .eq("id", recordingId)
    .eq("tutor_visible", true)
    .eq("status", "completed")
    .maybeSingle();

  if (recordingError || !recording) {
    return NextResponse.json(
      { error: "Recording not found." },
      { status: 404 }
    );
  }

  const fileType = String(recording.file_type || "").toUpperCase();

  if (!allowedFileTypes.has(fileType)) {
    return NextResponse.json(
      { error: "Recording not available." },
      { status: 404 }
    );
  }

  const { data: sessionRow, error: sessionError } = await supabase
    .from("tutoring_sessions")
    .select("id,tutor_id,tutoring_engagements(tutor_id)")
    .eq("id", recording.session_id)
    .maybeSingle();

  if (sessionError || !sessionRow) {
    return NextResponse.json(
      { error: "Recording not found." },
      { status: 404 }
    );
  }

  const relation =
    sessionRow.tutoring_engagements as unknown as
      | { tutor_id: string | null }
      | null;

  const ownsSession =
    sessionRow.tutor_id === auth.tutor.id ||
    relation?.tutor_id === auth.tutor.id;

  if (!ownsSession) {
    return NextResponse.json(
      { error: "Recording not found." },
      { status: 404 }
    );
  }

  const playTarget = safeZoomUrl(recording.play_url);

  if (
    playTarget &&
    recording.play_passcode
  ) {
    playTarget.searchParams.set(
      "pwd",
      recording.play_passcode
    );
  }

  const target =
    playTarget ||
    safeZoomUrl(recording.download_url);

  if (!target) {
    return NextResponse.json(
      { error: "Recording link is unavailable." },
      { status: 404 }
    );
  }

  const response = NextResponse.redirect(target, 302);

  response.headers.set(
    "Cache-Control",
    "private, no-store, max-age=0"
  );
  response.headers.set(
    "Referrer-Policy",
    "no-referrer"
  );

  return response;
}
