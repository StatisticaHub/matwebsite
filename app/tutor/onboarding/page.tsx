import Link from "next/link";
import { redirect } from "next/navigation";
import TutorSignOutButton from "@/components/TutorSignOutButton";
import { saveTutorOnboarding } from "@/app/tutor/onboarding-actions";
import { getTutorAccountSession } from "@/lib/tutor-auth";

export const metadata = {
  title: "Tutor onboarding",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type SearchParams = Promise<{
  saved?: string;
  submitted?: string;
  error?: string;
}>;

export default async function TutorOnboardingPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await getTutorAccountSession();

  if (!session) {
    redirect("/tutor/login?unauthorized=1");
  }

  if (session.tutor.status === "active") {
    redirect("/tutor");
  }

  const query = await searchParams;
  const tutor = session.tutor;

  return (
    <main
      className="tutor-page"
      style={{
        maxWidth: "980px",
        margin: "0 auto",
        padding: "32px 20px 64px",
      }}
    >
      <div className="tutor-breadcrumb">
        <Link href="/">My Academic Tutor</Link>
        <span>Tutor onboarding</span>
      </div>

      <header className="tutor-page-head">
        <div>
          <span className="tutor-eyebrow">Tutor onboarding</span>
          <h1>Complete your tutor profile</h1>
          <p>
            Tell the MAT team about the subjects you teach, your
            qualifications, experience and availability. Your profile
            will be reviewed before you are activated for student matching.
          </p>
        </div>

        <TutorSignOutButton />
      </header>

      {query.saved === "1" && (
        <div className="tutor-alert success">
          Draft saved. You can continue editing before submitting.
        </div>
      )}

      {query.submitted === "1" && (
        <div className="tutor-alert success">
          Your tutor profile has been submitted for MAT review.
        </div>
      )}

      {query.error === "incomplete" && (
        <div className="tutor-alert warning">
          Before submitting, complete your subjects, academic levels,
          qualifications, teaching experience, languages, timezone and
          teaching availability.
        </div>
      )}

      {tutor.onboarding_status === "submitted" && (
        <div className="tutor-alert warning">
          Your profile is currently under review. You may still correct
          information and submit it again if needed.
        </div>
      )}

      {tutor.onboarding_status === "changes_requested" && (
        <div className="tutor-alert warning">
          The MAT team has requested changes to your tutor profile.
          Update the information below and submit it again.
        </div>
      )}

      <section className="tutor-panel">
        <div className="tutor-panel-head">
          <div>
            <h2>{tutor.name}</h2>
            <span>{tutor.email}</span>
          </div>
          <span className={`tutor-status ${tutor.onboarding_status}`}>
            {tutor.onboarding_status.replaceAll("_", " ")}
          </span>
        </div>

        <form action={saveTutorOnboarding} className="tutor-form">
          <label>
            <span>Professional headline</span>
            <input
              name="headline"
              defaultValue={tutor.headline || ""}
              placeholder="For example: Medical Statistician · MSc Statistics"
            />
          </label>

          <label>
            <span>Subjects you can teach</span>
            <input
              name="subjects"
              defaultValue={(tutor.subjects || []).join(", ")}
              placeholder="Statistics, Mathematics, Economics, Biology"
            />
            <small>Separate subjects with commas.</small>
          </label>

          <label>
            <span>Academic levels</span>
            <input
              name="levels"
              defaultValue={(tutor.levels || []).join(", ")}
              placeholder="GCSE, A-Level, Undergraduate, Master's"
            />
            <small>Separate levels with commas.</small>
          </label>

          <label>
            <span>Specialist topics, methods or software</span>
            <input
              name="specialisms"
              defaultValue={(tutor.specialisms || []).join(", ")}
              placeholder="Regression, Econometrics, R, Python, Organic Chemistry"
            />
            <small>
              These help MAT match you with students whose requirements
              fit your specific expertise.
            </small>
          </label>

          <label>
            <span>Qualifications</span>
            <textarea
              name="qualifications"
              defaultValue={tutor.qualifications || ""}
              placeholder="List relevant degrees, qualifications, professional training and institutions."
            />
          </label>

          <label>
            <span>Teaching, tutoring or relevant professional experience</span>
            <textarea
              name="teachingExperience"
              defaultValue={tutor.teaching_experience || ""}
              placeholder="Describe your teaching, tutoring, research, academic or industry experience."
            />
          </label>

          <label>
            <span>Languages you can teach in</span>
            <input
              name="languages"
              defaultValue={(tutor.languages || []).join(", ")}
              placeholder="English, Hindi"
            />
          </label>

          <label>
            <span>Timezone</span>
            <input
              name="timezone"
              defaultValue={tutor.timezone || ""}
              placeholder="Europe/London"
            />
          </label>

          <fieldset>
            <legend>Available days</legend>

            <div className="tutor-check-grid">
              {[
                "Monday",
                "Tuesday",
                "Wednesday",
                "Thursday",
                "Friday",
                "Saturday",
                "Sunday",
              ].map((day) => {
                const value = day.toLowerCase();

                return (
                  <label key={day}>
                    <input
                      type="checkbox"
                      name="availabilityDays"
                      value={value}
                      defaultChecked={(tutor.availability_days || []).includes(value)}
                    />
                    <span>{day}</span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          <fieldset>
            <legend>Teaching periods</legend>

            <div className="tutor-check-grid compact">
              {["Morning", "Afternoon", "Evening"].map((period) => {
                const value = period.toLowerCase();

                return (
                  <label key={period}>
                    <input
                      type="checkbox"
                      name="availabilityPeriods"
                      value={value}
                      defaultChecked={(tutor.availability_periods || []).includes(value)}
                    />
                    <span>{period}</span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          <div className="tutor-form-grid">
            <label>
              <span>Weekly teaching capacity</span>
              <input
                name="weeklyCapacityHours"
                type="number"
                min="0"
                max="80"
                step="0.5"
                defaultValue={tutor.weekly_capacity_hours ?? ""}
                placeholder="10"
              />
              <small>Approximate hours per week.</small>
            </label>

            <label>
              <span>Maximum active students</span>
              <input
                name="maxActiveStudents"
                type="number"
                min="0"
                max="100"
                defaultValue={tutor.max_active_students ?? ""}
                placeholder="8"
              />
            </label>
          </div>

          <label>
            <span>Availability notes</span>
            <textarea
              name="availabilityNotes"
              defaultValue={tutor.availability_notes || ""}
              placeholder="For example: weekday evenings after 18:00, flexible on Saturdays."
            />
          </label>

          <label className="tutor-check-single">
            <input
              type="checkbox"
              name="acceptsTrials"
              value="yes"
              defaultChecked={tutor.accepts_trials !== false}
            />
            <span>I am available for trial sessions</span>
          </label>

          <div
            style={{
              display: "flex",
              gap: "12px",
              flexWrap: "wrap",
            }}
          >
            <button
              className="tutor-secondary-button"
              type="submit"
              name="intent"
              value="save"
            >
              Save draft
            </button>

            <button
              className="tutor-primary-button"
              type="submit"
              name="intent"
              value="submit"
            >
              Submit profile for review
            </button>
          </div>
        </form>
      </section>

      <section className="tutor-panel">
        <h2>What happens next?</h2>
        <p className="tutor-help">
          The MAT team will review your profile and verification information.
          Your internal rate, verification notes and approval controls are
          managed privately by MAT and are not part of this form.
        </p>
        <p className="tutor-help">
          Once approved and activated, your normal tutor workspace will open
          automatically when you sign in.
        </p>
      </section>
    </main>
  );
}
