import Link from "next/link";
import { redirect } from "next/navigation";
import AdminSignOutButton from "@/components/AdminSignOutButton";
import { getAdminSession } from "@/lib/admin-auth";

export const metadata = { robots: { index: false, follow: false } };

export default async function ProtectedAdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  return (
    <div className="admin-app">
      <aside className="admin-sidebar">
        <Link href="/admin" className="admin-brand">MAT <span>Admin</span></Link>
        <nav>
          <Link href="/admin">Lead inbox</Link>
          <Link href="/admin/follow-ups">Follow-ups</Link>
          <Link href="/admin/matching">Matching</Link>
          <Link href="/admin/students">Students</Link>
          <Link href="/admin/onboarding">Onboarding</Link>
          <Link href="/admin/sessions">Sessions</Link>
          <Link href="/admin/progress">Progress</Link>
          <Link href="/admin/portals">Student portals</Link>
          <Link href="/admin/tutors">Tutors</Link>
          <Link href="/admin/notifications">Notifications</Link>
          <Link href="/admin/analytics">Analytics</Link>
          <Link href="/" target="_blank">View website ↗</Link>
        </nav>
        <div className="admin-sidebar-footer">
          <span>{session.user.email}</span>
          <AdminSignOutButton />
        </div>
      </aside>
      <div className="admin-main">{children}</div>
    </div>
  );
}
