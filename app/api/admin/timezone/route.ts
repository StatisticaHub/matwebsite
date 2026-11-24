
import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  getAdminSession,
} from "@/lib/admin-auth";

import {
  ADMIN_TIME_ZONE_COOKIE,
} from "@/lib/admin-time-zone";

import {
  isValidTimeZone,
} from "@/lib/time-zone";


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
      new URL(origin).host ===
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
) {
  if (!sameOrigin(request)) {
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

  const session =
    await getAdminSession();

  if (!session) {
    return NextResponse.json(
      {
        error:
          "Unauthorized.",
      },
      {
        status: 401,
      },
    );
  }

  let body: {
    timezone?: unknown;
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
        status: 400,
      },
    );
  }

  const timeZone =
    String(
      body.timezone ||
        "",
    )
      .trim()
      .slice(
        0,
        120,
      );

  if (
    !isValidTimeZone(
      timeZone,
    )
  ) {
    return NextResponse.json(
      {
        error:
          "Choose a valid timezone.",
      },
      {
        status: 400,
      },
    );
  }

  const response =
    NextResponse.json({
      ok: true,
      timezone:
        timeZone,
    });

  response.cookies.set(
    ADMIN_TIME_ZONE_COOKIE,
    timeZone,
    {
      httpOnly:
        true,
      sameSite:
        "lax",
      secure:
        process.env.NODE_ENV ===
        "production",
      path:
        "/",
      maxAge:
        60 *
        60 *
        24 *
        365,
    },
  );

  return response;
}
