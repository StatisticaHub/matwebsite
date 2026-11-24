import Link from "next/link";
import { redirect } from "next/navigation";

import TutorSidebarNav from "@/components/TutorSidebarNav";
import { getTutorAccountSession } from "@/lib/tutor-auth";


export const metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export const dynamic =
  "force-dynamic";

export default async function TutorProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session =
    await getTutorAccountSession();

  if (!session) {
    redirect(
      "/tutor/login?unauthorized=1",
    );
  }

  /*
   * Pending tutors may authenticate, but they do not
   * enter the teaching workspace until MAT activates them.
   */
  if (
    session.tutor.status !==
    "active"
  ) {
    redirect(
      "/tutor/onboarding",
    );
  }

  return (
    <div className="tutor-app">
      <aside className="tutor-sidebar">
        <div className="tutor-sidebar-brand">
          <Link
            href="/tutor"
            className="tutor-brand"
          >
            <strong>
              MAT
            </strong>

            <span>
              Tutor
            </span>
          </Link>

          <small>
            Teaching workspace
          </small>
        </div>

        <TutorSidebarNav
          tutorName={
            session.tutor.name
          }
          email={
            session.user.email ||
            ""
          }
        />
      </aside>

      <main className="tutor-main">
        {children}
      </main>
    </div>
  );
}
