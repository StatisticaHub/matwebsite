import Link from "next/link";

export const metadata = {
  title: "Invalid reference link",
  robots: {
    index: false,
    follow: false,
  },
};

export default function InvalidTutorReferencePage() {
  return (
    <main className="page-hero compact-hero">
      <div className="shell narrow">
        <div className="eyebrow">
          TUTOR REFERENCE
        </div>

        <h1>This reference link is not valid.</h1>

        <p className="page-lead">
          Please use the link in the reference-request email or
          contact My Academic Tutor if you need assistance.
        </p>

        <Link href="/contact" className="button button-secondary">
          Contact MAT
        </Link>
      </div>
    </main>
  );
}
