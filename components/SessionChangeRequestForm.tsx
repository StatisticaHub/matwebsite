"use client";

import {
  FormEvent,
  useMemo,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

type ChangeType =
  | "reschedule"
  | "cancel";

type Status =
  | "idle"
  | "sending"
  | "sent"
  | "error";

type UpcomingSessionOption = {
  id: string;
  scheduledFor: string;
  topic: string;
  durationMinutes: number;
};

export default function SessionChangeRequestForm({
  token,
  engagementId,
  sessions,
  defaultSessionId,
}: {
  token: string;
  engagementId: string;
  sessions: UpcomingSessionOption[];
  defaultSessionId?: string | null;
}) {
  const router =
    useRouter();

  const timezone =
    useMemo(
      () =>
        Intl.DateTimeFormat()
          .resolvedOptions()
          .timeZone ||
        "Not provided",
      []
    );

  const initialSessionId =
    defaultSessionId &&
    sessions.some(
      (item) =>
        item.id ===
        defaultSessionId
    )
      ? defaultSessionId
      : sessions[0]?.id ||
        "";

  const [
    sessionId,
    setSessionId,
  ] =
    useState(
      initialSessionId
    );

  const [
    changeType,
    setChangeType,
  ] =
    useState<ChangeType>(
      "reschedule"
    );

  const [
    requestedDate,
    setRequestedDate,
  ] =
    useState("");

  const [
    requestedTime,
    setRequestedTime,
  ] =
    useState("");

  const [
    reason,
    setReason,
  ] =
    useState("");

  const [
    status,
    setStatus,
  ] =
    useState<Status>(
      "idle"
    );

  const [
    errorMessage,
    setErrorMessage,
  ] =
    useState("");

  const selectedSession =
    sessions.find(
      (item) =>
        item.id ===
        sessionId
    ) || sessions[0];

  const currentBooking =
    selectedSession
      ? new Intl.DateTimeFormat(
          "en-GB",
          {
            dateStyle:
              "medium",
            timeStyle:
              "short",
          }
        ).format(
          new Date(
            selectedSession.scheduledFor
          )
        )
      : null;

  async function submit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (
      !selectedSession ||
      !reason.trim() ||
      status ===
        "sending"
    ) {
      return;
    }

    if (
      changeType ===
        "reschedule" &&
      (!requestedDate ||
        !requestedTime)
    ) {
      setStatus(
        "error"
      );

      setErrorMessage(
        "Please choose your preferred new date and time."
      );

      return;
    }

    setStatus(
      "sending"
    );

    setErrorMessage(
      ""
    );

    const lines = [
      "SESSION CHANGE REQUEST",
      "",
      `Change type: ${
        changeType ===
        "reschedule"
          ? "Reschedule"
          : "Cancellation"
      }`,
      `Session ID: ${selectedSession.id}`,
      `Current scheduled UTC: ${selectedSession.scheduledFor}`,
      `Session topic: ${selectedSession.topic}`,
    ];

    if (
      changeType ===
      "reschedule"
    ) {
      const localDate =
        new Date(
          `${requestedDate}T${requestedTime}:00`
        );

      if (
        Number.isNaN(
          localDate.getTime()
        )
      ) {
        setStatus(
          "error"
        );

        setErrorMessage(
          "Please choose a valid new date and time."
        );

        return;
      }

      lines.push(
        `Requested local date: ${requestedDate}`,
        `Requested local time: ${requestedTime}`,
        `Student timezone: ${timezone}`,
        `Requested UTC: ${localDate.toISOString()}`
      );
    } else {
      lines.push(
        `Student timezone: ${timezone}`
      );
    }

    lines.push(
      "",
      `Reason: ${reason.trim()}`
    );

    try {
      const response =
        await fetch(
          `/api/portal/${encodeURIComponent(
            token
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
                engagementId,

                category:
                  "session_request",

                message:
                  lines.join(
                    "\n"
                  ),
              }),
          }
        );

      const result =
        await response
          .json()
          .catch(
            () => null
          );

      if (
        !response.ok
      ) {
        throw new Error(
          result?.error ||
            "Could not send your session change request."
        );
      }

      setRequestedDate(
        ""
      );

      setRequestedTime(
        ""
      );

      setReason(
        ""
      );

      setStatus(
        "sent"
      );

      router.refresh();
    } catch (
      error
    ) {
      setStatus(
        "error"
      );

      setErrorMessage(
        error instanceof
          Error
          ? error.message
          : "Could not send your session change request."
      );
    }
  }

  if (
    !sessions.length
  ) {
    return null;
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
          Which session?
        </span>

        <select
          value={
            sessionId
          }
          onChange={(
            event
          ) => {
            setSessionId(
              event.target
                .value
            );

            setStatus(
              "idle"
            );
          }}
        >
          {sessions.map(
            (item) => (
              <option
                key={
                  item.id
                }
                value={
                  item.id
                }
              >
                {new Intl.DateTimeFormat(
                  "en-GB",
                  {
                    dateStyle:
                      "medium",
                    timeStyle:
                      "short",
                  }
                ).format(
                  new Date(
                    item.scheduledFor
                  )
                )}{" "}
                —{" "}
                {
                  item.topic
                }
              </option>
            )
          )}
        </select>

        {currentBooking && (
          <small>
            Current booking in
            your time zone:{" "}
            {currentBooking}
            {" · "}
            {timezone}
          </small>
        )}
      </label>


      <label>
        <span>
          What would you like to do?
        </span>

        <select
          value={
            changeType
          }
          onChange={(
            event
          ) => {
            setChangeType(
              event.target
                .value as ChangeType
            );

            setStatus(
              "idle"
            );
          }}
        >
          <option value="reschedule">
            Request a different time
          </option>

          <option value="cancel">
            Request cancellation
          </option>
        </select>
      </label>


      {changeType ===
        "reschedule" && (
        <>
          <label>
            <span>
              Preferred new date
            </span>

            <input
              type="date"
              value={
                requestedDate
              }
              required
              onChange={(
                event
              ) =>
                setRequestedDate(
                  event.target
                    .value
                )
              }
            />
          </label>


          <label>
            <span>
              Preferred new time
            </span>

            <input
              type="time"
              value={
                requestedTime
              }
              required
              onChange={(
                event
              ) =>
                setRequestedTime(
                  event.target
                    .value
                )
              }
            />

            <small>
              Your time zone:{" "}
              {timezone}
            </small>
          </label>
        </>
      )}


      <label>
        <span>
          Reason
        </span>

        <textarea
          value={
            reason
          }
          required
          maxLength={
            1000
          }
          onChange={(
            event
          ) =>
            setReason(
              event.target
                .value
            )
          }
          placeholder={
            changeType ===
            "reschedule"
              ? "For example: class timetable changed, work shift, exam preparation..."
              : "Tell us briefly why you need to cancel this session."
          }
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
          : changeType ===
              "reschedule"
            ? "Request reschedule"
            : "Request cancellation"}
      </button>


      {status ===
        "sent" && (
        <p className="portal-form-success">
          Your request has been
          sent. The existing
          booking will stay
          unchanged until your
          tutoring team reviews
          it.
        </p>
      )}


      {status ===
        "error" && (
        <p className="portal-form-error">
          {errorMessage ||
            "We could not send your request. Please try again."}
        </p>
      )}
    </form>
  );
}
