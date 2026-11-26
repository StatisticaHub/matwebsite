import Link from "next/link";

const routes: Record<string, Array<{ href: string; title: string; copy: string }>> = {
  statistics: [
    { href: "/tutoring/statistics-tutor-online", title: "Online Statistics Tutor", copy: "Direct one-to-one tutoring for a statistics topic, method or university module." },
    { href: "/tutoring/statistics-data-analysis", title: "Statistics & Data Analysis Support", copy: "Broader support with method choice, software workflows, analysis and interpretation." },
    { href: "/tutoring/r-statistics-tutor", title: "R Statistics Tutor", copy: "R workflows, debugging, modelling and reproducible analysis." },
    { href: "/tutoring/spss-tutor", title: "SPSS Tutor", copy: "SPSS procedures, assumptions, output and reporting." },
    { href: "/tutoring/dissertation-statistics-support", title: "Dissertation Statistics Support", copy: "Ethical support for methods, analysis planning and interpretation." },
  ],
  "data-science": [
    { href: "/tutoring/data-science-tutor", title: "Data Science Tutor", copy: "Data workflows, modelling, validation, Python or R support." },
    { href: "/tutoring/r-statistics-tutor", title: "R Statistics Tutor", copy: "Learn reproducible data analysis and statistical coding in R." },
    { href: "/tutoring/coding-software", title: "Coding & Software Support", copy: "Guided coding, debugging and analytical workflows." },
  ],
  "research-methods": [
    { href: "/tutoring/dissertation-statistics-support", title: "Dissertation Statistics Support", copy: "Method selection, analysis planning and defensible interpretation." },
    { href: "/tutoring/research-methods-tutor", title: "Research Methods Tutor", copy: "Study design, research questions and methodological reasoning." },
    { href: "/tutoring/dissertation-research", title: "Dissertation & Research Support", copy: "Structured research guidance without outsourcing assessed work." },
  ],
  bioinformatics: [
    { href: "/tutoring/data-science-tutor", title: "Data Science Tutor", copy: "Programming, modelling and reproducible data workflows." },
    { href: "/tutoring/coding-software", title: "Coding & Software Support", copy: "R, Python and debugging support for computational work." },
    { href: "/subjects/statistics", title: "Statistics Tutoring", copy: "Build the statistical foundations behind biological data analysis." },
  ],
  "machine-learning-ai": [
    { href: "/tutoring/data-science-tutor", title: "Data Science Tutor", copy: "Model evaluation, validation, coding and interpretation." },
    { href: "/tutoring/coding-software", title: "Coding & Software Support", copy: "Python and R workflows with guided debugging." },
    { href: "/subjects/statistics", title: "Statistics Tutoring", copy: "Strengthen inference, regression and model reasoning." },
  ],
};

const fallback = [
  { href: "/tutoring/one-to-one-tutoring", title: "Regular 1:1 Tutoring", copy: "Ongoing teaching that follows your course and progress." },
  { href: "/tutoring/exam-preparation", title: "Exam Preparation", copy: "Targeted understanding, question practice and exam technique." },
  { href: "/tutoring/university-tutoring", title: "University Module Support", copy: "Help alongside lectures, problem sheets and assessments." },
];

export default function SubjectRelatedSupport({ subjectSlug }: { subjectSlug: string }) {
  const items = routes[subjectSlug] || fallback;
  return (
    <div className="intent-link-grid intent-link-grid-compact">
      {items.map((item) => (
        <Link key={item.href} href={item.href} className="intent-link-card">
          <h3>{item.title}</h3>
          <p>{item.copy}</p>
          <span className="text-link">Explore support</span>
        </Link>
      ))}
    </div>
  );
}
