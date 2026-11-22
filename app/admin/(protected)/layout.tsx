import Link from "next/link";
import { redirect } from "next/navigation";
import AdminSignOutButton from "@/components/AdminSignOutButton";
import AdminSidebarNav from "@/components/AdminSidebarNav";
import { getAdminSession } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import styles from "./admin-dashboard.module.css";

import AdminTimeZoneControl from "@/components/AdminTimeZoneControl";
import { getAdminTimeZone } from "@/lib/admin-time-zone";
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
  const session = await getAdminSession();

  if (!session) {
    redirect("/admin/login");
  }

  const adminTimeZone =
    await getAdminTimeZone();

  const supabase = createAdminClient();

  const [
    sessionRequestResult,
    supportRequestResult,
  ] = await Promise.all([
    supabase
      .from("student_support_requests")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq("category", "session_request")
      .in("status", ["new", "in_progress"]),

    supabase
      .from("student_support_requests")
      .select("id", {
        count: "exact",
        head: true,
      })
      .in("status", ["new", "in_progress"]),
  ]);

  const openSessionRequests =
    sessionRequestResult.error
      ? 0
      : sessionRequestResult.count || 0;

  const totalOpenSupport =
    supportRequestResult.error
      ? 0
      : supportRequestResult.count || 0;

  const openGeneralSupport = Math.max(
    totalOpenSupport - openSessionRequests,
    0,
  );

  return (
    <div className={`${styles.shell} admin-app`}>
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header">
          <Link href="/admin" className="admin-brand">
            MAT <span>Admin</span>
          </Link>

          <span className="admin-brand-subtitle">
            Operations console
          </span>
        </div>

        <AdminSidebarNav
          openSessionRequests={openSessionRequests}
          openGeneralSupport={openGeneralSupport}
        />

        <div className="admin-sidebar-footer">
          <span title={session.user.email || ""}>
            {session.user.email}
          </span>

          <AdminTimeZoneControl
            initialTimeZone={adminTimeZone}
          />

          <AdminSignOutButton />
        </div>
      </aside>

      <main className="admin-main">
        {children}
      </main>
    </div>
  );
}
