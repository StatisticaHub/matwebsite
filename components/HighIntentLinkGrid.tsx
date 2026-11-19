import Link from "next/link";

const links = [
  { href: "/tutoring/statistics-tutor-online", title: "Online Statistics Tutor", copy: "Statistics from foundations through regression, modelling, software and interpretation." },
  { href: "/tutoring/medical-statistics-tutor", title: "Medical Statistics Tutor", copy: "Biostatistics, health data, study design, regression and survival analysis." },
  { href: "/tutoring/r-statistics-tutor", title: "R Statistics Tutor", copy: "Learn R through real statistical workflows, debugging and reproducible analysis." },
  { href: "/tutoring/spss-tutor", title: "SPSS Tutor", copy: "Understand the statistics behind the menus, output, assumptions and reporting." },
  { href: "/tutoring/econometrics-tutor", title: "Econometrics Tutor", copy: "Regression, inference and quantitative methods for economics and finance students." },
  { href: "/tutoring/dissertation-statistics-support", title: "Dissertation Statistics Support", copy: "Ethical methods support for analysis planning, software and interpretation." },
];

export default function HighIntentLinkGrid({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`intent-link-grid ${compact ? "intent-link-grid-compact" : ""}`}>
      {links.map((item) => (
        <Link key={item.href} href={item.href} className="intent-link-card">
          <h3>{item.title}</h3>
          <p>{item.copy}</p>
          <span className="text-link">Explore tutoring</span>
        </Link>
      ))}
    </div>
  );
}
