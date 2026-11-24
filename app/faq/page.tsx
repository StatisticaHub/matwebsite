import type { Metadata } from "next";
import Link from "next/link";


export const metadata: Metadata = {
  title: "FAQs",
  description:
    "Questions about personalised online tutoring, tutor matching, pricing, academic integrity, the MAT Learning Hub and student learning portal.",
};


const faqs = [
  [
    "What does My Academic Tutor provide?",
    "My Academic Tutor provides free educational resources and personalised one-to-one online tutoring. Tutoring can support individual topics, exams, university modules, technical software, statistics, research methods and ongoing study.",
  ],
  [
    "How do I start tutoring?",
    "Tell us your subject, academic level, topic, goal and any useful availability. We review the academic context and arrange suitable one-to-one support before you decide whether to proceed.",
  ],
  [
    "How do you choose a tutor?",
    "We review the subject, academic level, specific topic, teaching need and practical fit before arranging suitable tutoring. You do not need to search through a public tutor directory.",
  ],
  [
    "How much does tutoring cost?",
    "One-to-one tutoring starts from £20 an hour. The exact rate depends on the subject, academic level and specialist requirements, and is confirmed before you decide whether to book.",
  ],
  [
    "Can I book only one session?",
    "Yes. Tutoring can be used for one focused session, a short series of lessons or regular ongoing support. You do not need to commit to a long-term package before speaking to us.",
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
  [
    "What is the student learning portal?",
    "Active tutoring students can use a private MAT learning space for sessions, homework, learning files, progress records and support.",
  ],
  [
    "Can I use the Learning Hub without booking tutoring?",
    "Yes. The Learning Hub is available for independent learning and can be used without booking a tutoring session.",
  ],
  [
    "Are structured MAT courses available?",
    "Structured courses and programmes are not currently offered for enrolment. Current services are free educational resources and personalised one-to-one tutoring.",
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
            Questions about learning and personalised tutoring.
          </h1>

          <p className="page-lead">
            How tutoring works, what it costs, what support is available and
            what to expect before you book.
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
