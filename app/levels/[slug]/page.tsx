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
      "Secondary-Level Tutoring for Adults | Online One-to-One Support",
    description:
      "Online secondary-level tutoring for learners aged 18+ who want to rebuild subject foundations, confidence and core academic skills.",
    hero:
      "Secondary-level tutoring for adult learners rebuilding important foundations.",
    intro:
      "For learners aged 18+, sessions can revisit school-level material, rebuild missing foundations and provide structured practice at a comfortable pace.",
    benefits: [
      "Patient explanations without rushing",
      "Help with difficult school topics and homework concepts",
      "Practice that checks real understanding",
      "Stronger foundations for later study",
    ],
  },

  "gcse-igcse": {
    title:
      "GCSE & IGCSE Tutoring for Adults | Resit & Exam Support",
    description:
      "Online GCSE and IGCSE tutoring for learners aged 18+, including adult resits, difficult topics, revision, exam technique and past-paper practice.",
    hero:
      "GCSE and IGCSE support for adult learners preparing for exams or resits.",
    intro:
      "For learners aged 18+, bring the topics you find hardest and use the session to understand the method, practise exam-style questions and improve how you show your working.",
    benefits: [
      "Find the topics that are costing you marks",
      "Work through exam-style and past-paper questions",
      "Improve method, working and exam technique",
      "Use revision time more effectively",
    ],
  },

  "a-level-ib": {
    title:
      "A-Level & IB Tutoring for Adults | Online One-to-One Support",
    description:
      "Online A-Level and IB tutoring for learners aged 18+ covering advanced concepts, problem-solving, assessment preparation and course understanding.",
    hero:
      "A-Level and IB support for adult learners who need more than a quick explanation.",
    intro:
      "For learners aged 18+, sessions can strengthen advanced concepts, rebuild earlier gaps and develop the reasoning needed for unfamiliar questions and assessments.",
    benefits: [
      "Clear explanations of advanced topics",
      "Multi-step and unfamiliar problem-solving",
      "Exams, coursework concepts and assessment preparation",
      "Explaining and justifying your reasoning",
    ],
  },

  "ap-us-high-school": {
    title:
      "AP & US High School-Level Tutoring for Adults | Online Support",
    description:
      "Online tutoring for learners aged 18+ studying AP or US high-school-level mathematics, science, statistics, computing and technical subjects.",
    hero:
      "AP and US high-school-level support for learners aged 18+.",
    intro:
      "For learners aged 18+, sessions can revisit the concept, work through course-style questions and strengthen the foundations needed for the next topic or assessment.",
    benefits: [
      "Help with the concepts in your current course",
      "AP-style and course-style practice",
      "Quiz, test and exam preparation",
      "Stronger foundations for the next unit",
    ],
  },

  undergraduate: {
    title:
      "Online University Tutoring | Undergraduate One-to-One Help",
    description:
      "One-to-one undergraduate tutoring for university modules in mathematics, statistics, coding, data science, science and technical subjects.",
    hero:
      "One-to-one university tutoring for difficult modules, methods and problem sheets.",
    intro:
      "Bring your lecture notes, module topics or problem sheets. Your tutor can unpack difficult notation, explain the method at university level and help you practise similar problems before assessments.",
    benefits: [
      "Modules that are moving faster than your understanding",
      "Problem sheets, calculations and technical exercises",
      "Mathematics, statistics, coding and data analysis",
      "Exams, coursework concepts and assessment preparation",
    ],
  },

  masters: {
    title:
      "Master's Tutoring Online | Statistics, Data Science & Research Methods",
    description:
      "One-to-one Master's tutoring for advanced statistics, research methods, data science, programming, quantitative modules and dissertation preparation.",
    hero:
      "Master's tutoring for advanced methods, coding and research-heavy modules.",
    intro:
      "Master's courses often move quickly and assume knowledge from several earlier topics at once. Sessions can slow down an advanced method, connect it back to the foundations and help you apply it correctly in software or analysis.",
    benefits: [
      "Advanced statistical and quantitative methods",
      "Research design, methodology and interpretation",
      "R, Python and analytical workflows",
      "Dissertation methods and analysis preparation",
    ],
  },

  "phd-research": {
    title:
      "PhD & Research Methods Tutoring | Statistics & Methodology",
    description:
      "One-to-one methodological tutoring for PhD students and researchers covering statistical methods, analysis strategy, reproducibility and interpretation.",
    hero:
      "Methodological tutoring for PhD students and researchers.",
    intro:
      "Use sessions to think through a method, test your understanding of its assumptions, discuss analysis choices and make sense of results. The research decisions and written work remain yours.",
    benefits: [
      "Advanced statistical and analytical methods",
      "Method choice and analysis strategy",
      "Reproducible R, Python or statistical workflows",
      "Interpretation, assumptions and methodological reasoning",
    ],
  },

  professional: {
    title:
      "Online Professional Tutoring | Technical & Analytical Skills",
    description:
      "One-to-one tutoring for professionals learning statistics, mathematics, programming, data analysis and other technical skills.",
    hero:
      "One-to-one technical tutoring built around the skill you need to use at work.",
    intro:
      "Bring the analysis, software or technical skill you need to understand. Sessions start from your existing experience and focus on practical use rather than covering material you already know.",
    benefits: [
      "Statistics and data analysis",
      "Programming and software skills",
      "Applied quantitative methods",
      "Practical skills you can use at work",
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
                href={`/find-a-tutor?level=${encodeURIComponent(level.name)}`}
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
              WHAT WE CAN WORK ON
            </div>

            <h3>
              Bring the work you are doing now.
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
              HOW SESSIONS WORK
            </div>

            <h2>
              The explanation should match the level of your course.
            </h2>

            <p>
              We use the terminology, methods and
              assessment style you are actually working
              with, then adapt the pace and explanation
              to what you need.
            </p>

            <div className="mini-timeline">
              <div>
                <span>1</span>

                <p>
                  Start with the exact concept,
                  method or skill causing trouble.
                </p>
              </div>

              <div>
                <span>2</span>

                <p>
                  Explain it at the level your
                  course actually expects.
                </p>
              </div>

              <div>
                <span>3</span>

                <p>
                  Work through examples,
                  questions or technical practice.
                </p>
              </div>

              <div>
                <span>4</span>

                <p>
                  Practise until you can use
                  the idea with less help.
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

      {/* level_learning_hub_bridge_marker */}
      <section className="section learning-on-tutoring-section">
        <div className="shell two-col">
          <div>
            <div className="eyebrow">
              FREE LEARNING HUB
            </div>

            <h2>
              Start with a free explanation when you want to review a topic independently.
            </h2>

            <p>
              Explore guides across statistics, mathematics, data science,
              research methods and related subjects. Use them to revisit a
              concept at your own pace, then bring the difficult part into
              tutoring if you need a more personalised explanation.
            </p>
          </div>

          <div className="quote-card">
            <div className="eyebrow">
              LEARN AT YOUR LEVEL
            </div>

            <strong>
              Build understanding first, then use one-to-one tutoring when the
              topic needs to be adapted to your course.
            </strong>

            <p>
              <Link href="/learn" className="text-link">
                Browse the Learning Hub →
              </Link>
            </p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="shell two-col">
          <div>
            <div className="eyebrow">
              ACADEMIC INTEGRITY
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
              request and recommend
              suitable one-to-one support.
            </p>

            <ul className="check-list">
              <li>
                Personalised one-to-one teaching
              </li>

              <li>
                Tutoring matched to your course level · 18+ enquiries only
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
              defaultLevel={level.name}
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
