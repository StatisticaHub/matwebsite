import type { Metadata } from "next";
import Link from "next/link";

import {
  academicLevels,
} from "@/lib/tutoring-data";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  "https://www.myacademictutor.com";

export const metadata: Metadata = {
  title:
    "Online Tutoring by Academic Level",

  description:
    "Explore personalised online tutoring for secondary school, GCSE, IGCSE, A-Level, IB, undergraduate, Master's, PhD and professional learners.",

  alternates: {
    canonical:
      `${siteUrl}/levels`,
  },

  openGraph: {
    type: "website",
    url:
      `${siteUrl}/levels`,
    siteName:
      "My Academic Tutor",
    title:
      "Online Tutoring by Academic Level",
    description:
      "Personalised one-to-one tutoring from secondary school through university, Master's and PhD-level study.",
  },
};

export default function Page() {
  return (
    <>
      <section className="page-hero compact-hero">
        <div className="shell narrow">
          <div className="eyebrow">
            ACADEMIC LEVELS
          </div>

          <h1>
            Tutoring that adapts to the level you are studying.
          </h1>

          <p className="page-lead">
            A school student, undergraduate,
            Master's learner and researcher need
            different explanations, expectations
            and types of practice. Choose your
            academic level to see how tutoring can
            support you.
          </p>

          <div className="button-row">
            <Link
              href="/find-a-tutor"
              className="button button-primary button-large"
            >
              Request tutoring
            </Link>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="shell level-grid">
          {academicLevels.map(
            (level) => (
              <Link
                key={level.slug}
                href={`/levels/${level.slug}`}
                className="card level-card"
              >
                <h2>
                  {level.name}
                </h2>

                <p>
                  {level.short}
                </p>

                <div className="tag-row">
                  {level.focus.map(
                    (focus) => (
                      <span
                        className="tag"
                        key={focus}
                      >
                        {focus}
                      </span>
                    )
                  )}
                </div>

                <span className="text-link">
                  Explore {level.name} tutoring
                </span>
              </Link>
            )
          )}
        </div>
      </section>
    </>
  );
}
