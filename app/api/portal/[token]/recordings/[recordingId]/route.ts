import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { getAuthenticatedPortalStudent } from "@/lib/student-portal-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = Promise<{
  token: string;
  recordingId: string;
}>;

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const allowedTypes = new Set([
  "MP4",
  "M4A",
  "VTT",
  "TRANSCRIPT",
]);

function privateHeaders() {
  return {
    "Cache-Control": "private, no-store, max-age=0",
    "Referrer-Policy": "no-referrer",
  };
}

export async function GET(
  _request: Request,
  {
    params,
  }: {
    params: Params;
  }
) {
  const {
    token,
    recordingId,
  } = await params;

  if (!uuidPattern.test(recordingId)) {
    return NextResponse.json(
      { error: "Recording not found." },
      {
        status: 404,
        headers: privateHeaders(),
      }
    );
  }

  const portalAuth =
    await getAuthenticatedPortalStudent(token);

  if (!portalAuth) {
    return NextResponse.json(
      {
        error: "Please sign in to access this recording.",
      },
      {
        status: 401,
        headers: privateHeaders(),
      }
    );
  }

  const admin =
    createAdminClient();

  const {
    data: recording,
    error: recordingError,
  } = await admin
    .from("session_recordings")
    .select(
      "id,session_id,file_type,play_url,play_passcode,status,student_visible"
    )
    .eq("id", recordingId)
    .eq("student_visible", true)
    .eq("status", "completed")
    .maybeSingle();

  if (
    recordingError ||
    !recording ||
    !allowedTypes.has(
      String(recording.file_type || "").toUpperCase()
    ) ||
    !recording.play_url
  ) {
    return NextResponse.json(
      { error: "Recording not found." },
      {
        status: 404,
        headers: privateHeaders(),
      }
    );
  }

  const {
    data: session,
    error: sessionError,
  } = await admin
    .from("tutoring_sessions")
    .select("id,engagement_id")
    .eq("id", recording.session_id)
    .maybeSingle();

  if (
    sessionError ||
    !session
  ) {
    return NextResponse.json(
      { error: "Recording not found." },
      {
        status: 404,
        headers: privateHeaders(),
      }
    );
  }

  const {
    data: engagement,
    error: engagementError,
  } = await admin
    .from("tutoring_engagements")
    .select("id")
    .eq("id", session.engagement_id)
    .eq("student_id", portalAuth.student.id)
    .maybeSingle();

  if (
    engagementError ||
    !engagement
  ) {
    return NextResponse.json(
      { error: "Recording not found." },
      {
        status: 404,
        headers: privateHeaders(),
      }
    );
  }

  let playUrl: URL;

  try {
    playUrl =
      new URL(recording.play_url);
  } catch {
    return NextResponse.json(
      { error: "Recording link is unavailable." },
      {
        status: 404,
        headers: privateHeaders(),
      }
    );
  }

  if (
    recording.play_passcode &&
    !playUrl.searchParams.has("pwd")
  ) {
    playUrl.searchParams.set(
      "pwd",
      recording.play_passcode
    );
  }

  return NextResponse.redirect(
    playUrl,
    {
      status: 302,
      headers: privateHeaders(),
    }
  );
}
