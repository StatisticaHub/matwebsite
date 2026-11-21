import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "FAQs" };

const faqs = [
  ["What does My Academic Tutor provide?", "MAT provides live one-to-one online tutoring from school through university, postgraduate and research-level study. Tell us what you are studying and we match the request to a suitable tutor."],
  ["How do I start tutoring?", "Tell us your subject, level, topic, goal and availability. We read your request, match it with a suitable tutor and confirm the next step before you book."],
  ["Can I get regular weekly lessons?", "Yes. Regular 1:1 tutoring can follow your course or module over time, while one-off and short-term support can focus on a specific topic or assessment."],
  ["Do you help with exams?", "Yes. Exam preparation can combine topic review, exam-style questions, timing, feedback and revision planning. The aim is to improve both understanding and assessment performance."],
  ["Do you support university and Master’s students?", "Yes. Support can cover quantitative modules, statistics, programming, data science, research methods, scientific subjects and other listed areas at undergraduate and postgraduate level."],
  ["Can you help with dissertations and research?", "Yes, within academic-integrity boundaries. Tutors can help students understand study design, methods, analysis, software, interpretation and methodological reasoning, but they should not write or complete assessed work for the student."],
  ["Can I get help with R, Python, SPSS or Stata?", "Yes. Coding and software tutoring is intended to help you understand the workflow, commands, errors and interpretation so you can reproduce the work yourself."],
  ["What if my exact subject or topic is not listed?", "Send the request anyway and describe the topic clearly. The listed subjects are the main areas, not necessarily the limit of what can be reviewed."],
  ["Is MAT AI the same as the tutoring service?", "No. MAT AI is an educational support layer for initial questions and explanations. Human tutoring is the main service for deeper teaching, feedback, practice and continuity."],
  ["Will a tutor do my assignment for me?", "No. MAT supports learning and academic development. Tutors can explain, demonstrate, review and guide, but assessed work must remain the student’s own."],
];

export default function Page() {
  return (
    <>
      <section className="page-hero compact-hero"><div className="shell narrow"><div className="eyebrow">FREQUENTLY ASKED QUESTIONS</div><h1>Questions about tutoring, booking and how sessions work.</h1><p className="page-lead">Straightforward answers about subjects, tutors, sessions, assessed work and getting started.</p></div></section>
      <section className="section"><div className="shell narrow faq-list">{faqs.map(([q,a]) => <details key={q}><summary>{q}</summary><p>{a}</p></details>)}<div className="center-cta"><Link className="button button-primary" href="/find-a-tutor">Get personalised tutoring</Link></div></div></section>
    </>
  );
}
