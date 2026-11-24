import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "FAQs",
  description:
    "Questions about My Academic Tutor, free learning resources, upcoming courses and programmes, and personalised online tutoring.",
};

const faqs = [
  [
    "What does My Academic Tutor provide?",
    "My Academic Tutor is an online learning and tutoring platform. Free educational resources and personalised one-to-one tutoring are available now. Structured courses, programmes and self-paced learning are also being developed for future launch.",
  ],
  [
    "Are MAT courses available now?",
    "Not yet. Structured programmes and self-paced courses are currently being developed. We will only describe a course as available once students can actually enrol and access the learning materials.",
  ],
  [
    "What will MAT courses include?",
    "The planned course experience includes structured modules and lessons, learning resources, practice activities and individual progress tracking. Some programmes may include live teaching, while others will be designed for independent self-paced study.",
  ],
  [
    "Will prerecorded self-paced courses be available?",
    "Yes. MAT is being designed to support self-paced courses that students can work through independently, including recorded teaching, lesson materials, exercises and progress tracking.",
  ],
  [
    "How is a course different from one-to-one tutoring?",
    "A course follows a shared structured curriculum that enrolled students can work through. One-to-one tutoring is personalised around an individual student's course, questions, goals and current difficulties.",
  ],
  [
    "Can I use free learning resources without booking tutoring?",
    "Yes. The Learning Hub is designed for independent learning and can be used without booking a tutoring session.",
  ],
  [
    "How do I start tutoring?",
    "Tell us your subject, academic level, topic, goal and availability. We review the academic context and arrange suitable one-to-one support before you decide whether to proceed.",
  ],
  [
    "Can I get regular weekly lessons?",
    "Yes. Regular one-to-one tutoring can follow your course or module over time, while one-off and short-term support can focus on a particular topic, method or assessment.",
  ],
  [
    "Do you help with exams?",
    "Yes. Exam preparation can combine topic review, exam-style questions, timing, feedback and revision planning. The aim is to improve both understanding and assessment performance.",
  ],
  [
    "Do you support university and Master's students?",
    "Yes. MAT supports learners from school through undergraduate, Master's, postgraduate and research-level study across the subjects listed on the website.",
  ],
  [
    "Can you help with dissertations and research?",
    "Yes, within academic-integrity boundaries. Tutors can help learners understand study design, methods, analysis, software, interpretation and methodological reasoning, but assessed work must remain the student's own.",
  ],
  [
    "Can I get help with R, Python, SPSS or Stata?",
    "Yes. Coding and software tutoring focuses on understanding workflows, commands, errors and interpretation so that the learner can reproduce the work independently.",
  ],
  [
    "Will a tutor do my assignment for me?",
    "No. MAT supports learning and academic development. Tutors can explain, demonstrate, review and guide, but assessed work must remain the student's own.",
  ],
];

export default function Page() {
  return (
    <>
      <section className="page-hero compact-hero">
        <div className="shell narrow">
          <div className="eyebrow">
            FREQUENTLY ASKED QUESTIONS
          </div>

          <h1>
            Questions about learning, courses and personalised
            tutoring.
          </h1>

          <p className="page-lead">
            What is available today, what MAT is building next and
            how different learning routes fit together.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="shell narrow faq-list">
          {faqs.map(([q, a]) => (
            <details key={q}>
              <summary>{q}</summary>
              <p>{a}</p>
            </details>
          ))}

          <div className="center-cta">
            <Link
              className="button button-primary"
              href="/learn"
            >
              Explore free learning
            </Link>

            <Link
              className="button button-secondary"
              href="/find-a-tutor"
            >
              Request personalised tutoring
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
