import {
  createHmac,
  timingSafeEqual,
} from "node:crypto";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
    };
  };
};

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

async function updateSessionFromZoomEvent(
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
      ?.object?.id;

  const meetingUuid =
    payload.payload
      ?.object?.uuid;

  if (
    meetingId === undefined ||
    meetingId === null
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

export async function POST(
  request: Request
) {
  try {
    const rawBody =
      await request.text();

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
          status:
            401,
        }
      );
    }

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
          status:
            400,
        }
      );
    }

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
            status:
              400,
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

    await updateSessionFromZoomEvent(
      body
    );

    return NextResponse.json({
      received:
        true,
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
        status:
          500,
      }
    );
  }
}
