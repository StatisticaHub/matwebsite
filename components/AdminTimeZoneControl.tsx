
"use client";

import {
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import TimeZoneSelect from "@/components/TimeZoneSelect";

type Props = {
  initialTimeZone: string;
};

export default function AdminTimeZoneControl({
  initialTimeZone,
}: Props) {
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
      | "error"
    >("idle");

  async function change(
    nextTimeZone: string,
  ) {
    setTimeZone(
      nextTimeZone,
    );

    setState(
      "saving",
    );

    try {
      const response =
        await fetch(
          "/api/admin/timezone",
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                timezone:
                  nextTimeZone,
              }),
          },
        );

      if (
        !response.ok
      ) {
        throw new Error();
      }

      setState(
        "idle",
      );

      router.refresh();
    } catch {
      setState(
        "error",
      );
    }
  }

  return (
    <div className="admin-timezone-control">
      <span>
        Session timezone
      </span>

      <TimeZoneSelect
        value={timeZone}
        onChange={change}
        disabled={
          state ===
          "saving"
        }
      />

      <small>
        {state ===
        "saving"
          ? "Saving…"
          : state ===
              "error"
            ? "Could not save timezone."
            : "Admin session times use this timezone."}
      </small>
    </div>
  );
}
