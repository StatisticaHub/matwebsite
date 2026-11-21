"use client";

import { FormEvent, useState } from "react";

type State =
  | { status: "idle"; message: ""; reference: "" }
  | { status: "sending"; message: ""; reference: "" }
  | { status: "success"; message: string; reference: string }
  | { status: "error"; message: string; reference: "" };

export default function TutorApplicationForm() {
  const [state, setState] = useState<State>({
    status: "idle",
    message: "",
    reference: "",
  });

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (state.status === "sending") return;

    setState({
      status: "sending",
      message: "",
      reference: "",
    });

    const form = event.currentTarget;
    const data = new FormData(form);

    try {
      const response = await fetch("/api/tutor-application", {
        method: "POST",
        body: data,
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          result.error ||
            "We could not submit your application. Please try again.",
        );
      }

      setState({
        status: "success",
        message:
          "Your tutor application has been received. The MAT team will review your qualifications, references and teaching demonstration.",
        reference: result.reference || "",
      });

      form.reset();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      setState({
        status: "error",
        message:
          error instanceof Error
            ? error.message
            : "We could not submit your application.",
        reference: "",
      });
    }
  }

  if (state.status === "success") {
    return (
      <div>
        <div className="eyebrow">APPLICATION RECEIVED</div>
        <h2>Thank you for applying.</h2>

        <p>{state.message}</p>

        {state.reference && (
          <p>
            Your application reference is{" "}
            <strong>{state.reference}</strong>.
          </p>
        )}

        <p>
          Please keep this reference in case you need to contact us about
          your application.
        </p>

        <button
          type="button"
          className="button button-secondary"
          onClick={() =>
            setState({
              status: "idle",
              message: "",
              reference: "",
            })
          }
        >
          Submit another application
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="portal-form">
      <div>
        <h2>Apply to tutor with MAT</h2>
        <p>
          Please provide accurate academic, teaching and availability
          information. Applications are reviewed before tutors are invited
          to the MAT onboarding process.
        </p>
      </div>

      <label>
        <span>Full name *</span>
        <input name="name" required maxLength={120} />
      </label>

      <label>
        <span>Email *</span>
        <input
          name="email"
          type="email"
          required
          maxLength={240}
          autoComplete="email"
        />
      </label>

      <label>
        <span>Phone</span>
        <input name="phone" type="tel" maxLength={80} />
      </label>

      <label>
        <span>Country / current location *</span>
        <input
          name="country"
          required
          maxLength={120}
          placeholder="United Kingdom"
        />
      </label>

      <label>
        <span>Subjects you can teach *</span>
        <input
          name="subjects"
          required
          placeholder="Statistics, Mathematics, Data Science"
        />
        <small>Separate subjects with commas.</small>
      </label>

      <label>
        <span>Academic levels you can teach *</span>
        <input
          name="levels"
          required
          placeholder="GCSE, A-Level, Undergraduate, Master's"
        />
        <small>Separate levels with commas.</small>
      </label>

      <label>
        <span>Specialist topics, methods or software</span>
        <input
          name="specialisms"
          placeholder="Regression, Econometrics, R, Python, SPSS"
        />
      </label>

      <label>
        <span>Languages you can teach in *</span>
        <input
          name="languages"
          required
          placeholder="English, Hindi"
        />
      </label>

      <label>
        <span>Qualifications *</span>
        <textarea
          name="qualifications"
          required
          maxLength={5000}
          placeholder="List your degrees, institutions, fields of study and relevant professional qualifications."
        />
      </label>

      <label>
        <span>Teaching / tutoring experience *</span>
        <textarea
          name="teachingExperience"
          required
          maxLength={5000}
          placeholder="Describe your teaching, tutoring, academic, research or relevant professional experience."
        />
      </label>

      <label>
        <span>Degree certificate *</span>
        <input
          name="degreeCertificate"
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
          required
        />
        <small>
          PDF, JPG or PNG. Maximum file size 10 MB. This document is stored
          privately and is available only to the MAT review team.
        </small>
      </label>

      <label>
        <span>Timezone *</span>
        <input
          name="timezone"
          required
          placeholder="Europe/London"
          maxLength={120}
        />
      </label>

      <label>
        <span>Typical teaching availability *</span>
        <textarea
          name="availability"
          required
          maxLength={2000}
          placeholder="For example: Monday–Thursday evenings after 18:00 and flexible weekends."
        />
      </label>

      <label>
        <span>Online teaching setup *</span>
        <textarea
          name="onlineTeachingSetup"
          required
          maxLength={2000}
          placeholder="Describe your laptop/computer, internet connection, webcam, microphone, tablet or writing setup."
        />
      </label>

      <label>
        <span>Why would you like to tutor with MAT? *</span>
        <textarea
          name="motivation"
          required
          maxLength={3000}
        />
      </label>

      <hr />

      <div>
        <div className="eyebrow">REFERENCE 1</div>
        <h3>First academic or professional referee</h3>
      </div>

      <label>
        <span>Referee name *</span>
        <input name="reference1Name" required maxLength={160} />
      </label>

      <label>
        <span>Referee email *</span>
        <input
          name="reference1Email"
          type="email"
          required
          maxLength={240}
        />
      </label>

      <label>
        <span>Organisation / institution</span>
        <input name="reference1Organisation" maxLength={240} />
      </label>

      <label>
        <span>Relationship to you *</span>
        <input
          name="reference1Relationship"
          required
          maxLength={240}
          placeholder="Dissertation supervisor, lecturer, manager..."
        />
      </label>

      <label>
        <span>Referee phone</span>
        <input name="reference1Phone" type="tel" maxLength={80} />
      </label>

      <hr />

      <div>
        <div className="eyebrow">REFERENCE 2</div>
        <h3>Second academic or professional referee</h3>
      </div>

      <label>
        <span>Referee name *</span>
        <input name="reference2Name" required maxLength={160} />
      </label>

      <label>
        <span>Referee email *</span>
        <input
          name="reference2Email"
          type="email"
          required
          maxLength={240}
        />
      </label>

      <label>
        <span>Organisation / institution</span>
        <input name="reference2Organisation" maxLength={240} />
      </label>

      <label>
        <span>Relationship to you *</span>
        <input
          name="reference2Relationship"
          required
          maxLength={240}
        />
      </label>

      <label>
        <span>Referee phone</span>
        <input name="reference2Phone" type="tel" maxLength={80} />
      </label>

      <hr />

      <div>
        <div className="eyebrow">TEACHING DEMONSTRATION</div>
        <h3>Submit a short demo lesson</h3>
        <p>
          Record yourself explaining or teaching a topic as if you were
          working with a student. Upload the recording to a private or
          unlisted service such as Google Drive, OneDrive or YouTube and
          provide a shareable link.
        </p>
      </div>

      <label>
        <span>Demo subject *</span>
        <input
          name="demoSubject"
          required
          maxLength={160}
          placeholder="Statistics"
        />
      </label>

      <label>
        <span>Demo academic level *</span>
        <input
          name="demoLevel"
          required
          maxLength={160}
          placeholder="Undergraduate"
        />
      </label>

      <label>
        <span>Demo lesson topic *</span>
        <input
          name="demoTopic"
          required
          maxLength={300}
          placeholder="Simple linear regression and interpretation"
        />
      </label>

      <label>
        <span>Demo recording link *</span>
        <input
          name="demoVideoUrl"
          type="url"
          required
          placeholder="https://..."
        />
        <small>
          Make sure the MAT review team can open the link.
        </small>
      </label>

      <label>
        <span>Anything we should know about the demo?</span>
        <textarea
          name="demoNotes"
          maxLength={2000}
          placeholder="Optional context about the lesson or intended student level."
        />
      </label>

      <label className="tutor-check-single">
        <input
          name="academicIntegrity"
          type="checkbox"
          value="yes"
          required
        />
        <span>
          I understand that MAT tutors teach, explain and guide students,
          but must not complete assessed academic work on a student's behalf.
        </span>
      </label>

      {/* Honeypot */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          left: "-10000px",
          width: 1,
          height: 1,
          overflow: "hidden",
        }}
      >
        <label>
          Company website
          <input
            name="companyWebsite"
            tabIndex={-1}
            autoComplete="off"
          />
        </label>
      </div>

      <button
        type="submit"
        className="button button-primary"
        disabled={state.status === "sending"}
      >
        {state.status === "sending"
          ? "Submitting application…"
          : "Submit tutor application"}
      </button>

      {state.status === "error" && (
        <p className="form-error" role="alert">
          {state.message}
        </p>
      )}
    </form>
  );
}
