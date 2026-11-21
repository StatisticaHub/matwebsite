"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import TimeZonePicker from "@/components/TimeZonePicker";

import {
  DEFAULT_TIME_ZONE,
  formatDateTimeInTimeZone,
  isValidTimeZone,
  zonedLocalDateTimeToUtc,
} from "@/lib/time-zone";


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
  initialTimeZone,
}: {
  token: string;

  engagementId:
    string;

  sessions:
    UpcomingSessionOption[];

  defaultSessionId?:
    string | null;

  initialTimeZone?:
    string | null;
}) {
  const router =
    useRouter();


  const initialSessionId =
    defaultSessionId &&
    sessions.some(
      (item) =>
        item.id ===
        defaultSessionId,
    )
      ? defaultSessionId
      : sessions[0]
          ?.id ||
        "";


  const [
    sessionId,
    setSessionId,
  ] =
    useState(
      initialSessionId,
    );


  const [
    changeType,
    setChangeType,
  ] =
    useState<ChangeType>(
      "reschedule",
    );


  const [
    requestedDate,
    setRequestedDate,
  ] =
    useState(
      "",
    );


  const [
    requestedTime,
    setRequestedTime,
  ] =
    useState(
      "",
    );


  const [
    reason,
    setReason,
  ] =
    useState(
      "",
    );


  const [
    timeZone,
    setTimeZone,
  ] =
    useState(
      isValidTimeZone(
        initialTimeZone,
      )
        ? initialTimeZone
        : DEFAULT_TIME_ZONE,
    );


  const [
    status,
    setStatus,
  ] =
    useState<Status>(
      "idle",
    );


  const [
    errorMessage,
    setErrorMessage,
  ] =
    useState(
      "",
    );


  useEffect(
    () => {
      const saved =
        window.localStorage
          .getItem(
            "mat-portal-time-zone",
          );


      const detected =
        Intl.DateTimeFormat()
          .resolvedOptions()
          .timeZone;


      if (
        isValidTimeZone(
          saved,
        )
      ) {
        setTimeZone(
          saved,
        );

      } else if (
        !isValidTimeZone(
          initialTimeZone,
        ) &&
        isValidTimeZone(
          detected,
        )
      ) {
        setTimeZone(
          detected,
        );
      }


      function handleTimeZone(
        event:
          Event,
      ) {
        const value =
          (
            event as
              CustomEvent<string>
          ).detail;


        if (
          isValidTimeZone(
            value,
          )
        ) {
          setTimeZone(
            value,
          );
        }
      }


      window.addEventListener(
        "mat:portal-time-zone",
        handleTimeZone,
      );


      return () =>
        window.removeEventListener(
          "mat:portal-time-zone",
          handleTimeZone,
        );
    },
    [
      initialTimeZone,
    ],
  );


  const selectedSession =
    sessions.find(
      (item) =>
        item.id ===
        sessionId,
    ) ||
    sessions[0];


  const currentBooking =
    selectedSession
      ? formatDateTimeInTimeZone(
          selectedSession.scheduledFor,
          timeZone,
        )
      : null;


  async function submit(
    event:
      FormEvent<HTMLFormElement>,
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
        "reschedule"
    ) {
      const converted =
        zonedLocalDateTimeToUtc(
          requestedDate,
          requestedTime,
          timeZone,
        );


      if (
        !converted.ok
      ) {
        setStatus(
          "error",
        );

        setErrorMessage(
          converted.error,
        );

        return;
      }
    }


    setStatus(
      "sending",
    );

    setErrorMessage(
      "",
    );


    try {
      const response =
        await fetch(
          `/api/portal/${encodeURIComponent(
            token,
          )}/session-request`,
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                type:
                  "change",

                engagementId,

                sessionId:
                  selectedSession.id,

                changeType,

                requestedDate,

                requestedTime,

                timeZone,

                reason:
                  reason.trim(),
              }),
          },
        );


      const result =
        await response
          .json()
          .catch(
            () =>
              null,
          );


      if (
        !response.ok
      ) {
        throw new Error(
          result?.error ||
            "Could not send your request.",
        );
      }


      window.localStorage.setItem(
        "mat-portal-time-zone",
        timeZone,
      );


      setRequestedDate(
        "",
      );

      setRequestedTime(
        "",
      );

      setReason(
        "",
      );

      setStatus(
        "sent",
      );


      router.refresh();

    } catch (
      error
    ) {
      setStatus(
        "error",
      );

      setErrorMessage(
        error instanceof
          Error
          ? error.message
          : "Could not send your request.",
      );
    }
  }


  if (
    !sessions.length
  ) {
    return null;
  }


  return (
    <details className="portal-collapsible-form">

      <summary>
        Change or cancel an
        existing session
      </summary>


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
              event,
            ) => {
              setSessionId(
                event.target
                  .value,
              );

              setStatus(
                "idle",
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
                  {formatDateTimeInTimeZone(
                    item.scheduledFor,
                    timeZone,
                  )}
                  {" — "}
                  {
                    item.topic
                  }
                </option>
              ),
            )}
          </select>


          {currentBooking && (
            <small>
              Current booking:
              {" "}
              {
                currentBooking
              }
              {" · "}
              {
                timeZone
              }
            </small>
          )}

        </label>


        <label>

          <span>
            What would you like
            to do?
          </span>

          <select
            value={
              changeType
            }
            onChange={(
              event,
            ) =>
              setChangeType(
                event.target
                  .value as
                  ChangeType,
              )
            }
          >
            <option value="reschedule">
              Request a different
              time
            </option>

            <option value="cancel">
              Request cancellation
            </option>
          </select>

        </label>


        {changeType ===
          "reschedule" && (
          <>

            <div className="portal-booking-grid">

              <label>

                <span>
                  New date
                </span>

                <input
                  type="date"
                  value={
                    requestedDate
                  }
                  required
                  onChange={(
                    event,
                  ) =>
                    setRequestedDate(
                      event.target
                        .value,
                    )
                  }
                />

              </label>


              <label>

                <span>
                  New time
                </span>

                <input
                  type="time"
                  value={
                    requestedTime
                  }
                  required
                  onChange={(
                    event,
                  ) =>
                    setRequestedTime(
                      event.target
                        .value,
                    )
                  }
                />

              </label>

            </div>


            <TimeZonePicker
              value={
                timeZone
              }
              onChange={
                setTimeZone
              }
              label="Time zone for the new time"
            />

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
              1200
            }
            onChange={(
              event,
            ) =>
              setReason(
                event.target
                  .value,
              )
            }
            placeholder="For example: class timetable changed, work shift or another commitment."
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
                "cancel"
              ? "Request cancellation"
              : "Request new time"}
        </button>


        {status ===
          "sent" && (
          <p className="portal-form-success">
            Request sent. Your
            current booking stays
            unchanged until MAT
            confirms the update.
          </p>
        )}


        {status ===
          "error" && (
          <p className="portal-form-error">
            {
              errorMessage
            }
          </p>
        )}

      </form>

    </details>
  );
}
