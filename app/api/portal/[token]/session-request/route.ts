import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  resolvePortalLink,
} from "@/lib/student-portal";

import {
  createAdminClient,
} from "@/lib/supabase/admin";

import {
  isValidTimeZone,
  zonedLocalDateTimeToUtc,
} from "@/lib/time-zone";


type Params = Promise<{
  token: string;
}>;


const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;


function clean(
  value: unknown,
  max = 5000,
) {
  return String(
    value ?? "",
  )
    .trim()
    .slice(
      0,
      max,
    );
}


function sameOrigin(
  request:
    NextRequest,
) {
  const origin =
    request.headers.get(
      "origin",
    );

  if (!origin) {
    return true;
  }

  try {
    return (
      new URL(
        origin,
      ).host ===
      request.headers.get(
        "host",
      )
    );
  } catch {
    return false;
  }
}


export async function POST(
  request:
    NextRequest,
  {
    params,
  }: {
    params: Params;
  },
) {
  if (
    !sameOrigin(
      request,
    )
  ) {
    return NextResponse.json(
      {
        error:
          "Invalid origin.",
      },
      {
        status:
          403,
      },
    );
  }


  if (
    Number(
      request.headers.get(
        "content-length",
      ) ||
        0,
    ) >
    100_000
  ) {
    return NextResponse.json(
      {
        error:
          "Request too large.",
      },
      {
        status:
          413,
      },
    );
  }


  const {
    token,
  } =
    await params;


  const link =
    await resolvePortalLink(
      token,
    );


  if (!link) {
    return NextResponse.json(
      {
        error:
          "This portal link is invalid or has expired.",
      },
      {
        status:
          404,
      },
    );
  }


  let body:
    Record<
      string,
      unknown
    >;


  try {
    body =
      await request.json();

  } catch {
    return NextResponse.json(
      {
        error:
          "Invalid request.",
      },
      {
        status:
          400,
      },
    );
  }


  const engagementId =
    clean(
      body.engagementId,
      100,
    );


  if (
    !uuidPattern.test(
      engagementId,
    )
  ) {
    return NextResponse.json(
      {
        error:
          "Invalid course workspace.",
      },
      {
        status:
          400,
      },
    );
  }


  const supabase =
    createAdminClient();


  const {
    data:
      engagement,

    error:
      engagementError,
  } =
    await supabase
      .from(
        "tutoring_engagements",
      )
      .select(
        "id,student_id,tutor_id,subject",
      )
      .eq(
        "id",
        engagementId,
      )
      .eq(
        "student_id",
        link.student_id,
      )
      .maybeSingle();


  if (
    engagementError ||
    !engagement
  ) {
    return NextResponse.json(
      {
        error:
          "That course is not available through this portal.",
      },
      {
        status:
          403,
      },
    );
  }


  const timeZone =
    clean(
      body.timeZone,
      200,
    );


  if (
    !isValidTimeZone(
      timeZone,
    )
  ) {
    return NextResponse.json(
      {
        error:
          "Please choose a valid time zone.",
      },
      {
        status:
          400,
      },
    );
  }


  /*
   * Keep the student's preferred
   * timezone centrally available.
   */
  const {
    error:
      timezoneError,
  } =
    await supabase
      .from(
        "student_onboarding",
      )
      .upsert(
        {
          student_id:
            link.student_id,

          timezone:
            timeZone,

          updated_at:
            new Date()
              .toISOString(),
        },
        {
          onConflict:
            "student_id",
        },
      );


  if (
    timezoneError
  ) {
    console.error(
      "Could not persist student timezone:",
      timezoneError.message,
    );
  }


  const requestType =
    clean(
      body.type,
      20,
    );


  let message =
    "";


  /* ========================================================
     NEW SESSION REQUEST
     ======================================================== */

  if (
    requestType ===
    "new"
  ) {
    const preferredDate =
      clean(
        body.preferredDate,
        20,
      );

    const preferredTime =
      clean(
        body.preferredTime,
        20,
      );

    const topic =
      clean(
        body.topic,
        500,
      );

    const notes =
      clean(
        body.notes,
        1200,
      );

    const duration =
      Number(
        body.durationMinutes,
      );

    const urgency =
      clean(
        body.urgency,
        40,
      );


    if (
      !preferredDate ||
      !preferredTime ||
      !topic
    ) {
      return NextResponse.json(
        {
          error:
            "Date, time and lesson topic are required.",
        },
        {
          status:
            400,
        },
      );
    }


    if (
      !Number.isFinite(
        duration,
      ) ||
      duration < 15 ||
      duration > 480
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid session duration.",
        },
        {
          status:
            400,
        },
      );
    }


    const converted =
      zonedLocalDateTimeToUtc(
        preferredDate,
        preferredTime,
        timeZone,
      );


    if (
      !converted.ok
    ) {
      return NextResponse.json(
        {
          error:
            converted.error,
        },
        {
          status:
            400,
        },
      );
    }


    const urgencyLabel =
      urgency ===
      "urgent"
        ? "As soon as possible"
        : urgency ===
            "this_week"
          ? "This week"
          : "Flexible";


    message = [
      "SESSION REQUEST",
      "",
      `Preferred local date: ${preferredDate}`,
      `Preferred local time: ${preferredTime}`,
      `Student timezone: ${timeZone}`,
      `Preferred UTC: ${converted.iso}`,
      `Session length: ${Math.round(
        duration,
      )} minutes`,
      `Urgency: ${urgencyLabel}`,
      "",
      `Topic / goal: ${topic}`,
      "",
      notes
        ? `Additional notes: ${notes}`
        : "Additional notes: None",
    ].join(
      "\n",
    );
  }


  /* ========================================================
     CHANGE / CANCELLATION REQUEST
     ======================================================== */

  else if (
    requestType ===
    "change"
  ) {
    const sessionId =
      clean(
        body.sessionId,
        100,
      );

    const changeType =
      clean(
        body.changeType,
        30,
      );

    const reason =
      clean(
        body.reason,
        1200,
      );


    if (
      !uuidPattern.test(
        sessionId,
      ) ||
      ![
        "reschedule",
        "cancel",
      ].includes(
        changeType,
      ) ||
      !reason
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid session change request.",
        },
        {
          status:
            400,
        },
      );
    }


    const {
      data:
        session,

      error:
        sessionError,
    } =
      await supabase
        .from(
          "tutoring_sessions",
        )
        .select(
          "id,engagement_id,scheduled_for,topic",
        )
        .eq(
          "id",
          sessionId,
        )
        .eq(
          "engagement_id",
          engagement.id,
        )
        .maybeSingle();


    if (
      sessionError ||
      !session
    ) {
      return NextResponse.json(
        {
          error:
            "That session does not belong to this course.",
        },
        {
          status:
            403,
        },
      );
    }


    const lines = [
      "SESSION CHANGE REQUEST",
      "",
      `Change type: ${
        changeType ===
        "reschedule"
          ? "Reschedule"
          : "Cancellation"
      }`,
      `Session ID: ${session.id}`,
      `Current scheduled UTC: ${
        session.scheduled_for ||
        ""
      }`,
      `Session topic: ${session.topic}`,
    ];


    if (
      changeType ===
      "reschedule"
    ) {
      const requestedDate =
        clean(
          body.requestedDate,
          20,
        );

      const requestedTime =
        clean(
          body.requestedTime,
          20,
        );


      const converted =
        zonedLocalDateTimeToUtc(
          requestedDate,
          requestedTime,
          timeZone,
        );


      if (
        !converted.ok
      ) {
        return NextResponse.json(
          {
            error:
              converted.error,
          },
          {
            status:
              400,
          },
        );
      }


      lines.push(
        `Requested local date: ${requestedDate}`,
        `Requested local time: ${requestedTime}`,
        `Student timezone: ${timeZone}`,
        `Requested UTC: ${converted.iso}`,
      );

    } else {
      lines.push(
        `Student timezone: ${timeZone}`,
      );
    }


    lines.push(
      "",
      `Reason: ${reason}`,
    );


    message =
      lines.join(
        "\n",
      );
  }


  else {
    return NextResponse.json(
      {
        error:
          "Unknown session request type.",
      },
      {
        status:
          400,
      },
    );
  }


  const {
    error:
      insertError,
  } =
    await supabase
      .from(
        "student_support_requests",
      )
      .insert({
        student_id:
          link.student_id,

        engagement_id:
          engagement.id,

        portal_link_id:
          link.id,

        category:
          "session_request",

        message,

        status:
          "new",
      });


  if (
    insertError
  ) {
    return NextResponse.json(
      {
        error:
          "Could not send your session request.",
      },
      {
        status:
          500,
      },
    );
  }


  return NextResponse.json({
    ok: true,
  });
}
