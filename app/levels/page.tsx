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
    "Explore online tutoring for learners aged 18+, including GCSE, IGCSE, A-Level and IB-level study, undergraduate courses, Master's study, PhD research and professional learning.",

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
      "One-to-one online tutoring for learners aged 18+, from school-level foundations and adult resits through university, Master's and PhD-level study.",
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
            Tutoring that matches the level and course you are actually studying.
          </h1>

          <p className="page-lead">
            Different courses and academic stages need different kinds of
            explanation. Choose your level to see how tutoring can fit the work
            you are doing. Live one-to-one tutoring enquiries are currently for
            learners aged 18+.
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
