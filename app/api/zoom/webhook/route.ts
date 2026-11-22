import {
  createHmac,
  timingSafeEqual,
} from "node:crypto";

import { NextResponse } from "next/server";

import {
  createAdminClient,
} from "@/lib/supabase/admin";


export const runtime = "nodejs";
export const dynamic = "force-dynamic";


/* ==========================================================================
   TYPES
   ========================================================================== */

type ZoomRecordingFile = {
  id?: string;

  meeting_id?: string;

  recording_start?: string;
  recording_end?: string;

  file_type?: string;
  file_extension?: string;
  file_size?: number;
  file_name?: string;

  play_url?: string;
  download_url?: string;

  status?: string;
  recording_type?: string;
};


type ZoomWebhookPayload = {
  event?: string;

  event_ts?: number;

  payload?: {
    plainToken?: string;

    account_id?: string;

    object?: {
      id?: string | number;

      uuid?: string;

      start_time?: string;

      recording_count?: number;

      recording_play_passcode?: string;

      recording_files?: ZoomRecordingFile[];
    };
  };
};


/* ==========================================================================
   WEBHOOK SECURITY
   ========================================================================== */

function webhookSecret() {
  const value =
    process.env
      .ZOOM_WEBHOOK_SECRET_TOKEN
      ?.trim();

  if (!value) {
    throw new Error(
      "ZOOM_WEBHOOK_SECRET_TOKEN is not configured."
    );
  }

  return value;
}


function safeEqual(
  left: string,
  right: string
) {
  const a =
    Buffer.from(left);

  const b =
    Buffer.from(right);

  return (
    a.length === b.length &&
    timingSafeEqual(a, b)
  );
}


function verifyZoomSignature(args: {
  rawBody: string;
  timestamp: string | null;
  signature: string | null;
}) {
  if (
    !args.timestamp ||
    !args.signature
  ) {
    return false;
  }

  const timestampNumber =
    Number(args.timestamp);

  if (
    !Number.isFinite(
      timestampNumber
    )
  ) {
    return false;
  }

  const ageSeconds =
    Math.abs(
      Math.floor(
        Date.now() / 1000
      ) -
        timestampNumber
    );

  if (ageSeconds > 300) {
    return false;
  }

  const message =
    `v0:${args.timestamp}:${args.rawBody}`;

  const digest =
    createHmac(
      "sha256",
      webhookSecret()
    )
      .update(message)
      .digest("hex");

  const expected =
    `v0=${digest}`;

  return safeEqual(
    expected,
    args.signature
  );
}


/* ==========================================================================
   EVENT HELPERS
   ========================================================================== */

function eventIso(
  payload: ZoomWebhookPayload
) {
  if (
    payload.event_ts &&
    Number.isFinite(
      payload.event_ts
    )
  ) {
    const date =
      new Date(
        payload.event_ts
      );

    if (
      !Number.isNaN(
        date.getTime()
      )
    ) {
      return date.toISOString();
    }
  }

  return new Date()
    .toISOString();
}


/* ==========================================================================
   MATCH ZOOM MEETING TO MAT SESSION
   ========================================================================== */

async function findSessionId(args: {
  meetingId:
    | string
    | number
    | undefined;

  meetingUuid?:
    | string
    | null;
}) {
  const supabase =
    createAdminClient();

  if (
    args.meetingId !==
      undefined &&
    args.meetingId !==
      null
  ) {
    const {
      data,
      error,
    } = await supabase
      .from(
        "tutoring_sessions"
      )
      .select("id")
      .eq(
        "zoom_meeting_id",
        String(
          args.meetingId
        )
      )
      .limit(1)
      .maybeSingle();

    if (error) {
      throw new Error(
        error.message
      );
    }

    if (data?.id) {
      return data.id;
    }
  }


  if (args.meetingUuid) {
    const {
      data,
      error,
    } = await supabase
      .from(
        "tutoring_sessions"
      )
      .select("id")
      .eq(
        "zoom_meeting_uuid",
        args.meetingUuid
      )
      .limit(1)
      .maybeSingle();

    if (error) {
      throw new Error(
        error.message
      );
    }

    if (data?.id) {
      return data.id;
    }
  }


  return null;
}


/* ==========================================================================
   MEETING START / END
   ========================================================================== */

async function updateSessionFromMeetingEvent(
  payload: ZoomWebhookPayload
) {
  const event =
    payload.event;

  if (
    event !==
      "meeting.started" &&
    event !==
      "meeting.ended"
  ) {
    return;
  }


  const meetingId =
    payload.payload
      ?.object
      ?.id;

  const meetingUuid =
    payload.payload
      ?.object
      ?.uuid;


  if (
    meetingId ===
      undefined ||
    meetingId ===
      null
  ) {
    return;
  }


  const supabase =
    createAdminClient();

  const timestamp =
    eventIso(payload);


  const update =
    event ===
    "meeting.started"
      ? {
          zoom_started_at:
            timestamp,

          zoom_last_event_at:
            timestamp,
        }
      : {
          zoom_ended_at:
            timestamp,

          zoom_last_event_at:
            timestamp,
        };


  const meetingIdText =
    String(meetingId);


  const {
    data,
    error,
  } = await supabase
    .from(
      "tutoring_sessions"
    )
    .update(update)
    .eq(
      "zoom_meeting_id",
      meetingIdText
    )
    .select("id");


  if (error) {
    throw new Error(
      error.message
    );
  }


  if (
    data &&
    data.length > 0
  ) {
    return;
  }


  if (!meetingUuid) {
    return;
  }


  const {
    error: uuidError,
  } = await supabase
    .from(
      "tutoring_sessions"
    )
    .update(update)
    .eq(
      "zoom_meeting_uuid",
      meetingUuid
    );


  if (uuidError) {
    throw new Error(
      uuidError.message
    );
  }
}


/* ==========================================================================
   RECORDING COMPLETED
   ========================================================================== */

async function saveCompletedRecording(
  payload: ZoomWebhookPayload
) {
  if (
    payload.event !==
    "recording.completed"
  ) {
    return;
  }


  const object =
    payload.payload
      ?.object;


  if (
    !object ||
    object.id ===
      undefined ||
    object.id ===
      null
  ) {
    return;
  }


  const sessionId =
    await findSessionId({
      meetingId:
        object.id,

      meetingUuid:
        object.uuid || null,
    });


  /*
   * The MAT Zoom account may eventually contain meetings
   * that are unrelated to a tutoring session.
   *
   * An unmatched Zoom recording should therefore not make
   * the webhook fail.
   */
  if (!sessionId) {
    console.warn(
      "Zoom recording completed but no MAT tutoring session matched the meeting.",
      {
        meetingId:
          String(
            object.id
          ),

        meetingUuid:
          object.uuid ||
          null,
      }
    );

    return;
  }


  const files =
    object.recording_files ||
    [];


  const timestamp =
    eventIso(payload);


  const rows =
    files.flatMap(
      (file) => {

        if (!file.id) {
          return [];
        }


        return [
          {
            session_id:
              sessionId,

            provider:
              "zoom",

            provider_recording_id:
              file.id,

            provider_meeting_id:
              String(
                object.id
              ),

            provider_meeting_uuid:
              object.uuid ||
              file.meeting_id ||
              null,

            recording_type:
              file.recording_type ||
              null,

            file_type:
              file.file_type ||
              null,

            file_extension:
              file.file_extension ||
              null,

            file_name:
              file.file_name ||
              null,

            file_size_bytes:
              typeof file.file_size ===
                "number"
                ? file.file_size
                : null,

            recording_start:
              file.recording_start ||
              null,

            recording_end:
              file.recording_end ||
              null,

            play_url:
              file.play_url ||
              null,

            download_url:
              file.download_url ||
              null,

            play_passcode:
              object.recording_play_passcode ||
              null,

            status:
              file.status ||
              "completed",

            updated_at:
              timestamp,
          },
        ];
      }
    );


  const supabase =
    createAdminClient();


  if (rows.length > 0) {
    /*
     * Zoom may retry webhook events.
     *
     * ignoreDuplicates prevents a retry from resetting
     * student_visible after MAT has manually published
     * a recording.
     */
    const {
      error,
    } = await supabase
      .from(
        "session_recordings"
      )
      .upsert(
        rows,
        {
          onConflict:
            "provider,provider_recording_id",

          ignoreDuplicates:
            true,
        }
      );


    if (error) {
      throw new Error(
        error.message
      );
    }
  }


  const {
    error: sessionError,
  } = await supabase
    .from(
      "tutoring_sessions"
    )
    .update({
      zoom_last_event_at:
        timestamp,
    })
    .eq(
      "id",
      sessionId
    );


  if (sessionError) {
    throw new Error(
      sessionError.message
    );
  }
}


/* ==========================================================================
   EVENT ROUTER
   ========================================================================== */

async function handleZoomEvent(
  payload: ZoomWebhookPayload
) {
  await updateSessionFromMeetingEvent(
    payload
  );

  await saveCompletedRecording(
    payload
  );
}


/* ==========================================================================
   HEALTH CHECK
   ========================================================================== */

export async function GET() {
  return NextResponse.json({
    ok: true,

    service:
      "My Academic Tutor Zoom webhook",
  });
}


/* ==========================================================================
   WEBHOOK
   ========================================================================== */

export async function POST(
  request: Request
) {
  try {

    const rawBody =
      await request.text();


    let body:
      ZoomWebhookPayload;


    try {

      body =
        JSON.parse(
          rawBody
        ) as ZoomWebhookPayload;

    } catch {

      return NextResponse.json(
        {
          error:
            "Invalid JSON.",
        },
        {
          status: 400,
        }
      );

    }


    /*
     * Zoom endpoint validation challenge.
     */
    if (
      body.event ===
      "endpoint.url_validation"
    ) {

      const plainToken =
        body.payload
          ?.plainToken;


      if (!plainToken) {

        return NextResponse.json(
          {
            error:
              "Missing Zoom validation token.",
          },
          {
            status: 400,
          }
        );

      }


      const encryptedToken =
        createHmac(
          "sha256",
          webhookSecret()
        )
          .update(
            plainToken
          )
          .digest("hex");


      return NextResponse.json({
        plainToken,
        encryptedToken,
      });

    }


    /*
     * Verify normal Zoom webhook notifications.
     */
    const timestamp =
      request.headers.get(
        "x-zm-request-timestamp"
      );


    const signature =
      request.headers.get(
        "x-zm-signature"
      );


    if (
      !verifyZoomSignature({
        rawBody,
        timestamp,
        signature,
      })
    ) {

      return NextResponse.json(
        {
          error:
            "Invalid Zoom webhook signature.",
        },
        {
          status: 401,
        }
      );

    }


    await handleZoomEvent(
      body
    );


    return NextResponse.json({
      received: true,
    });

  } catch (error) {

    console.error(
      "Zoom webhook failed:",
      error
    );


    return NextResponse.json(
      {
        error:
          "Zoom webhook processing failed.",
      },
      {
        status: 500,
      }
    );

  }
}
