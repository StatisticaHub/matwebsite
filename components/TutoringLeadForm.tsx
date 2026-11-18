"use client";

import { FormEvent, useMemo, useState } from "react";
import { countries, levels, subjects, supportTypes } from "@/lib/tutoring-data";

type Props = { compact?: boolean; defaultSubject?: string; defaultSupportType?: string; submitLabel?: string };
type Status = { type: "idle" | "loading" | "success" | "error"; message?: string; reference?: string; mode?: string };

export default function TutoringLeadForm({ compact = false, defaultSubject = "Statistics", defaultSupportType = "Regular 1:1 tutoring", submitLabel }: Props) {
  const exists = useMemo(() => subjects.some((subject) => subject.name === defaultSubject), [defaultSubject]);
  const [status, setStatus] = useState<Status>({ type: "idle" });

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus({ type: "loading" });
    const form = new FormData(event.currentTarget);
    const payload: Record<string, FormDataEntryValue | string> = Object.fromEntries(form.entries());

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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not submit");
      setStatus({ type: "success", message: data.message, reference: data.reference, mode: data.mode });
      event.currentTarget.reset();
    } catch (error) {
      setStatus({ type: "error", message: error instanceof Error ? error.message : "Something went wrong." });
    }
  }

  if (status.type === "success") {
    return (
      <div className="form-success" role="status">
        <span className="success-mark">✓</span>
        <h3>Request received.</h3>
        <p>{status.message}</p>
        <div className="reference">Reference <strong>{status.reference}</strong></div>
        {status.mode === "demo" && (
          <p className="form-note">Development mode: this request was not stored because Supabase is not connected in this environment.</p>
        )}
        <button className="button button-secondary" type="button" onClick={() => setStatus({ type: "idle" })}>
          Start another request
        </button>
      </div>
    );
  }

  return (
    <form className={`lead-form ${compact ? "lead-form-compact" : ""}`} onSubmit={submit}>
      <input className="honeypot" name="companyWebsite" tabIndex={-1} autoComplete="off" aria-hidden="true" />

      <div className="form-grid">
        <label>
          <span>Country / education system</span>
          <select name="country" required defaultValue="United Kingdom">
            {countries.map((country) => <option key={country}>{country}</option>)}
          </select>
        </label>

        <label>
          <span>Academic level</span>
          <select name="level" required defaultValue="Master's">
            {levels.map((level) => <option key={level}>{level}</option>)}
          </select>
        </label>

        <label>
          <span>Subject</span>
          <select name="subject" required defaultValue={exists ? defaultSubject : subjects[0].name}>
            {subjects.map((subject) => <option key={subject.slug}>{subject.name}</option>)}
            <option>Other</option>
          </select>
        </label>

        <label>
          <span>Type of support</span>
          <select name="supportType" required defaultValue={supportTypes.includes(defaultSupportType) ? defaultSupportType : supportTypes[0]}>
            {supportTypes.map((type) => <option key={type}>{type}</option>)}
          </select>
        </label>

        {!compact && (
          <>
            <label>
              <span>Curriculum / university <em>optional</em></span>
              <input name="curriculum" placeholder="e.g. A-Level, IB, University of Bristol" />
            </label>
            <label>
              <span>Topic <em>optional</em></span>
              <input name="topic" placeholder="e.g. Cox regression, calculus, organic chemistry" />
            </label>
          </>
        )}

        <label className="form-span-2">
          <span>What would you like help with?</span>
          <textarea
            name="requirements"
            required
            minLength={20}
            placeholder="Tell us what you’re studying, where you’re getting stuck and what you want to achieve."
          />
        </label>

        {!compact && (
          <>
            <label>
              <span>Preferred availability <em>optional</em></span>
              <input name="availability" placeholder="e.g. Tue/Thu after 6pm UK time" />
            </label>
            <label>
              <span>How soon?</span>
              <select name="urgency" defaultValue="This week">
                <option>As soon as possible</option>
                <option>This week</option>
                <option>Within 2 weeks</option>
                <option>Flexible</option>
              </select>
            </label>
          </>
        )}

        <label>
          <span>Name</span>
          <input name="name" required autoComplete="name" placeholder="Your name" />
        </label>

        <label>
          <span>Email</span>
          <input type="email" name="email" required autoComplete="email" placeholder="you@example.com" />
        </label>

        {!compact && (
          <label>
            <span>Phone / WhatsApp <em>optional</em></span>
            <input name="phone" autoComplete="tel" placeholder="Include country code" />
          </label>
        )}
      </div>

      <label className="consent-row">
        <input type="checkbox" name="consent" value="yes" required />
        <span>I agree that My Academic Tutor may contact me about this tutoring request.</span>
      </label>

      <button className="button button-primary submit-button" disabled={status.type === "loading"} type="submit">
        {status.type === "loading" ? "Submitting…" : submitLabel || (compact ? "Get personalised tutoring" : "Send my tutoring request")}
      </button>

      {status.type === "error" && <p className="form-error" role="alert">{status.message}</p>}
      <p className="form-note">Your information is used only to review your tutoring request and arrange suitable support.</p>
    </form>
  );
}
