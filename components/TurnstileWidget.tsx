"use client";

import Script from "next/script";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

type TurnstileOptions = {
  sitekey: string;
  action: string;
  theme: "auto";
  callback: (token: string) => void;
  "expired-callback": () => void;
  "error-callback": () => void;
};

type TurnstileApi = {
  render: (
    container: HTMLElement,
    options: TurnstileOptions,
  ) => string;

  reset: (
    widgetId?: string,
  ) => void;

  remove: (
    widgetId: string,
  ) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

const RESET_EVENT =
  "mat-turnstile-reset";

const siteKey =
  process.env
    .NEXT_PUBLIC_TURNSTILE_SITE_KEY ||
  "";

export function resetTurnstile() {
  if (
    typeof window !== "undefined"
  ) {
    window.dispatchEvent(
      new Event(
        RESET_EVENT,
      ),
    );
  }
}

export default function TurnstileWidget({
  action,
}: {
  action: string;
}) {
  const containerRef =
    useRef<HTMLDivElement>(
      null,
    );

  const widgetIdRef =
    useRef<string | null>(
      null,
    );

  const [token, setToken] =
    useState("");

  const renderWidget =
    useCallback(() => {
      if (
        !siteKey ||
        !containerRef.current ||
        !window.turnstile ||
        widgetIdRef.current
      ) {
        return;
      }

      widgetIdRef.current =
        window.turnstile.render(
          containerRef.current,
          {
            sitekey: siteKey,
            action,
            theme: "auto",

            callback:
              (
                nextToken,
              ) => {
                setToken(
                  nextToken,
                );
              },

            "expired-callback":
              () => {
                setToken("");
              },

            "error-callback":
              () => {
                setToken("");
              },
          },
        );
    }, [action]);

  useEffect(() => {
    function reset() {
      setToken("");

      if (
        widgetIdRef.current &&
        window.turnstile
      ) {
        window.turnstile.reset(
          widgetIdRef.current,
        );
      }
    }

    window.addEventListener(
      RESET_EVENT,
      reset,
    );

    renderWidget();

    return () => {
      window.removeEventListener(
        RESET_EVENT,
        reset,
      );

      if (
        widgetIdRef.current &&
        window.turnstile
      ) {
        window.turnstile.remove(
          widgetIdRef.current,
        );

        widgetIdRef.current =
          null;
      }
    };
  }, [renderWidget]);

  if (!siteKey) {
    return (
      <p
        className="form-error"
        role="alert"
      >
        Human verification is
        temporarily unavailable.
      </p>
    );
  }

  return (
    <div
      className="turnstile-field"
      aria-label="Human verification"
    >
      <Script
        id="cloudflare-turnstile"
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
        onReady={renderWidget}
      />

      <div ref={containerRef} />

      <input
        type="hidden"
        name="cf-turnstile-response"
        value={token}
        readOnly
      />
    </div>
  );
}
