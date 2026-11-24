import type { Metadata } from "next";
import Link from "next/link";


export const metadata: Metadata = {
  title: "Safeguarding and Age Eligibility",
  description:
    "Current age eligibility for My Academic Tutor services and our approach to safeguarding before any under-18 tutoring is introduced.",
};


export default function Page() {
  return (
    <>
      <section className="page-hero compact-hero">
        <div className="shell narrow">

          <div className="eyebrow">
            SAFEGUARDING
          </div>

          <h1>
            Tutoring enquiries are currently limited to learners aged 18 and over.
          </h1>

          <p className="page-lead">
            My Academic Tutor is currently operating personalised tutoring for
            adult learners. We are not currently accepting tutoring bookings for
            students under the age of 18.
          </p>

        </div>
      </section>


      <section className="section">

        <div className="shell article-shell">

          <section>

            <h2>
              Current tutoring eligibility
            </h2>

            <p>
              Students requesting personalised tutoring must currently be aged
              18 or over.
            </p>

            <p>
              Our public Learning Hub may contain educational material relevant
              to school-level subjects or qualifications. The presence of those
              resources does not mean that tutoring services for under-18
              students are currently being offered.
            </p>

          </section>


          <section>

            <h2>
              Why we are taking this approach
            </h2>

            <p>
              Supporting children and young people requires safeguarding
              arrangements that are appropriate to the countries, age groups,
              communication channels and tutoring model involved.
            </p>

            <p>
              MAT will not present under-18 tutoring as an available service
              until the relevant safeguarding processes have been formally
              documented and implemented.
            </p>

          </section>


          <section>

            <h2>
              Before under-18 tutoring is introduced
            </h2>

            <p>
              Any future service involving students under 18 will require a
              documented safeguarding framework covering areas such as tutor
              suitability checks where applicable, appropriate communication
              arrangements, parental or guardian involvement, professional
              boundaries, reporting and escalation procedures.
            </p>

            <p>
              Those requirements will be reviewed against the actual operating
              model before such services are made available.
            </p>

          </section>


          <section>

            <h2>
              Current adult tutoring
            </h2>

            <p>
              Adult learners can currently request personalised one-to-one
              tutoring through MAT. Academic-integrity and professional conduct
              expectations apply to all tutoring arrangements.
            </p>

            <p>
              See our{" "}
              <Link href="/academic-integrity">
                Academic Integrity policy
              </Link>{" "}
              or{" "}
              <Link href="/find-a-tutor">
                request tutoring
              </Link>.
            </p>

          </section>

        </div>

      </section>
    </>
  );
}
