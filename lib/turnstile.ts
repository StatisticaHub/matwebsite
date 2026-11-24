import "server-only";

const SITEVERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";

const TEST_SECRET =
  "1x0000000000000000000000000000000AA";

type TurnstileResponse = {
  success: boolean;
  action?: string;
  hostname?: string;
  "error-codes"?: string[];
};

export type TurnstileResult =
  | {
      ok: true;
    }
  | {
      ok: false;
      status: 400 | 503;
      error: string;
    };

export async function verifyTurnstileToken({
  token: tokenInput,
  expectedAction,
}: {
  token: unknown;
  expectedAction: string;
}): Promise<TurnstileResult> {
  const secret =
    process.env.TURNSTILE_SECRET_KEY?.trim();

  if (!secret) {
    console.error(
      "[TURNSTILE] TURNSTILE_SECRET_KEY is not configured.",
    );

    return {
      ok: false,
      status: 503,
      error:
        "Human verification is temporarily unavailable.",
    };
  }

  const token =
    String(
      tokenInput || "",
    ).trim();

  if (
    !token ||
    token.length > 2048
  ) {
    return {
      ok: false,
      status: 400,
      error:
        "Please complete the human verification and try again.",
    };
  }

  try {
    const body =
      new URLSearchParams({
        secret,
        response: token,
      });

    const response =
      await fetch(
        SITEVERIFY_URL,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/x-www-form-urlencoded",
          },

          body,

          cache: "no-store",

          signal:
            AbortSignal.timeout(
              8_000,
            ),
        },
      );

    if (!response.ok) {
      console.error(
        "[TURNSTILE] Siteverify HTTP error:",
        response.status,
      );

      return {
        ok: false,
        status: 503,
        error:
          "Human verification is temporarily unavailable.",
      };
    }

    const result =
      (await response.json()) as
        TurnstileResponse;

    if (!result.success) {
      console.warn(
        "[TURNSTILE] Validation failed:",
        result["error-codes"] || [],
      );

      return {
        ok: false,
        status: 400,
        error:
          "Human verification failed. Please try again.",
      };
    }

    /*
     * Cloudflare's official test secret does not return
     * the action field. Real production verification does,
     * so enforce action matching outside the test environment.
     */
    if (
      secret !== TEST_SECRET &&
      result.action !==
        expectedAction
    ) {
      console.warn(
        "[TURNSTILE] Action mismatch.",
      );

      return {
        ok: false,
        status: 400,
        error:
          "Human verification failed. Please try again.",
      };
    }

    return {
      ok: true,
    };
  } catch (error) {
    console.error(
      "[TURNSTILE] Verification request failed:",
      error,
    );

    return {
      ok: false,
      status: 503,
      error:
        "Human verification is temporarily unavailable.",
    };
  }
}
