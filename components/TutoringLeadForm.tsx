"use client";

import TurnstileWidget, { resetTurnstile } from "@/components/TurnstileWidget";

import {
  FocusEvent,
  FormEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
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
  defaultLevel?: string;
  defaultTopic?: string;
  defaultSupportType?: string;
  submitLabel?: string;
  defaultCountry?: string;
  defaultCurrency?: "GBP" | "USD" | "CAD";
  defaultSource?: string;
};

const supportTypePresentation: Record<
  string,
  {
    label: string;
    description: string;
  }
> = {
  "Regular 1:1 tutoring": {
    label: "Regular tutoring",
    description:
      "Ongoing one-to-one teaching that follows your course and progress.",
  },
  "One-off topic session": {
    label: "One-off topic",
    description:
      "Work through one difficult concept, method or problem area.",
  },
  "Exam preparation": {
    label: "Exam preparation",
    description:
      "Revision, guided practice and exam-style problem solving.",
  },
  "University module support": {
    label: "University module",
    description:
      "Support alongside lectures, problem sheets and course material.",
  },
  "Master’s support": {
    label: "Master’s study",
    description:
      "Advanced methods, quantitative modules and postgraduate learning.",
  },
  "Statistics & data analysis tutoring": {
    label: "Statistics & data analysis",
    description:
      "Statistical methods, interpretation and applied analytical reasoning.",
  },
  "Research / dissertation support": {
    label: "Research & dissertation",
    description:
      "Methods, analysis planning and defensible interpretation.",
  },
  "Software / coding support": {
    label: "Software & coding",
    description:
      "Guided work in R, Python, SPSS, Stata and analytical workflows.",
  },
  "Not sure yet": {
    label: "Not sure yet",
    description:
      "Tell us what you are studying and we will help identify the right support.",
  },
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
  defaultLevel = "",
  defaultTopic = "",
  defaultSupportType = "",
  submitLabel,
  defaultCountry = "",
  defaultCurrency = "GBP",
  defaultSource = "website",
}: Props) {
  const subjectExists = useMemo(
    () => subjects.some((subject) => subject.name === defaultSubject),
    [defaultSubject]
  );

  const levelExists = useMemo(
    () => levels.includes(defaultLevel),
    [defaultLevel]
  );

  const supportTypeExists = useMemo(
    () => supportTypes.includes(defaultSupportType),
    [defaultSupportType]
  );

  const [status, setStatus] = useState<Status>({
    type: "idle",
  });

  const formRef =
    useRef<HTMLFormElement | null>(
      null
    );

  const analyticsMilestones = useRef({
    viewed: false,
    started: false,
    supportSelected: false,
    requirementsStarted: false,
    contactReached: false,
  });

  function analyticsContext(
    extra: Record<
      string,
      string | number
    > = {},
  ) {
    if (typeof window === "undefined") {
      return extra;
    }

    const params =
      new URLSearchParams(
        window.location.search
      );

    return {
      form_name:
        "tutoring_enquiry",
      form_variant:
        compact
          ? "compact"
          : "full",
      lead_source:
        params.get("utm_source") ||
        defaultSource ||
        "website",
      utm_campaign:
        params.get("utm_campaign") ||
        "none",
      landing_page:
        window.location.pathname,
      learning_hub:
        params.get("utm_source") ===
        "learning_hub"
          ? "yes"
          : "no",
      subject:
        defaultSubject ||
        "not_prefilled",
      ...extra,
    };
  }

  function trackFunnelEvent(
    eventName: string,
    extra: Record<
      string,
      string | number
    > = {},
  ) {
    try {
      sendGAEvent(
        "event",
        eventName,
        analyticsContext(extra),
      );
    } catch (analyticsError) {
      console.warn(
        "Analytics event could not be sent:",
        analyticsError,
      );
    }
  }

  function markFormStarted() {
    if (
      analyticsMilestones.current
        .started
    ) {
      return;
    }

    analyticsMilestones.current.started =
      true;

    trackFunnelEvent(
      "tutoring_form_start",
    );
  }

  function handleFormFocus(
    event: FocusEvent<HTMLFormElement>,
  ) {
    markFormStarted();

    const target = event.target;

    if (
      !(
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement
      )
    ) {
      return;
    }

    if (
      (
        target.name === "name" ||
        target.name === "email"
      ) &&
      !analyticsMilestones.current
        .contactReached
    ) {
      analyticsMilestones.current.contactReached =
        true;

      trackFunnelEvent(
        "tutoring_contact_reached",
      );
    }
  }

  function handleFormChange(
    event: FormEvent<HTMLFormElement>,
  ) {
    markFormStarted();

    const target = event.target;

    if (
      !(
        target instanceof HTMLInputElement ||
        target instanceof HTMLSelectElement
      )
    ) {
      return;
    }

    if (
      target.name ===
        "supportType" &&
      target.value &&
      !analyticsMilestones.current
        .supportSelected
    ) {
      analyticsMilestones.current.supportSelected =
        true;

      trackFunnelEvent(
        "tutoring_support_selected",
        {
          support_type:
            target.value,
        },
      );
    }
  }

  function handleFormInput(
    event: FormEvent<HTMLFormElement>,
  ) {
    markFormStarted();

    const target = event.target;

    if (
      !(
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement
      )
    ) {
      return;
    }

    if (
      target.name ===
        "requirements" &&
      target.value.trim().length >
        0 &&
      !analyticsMilestones.current
        .requirementsStarted
    ) {
      analyticsMilestones.current.requirementsStarted =
        true;

      trackFunnelEvent(
        "tutoring_requirements_started",
      );
    }
  }

  useEffect(() => {
    const form =
      formRef.current;

    if (!form) {
      return;
    }

    function markViewed() {
      if (
        analyticsMilestones.current
          .viewed
      ) {
        return;
      }

      analyticsMilestones.current.viewed =
        true;

      trackFunnelEvent(
        "tutoring_form_view",
      );
    }

    if (
      typeof IntersectionObserver ===
      "undefined"
    ) {
      markViewed();
      return;
    }

    const observer =
      new IntersectionObserver(
        (entries) => {
          const visible =
            entries.some(
              (entry) =>
                entry.isIntersecting &&
                entry.intersectionRatio >=
                  0.25,
            );

          if (visible) {
            markViewed();
            observer.disconnect();
          }
        },
        {
          threshold: [0.25],
        },
      );

    observer.observe(form);

    return () => {
      observer.disconnect();
    };
  }, [
    compact,
    defaultSource,
    defaultSubject,
  ]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formElement = event.currentTarget;

    setStatus({
      type: "loading",
    });

    const formData = new FormData(formElement);

    const payload: Record<string, FormDataEntryValue | string> =
      Object.fromEntries(formData.entries());

    trackFunnelEvent(
      "tutoring_submit_attempt",
      {
        subject:
          String(
            payload.subject || "",
          ),
        academic_level:
          String(
            payload.level || "",
          ),
        support_type:
          String(
            payload.supportType ||
              "",
          ),
      },
    );

    const params = new URLSearchParams(window.location.search);

    payload.source = "website";
    payload.landingPage = window.location.href;
    payload.referrer = document.referrer || "";

    payload.utmSource = params.get("utm_source") || "";
    payload.utmMedium = params.get("utm_medium") || "";
    payload.utmCampaign = params.get("utm_campaign") || "";
    payload.utmTerm = params.get("utm_term") || "";
    payload.utmContent = params.get("utm_content") || "";

    payload.referralCode =
      params.get("ref") || "";
    payload.source = defaultSource || "website";
    payload.currency = defaultCurrency || "GBP";

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

      trackFunnelEvent(
        "tutoring_submit_error",
        {
          error_stage:
            "submission",
        },
      );

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
                <p>We contact you with the proposed support and exact price. Nothing is booked and no payment is taken until you decide to proceed.</p>
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
      ref={formRef}
      id="tutoring-enquiry-form"
      name="tutoring_enquiry"
      className={`lead-form ${compact ? "lead-form-compact" : ""}`}
      onFocusCapture={handleFormFocus}
      onChangeCapture={handleFormChange}
      onInputCapture={handleFormInput}
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
              <select
                name="level"
                required
                defaultValue={levelExists ? defaultLevel : ""}
              >
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
              <span>
                Topic or course area{" "}
                <small>(optional)</small>
              </span>
              <input
                name="topic"
                type="text"
                maxLength={240}
                defaultValue={defaultTopic}
                placeholder="e.g. Confidence intervals, regression, Python debugging"
              />
            </label>

            <label className="form-span-2">
              <span>Country / region</span>
              <select
                name="country"
                required
                defaultValue={
                  countries.includes(defaultCountry)
                    ? defaultCountry
                    : ""
                }
              >
                <option value="" disabled>
                  Choose your country / region
                </option>
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
            {compact ? (
              <label className="form-span-2">
                <span>Type of support</span>

                <select
                  name="supportType"
                  required
                  defaultValue={
                    supportTypeExists
                      ? defaultSupportType
                      : ""
                  }
                >
                  <option value="" disabled>
                    Choose the type of support
                  </option>

                  {supportTypes.map((type) => (
                    <option
                      key={type}
                      value={type}
                    >
                      {type}
                    </option>
                  ))}
                </select>
              </label>
            ) : (
              <fieldset className="lead-support-choice-fieldset form-span-2">
                <legend>
                  What kind of help are you looking for?
                </legend>

                <p className="lead-support-choice-intro">
                  Choose the closest option. You can explain the details
                  in your own words below.
                </p>

                <div className="lead-support-choice-grid">
                  {supportTypes.map((type) => {
                    const presentation =
                      supportTypePresentation[
                        type
                      ];

                    return (
                      <label
                        className="lead-support-choice"
                        key={type}
                      >
                        <input
                          type="radio"
                          name="supportType"
                          value={type}
                          required
                          defaultChecked={
                            supportTypeExists &&
                            defaultSupportType ===
                              type
                          }
                        />

                        <span className="lead-support-choice-card">
                          <strong>
                            {presentation?.label ||
                              type}
                          </strong>

                          <small>
                            {presentation?.description ||
                              "Tell us what kind of tutoring support you need."}
                          </small>

                          <i aria-hidden="true">
                            ✓
                          </i>
                        </span>
                      </label>
                    );
                  })}
                </div>
              </fieldset>
            )}

            <label className="form-span-2 lead-requirements-field">
              <span>
                Tell us where you&apos;re stuck
              </span>

              {!compact && (
                <div className="lead-requirements-prompts">
                  <div>
                    <strong>1</strong>
                    <span>
                      What are you trying to understand or do?
                    </span>
                  </div>

                  <div>
                    <strong>2</strong>
                    <span>
                      Which part currently feels difficult?
                    </span>
                  </div>

                  <div>
                    <strong>3</strong>
                    <span>
                      Add any useful course, software or deadline context.
                    </span>
                  </div>
                </div>
              )}

              <textarea
                name="requirements"
                required
                minLength={20}
                maxLength={5000}
                rows={4}
                placeholder={
                  defaultTopic
                    ? `For example: I am studying ${defaultTopic} and understand the basic idea, but I am getting stuck when I try to apply it in my own questions. I would like help working through the reasoning step by step.`
                    : "For example: I understand some of the material, but I am getting stuck when I try to apply it independently. I would like help working through the difficult parts and practising similar problems."
                }
              />

              {!compact && (
                <small className="lead-requirements-note">
                  Two to four sentences is usually enough. You do not
                  need to prepare a detailed brief.
                </small>
              )}
            </label>

            <details className="lead-form-optional-details form-span-2">
              <summary>
                <span>
                  Add timing preferences
                </span>

                <small>
                  Optional
                </small>
              </summary>

              <div className="lead-form-optional-grid">
                <label>
                  <span>
                    Preferred availability
                  </span>

                  <input
                    name="availability"
                    type="text"
                    maxLength={500}
                    placeholder="e.g. Tuesday and Thursday evenings"
                  />
                </label>

                <label>
                  <span>
                    How soon would you like to start?
                  </span>

                  <select
                    name="urgency"
                    defaultValue=""
                  >
                    <option value="">
                      No preference
                    </option>

                    <option value="As soon as possible">
                      As soon as possible
                    </option>

                    <option value="Within 1 week">
                      Within 1 week
                    </option>

                    <option value="Within 2–4 weeks">
                      Within 2–4 weeks
                    </option>

                    <option value="Flexible">
                      Flexible
                    </option>
                  </select>
                </label>
              </div>
            </details>
          </div>
        </section>

        <section className="lead-form-group lead-final-step-group">
          {!compact && (
            <div className="lead-form-group-head">
              <span>03</span>

              <div>
                <strong>Finish your request</strong>

                <small>
                  Add your contact details, check the two confirmations
                  and send your enquiry.
                </small>
              </div>
            </div>
          )}

          <div className="lead-final-step">
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

            {!compact && (
              <div
                className="lead-final-reassurance"
                aria-label="Before you send your tutoring request"
              >
                <div>
                  <strong>No payment now</strong>
                  <span>
                    Sending this form does not charge you.
                  </span>
                </div>

                <div>
                  <strong>Nothing is booked yet</strong>
                  <span>
                    You decide after seeing the proposed support
                    and price.
                  </span>
                </div>

                <div>
                  <strong>Reviewed by MAT</strong>
                  <span>
                    We read your academic context before suggesting
                    the next step.
                  </span>
                </div>
              </div>
            )}

            <div className="lead-final-consents">
              <label className="consent-row">
                <input
                  type="checkbox"
                  name="ageConfirmation"
                  value="yes"
                  required
                />

                <span>
                  I confirm that I am aged 18 or over.
                </span>
              </label>

              <label className="consent-row">
                <input
                  type="checkbox"
                  name="consent"
                  value="yes"
                  required
                />

                <span>
                  I agree that My Academic Tutor may contact me
                  about this request.
                </span>
              </label>
            </div>

            <TurnstileWidget action="tutoring_enquiry" />

            <div className="lead-final-submit">
              <button
                className="button button-primary submit-button"
                disabled={status.type === "loading"}
                type="submit"
              >
                {status.type === "loading"
                  ? "Submitting…"
                  : submitLabel ||
                    (compact
                      ? "Request tutoring"
                      : "Send tutoring request")}
              </button>

              {!compact && (
                <small>
                  Your details are used to respond to this tutoring
                  enquiry. No lesson or payment is created by
                  submitting this form.
                </small>
              )}
            </div>

            {status.type === "error" && (
              <p
                className="form-error"
                role="alert"
              >
                {status.message}
              </p>
            )}
          </div>
        </section>
      </div>

    </form>
  );
}
