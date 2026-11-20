import Link from "next/link";
import { redirect } from "next/navigation";
import AdminSignOutButton from "@/components/AdminSignOutButton";
import { getAdminSession } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default async function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session =
    await getAdminSession();

  if (!session) {
    redirect(
      "/admin/login"
    );
  }

  /*
   * These counts are intentionally lightweight.
   * They let the navigation surface work that needs attention
   * without loading the full request records.
   */
  const supabase =
    createAdminClient();

  const [
    sessionRequestResult,
    supportRequestResult,
  ] = await Promise.all([
    supabase
      .from(
        "student_support_requests"
      )
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq(
        "category",
        "session_request"
      )
      .in(
        "status",
        [
          "new",
          "in_progress",
        ]
      ),

    supabase
      .from(
        "student_support_requests"
      )
      .select("id", {
        count: "exact",
        head: true,
      })
      .in(
        "status",
        [
          "new",
          "in_progress",
        ]
      ),
  ]);

  /*
   * Navigation badges are non-critical UI.
   * If a count query ever fails, keep the admin area usable
   * and simply omit the affected badge.
   */
  const openSessionRequests =
    sessionRequestResult.error
      ? 0
      : sessionRequestResult.count ||
        0;

  const totalOpenSupport =
    supportRequestResult.error
      ? 0
      : supportRequestResult.count ||
        0;

  const openGeneralSupport =
    Math.max(
      totalOpenSupport -
        openSessionRequests,
      0
    );

  return (
    <div className="admin-app">

      <aside className="admin-sidebar">

        <Link
          href="/admin"
          className="admin-brand"
        >
          MAT{" "}
          <span>
            Admin
          </span>
        </Link>


        <nav>

          <Link href="/admin">
            Lead inbox
          </Link>

          <Link href="/admin/follow-ups">
            Follow-ups
          </Link>

          <Link href="/admin/matching">
            Matching
          </Link>

          <Link href="/admin/students">
            Students
          </Link>

          <Link href="/admin/onboarding">
            Onboarding
          </Link>


          <Link href="/admin/sessions">
            Sessions
            {openSessionRequests >
              0 && (
              <span>
                {" "}
                •{" "}
                {
                  openSessionRequests
                }
              </span>
            )}
          </Link>


          <Link href="/admin/progress">
            Progress
          </Link>

          <Link href="/admin/retention">
            Retention
          </Link>


          <Link href="/admin/portals">
            Student portals
            {openGeneralSupport >
              0 && (
              <span>
                {" "}
                •{" "}
                {
                  openGeneralSupport
                }
              </span>
            )}
          </Link>


          <Link href="/admin/tutors">
            Tutors
          </Link>

          <Link href="/admin/notifications">
            Notifications
          </Link>

          <Link href="/admin/testimonials">
            Testimonials
          </Link>

          <Link href="/admin/content-growth">
            Content growth
          </Link>

          <Link href="/admin/analytics">
            Analytics
          </Link>

          <Link href="/admin/business-intelligence">
            Business intelligence
          </Link>

          <Link href="/admin/system-health">
            System health
          </Link>

          <Link
            href="/"
            target="_blank"
          >
            View website ↗
          </Link>

        </nav>


        <div className="admin-sidebar-footer">

          <span>
            {
              session.user.email
            }
          </span>

          <AdminSignOutButton />

        </div>

      </aside>


      <div className="admin-main">
        {children}
      </div>

    </div>
  );
}
