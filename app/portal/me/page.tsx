import Link from "next/link";
import { redirect } from "next/navigation";

import { getStudentSession } from "@/lib/student-auth";

export const metadata = {
  title: "My Student Portal",
  robots: {
    index: false,
    follow: false,
  },
};

export const dynamic = "force-dynamic";

export default async function StudentAccountPage() {
  const session =
    await getStudentSession();

  if (!session) {
    redirect(
      "/portal/login?unauthorized=1",
    );
  }

  const firstName =
    session.student.name
      .trim()
      .split(/\s+/)[0] ||
    "Student";

  return (
    <main className="tutor-auth-shell">
      <div className="tutor-auth-card">
        <Link
          href="/"
          className="tutor-wordmark"
        >
          My Academic Tutor
        </Link>

        <span className="tutor-kicker">
          Student Portal
        </span>

        <h1>
          Welcome, {firstName}
        </h1>

        <p>
          Your MAT account is active.
          Open your learning workspace
          to access your sessions,
          homework, files, progress
          and support.
        </p>

        <a
          href="/portal/open"
          className="tutor-primary-button"
        >
          Open my learning portal
        </a>

        <div
          style={{
            marginTop: 20,
            display: "flex",
            gap: 14,
            flexWrap: "wrap",
          }}
        >
          <Link
            href="/contact"
            className="admin-back-link"
          >
            Get support
          </Link>

          <a
            href="/portal/logout"
            className="admin-back-link"
          >
            Sign out
          </a>
        </div>
      </div>
    </main>
  );
}
