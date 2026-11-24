import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "Terms governing personalised tutoring, student portal access and learning services provided by My Academic Tutor.",
};

export default function TermsPage() {
  return (
    <>
      <section className="page-hero compact-hero">
        <div className="shell narrow">
          <div className="eyebrow">TERMS OF SERVICE</div>

          <h1>Terms for learning and tutoring with My Academic Tutor.</h1>

          <p className="page-lead">
            These terms explain how our current tutoring, learning support and
            student portal services work, including bookings, payments,
            cancellations, academic integrity and use of learning materials.
          </p>

          <p>
            <strong>Last updated:</strong> 24 November 2026
          </p>
        </div>
      </section>

      <section className="section">
        <div className="shell article-shell">

          <section>
            <h2>1. About these terms</h2>

            <p>
              These Terms of Service apply to personalised tutoring, academic
              learning support, student portal access and related services
              currently provided through My Academic Tutor ("MAT", "we",
              "us" or "our").
            </p>

            <p>
              Free educational resources may also be available through the
              website. Structured programmes and self-paced courses that are
              described as coming soon are not currently offered for enrolment.
              Additional or updated terms may apply when those products launch.
            </p>

            <p>
              These terms do not remove or restrict any rights that you have
              under applicable consumer law.
            </p>
          </section>


          <section>
            <h2>2. Our current services</h2>

            <p>
              MAT provides online educational support which may include
              one-to-one tutoring, guided practice, learning plans, homework
              or practice activities, learning resources, progress records,
              session support and access to a private student learning portal.
            </p>

            <p>
              The exact service provided to you depends on what is agreed for
              your subject, academic level, learning needs and tutoring
              arrangement.
            </p>

            <p>
              Tutoring is educational support. We do not promise a particular
              grade, examination result, university outcome, qualification or
              other academic result.
            </p>
          </section>


          <section>
            <h2>3. Forming a tutoring agreement</h2>

            <p>
              Sending a tutoring enquiry does not create an obligation to
              purchase tutoring.
            </p>

            <p>
              Before paid tutoring begins, we will normally confirm the
              proposed support, tutor or teaching arrangement, price and any
              relevant payment or booking information.
            </p>

            <p>
              A paid tutoring agreement is formed when the proposed service
              has been accepted through the relevant booking, payment or
              written confirmation process.
            </p>

            <p>
              Where required, the booking communication will also provide the
              trader identity and contact information applicable to the
              agreement.
            </p>
          </section>


          <section>
            <h2>4. Fees and payment</h2>

            <p>
              Tutoring prices can vary according to academic level, subject,
              tutor specialism, session format and other requirements.
            </p>

            <p>
              The price applicable to your tutoring will be confirmed before
              you commit to the service. Any payment schedule, package price or
              other payment condition agreed with you forms part of the
              tutoring agreement.
            </p>

            <p>
              We will not add a charge that was not disclosed or agreed before
              it became payable.
            </p>
          </section>


          <section>
            <h2>5. Consumer cancellation rights</h2>

            <p>
              If you enter into a qualifying consumer contract with us at a
              distance, for example online or by email, you may have a legal
              right to cancel the service contract during the applicable
              cancellation period.
            </p>

            <p>
              Under current UK consumer rules, this is generally 14 days after
              a service contract is entered into.
            </p>

            <p>
              If you expressly ask us to begin providing tutoring during that
              cancellation period, you may be required to pay for the service
              that has already been provided if you later cancel.
            </p>

            <p>
              Where the service has been fully performed during the
              cancellation period following the legally required request and
              acknowledgement, the statutory right to cancel may end.
            </p>

            <p>
              Nothing in these terms limits any cancellation, refund or other
              statutory right available to you.
            </p>
          </section>


          <section>
            <h2>6. Session cancellations and rescheduling</h2>

            <p>
              Any specific cancellation, rescheduling or missed-session policy
              applicable to your tutoring arrangement will be communicated
              before it becomes binding.
            </p>

            <p>
              We will only apply a cancellation or missed-session charge where
              the relevant rule or charge was made clear to you beforehand.
            </p>

            <p>
              If MAT or the tutor needs to cancel or reschedule a session, we
              will make reasonable efforts to arrange an alternative. Where a
              paid service cannot be provided, any appropriate refund or credit
              will be considered in accordance with the agreement and your
              statutory rights.
            </p>
          </section>


          <section>
            <h2>7. Teaching standards</h2>

            <p>
              We aim to provide educational services with reasonable care and
              skill and to match teaching to the student's academic level,
              stated needs and learning context.
            </p>

            <p>
              Students should provide accurate information about their course,
              level, subject and goals where this is relevant to the tutoring.
            </p>

            <p>
              A tutor may adapt the planned lesson where doing so is reasonably
              necessary to address gaps in understanding or to teach the
              subject effectively.
            </p>
          </section>


          <section>
            <h2>8. Academic integrity</h2>

            <p>
              MAT exists to support learning. Tutors may explain concepts,
              demonstrate methods, discuss approaches, review understanding,
              provide feedback and practise similar questions with students.
            </p>

            <p>
              Tutors must not impersonate students or complete examinations,
              tests, assignments, dissertations or other assessed work on a
              student's behalf.
            </p>

            <p>
              We may refuse or stop support where a request would require us or
              a tutor to breach academic-integrity standards, institutional
              rules or applicable law.
            </p>

            <p>
              More information is available in our{" "}
              <Link href="/academic-integrity">
                Academic Integrity policy
              </Link>.
            </p>
          </section>


          <section>
            <h2>9. Student portal accounts</h2>

            <p>
              Student portal accounts are private and invitation-only. Access
              is intended for the person to whom the account has been issued.
            </p>

            <p>
              Students must take reasonable care of their login credentials
              and must not deliberately allow another person to access private
              learning records through their account.
            </p>

            <p>
              We may suspend portal access where reasonably necessary for
              security, account administration, safeguarding or where the
              tutoring relationship has ended.
            </p>

            <p>
              Ending portal access does not remove any rights you may have in
              relation to your personal information. See our{" "}
              <Link href="/privacy">Privacy Notice</Link>.
            </p>
          </section>


          <section>
            <h2>10. Learning materials and recordings</h2>

            <p>
              Worksheets, lesson notes, slides, examples, recordings and other
              learning materials supplied by MAT or a tutor are normally
              provided for the student's personal educational use.
            </p>

            <p>
              Unless permission is given, students should not commercially
              reproduce, sell, republish or distribute MAT learning materials
              to other people.
            </p>

            <p>
              Students retain ownership of their own original work and
              materials, subject to any rights belonging to their institution
              or another third party.
            </p>

            <p>
              A tutoring session will not be recorded by MAT simply because it
              takes place online. Where recording is proposed, the relevant
              arrangements should be made clear beforehand.
            </p>
          </section>


          <section>
            <h2>11. Technology and third-party services</h2>

            <p>
              MAT uses third-party technology providers to operate parts of
              the service, including website hosting, authentication, email
              delivery, database infrastructure and online meeting tools.
            </p>

            <p>
              Temporary interruptions can sometimes occur because of internet
              connections, device problems or external services. Where a
              technical failure materially prevents a paid tutoring session,
              we will make reasonable efforts to resolve, reschedule or
              otherwise address the affected service.
            </p>
          </section>


          <section>
            <h2>12. Behaviour and safeguarding</h2>

            <p>
              Students, tutors and MAT team members are expected to communicate
              respectfully and behave appropriately during tutoring and through
              MAT communication systems.
            </p>

            <p>
              We may intervene, restrict access or stop a tutoring arrangement
              where reasonably necessary because of abusive behaviour,
              harassment, safeguarding concerns, security concerns or serious
              misuse of the service.
            </p>

            <p>
              MAT currently accepts personalised tutoring arrangements only
              where the student is aged 18 or over. Public educational
              resources may cover school-level topics, but this does not mean
              that under-18 tutoring is currently available. See our{" "}
              <Link href="/safeguarding">Safeguarding and Age Eligibility policy</Link>.
            </p>
          </section>


          <section>
            <h2>13. Our responsibility</h2>

            <p>
              Nothing in these terms excludes or restricts liability where it
              would be unlawful to do so, including rights and remedies that
              consumers have under applicable consumer law.
            </p>

            <p>
              In particular, these terms do not exclude the requirement for
              consumer services to be performed with reasonable care and skill.
            </p>

            <p>
              MAT is not responsible for guaranteeing academic results or for
              decisions made independently by schools, universities,
              examination bodies, employers or other third parties.
            </p>
          </section>


          <section>
            <h2>14. Privacy</h2>

            <p>
              We process personal information in connection with enquiries,
              tutoring, learning records, communications and student portal
              access.
            </p>

            <p>
              Details of how personal information is used are set out in our{" "}
              <Link href="/privacy">Privacy Notice</Link>.
            </p>
          </section>


          <section>
            <h2>15. Complaints and problems</h2>

            <p>
              If something has gone wrong with tutoring or another MAT
              service, please contact us so that we can review the issue and
              try to resolve it.
            </p>

            <p>
              Email:{" "}
              <a href="mailto:contact@myacademictutor.com">
                contact@myacademictutor.com
              </a>
            </p>

            <p>
              Making a complaint does not affect any statutory rights or
              remedies available to you.
            </p>
          </section>


          <section>
            <h2>16. Changes to these terms</h2>

            <p>
              We may update these terms as MAT develops, for example when new
              services such as structured programmes or self-paced courses are
              introduced.
            </p>

            <p>
              An update will not retrospectively remove rights that already
              apply to an existing contract. Material changes affecting an
              ongoing paid arrangement will be communicated where appropriate.
            </p>
          </section>


          <section>
            <h2>17. Applicable law</h2>

            <p>
              These terms are governed by the laws of England and Wales,
              subject to any mandatory consumer protections that apply where
              you live.
            </p>

            <p>
              If you are a consumer, nothing in this section is intended to
              deprive you of mandatory legal protections available to you under
              applicable law.
            </p>
          </section>

        </div>
      </section>
    </>
  );
}
