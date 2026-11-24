"use client";

import TurnstileWidget, { resetTurnstile } from "@/components/TurnstileWidget";

import { FormEvent, useMemo, useState } from "react";
import { sendGAEvent } from "@next/third-parties/google";
import {
  countries,
  levels,
  subjects,
  supportTypes,
} from "@/lib/tutoring-data";

type Props = {
  compact?: boolean;
  defaultSubject?: string;
  defaultSupportType?: string;
  submitLabel?: string;
};

type Status = {
  type: "idle" | "loading" | "success" | "error";
  message?: string;
  reference?: string;
  mode?: string;
};

export default function TutoringLeadForm({
  compact = false,
  defaultSubject = "",
  defaultSupportType = "",
  submitLabel,
}: Props) {
  const subjectExists = useMemo(
    () => subjects.some((subject) => subject.name === defaultSubject),
    [defaultSubject]
  );

  const supportTypeExists = useMemo(
    () => supportTypes.includes(defaultSupportType),
    [defaultSupportType]
  );

  const [status, setStatus] = useState<Status>({
    type: "idle",
  });

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formElement = event.currentTarget;

    setStatus({
      type: "loading",
    });

    const formData = new FormData(formElement);

    const payload: Record<string, FormDataEntryValue | string> =
      Object.fromEntries(formData.entries());

    const params = new URLSearchParams(window.location.search);

    payload.source = "website";
    payload.landingPage = window.location.href;
    payload.referrer = document.referrer || "";

    payload.utmSource = params.get("utm_source") || "";
    payload.utmMedium = params.get("utm_medium") || "";
    payload.utmCampaign = params.get("utm_campaign") || "";
    payload.utmTerm = params.get("utm_term") || "";
    payload.utmContent = params.get("utm_content") || "";

    try {
      const response = await fetch("/api/tutoring-lead", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...payload,
          turnstileToken: String(
            new FormData(
              event.currentTarget,
            ).get(
              "cf-turnstile-response",
            ) || "",
          ),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Could not submit your tutoring request."
        );
      }

      try {
        sendGAEvent("event", "generate_lead", {
          lead_source:
            params.get("utm_source") ||
            document.referrer ||
            "website",

          subject:
            String(payload.subject || ""),

          academic_level:
            String(payload.level || ""),

          support_type:
            String(payload.supportType || ""),

          landing_page:
            window.location.pathname,
        });
      } catch (analyticsError) {
        console.warn(
          "Analytics event could not be sent:",
          analyticsError
        );
      }

      formElement.reset();

      setStatus({
        type: "success",
        message: data.message,
        reference: data.reference,
        mode: data.mode,
      });
    } catch (error) {
      console.error("Tutoring request error:", error);

      setStatus({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Something went wrong. Please try again.",
      });
    }
  }

  if (status.type === "success") {
    return (
      <div className="form-success" role="status">
        <span className="success-mark">✓</span>

        <h3>Request received</h3>

        <p className="form-success-intro">
          {status.message ||
            "Thank you. We have your tutoring request and will review the academic context before suggesting the next step."}
        </p>

        {status.reference && (
          <div className="reference">
            Your reference: <strong>{status.reference}</strong>
          </div>
        )}

        {status.mode === "demo" && (
          <p className="form-note">
            Development mode: this request was not stored.
          </p>
        )}

        {status.mode !== "demo" && (
          <div className="form-success-next">
            <strong>What happens next</strong>

            <div className="form-success-steps">
              <div>
                <span>1</span>
                <p>We review your subject, level and learning need.</p>
              </div>

              <div>
                <span>2</span>
                <p>We identify suitable tutoring support for the request.</p>
              </div>

              <div>
                <span>3</span>
                <p>We contact you with the proposed next step and price before you book.</p>
              </div>
            </div>
          </div>
        )}

        <div className="form-success-actions">
          <a
            className="button button-primary"
            href="/learn"
          >
            Explore free learning resources
          </a>

          <button
            className="button button-secondary"
            type="button"
            onClick={() =>
              setStatus({
                type: "idle",
              })
            }
          >
            Submit another request
          </button>
        </div>
      </div>
    );
  }

  return (
    <form
      id="tutoring-enquiry-form"
      name="tutoring_enquiry"
      className={`lead-form ${compact ? "lead-form-compact" : ""}`}
      onSubmit={submit}
    >
      <input
        className="honeypot"
        name="companyWebsite"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
      />

      <div className="lead-form-groups">
        <section className="lead-form-group">
          {!compact && (
            <div className="lead-form-group-head">
              <span>01</span>
              <div>
                <strong>Study details</strong>
                <small>Tell us what and where you are studying.</small>
              </div>
            </div>
          )}

          <div className="form-grid">
            <label>
              <span>Subject</span>
              <select
                name="subject"
                required
                defaultValue={subjectExists ? defaultSubject : ""}
              >
                <option value="" disabled>
                  Choose a subject
                </option>
                {subjects.map((subject) => (
                  <option key={subject.slug} value={subject.name}>
                    {subject.name}
                  </option>
                ))}
                <option value="Other">Other</option>
              </select>
            </label>

            <label>
              <span>Academic level</span>
              <select name="level" required defaultValue="">
                <option value="" disabled>
                  Choose your academic level
                </option>
                {levels.map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </select>
            </label>

            <label className="form-span-2">
              <span>Country</span>
              <select name="country" required defaultValue="United Kingdom">
                {countries.map((country) => (
                  <option key={country} value={country}>
                    {country}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </section>

        <section className="lead-form-group">
          {!compact && (
            <div className="lead-form-group-head">
              <span>02</span>
              <div>
                <strong>What do you need help with?</strong>
                <small>Give us enough context to understand the teaching you need.</small>
              </div>
            </div>
          )}

          <div className="form-grid">
            <label className="form-span-2">
              <span>Type of support</span>
              <select
                name="supportType"
                required
                defaultValue={supportTypeExists ? defaultSupportType : ""}
              >
                <option value="" disabled>
                  Choose the type of support
                </option>
                {supportTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </label>

            <label className="form-span-2">
              <span>What do you want help understanding?</span>
              <textarea
                name="requirements"
                required
                minLength={20}
                rows={4}
                placeholder="For example: I am studying MSc Finance and need help understanding regression, hypothesis testing and econometrics before my next assessment."
              />
            </label>
          </div>
        </section>

        <section className="lead-form-group">
          {!compact && (
            <div className="lead-form-group-head">
              <span>03</span>
              <div>
                <strong>Contact details</strong>
                <small>We will use these only to respond to your tutoring request.</small>
              </div>
            </div>
          )}

          <div className="form-grid">
            <label>
              <span>Your name</span>
              <input
                name="name"
                required
                autoComplete="name"
                placeholder="Your name"
              />
            </label>

            <label>
              <span>Email</span>
              <input
                type="email"
                name="email"
                required
                autoComplete="email"
                placeholder="you@example.com"
              />
            </label>
          </div>
        </section>
      </div>

      <label className="consent-row">
        <input
          type="checkbox"
          name="consent"
          value="yes"
          required
        />

        <span>
          I agree that My Academic Tutor may contact me about this request.
        </span>
      </label>

      <TurnstileWidget action="tutoring_enquiry" />

      <button
        className="button button-primary submit-button"
        disabled={status.type === "loading"}
        type="submit"
      >
        {status.type === "loading"
          ? "Submitting…"
          : submitLabel || "Request tutoring"}
      </button>

      {status.type === "error" && (
        <p
          className="form-error"
          role="alert"
        >
          {status.message}
        </p>
      )}

      <p className="form-note">
        No obligation. Submitting this form does not book a lesson or commit you
        to ongoing tutoring.
      </p>
    </form>
  );
}
