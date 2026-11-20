import Link from "next/link";
import { redirect } from "next/navigation";
import TutorSignOutButton from "@/components/TutorSignOutButton";
import { getTutorSession } from "@/lib/tutor-auth";

export const metadata = { robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function TutorProtectedLayout({ children }: { children: React.ReactNode }) {
  const session = await getTutorSession();
  if (!session) redirect("/tutor/login?unauthorized=1");
  return <div className="tutor-app">
    <aside className="tutor-sidebar">
      <Link href="/tutor" className="tutor-brand">MAT <span>Tutor</span></Link>
      <nav>
        <Link href="/tutor">Overview</Link>
        <Link href="/tutor/sessions">Sessions</Link>
        <Link href="/tutor/students">Students</Link>
        <Link href="/tutor/progress">Progress</Link>
        <Link href="/tutor/retention">Retention</Link>
        <Link href="/tutor/trials">Trials</Link>
        <Link href="/tutor/availability">Availability</Link>
        <Link href="/" target="_blank">View website ↗</Link>
      </nav>
      <div className="tutor-sidebar-footer"><span>{session.tutor.name}</span><small>{session.user.email}</small><TutorSignOutButton /></div>
    </aside>
    <div className="tutor-main">{children}</div>
  </div>;
}
