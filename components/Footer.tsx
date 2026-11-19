import Link from "next/link";

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="shell">
        <div className="footer-grid">
          <div className="footer-brand">
            <strong>My Academic Tutor</strong>
            <p>Personalised one-to-one tutoring for deeper understanding, stronger skills and more confident independent learning.</p>
            <p className="footer-small">Online academic support from secondary school to postgraduate and research-level study.</p>
          </div>

          <div className="footer-columns">
            <div>
              <b>Learn</b>
              <Link href="/learn">Learning hub</Link>
              <Link href="/learn/editorial-policy">Learning editorial approach</Link>
              <Link href="/subjects">Subjects</Link>
              <Link href="/levels">Academic levels</Link>
              <Link href="/ai-tutor">AI Tutor</Link>
            </div>
            <div>
              <b>Tutoring</b>
              <Link href="/tutoring">Tutoring services</Link>
              <Link href="/tutoring/exam-preparation">Exam preparation</Link>
              <Link href="/tutoring/statistics-data-analysis">Statistics & data analysis</Link>
              <Link href="/tutoring/dissertation-research">Research support</Link>
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
          <span>Understand. Practise. Progress.</span>
        </div>
      </div>
    </footer>
  );
}
