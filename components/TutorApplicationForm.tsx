"use client";

import {
  FormEvent,
  useState,
} from "react";

type SubmitState = {
  loading: boolean;
  error: string | null;
  reference: string | null;
};

export default function TutorApplicationForm() {
  const [
    state,
    setState,
  ] = useState<SubmitState>({
    loading: false,
    error: null,
    reference: null,
  });

  async function submit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (state.loading) {
      return;
    }

    const form =
      event.currentTarget;

    setState({
      loading: true,
      error: null,
      reference: null,
    });

    try {
      const body =
        new FormData(form);

      const response =
        await fetch(
          "/api/tutor-application",
          {
            method: "POST",
            body,
          },
        );

      let payload: {
        error?: string;
        reference?: string;
      } = {};

      try {
        payload =
          await response.json();
      } catch {
        // Use generic error below.
      }

      if (!response.ok) {
        throw new Error(
          payload.error ||
            "Your application could not be submitted. Please try again.",
        );
      }

      form.reset();

      setState({
        loading: false,
        error: null,
        reference:
          payload.reference ||
          "Submitted",
      });
    } catch (error) {
      setState({
        loading: false,
        error:
          error instanceof Error
            ? error.message
            : "Your application could not be submitted.",
        reference: null,
      });
    }
  }

  if (state.reference) {
    return (
      <div className="form-success">
        <span className="success-mark">
          ✓
        </span>

        <h3>
          Application received.
        </h3>

        <p>
          Thank you for applying to
          My Academic Tutor. Our team
          will review your subject
          background, teaching
          experience, qualification
          evidence, references and
          teaching demonstration.
        </p>

        <p>
          <strong>
            Application reference:
          </strong>
          {" "}
          {state.reference}
        </p>

        <p>
          We will contact you using
          the email address provided
          if we would like to progress
          your application.
        </p>
      </div>
    );
  }

  return (
    <form
      className="lead-form"
      onSubmit={submit}
      encType="multipart/form-data"
    >
      {/* Bot trap — genuine applicants never see this. */}
      <label
        className="honeypot"
        aria-hidden="true"
      >
        <span>
          Company website
        </span>

        <input
          name="companyWebsite"
          type="text"
          tabIndex={-1}
          autoComplete="off"
        />
      </label>

      <div className="form-span-2">
        <div className="eyebrow">
          YOUR DETAILS
        </div>
        <h3>
          Tell us about you
        </h3>
      </div>

      <div className="form-grid">
        <label>
          <span>
            Full name
          </span>
          <input
            name="name"
            required
            autoComplete="name"
            placeholder="Your full name"
          />
        </label>

        <label>
          <span>
            Email
          </span>
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
          />
        </label>

        <label>
          <span>
            Phone
          </span>
          <input
            name="phone"
            type="tel"
            autoComplete="tel"
            placeholder="+44..."
          />
        </label>

        <label>
          <span>
            Country
          </span>
          <input
            name="country"
            required
            autoComplete="country-name"
            placeholder="e.g. United Kingdom"
          />
        </label>
      </div>

      <div className="form-span-2">
        <div className="eyebrow">
          TEACHING PROFILE
        </div>
        <h3>
          Your subject expertise
        </h3>
        <p className="form-note">
          For fields with several
          items, separate them with
          commas.
        </p>
      </div>

      <div className="form-grid">
        <label>
          <span>
            Subjects you can teach
          </span>
          <input
            name="subjects"
            required
            placeholder="Statistics, Mathematics, Data Science"
          />
        </label>

        <label>
          <span>
            Levels you can teach
          </span>
          <input
            name="levels"
            required
            placeholder="GCSE, A-level, Undergraduate, Master's"
          />
        </label>

        <label>
          <span>
            Specialist areas
          </span>
          <input
            name="specialisms"
            placeholder="Regression, R, Econometrics, Machine Learning"
          />
        </label>

        <label>
          <span>
            Languages
          </span>
          <input
            name="languages"
            required
            placeholder="English, Hindi"
          />
        </label>

        <label className="form-span-2">
          <span>
            Qualifications
          </span>
          <textarea
            name="qualifications"
            required
            minLength={10}
            placeholder="List your relevant degrees, qualifications and subject training."
          />
        </label>

        <label className="form-span-2">
          <span>
            Teaching or tutoring experience
          </span>
          <textarea
            name="teachingExperience"
            required
            minLength={30}
            placeholder="Describe your teaching, tutoring, mentoring or academic support experience."
          />
        </label>
      </div>

      <div className="form-span-2">
        <div className="eyebrow">
          AVAILABILITY
        </div>
        <h3>
          How you would teach with MAT
        </h3>
      </div>

      <div className="form-grid">
        <label>
          <span>
            Timezone
          </span>
          <input
            name="timezone"
            required
            placeholder="e.g. Europe/London"
          />
        </label>

        <label>
          <span>
            Typical availability
          </span>
          <input
            name="availability"
            required
            placeholder="e.g. Weekday evenings and weekends"
          />
        </label>

        <label className="form-span-2">
          <span>
            Online teaching setup
          </span>
          <textarea
            name="onlineTeachingSetup"
            required
            placeholder="Tell us about your laptop, internet connection, microphone, camera, tablet or other teaching equipment."
          />
        </label>

        <label className="form-span-2">
          <span>
            Why would you like to tutor with My Academic Tutor?
          </span>
          <textarea
            name="motivation"
            required
            minLength={30}
            placeholder="Tell us what interests you about teaching students through MAT."
          />
        </label>
      </div>

      <div className="form-span-2">
        <div className="eyebrow">
          TEACHING DEMONSTRATION
        </div>
        <h3>
          Show us how you explain
        </h3>
        <p className="form-note">
          Provide a link to a short
          teaching demonstration you
          have uploaded to a service
          such as Google Drive,
          OneDrive, YouTube or Vimeo.
          Make sure the MAT team can
          access the link.
        </p>
      </div>

      <div className="form-grid">
        <label>
          <span>
            Demo subject
          </span>
          <input
            name="demoSubject"
            required
            placeholder="e.g. Statistics"
          />
        </label>

        <label>
          <span>
            Demo level
          </span>
          <input
            name="demoLevel"
            required
            placeholder="e.g. Undergraduate"
          />
        </label>

        <label className="form-span-2">
          <span>
            Topic demonstrated
          </span>
          <input
            name="demoTopic"
            required
            placeholder="e.g. Interpreting a confidence interval"
          />
        </label>

        <label className="form-span-2">
          <span>
            Teaching demonstration URL
          </span>
          <input
            name="demoVideoUrl"
            type="url"
            required
            placeholder="https://..."
          />
        </label>

        <label className="form-span-2">
          <span>
            Demo notes
          </span>
          <textarea
            name="demoNotes"
            placeholder="Optional context about your demonstration."
          />
        </label>
      </div>

      <div className="form-span-2">
        <div className="eyebrow">
          REFERENCES
        </div>
        <h3>
          Referee 1
        </h3>
        <p className="form-note">
          Please provide someone who
          can comment professionally
          or academically on your
          suitability to teach.
        </p>
      </div>

      <div className="form-grid">
        <label>
          <span>
            Referee name
          </span>
          <input
            name="reference1Name"
            required
          />
        </label>

        <label>
          <span>
            Referee email
          </span>
          <input
            name="reference1Email"
            type="email"
            required
          />
        </label>

        <label>
          <span>
            Organisation
          </span>
          <input
            name="reference1Organisation"
            placeholder="University, company or organisation"
          />
        </label>

        <label>
          <span>
            Relationship to you
          </span>
          <input
            name="reference1Relationship"
            required
            placeholder="e.g. Lecturer, manager"
          />
        </label>

        <label className="form-span-2">
          <span>
            Referee phone
          </span>
          <input
            name="reference1Phone"
            type="tel"
          />
        </label>
      </div>

      <div className="form-span-2">
        <h3>
          Referee 2
        </h3>
      </div>

      <div className="form-grid">
        <label>
          <span>
            Referee name
          </span>
          <input
            name="reference2Name"
            required
          />
        </label>

        <label>
          <span>
            Referee email
          </span>
          <input
            name="reference2Email"
            type="email"
            required
          />
        </label>

        <label>
          <span>
            Organisation
          </span>
          <input
            name="reference2Organisation"
            placeholder="University, company or organisation"
          />
        </label>

        <label>
          <span>
            Relationship to you
          </span>
          <input
            name="reference2Relationship"
            required
            placeholder="e.g. Supervisor, employer"
          />
        </label>

        <label className="form-span-2">
          <span>
            Referee phone
          </span>
          <input
            name="reference2Phone"
            type="tel"
          />
        </label>
      </div>

      <div className="form-span-2">
        <div className="eyebrow">
          QUALIFICATION EVIDENCE
        </div>
        <h3>
          Degree certificate
        </h3>
      </div>

      <div className="form-grid">
        <label className="form-span-2">
          <span>
            Upload degree certificate
          </span>
          <input
            name="degreeCertificate"
            type="file"
            required
            accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
          />
          <small>
            PDF, JPG or PNG only.
            Maximum file size 10 MB.
          </small>
        </label>
      </div>

      <div className="form-span-2">
        <div className="eyebrow">
          ACADEMIC INTEGRITY
        </div>

        <label
          style={{
            display: "flex",
            gap: 10,
            alignItems: "flex-start",
          }}
        >
          <input
            name="academicIntegrity"
            type="checkbox"
            value="yes"
            required
            style={{
              width: "auto",
              marginTop: 4,
            }}
          />

          <span>
            I understand that tutors
            must support learning and
            academic development. I
            will not complete assessed
            work, examinations,
            dissertations or research
            on behalf of students.
          </span>
        </label>
      </div>

      {state.error && (
        <div
          className="form-error"
          role="alert"
        >
          {state.error}
        </div>
      )}

      <button
        className="button button-primary submit-button"
        type="submit"
        disabled={state.loading}
      >
        {state.loading
          ? "Submitting application…"
          : "Submit tutor application"}
      </button>

      <p className="form-note">
        Your application is reviewed
        by the My Academic Tutor team.
        Qualification documents and
        referee information are used
        only as part of the tutor
        recruitment and verification
        process.
      </p>
    </form>
  );
}
