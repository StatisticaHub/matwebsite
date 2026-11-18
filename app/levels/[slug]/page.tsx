import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";

import TutoringLeadForm from "@/components/TutoringLeadForm";
import {
  academicLevels,
  subjects,
} from "@/lib/tutoring-data";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  "https://www.myacademictutor.com";

type LevelContent = {
  title: string;
  description: string;
  hero: string;
  intro: string;
  benefits: string[];
};

const levelContent: Record<string, LevelContent> = {
  "school-secondary": {
    title:
      "Online Secondary School Tutoring | Personalised 1:1 Support",
    description:
      "Personalised online tutoring for secondary-school students. Build stronger foundations, confidence and study habits through clear one-to-one teaching.",
    hero:
      "Personalised online tutoring for secondary-school students.",
    intro:
      "Build strong foundations before small gaps become bigger problems. Sessions focus on understanding, confidence and steady academic progress.",
    benefits: [
      "Patient explanations at the right pace",
      "Support with difficult school topics",
      "Guided practice rather than supplied answers",
      "Stronger confidence and study habits",
    ],
  },

  "gcse-igcse": {
    title:
      "Online GCSE & IGCSE Tutoring | Personalised 1:1 Support",
    description:
      "Online GCSE and IGCSE tutoring with personalised one-to-one support for difficult topics, exam preparation, revision and past-paper practice.",
    hero:
      "Online GCSE and IGCSE tutoring built around understanding and exam confidence.",
    intro:
      "Strengthen difficult topics, improve problem-solving and prepare for assessments with tutoring that combines clear teaching and purposeful exam practice.",
    benefits: [
      "Identify and close topic gaps",
      "Practise exam-style questions",
      "Improve method and working",
      "Build a focused revision strategy",
    ],
  },

  "a-level-ib": {
    title:
      "Online A-Level & IB Tutoring | Personalised 1:1 Support",
    description:
      "Personalised online A-Level and IB tutoring for advanced concepts, problem-solving, coursework understanding and exam preparation.",
    hero:
      "One-to-one A-Level and IB tutoring for demanding academic study.",
    intro:
      "Develop deeper subject understanding and the confidence to apply advanced methods independently in lessons, coursework and examinations.",
    benefits: [
      "Advanced concept explanation",
      "Structured problem-solving",
      "Exam and assessment preparation",
      "Independent academic reasoning",
    ],
  },

  "ap-us-high-school": {
    title:
      "Online AP & US High School Tutoring | 1:1 Academic Support",
    description:
      "Personalised online tutoring for AP and US high-school students across quantitative, technical and science subjects.",
    hero:
      "Online AP and US high-school tutoring tailored to your course.",
    intro:
      "Work through demanding concepts, practise course-style questions and strengthen the foundations needed for tests and future study.",
    benefits: [
      "Course-specific concept support",
      "AP-style practice questions",
      "Test and assessment preparation",
      "Stronger academic confidence",
    ],
  },

  undergraduate: {
    title:
      "Online University Tutoring | Undergraduate 1:1 Academic Support",
    description:
      "Online undergraduate tutoring for university modules, mathematics, statistics, coding, data science, science and technical subjects.",
    hero:
      "Personalised university tutoring for difficult undergraduate modules.",
    intro:
      "Use one-to-one tutoring to understand lectures, work through difficult methods and build the skills needed for assignments, problem sheets and examinations.",
    benefits: [
      "Difficult university modules",
      "Problem sheets and technical exercises",
      "Statistics, mathematics and coding",
      "Exam and assessment preparation",
    ],
  },

  masters: {
    title:
      "Master's Tutoring Online | Statistics, Data Science & Research Support",
    description:
      "Personalised online Master's tutoring for advanced statistics, research methods, data science, programming, quantitative modules and dissertation preparation.",
    hero:
      "Specialist one-to-one tutoring for Master's students.",
    intro:
      "Postgraduate courses can move quickly from foundations to advanced methods. Get focused support with statistics, quantitative methods, coding, research design and complex technical modules.",
    benefits: [
      "Advanced statistics and quantitative methods",
      "Research methods and study design",
      "R, Python and data-analysis support",
      "Dissertation and research preparation",
    ],
  },

  "phd-research": {
    title:
      "PhD & Research Methods Tutoring | Statistical and Analytical Support",
    description:
      "Specialist one-to-one tutoring for PhD students and researchers covering statistical methods, analysis strategy, reproducibility and interpretation.",
    hero:
      "Specialist methodological tutoring for PhD students and researchers.",
    intro:
      "Discuss advanced methods with someone who can help you understand assumptions, analysis strategy, interpretation and reproducible workflows without taking ownership of your research.",
    benefits: [
      "Advanced statistical methods",
      "Analysis strategy and methodology",
      "Reproducible analytical workflows",
      "Interpretation and methodological reasoning",
    ],
  },

  professional: {
    title:
      "Online Professional Tutoring | Technical & Analytical Skills",
    description:
      "Flexible one-to-one tutoring for professionals learning statistics, mathematics, programming, data analysis and other technical skills.",
    hero:
      "Flexible technical tutoring for professional development.",
    intro:
      "Develop practical analytical and technical skills through personalised teaching built around your work, goals and existing experience.",
    benefits: [
      "Statistics and data analysis",
      "Programming and software skills",
      "Applied quantitative methods",
      "Professional upskilling",
    ],
  },
};

function supportTypeForLevel(slug: string) {
  switch (slug) {
    case "gcse-igcse":
    case "a-level-ib":
    case "ap-us-high-school":
      return "Exam preparation";

    case "undergraduate":
      return "University module support";

    case "masters":
      return "Master’s support";

    case "phd-research":
      return "Research / dissertation support";

    default:
      return "Regular 1:1 tutoring";
  }
}

export function generateStaticParams() {
  return academicLevels.map((level) => ({
    slug: level.slug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;

  const level = academicLevels.find(
    (item) => item.slug === slug
  );

  if (!level) {
    return {};
  }

  const content =
    levelContent[level.slug];

  const canonical =
    `${siteUrl}/levels/${level.slug}`;

  return {
    title:
      content?.title ||
      `${level.name} Tutoring | Personalised Online Tutoring`,

    description:
      content?.description ||
      level.short,

    alternates: {
      canonical,
    },

    openGraph: {
      type: "website",
      url: canonical,
      siteName: "My Academic Tutor",
      title:
        content?.title ||
        `${level.name} Tutoring | My Academic Tutor`,
      description:
        content?.description ||
        level.short,
    },

    twitter: {
      card: "summary",
      title:
        content?.title ||
        `${level.name} Tutoring`,
      description:
        content?.description ||
        level.short,
    },
  };
}

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const level = academicLevels.find(
    (item) => item.slug === slug
  );

  if (!level) {
    notFound();
  }

  const content =
    levelContent[level.slug] || {
      title: `${level.name} Tutoring`,
      description: level.short,
      hero:
        `Personalised tutoring for ${level.name.toLowerCase()} study.`,
      intro: level.short,
      benefits: level.focus,
    };

  const pageUrl =
    `${siteUrl}/levels/${level.slug}`;

  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",

    "@id":
      `${pageUrl}#service`,

    name:
      `${level.name} Tutoring`,

    serviceType:
      `${level.name} online tutoring`,

    url: pageUrl,

    description:
      content.description,

    provider: {
      "@id":
        `${siteUrl}/#organisation`,
    },

    areaServed: "Worldwide",

    audience: {
      "@type": "Audience",
      audienceType: level.name,
    },
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",

    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: siteUrl,
      },

      {
        "@type": "ListItem",
        position: 2,
        name: "Academic Levels",
        item:
          `${siteUrl}/levels`,
      },

      {
        "@type": "ListItem",
        position: 3,
        name: level.name,
        item: pageUrl,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            serviceSchema
          ).replace(/</g, "\\u003c"),
        }}
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbSchema
          ).replace(/</g, "\\u003c"),
        }}
      />

      <section className="page-hero compact-hero">
        <div className="shell two-col">
          <div>
            <div className="eyebrow">
              {level.name.toUpperCase()} TUTORING
            </div>

            <h1>
              {content.hero}
            </h1>

            <p className="page-lead">
              {content.intro}
            </p>

            <div className="button-row">
              <Link
                className="button button-primary button-large"
                href="/find-a-tutor"
              >
                Request tutoring
              </Link>

              <Link
                className="button button-secondary button-large"
                href="/subjects"
              >
                Explore subjects
              </Link>
            </div>
          </div>

          <aside className="card detail-card">
            <div className="eyebrow">
              COMMON SUPPORT
            </div>

            <h3>
              Tutoring shaped around the work you are doing now.
            </h3>

            <ul className="check-list">
              {content.benefits.map(
                (benefit) => (
                  <li key={benefit}>
                    {benefit}
                  </li>
                )
              )}
            </ul>
          </aside>
        </div>
      </section>

      <section className="section">
        <div className="shell two-col">
          <div>
            <div className="eyebrow">
              HOW WE TEACH
            </div>

            <h2>
              The depth of tutoring changes with the academic level.
            </h2>

            <p>
              A student at this stage needs more than
              generic explanation. Sessions adapt to
              the terminology, methods, assessment
              style and level of independence expected
              in your course.
            </p>

            <div className="mini-timeline">
              <div>
                <span>1</span>

                <p>
                  Identify the exact concept,
                  method or skill causing difficulty.
                </p>
              </div>

              <div>
                <span>2</span>

                <p>
                  Explain it at the appropriate
                  academic depth.
                </p>
              </div>

              <div>
                <span>3</span>

                <p>
                  Apply it through examples,
                  questions or technical practice.
                </p>
              </div>

              <div>
                <span>4</span>

                <p>
                  Build enough understanding to
                  use the method independently.
                </p>
              </div>
            </div>
          </div>

          <div>
            <div className="eyebrow">
              COMMON FOCUS
            </div>

            <h2>
              Support for the work in front of you.
            </h2>

            <ul className="check-list">
              {level.focus.map(
                (focus) => (
                  <li key={focus}>
                    {focus}
                  </li>
                )
              )}
            </ul>

            <p>
              Tutoring can be used regularly
              alongside a course or for a focused
              topic, assessment, technical method
              or research challenge.
            </p>
          </div>
        </div>
      </section>

      <section className="section section-soft">
        <div className="shell">
          <div className="section-head">
            <div>
              <div className="eyebrow">
                SUBJECTS
              </div>

              <h2>
                Choose the subject you are studying.
              </h2>

              <p className="section-intro">
                Explore subject-specific tutoring and
                the topics we can support at your
                academic level.
              </p>
            </div>
          </div>

          <div className="subject-grid">
            {subjects.map(
              (subject, index) => (
                <Link
                  key={subject.slug}
                  href={`/subjects/${subject.slug}`}
                  className="subject-card"
                >
                  <span className="subject-index">
                    {String(index + 1).padStart(
                      2,
                      "0"
                    )}
                  </span>

                  <h3>
                    {subject.name}
                  </h3>

                  <p>
                    {subject.short}
                  </p>

                  <span className="text-link">
                    Explore {subject.name}
                  </span>
                </Link>
              )
            )}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="shell two-col">
          <div>
            <div className="eyebrow">
              RESPONSIBLE ACADEMIC SUPPORT
            </div>

            <h2>
              Guidance that strengthens your own work.
            </h2>

            <p>
              My Academic Tutor helps students
              understand concepts, methods and
              reasoning. Tutors can explain,
              demonstrate, question, review and
              practise with you.
            </p>

            <p>
              We do not complete assessed work,
              dissertations or research on behalf
              of students.
            </p>

            <Link
              href="/academic-integrity"
              className="text-link"
            >
              Read our academic integrity approach
            </Link>
          </div>

          <div className="quote-card">
            <div className="eyebrow">
              THE AIM
            </div>

            <strong>
              You should leave a tutoring session
              better able to understand and apply
              the method yourself.
            </strong>
          </div>
        </div>
      </section>

      <section className="section section-soft">
        <div className="shell lead-section-grid">
          <div>
            <div className="eyebrow">
              {level.name.toUpperCase()} SUPPORT
            </div>

            <h2>
              Tell us what you are studying and where you are stuck.
            </h2>

            <p className="section-intro">
              Share your subject and a short
              description of what you need help
              understanding. We will review the
              academic context and recommend
              suitable one-to-one support.
            </p>

            <ul className="check-list">
              <li>
                Personalised one-to-one teaching
              </li>

              <li>
                Support at the correct academic depth
              </li>

              <li>
                Flexible online sessions
              </li>

              <li>
                Focused on understanding and independence
              </li>
            </ul>
          </div>

          <div className="card form-card">
            <TutoringLeadForm
              compact
              defaultSupportType={
                supportTypeForLevel(
                  level.slug
                )
              }
              submitLabel={`Request ${level.name} tutoring`}
            />
          </div>
        </div>
      </section>
    </>
  );
}
