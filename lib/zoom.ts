import "server-only";

type ZoomTokenResponse = {
  access_token?: string;
  expires_in?: number;
  token_type?: string;
};

export type CreatedZoomMeeting = {
  id: string;
  uuid: string | null;
  joinUrl: string;
};

function requiredEnv(name: string) {
  const value =
    process.env[name]?.trim();

  if (!value) {
    throw new Error(
      `${name} is not configured.`
    );
  }

  return value;
}

export function isZoomConfigured() {
  return Boolean(
    process.env.ZOOM_ACCOUNT_ID?.trim() &&
      process.env.ZOOM_CLIENT_ID?.trim() &&
      process.env.ZOOM_CLIENT_SECRET?.trim() &&
      process.env.ZOOM_HOST_USER_ID?.trim()
  );
}

async function zoomAccessToken() {
  const accountId =
    requiredEnv(
      "ZOOM_ACCOUNT_ID"
    );

  const clientId =
    requiredEnv(
      "ZOOM_CLIENT_ID"
    );

  const clientSecret =
    requiredEnv(
      "ZOOM_CLIENT_SECRET"
    );

  const credentials =
    Buffer.from(
      `${clientId}:${clientSecret}`
    ).toString("base64");

  const body =
    new URLSearchParams({
      grant_type:
        "account_credentials",

      account_id:
        accountId,
    });

  const response =
    await fetch(
      "https://zoom.us/oauth/token",
      {
        method:
          "POST",

        headers: {
          Authorization:
            `Basic ${credentials}`,

          "Content-Type":
            "application/x-www-form-urlencoded",
        },

        body:
          body.toString(),

        cache:
          "no-store",
      }
    );

  const result =
    (await response
      .json()
      .catch(
        () => ({})
      )) as ZoomTokenResponse & {
      reason?: string;
      error?: string;
    };

  if (
    !response.ok ||
    !result.access_token
  ) {
    throw new Error(
      result.reason ||
        result.error ||
        `Zoom authentication failed (${response.status}).`
    );
  }

  return result.access_token;
}

async function zoomApi(
  path: string,
  init: RequestInit
) {
  const token =
    await zoomAccessToken();

  return fetch(
    `https://api.zoom.us/v2${path}`,
    {
      ...init,

      headers: {
        Authorization:
          `Bearer ${token}`,

        "Content-Type":
          "application/json",

        ...(init.headers ||
          {}),
      },

      cache:
        "no-store",
    }
  );
}

async function zoomError(
  response: Response,
  fallback: string
) {
  const result =
    (await response
      .json()
      .catch(
        () => ({})
      )) as {
      message?: string;
      reason?: string;
      code?: number;
    };

  const suffix =
    result.code
      ? ` (Zoom code ${result.code})`
      : "";

  return new Error(
    `${
      result.message ||
      result.reason ||
      fallback
    }${suffix}`
  );
}

export async function createZoomMeeting(args: {
  topic: string;
  scheduledFor: string;
  durationMinutes: number;
}) {
  const hostUserId =
    requiredEnv(
      "ZOOM_HOST_USER_ID"
    );

  const response =
    await zoomApi(
      `/users/${encodeURIComponent(
        hostUserId
      )}/meetings`,
      {
        method:
          "POST",

        body:
          JSON.stringify({
            topic:
              args.topic,

            type:
              2,

            start_time:
              args.scheduledFor,

            duration:
              args.durationMinutes,

            timezone:
              "UTC",

            settings: {
              join_before_host:
                false,

              waiting_room:
                true,
            },
          }),
      }
    );

  if (!response.ok) {
    throw await zoomError(
      response,
      "Could not create Zoom meeting."
    );
  }

  const result =
    (await response.json()) as {
      id?: string | number;
      uuid?: string;
      join_url?: string;
    };

  if (
    !result.id ||
    !result.join_url
  ) {
    throw new Error(
      "Zoom created a meeting but did not return the expected meeting ID and join URL."
    );
  }

  return {
    id:
      String(
        result.id
      ),

    uuid:
      result.uuid ||
      null,

    joinUrl:
      result.join_url,
  } satisfies CreatedZoomMeeting;
}

export async function updateZoomMeeting(
  meetingId: string,
  args: {
    topic?: string;
    scheduledFor: string;
    durationMinutes: number;
  }
) {
  const response =
    await zoomApi(
      `/meetings/${encodeURIComponent(
        meetingId
      )}`,
      {
        method:
          "PATCH",

        body:
          JSON.stringify({
            ...(args.topic
              ? {
                  topic:
                    args.topic,
                }
              : {}),

            start_time:
              args.scheduledFor,

            duration:
              args.durationMinutes,

            timezone:
              "UTC",
          }),
      }
    );

  if (
    response.status === 204
  ) {
    return;
  }

  if (!response.ok) {
    throw await zoomError(
      response,
      "Could not update Zoom meeting."
    );
  }
}

export async function deleteZoomMeeting(
  meetingId: string
) {
  const response =
    await zoomApi(
      `/meetings/${encodeURIComponent(
        meetingId
      )}`,
      {
        method:
          "DELETE",
      }
    );

  if (
    response.status ===
      204 ||
    response.status ===
      404
  ) {
    return;
  }

  if (!response.ok) {
    throw await zoomError(
      response,
      "Could not delete Zoom meeting."
    );
  }
}

export function zoomHostUserId() {
  return (
    process.env
      .ZOOM_HOST_USER_ID
      ?.trim() ||
    null
  );
}
