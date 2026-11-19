import Link from "next/link";
import TutorPasswordSetupForm from "@/components/TutorPasswordSetupForm";
export const metadata = { title: "Set up tutor portal", robots: { index: false, follow: false } };
export default function TutorWelcomePage() {
  return <main className="tutor-auth-shell"><div className="tutor-auth-card">
    <Link href="/" className="tutor-wordmark">My Academic Tutor</Link>
    <span className="tutor-kicker">Tutor portal setup</span>
    <h1>Choose your portal password</h1>
    <p>Set a secure password to finish activating your tutor portal.</p>
    <TutorPasswordSetupForm />
  </div></main>;
}
