"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import TimeZonePicker from "@/components/TimeZonePicker";

import {
  isValidTimeZone,
} from "@/lib/time-zone";


export default function PortalTimeZoneControl({
  token,
  initialTimeZone,
}: {
  token: string;
  initialTimeZone: string;
}) {
  const router =
    useRouter();


  const [
    timeZone,
    setTimeZone,
  ] =
    useState(
      initialTimeZone,
    );


  const [
    state,
    setState,
  ] =
    useState<
      | "idle"
      | "saving"
      | "saved"
      | "error"
    >(
      "idle",
    );


  useEffect(
    () => {
      if (
        isValidTimeZone(
          initialTimeZone,
        )
      ) {
        return;
      }


      const detected =
        Intl.DateTimeFormat()
          .resolvedOptions()
          .timeZone;


      if (
        isValidTimeZone(
          detected,
        )
      ) {
        setTimeZone(
          detected,
        );
      }
    },
    [
      initialTimeZone,
    ],
  );


  async function save() {
    if (
      !isValidTimeZone(
        timeZone,
      )
    ) {
      setState(
        "error",
      );

      return;
    }


    setState(
      "saving",
    );


    const response =
      await fetch(
        `/api/portal/${encodeURIComponent(
          token,
        )}/timezone`,
        {
          method:
            "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body:
            JSON.stringify({
              timeZone,
            }),
        },
      );


    if (
      !response.ok
    ) {
      setState(
        "error",
      );

      return;
    }


    window.localStorage.setItem(
      "mat-portal-time-zone",
      timeZone,
    );


    window.dispatchEvent(
      new CustomEvent(
        "mat:portal-time-zone",
        {
          detail:
            timeZone,
        },
      ),
    );


    setState(
      "saved",
    );

    router.refresh();
  }


  return (
    <details className="portal-time-zone-control">

      <summary>
        <span>
          Your time
        </span>

        <strong>
          {
            timeZone
          }
        </strong>
      </summary>


      <div>

        <TimeZonePicker
          value={
            timeZone
          }
          onChange={
            setTimeZone
          }
        />


        <button
          type="button"
          className="button button-primary"
          disabled={
            state ===
            "saving"
          }
          onClick={
            save
          }
        >
          {state ===
          "saving"
            ? "Saving…"
            : "Use this time zone"}
        </button>


        {state ===
          "saved" && (
          <small>
            Time zone saved.
          </small>
        )}


        {state ===
          "error" && (
          <small className="portal-form-error">
            Choose a valid
            time zone.
          </small>
        )}

      </div>

    </details>
  );
}
