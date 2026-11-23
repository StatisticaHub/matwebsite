import Link from "next/link";
import { redirect } from "next/navigation";

import StudentLoginForm from "@/components/StudentLoginForm";
import { getStudentSession } from "@/lib/student-auth";

export const metadata = {
  title: "Student Portal Sign In",
  robots: {
    index: false,
    follow: false,
  },
};

export const dynamic = "force-dynamic";

type SearchParams = Promise<{
  unauthorized?: string;
  expired?: string;
}>;

export default async function StudentLoginPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const query = await searchParams;
  const session = await getStudentSession();

  if (session && query.expired !== "1") {
    redirect("/portal/me");
  }

  return (
    <main className="tutor-auth-shell">
      <div className="tutor-auth-card">
        <Link href="/" className="tutor-wordmark">
          My Academic Tutor
        </Link>

        <span className="tutor-kicker">
          Student learning portal
        </span>

        <h1>Welcome back</h1>

        <p>
          Sign in to access your sessions, homework,
          learning files, progress and support.
        </p>

        {query.expired === "1" && (
          <div className="tutor-alert warning">
            Your portal session has expired. Sign in again to continue.
          </div>
        )}

        {query.unauthorized === "1" && (
          <div className="tutor-alert warning">
            This account is not currently linked to an
            active MAT Student Portal.
          </div>
        )}

        <StudentLoginForm />

        <p className="tutor-auth-help">
          Student accounts are invitation-only. If you
          already study with MAT and need access, contact
          the MAT team.
        </p>

        <Link href="/" className="admin-back-link">
          ← Return to website
        </Link>
      </div>
    </main>
  );
}
