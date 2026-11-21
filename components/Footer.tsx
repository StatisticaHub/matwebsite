import Link from "next/link";

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="shell">
        <div className="footer-grid">
          <div className="footer-brand">
            <strong>My Academic Tutor</strong>
            <p>One-to-one online tutoring for school, university and postgraduate students.</p>
            <p className="footer-small">One-to-one online tutoring from secondary school to postgraduate and research-level study.</p>
          </div>

          <div className="footer-columns">
            <div>
              <b>Learn</b>
              <Link href="/learn">Learning hub</Link>
              <Link href="/learn/editorial-policy">How we write our guides</Link>
              <Link href="/subjects">Subjects</Link>
              <Link href="/levels">Academic levels</Link>
            </div>
            <div>
              <b>Tutoring</b>
              <Link href="/tutoring">All tutoring</Link>
              <Link href="/tutoring/exam-preparation">Exam preparation</Link>
              <Link href="/tutoring/statistics-data-analysis">Statistics & data analysis</Link>
              <Link href="/tutoring/dissertation-research">Dissertation & research</Link>
            </div>
            <div>
              <b>Company</b>
              <Link href="/about">About</Link>
              <Link href="/tutors">Tutor standards</Link>
              <Link href="/become-a-tutor">Become a tutor</Link>
              <Link href="/contact">Contact</Link>
            </div>
            <div>
              <b>Policies</b>
              <Link href="/academic-integrity">Academic integrity</Link>
              <Link href="/safeguarding">Safeguarding</Link>
              <Link href="/privacy">Privacy</Link>
              <Link href="/terms">Terms</Link>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} My Academic Tutor.</span>
          <span>Understand it. Practise it. Use it.</span>
        </div>
      </div>
    </footer>
  );
}
