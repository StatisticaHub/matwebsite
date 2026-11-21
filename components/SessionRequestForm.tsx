"use client";

import {
  FormEvent,
  useEffect,
  useMemo,
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


type Status =
  | "idle"
  | "sending"
  | "sent"
  | "error";


export default function SessionRequestForm({
  token,
  engagementId,
  initialTimeZone,
  defaultDurationMinutes = 60,
}: {
  token: string;

  engagementId:
    string;

  initialTimeZone?:
    string | null;

  defaultDurationMinutes?:
    number;
}) {
  const router =
    useRouter();


  const [
    preferredDate,
    setPreferredDate,
  ] =
    useState(
      "",
    );


  const [
    preferredTime,
    setPreferredTime,
  ] =
    useState(
      "",
    );


  const [
    duration,
    setDuration,
  ] =
    useState(
      String(
        defaultDurationMinutes ||
          60,
      ),
    );


  const [
    urgency,
    setUrgency,
  ] =
    useState(
      "flexible",
    );


  const [
    topic,
    setTopic,
  ] =
    useState(
      "",
    );


  const [
    notes,
    setNotes,
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


  const preview =
    useMemo(
      () => {
        if (
          !preferredDate ||
          !preferredTime ||
          !isValidTimeZone(
            timeZone,
          )
        ) {
          return null;
        }


        const converted =
          zonedLocalDateTimeToUtc(
            preferredDate,
            preferredTime,
            timeZone,
          );


        if (
          !converted.ok
        ) {
          return null;
        }


        return formatDateTimeInTimeZone(
          converted.iso,
          timeZone,
        );
      },
      [
        preferredDate,
        preferredTime,
        timeZone,
      ],
    );


  async function submit(
    event:
      FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();


    if (
      !preferredDate ||
      !preferredTime ||
      !topic.trim() ||
      status ===
        "sending"
    ) {
      return;
    }


    const converted =
      zonedLocalDateTimeToUtc(
        preferredDate,
        preferredTime,
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
                  "new",

                engagementId,

                preferredDate,

                preferredTime,

                timeZone,

                durationMinutes:
                  Number(
                    duration,
                  ),

                urgency,

                topic:
                  topic.trim(),

                notes:
                  notes.trim(),
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
            "Could not send your session request.",
        );
      }


      window.localStorage.setItem(
        "mat-portal-time-zone",
        timeZone,
      );


      setPreferredDate(
        "",
      );

      setPreferredTime(
        "",
      );

      setTopic(
        "",
      );

      setNotes(
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
          : "Could not send your session request.",
      );
    }
  }


  return (
    <details className="portal-collapsible-form">

      <summary>
        Choose date, time &
        lesson topic
      </summary>


      <form
        className="portal-form"
        onSubmit={
          submit
        }
      >

        <div className="portal-booking-grid">

          <label>

            <span>
              Preferred date
            </span>

            <input
              type="date"
              value={
                preferredDate
              }
              required
              onChange={(
                event,
              ) =>
                setPreferredDate(
                  event.target
                    .value,
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
              value={
                preferredTime
              }
              required
              onChange={(
                event,
              ) =>
                setPreferredTime(
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
          label="Time zone for this request"
        />


        {preview && (
          <div className="portal-time-preview">

            <span>
              We will interpret
              your request as
            </span>

            <strong>
              {preview}
            </strong>

            <small>
              {timeZone}
            </small>

          </div>
        )}


        <div className="portal-booking-grid">

          <label>

            <span>
              Session length
            </span>

            <select
              value={
                duration
              }
              onChange={(
                event,
              ) =>
                setDuration(
                  event.target
                    .value,
                )
              }
            >
              <option value="30">
                30 minutes
              </option>

              <option value="45">
                45 minutes
              </option>

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
              How soon?
            </span>

            <select
              value={
                urgency
              }
              onChange={(
                event,
              ) =>
                setUrgency(
                  event.target
                    .value,
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

        </div>


        <label>

          <span>
            What would you like
            to work on?
          </span>

          <textarea
            value={
              topic
            }
            required
            maxLength={
              500
            }
            onChange={(
              event,
            ) =>
              setTopic(
                event.target
                  .value,
              )
            }
            placeholder="Topic, question, exam area, assignment or concept you want to cover."
          />

        </label>


        <label>

          <span>
            Anything else?
          </span>

          <textarea
            value={
              notes
            }
            maxLength={
              1200
            }
            onChange={(
              event,
            ) =>
              setNotes(
                event.target
                  .value,
              )
            }
            placeholder="Alternative availability, deadlines or anything useful for your tutor."
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
            : "Request session"}
        </button>


        {status ===
          "sent" && (
          <p className="portal-form-success">
            Request sent. Your
            tutoring team will
            confirm the final
            session time.
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
