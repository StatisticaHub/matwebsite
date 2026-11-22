import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  resolveIntakeLink,
} from "@/lib/student-onboarding";

import {
  createAdminClient,
} from "@/lib/supabase/admin";

import {
  isValidTimeZone,
} from "@/lib/time-zone";

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

function nullable(
  value: unknown,
  max = 5000,
) {
  const text =
    clean(
      value,
      max,
    );

  return text || null;
}

function sameOrigin(
  request: NextRequest,
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
  request: NextRequest,
  {
    params,
  }: {
    params: Promise<{
      token: string;
    }>;
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
        status: 403,
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
    40_000
  ) {
    return NextResponse.json(
      {
        error:
          "Request too large.",
      },
      {
        status: 413,
      },
    );
  }

  const {
    token,
  } =
    await params;

  const link =
    await resolveIntakeLink(
      token,
    );

  if (!link) {
    return NextResponse.json(
      {
        error:
          "This intake link is invalid or has expired.",
      },
      {
        status: 404,
      },
    );
  }

  let body: Record<
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
        status: 400,
      },
    );
  }

  if (
    clean(
      body.company,
      200,
    )
  ) {
    return NextResponse.json({
      ok: true,
    });
  }

  if (
    clean(
      body.consent,
      20,
    ) !==
    "yes"
  ) {
    return NextResponse.json(
      {
        error:
          "Please confirm the tutoring setup checkbox.",
      },
      {
        status: 400,
      },
    );
  }

  const academicLevel =
    clean(
      body.academicLevel,
      300,
    );

  const targetOutcome =
    clean(
      body.targetOutcome,
      5000,
    );

  const availability =
    clean(
      body.availability,
      1500,
    );

  const timeZone =
    clean(
      body.timezone,
      120,
    );

  if (!academicLevel) {
    return NextResponse.json(
      {
        error:
          "Please choose your academic level.",
      },
      {
        status: 400,
      },
    );
  }

  if (!targetOutcome) {
    return NextResponse.json(
      {
        error:
          "Please tell us what you would like help with.",
      },
      {
        status: 400,
      },
    );
  }

  if (!availability) {
    return NextResponse.json(
      {
        error:
          "Please tell us when you are usually available.",
      },
      {
        status: 400,
      },
    );
  }

  if (
    !isValidTimeZone(
      timeZone,
    )
  ) {
    return NextResponse.json(
      {
        error:
          "Please choose a valid timezone.",
      },
      {
        status: 400,
      },
    );
  }

  const now =
    new Date()
      .toISOString();

  const supabase =
    createAdminClient();

  const {
    error:
      onboardingError,
  } =
    await supabase
      .from(
        "student_onboarding",
      )
      .upsert(
        {
          student_id:
            link.student_id,

          status:
            "review",

          timezone:
            timeZone,

          availability,

          target_outcome:
            targetOutcome,

          anything_else:
            nullable(
              body.anythingElse,
              5000,
            ),

          consent_confirmed:
            true,

          intake_completed_at:
            now,

          updated_at:
            now,
        },
        {
          onConflict:
            "student_id",
        },
      );

  if (
    onboardingError
  ) {
    console.error(
      "Could not save simplified student intake:",
      onboardingError,
    );

    return NextResponse.json(
      {
        error:
          "Could not save your learning details.",
      },
      {
        status: 500,
      },
    );
  }

  const {
    error:
      studentError,
  } =
    await supabase
      .from(
        "students",
      )
      .update({
        academic_level:
          academicLevel,

        updated_at:
          now,
      })
      .eq(
        "id",
        link.student_id,
      );

  if (
    studentError
  ) {
    return NextResponse.json(
      {
        error:
          "Your learning details were saved, but your academic level could not be updated.",
      },
      {
        status: 500,
      },
    );
  }

  return NextResponse.json({
    ok: true,
  });
}
