"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type Status =
  | "idle"
  | "sending"
  | "sent"
  | "error";

export default function SessionRequestForm({
  token,
}: {
  token: string;
}) {
  const router = useRouter();

  const [status, setStatus] =
    useState<Status>("idle");

  const [preferredDate, setPreferredDate] =
    useState("");

  const [preferredTime, setPreferredTime] =
    useState("");

  const [duration, setDuration] =
    useState("60");

  const [urgency, setUrgency] =
    useState("flexible");

  const [topic, setTopic] =
    useState("");

  const [notes, setNotes] =
    useState("");

  async function submit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (
      !preferredDate ||
      !preferredTime ||
      !topic.trim() ||
      status === "sending"
    ) {
      return;
    }

    setStatus("sending");

    const timezone =
      Intl.DateTimeFormat()
        .resolvedOptions()
        .timeZone || "Not provided";

    const urgencyLabel =
      urgency === "urgent"
        ? "As soon as possible"
        : urgency === "this_week"
          ? "This week"
          : "Flexible";

    const message = [
      "SESSION REQUEST",
      "",
      `Preferred date: ${preferredDate}`,
      `Preferred time: ${preferredTime}`,
      `Timezone: ${timezone}`,
      `Session length: ${duration} minutes`,
      `Urgency: ${urgencyLabel}`,
      "",
      `Topic / goal: ${topic.trim()}`,
      "",
      notes.trim()
        ? `Additional notes: ${notes.trim()}`
        : "Additional notes: None",
    ].join("\n");

    try {
      const response = await fetch(
        `/api/portal/${encodeURIComponent(
          token
        )}/support`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            category:
              "session_request",
            message,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          "Request failed"
        );
      }

      setPreferredDate("");
      setPreferredTime("");
      setDuration("60");
      setUrgency("flexible");
      setTopic("");
      setNotes("");
      setStatus("sent");

      router.refresh();
    } catch {
      setStatus("error");
    }
  }

  return (
    <form
      className="portal-form"
      onSubmit={submit}
    >
      <label>
        <span>
          Preferred date
        </span>

        <input
          type="date"
          value={preferredDate}
          required
          onChange={(event) =>
            setPreferredDate(
              event.target.value
            )
          }
        />
      </label>

      <label>
        <span>
          Preferred time
        </span>

        <input
          type="time"
          value={preferredTime}
          required
          onChange={(event) =>
            setPreferredTime(
              event.target.value
            )
          }
        />
      </label>

      <label>
        <span>
          Session length
        </span>

        <select
          value={duration}
          onChange={(event) =>
            setDuration(
              event.target.value
            )
          }
        >
          <option value="60">
            60 minutes
          </option>

          <option value="75">
            75 minutes
          </option>

          <option value="90">
            90 minutes
          </option>

          <option value="120">
            120 minutes
          </option>
        </select>
      </label>

      <label>
        <span>
          How soon do you need it?
        </span>

        <select
          value={urgency}
          onChange={(event) =>
            setUrgency(
              event.target.value
            )
          }
        >
          <option value="flexible">
            Flexible
          </option>

          <option value="this_week">
            This week
          </option>

          <option value="urgent">
            As soon as possible
          </option>
        </select>
      </label>

      <label>
        <span>
          What would you like to
          cover?
        </span>

        <textarea
          value={topic}
          required
          maxLength={500}
          onChange={(event) =>
            setTopic(
              event.target.value
            )
          }
          placeholder="For example: confidence intervals, regression diagnostics, exam preparation, R coding, dissertation analysis..."
        />
      </label>

      <label>
        <span>
          Anything else we should
          know?
        </span>

        <textarea
          value={notes}
          maxLength={1200}
          onChange={(event) =>
            setNotes(
              event.target.value
            )
          }
          placeholder="Alternative availability, a deadline, particular questions or anything your tutor should know."
        />
      </label>

      <button
        className="button button-primary"
        disabled={
          status === "sending"
        }
        type="submit"
      >
        {status === "sending"
          ? "Sending…"
          : "Request session"}
      </button>

      {status === "sent" && (
        <p className="portal-form-success">
          Session request sent.
          Your tutoring team can now
          review your preferred time
          and learning goal.
        </p>
      )}

      {status === "error" && (
        <p className="portal-form-error">
          We could not send your
          session request. Please try
          again.
        </p>
      )}
    </form>
  );
}