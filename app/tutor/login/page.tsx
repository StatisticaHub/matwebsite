import Link from "next/link";
import { redirect } from "next/navigation";
import TutorLoginForm from "@/components/TutorLoginForm";
import { getTutorAccountSession } from "@/lib/tutor-auth";

export const metadata = {
  title: "Tutor sign in",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ unauthorized?: string }>;

export default async function TutorLoginPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await getTutorAccountSession();

  if (session) {
    redirect(
      session.tutor.status === "active"
        ? "/tutor"
        : "/tutor/onboarding"
    );
  }

  const query = await searchParams;

  return (
    <main className="tutor-auth-shell">
      <div className="tutor-auth-card">
        <Link href="/" className="tutor-wordmark">
          My Academic Tutor
        </Link>

        <span className="tutor-kicker">Tutor portal</span>
        <h1>Welcome back</h1>

        <p>
          Sign in to complete your tutor profile or access your teaching workspace.
        </p>

        {query.unauthorized === "1" && (
          <div className="tutor-alert warning" role="alert">
            This account does not currently have tutor portal access.
            Contact the MAT team if you need help.
          </div>
        )}

        <TutorLoginForm />

        <p className="tutor-auth-help">
          Need a new password or access link? Ask the MAT admin team
          to resend portal access from your tutor profile.
        </p>
      </div>
    </main>
  );
}
