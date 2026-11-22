"use client";

import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";

import TimeZoneSelect from "@/components/TimeZoneSelect";

import {
  DEFAULT_TIME_ZONE,
  isValidTimeZone,
} from "@/lib/time-zone";

type LooseObject =
  Record<string, any>;

type Props = {
  token: string;
  [key: string]: any;
};

const academicLevels = [
  "School / Secondary",
  "GCSE / IGCSE",
  "A-level / IB",
  "Undergraduate",
  "Postgraduate",
  "Research / Professional",
  "Other",
];

function firstValue(
  ...values: unknown[]
) {
  for (
    const value of values
  ) {
    const text =
      String(
        value ?? "",
      ).trim();

    if (text) {
      return text;
    }
  }

  return "";
}

export default function StudentIntakeForm(
  props: Props,
) {
  const student =
    (
      props.student as
        | LooseObject
        | undefined
    ) ||
    (
      props.context
        ?.student as
        | LooseObject
        | undefined
    ) ||
    {};

  const onboarding =
    (
      props.onboarding as
        | LooseObject
        | undefined
    ) ||
    (
      props.context
        ?.onboarding as
        | LooseObject
        | undefined
    ) ||
    {};

  const engagement =
    (
      props.engagement as
        | LooseObject
        | undefined
    ) ||
    (
      props.context
        ?.engagement as
        | LooseObject
        | undefined
    ) ||
    {};

  const initialLevel =
    firstValue(
      props.initialAcademicLevel,
      props.academicLevel,
      student.academic_level,
    );

  const initialGoal =
    firstValue(
      props.initialTargetOutcome,
      props.targetOutcome,
      onboarding.target_outcome,
      engagement.current_focus,
      engagement.goal,
    );

  const initialAvailability =
    firstValue(
      props.initialAvailability,
      props.availability,
      onboarding.availability,
    );

  const initialNote =
    firstValue(
      props.initialAnythingElse,
      props.anythingElse,
      onboarding.anything_else,
    );

  const suppliedTimeZone =
    firstValue(
      props.initialTimeZone,
      props.timezone,
      onboarding.timezone,
    );

  const [
    timeZone,
    setTimeZone,
  ] =
    useState(
      isValidTimeZone(
        suppliedTimeZone,
      )
        ? suppliedTimeZone
        : DEFAULT_TIME_ZONE,
    );

  const [
    status,
    setStatus,
  ] =
    useState<
      | "idle"
      | "saving"
      | "saved"
      | "error"
    >("idle");

  const [
    message,
    setMessage,
  ] =
    useState("");

  const detectedTimeZone =
    useMemo(
      () => {
        try {
          return (
            Intl.DateTimeFormat()
              .resolvedOptions()
              .timeZone ||
            ""
          );
        } catch {
          return "";
        }
      },
      [],
    );

  useEffect(
    () => {
      if (
        !suppliedTimeZone &&
        detectedTimeZone &&
        isValidTimeZone(
          detectedTimeZone,
        )
      ) {
        setTimeZone(
          detectedTimeZone,
        );
      }
    },
    [
      detectedTimeZone,
      suppliedTimeZone,
    ],
  );

  async function submit(
    event:
      FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (
      status ===
      "saving"
    ) {
      return;
    }

    const form =
      new FormData(
        event.currentTarget,
      );

    const academicLevel =
      String(
        form.get(
          "academicLevel",
        ) || "",
      ).trim();

    const targetOutcome =
      String(
        form.get(
          "targetOutcome",
        ) || "",
      ).trim();

    const availability =
      String(
        form.get(
          "availability",
        ) || "",
      ).trim();

    const anythingElse =
      String(
        form.get(
          "anythingElse",
        ) || "",
      ).trim();

    const consent =
      form.get(
        "consent",
      ) ===
      "yes";

    if (
      !academicLevel ||
      !targetOutcome ||
      !availability
    ) {
      setStatus(
        "error",
      );

      setMessage(
        "Please complete your level, what you want help with, and your usual availability.",
      );

      return;
    }

    if (!consent) {
      setStatus(
        "error",
      );

      setMessage(
        "Please confirm the tutoring setup checkbox.",
      );

      return;
    }

    setStatus(
      "saving",
    );

    setMessage("");

    try {
      const response =
        await fetch(
          `/api/intake/${encodeURIComponent(
            props.token,
          )}`,
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                company:
                  "",

                consent:
                  "yes",

                academicLevel,

                targetOutcome,

                timezone:
                  timeZone,

                availability,

                anythingElse,
              }),
          },
        );

      const result =
        await response
          .json()
          .catch(
            () => null,
          );

      if (
        !response.ok
      ) {
        throw new Error(
          result?.error ||
            "Could not save your learning details.",
        );
      }

      setStatus(
        "saved",
      );
    } catch (
      error
    ) {
      setStatus(
        "error",
      );

      setMessage(
        error instanceof
          Error
          ? error.message
          : "Could not save your learning details.",
      );
    }
  }

  if (
    status ===
    "saved"
  ) {
    return (
      <section className="intake-card intake-success">
        <span className="intake-kicker">
          All set
        </span>

        <h2>
          Your learning details
          are saved.
        </h2>

        <p>
          Your tutor now has the
          essentials needed to
          prepare for your tutoring.
        </p>
      </section>
    );
  }

  return (
    <form
      className="intake-form"
      onSubmit={submit}
    >
      <div className="intake-form-intro">
        <span className="intake-kicker">
          Quick learning setup
        </span>

        <h2>
          Just the essentials.
        </h2>

        <p>
          This should take about a
          minute. Your tutor can
          learn the finer details
          with you during your first
          lesson.
        </p>
      </div>

      <div className="intake-simple-grid">
        <label>
          <span>
            1. Your level
          </span>

          <select
            name="academicLevel"
            required
            defaultValue={
              initialLevel
            }
          >
            <option
              value=""
              disabled
            >
              Choose your level
            </option>

            {academicLevels.map(
              (level) => (
                <option
                  key={level}
                  value={level}
                >
                  {level}
                </option>
              ),
            )}
          </select>
        </label>

        <label className="intake-field-wide">
          <span>
            2. What would you like
            help with?
          </span>

          <textarea
            name="targetOutcome"
            required
            defaultValue={
              initialGoal
            }
            placeholder="For example: prepare for an exam, understand a difficult topic, improve coursework skills, or work through a specific chapter."
          />
        </label>

        <label>
          <span>
            3. Your timezone
          </span>

          <TimeZoneSelect
            value={timeZone}
            required
            onChange={
              setTimeZone
            }
          />

          <small>
            We detect this
            automatically. Change it
            only if needed. Session
            times will use this
            timezone.
          </small>
        </label>

        <label>
          <span>
            4. When are you usually
            available?
          </span>

          <textarea
            name="availability"
            required
            defaultValue={
              initialAvailability
            }
            placeholder="For example: weekday evenings, Saturday mornings, or flexible."
          />
        </label>

        <label className="intake-field-wide">
          <span>
            5. Anything your tutor
            should know? (optional)
          </span>

          <textarea
            name="anythingElse"
            defaultValue={
              initialNote
            }
            placeholder="An upcoming deadline, learning needs, materials you use, or anything else that would help."
          />
        </label>
      </div>

      <label className="intake-consent">
        <input
          name="consent"
          type="checkbox"
          value="yes"
          required
        />

        <span>
          I confirm these details can
          be used to arrange and
          deliver my tutoring.
        </span>
      </label>

      <input
        name="company"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="intake-honeypot"
      />

      <button
        className="button button-primary"
        type="submit"
        disabled={
          status ===
          "saving"
        }
      >
        {status ===
        "saving"
          ? "Saving…"
          : "Save and continue"}
      </button>

      {message && (
        <p className="intake-form-error">
          {message}
        </p>
      )}
    </form>
  );
}
