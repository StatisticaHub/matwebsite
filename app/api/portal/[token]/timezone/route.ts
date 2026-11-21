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
} from "@/lib/time-zone";


type Params = Promise<{
  token: string;
}>;


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
          "Portal link is invalid or expired.",
      },
      {
        status:
          404,
      },
    );
  }


  let body: {
    timeZone?: string;
  };


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


  const timeZone =
    String(
      body.timeZone ||
        "",
    ).trim();


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


  const supabase =
    createAdminClient();


  const {
    data:
      existing,

    error:
      existingError,
  } =
    await supabase
      .from(
        "student_onboarding",
      )
      .select(
        "student_id",
      )
      .eq(
        "student_id",
        link.student_id,
      )
      .maybeSingle();


  if (existingError) {
    return NextResponse.json(
      {
        error:
          "Could not save time zone.",
      },
      {
        status:
          500,
      },
    );
  }


  const now =
    new Date()
      .toISOString();


  const result =
    existing
      ? await supabase
          .from(
            "student_onboarding",
          )
          .update({
            timezone:
              timeZone,

            updated_at:
              now,
          })
          .eq(
            "student_id",
            link.student_id,
          )

      : await supabase
          .from(
            "student_onboarding",
          )
          .insert({
            student_id:
              link.student_id,

            status:
              "awaiting_intake",

            timezone:
              timeZone,

            updated_at:
              now,
          });


  if (
    result.error
  ) {
    return NextResponse.json(
      {
        error:
          "Could not save time zone.",
      },
      {
        status:
          500,
      },
    );
  }


  return NextResponse.json({
    ok: true,
    timeZone,
  });
}
