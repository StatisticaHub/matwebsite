import Link from "next/link";


export default function Footer() {
  return (
    <footer className="site-footer">

      <div className="shell">

        <div className="footer-grid">

          <div className="footer-brand">

            <strong>
              My Academic Tutor
            </strong>

            <p>
              Online learning and personalised tutoring built around clear
              explanation, guided practice and real understanding.
            </p>

            <p className="footer-small">
              Free learning resources and personalised one-to-one tutoring
              are available online.
            </p>

          </div>


          <div className="footer-columns">

            <div>

              <b>
                Learn
              </b>

              <Link href="/learn">
                Learning hub
              </Link>

              <Link href="/subjects">
                Subjects
              </Link>

              <Link href="/levels">
                Academic levels
              </Link>

              <Link href="/testimonials">
                Student experiences
              </Link>

            </div>


            <div>

              <b>
                Tutoring
              </b>

              <Link href="/tutoring">
                Personalised tutoring
              </Link>

              <Link href="/find-a-tutor">
                Request tutoring
              </Link>

              <Link href="/how-it-works">
                How tutoring works
              </Link>

              <Link href="/pricing">
                Pricing
              </Link>

            </div>


            <div>

              <b>
                Company
              </b>

              <Link href="/about">
                About
              </Link>

              <Link href="/tutors">
                Tutor standards
              </Link>

              <Link href="/become-a-tutor">
                Become a tutor
              </Link>

              <Link href="/contact">
                Contact
              </Link>

            </div>


            <div>

              <b>
                Policies
              </b>

              <Link href="/academic-integrity">
                Academic integrity
              </Link>

              <Link href="/safeguarding">
                Safeguarding
              </Link>

              <Link href="/privacy">
                Privacy
              </Link>

              <Link href="/terms">
                Terms
              </Link>

            </div>

          </div>

        </div>


        <div className="footer-bottom">

          <span>
            © 2026 My Academic Tutor.
          </span>

          <span>
            Learn it. Practise it. Use it.
          </span>

        </div>

      </div>

    </footer>
  );
}
