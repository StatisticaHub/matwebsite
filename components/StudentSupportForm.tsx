"use client";

import {
  FormEvent,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";


export default function StudentSupportForm({
  token,
  engagementId,
}: {
  token: string;

  engagementId?:
    | string
    | null;
}) {
  const router =
    useRouter();


  const [
    status,
    setStatus,
  ] =
    useState<
      | "idle"
      | "sending"
      | "sent"
      | "error"
    >(
      "idle",
    );


  const [
    message,
    setMessage,
  ] =
    useState("");


  const [
    category,
    setCategory,
  ] =
    useState(
      "general",
    );


  async function submit(
    event:
      FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (
      !message.trim() ||
      status ===
        "sending"
    ) {
      return;
    }


    setStatus(
      "sending",
    );


    try {
      const response =
        await fetch(
          `/api/portal/${encodeURIComponent(
            token,
          )}/support`,
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                engagementId:
                  engagementId ||
                  null,

                category,

                message,
              }),
          },
        );


      if (!response.ok) {
        throw new Error(
          "Request failed",
        );
      }


      setMessage("");

      setStatus(
        "sent",
      );

      router.refresh();

    } catch {
      setStatus(
        "error",
      );
    }
  }


  return (
    <form
      className="portal-form"
      onSubmit={
        submit
      }
    >

      <label>

        <span>
          What do you need help
          with?
        </span>

        <select
          value={
            category
          }
          onChange={(
            event,
          ) =>
            setCategory(
              event.target.value,
            )
          }
        >

          <option value="general">
            General support
          </option>

          <option value="lesson">
            Lesson / topic
          </option>

          <option value="homework">
            Homework
          </option>

          <option value="resource">
            Learning resource
          </option>

          <option value="technical">
            Technical issue
          </option>

        </select>

      </label>


      <label>

        <span>
          Message
        </span>

        <textarea
          value={
            message
          }
          maxLength={
            3000
          }
          required
          onChange={(
            event,
          ) =>
            setMessage(
              event.target.value,
            )
          }
          placeholder="Tell us what you need and we’ll pick it up from your learning record."
        />

      </label>


      <button
        className="button button-primary"
        disabled={
          status ===
          "sending"
        }
        type="submit"
      >
        {status ===
        "sending"
          ? "Sending…"
          : "Send request"}
      </button>


      {status ===
        "sent" && (
        <p className="portal-form-success" role="status" aria-live="polite">
          Request sent. Your
          tutoring team can now
          see it.
        </p>
      )}


      {status ===
        "error" && (
        <p className="portal-form-error" role="alert">
          We could not send that
          request. Please try
          again.
        </p>
      )}

    </form>
  );
}
