import Link from "next/link";
import PortalAccessManager from "@/components/PortalAccessManager";
import { updateSupportRequest } from "@/app/admin/portal-actions";
import { createAdminClient } from "@/lib/supabase/admin";
import { portalSupportStatuses, type HomeworkSubmission, type StudentPortalLink, type StudentSupportRequest } from "@/lib/student-portal";

export const metadata = { title: "Student portals" };
export const dynamic = "force-dynamic";

type SearchParams = Promise<{ student?: string }>;

type StudentRow = { id: string; name: string; email: string; status: string };
type AdminHomeworkSubmission = HomeworkSubmission & { homework: { title: string } | null };

function formatDateTime(value: string | null) {
  if (!value) return "Never";
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/London" }).format(new Date(value));
}

function safeUrl(value: string | null) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) ? url.toString() : null;
  } catch {
    return null;
  }
}

export default async function StudentPortalsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const supabase = createAdminClient();

  const [studentResult, linkResult, supportResult, submissionResult] = await Promise.all([
    supabase.from("students").select("id,name,email,status").order("name"),
    supabase.from("student_portal_links").select("id,student_id,token_preview,expires_at,created_at,last_accessed_at").is("revoked_at", null).order("created_at", { ascending: false }),
    supabase.from("student_support_requests").select("*").order("created_at", { ascending: false }).limit(50),
    supabase.from("homework_submissions").select("*,homework(title)").order("submitted_at", { ascending: false }).limit(50),
  ]);

  const students = (studentResult.data || []) as StudentRow[];
  const links = (linkResult.data || []) as StudentPortalLink[];
  const support = (supportResult.data || []) as StudentSupportRequest[];
  const submissions = (submissionResult.data || []) as AdminHomeworkSubmission[];
  const studentById = Object.fromEntries(students.map((student) => [student.id, student]));
  const openRequests = support.filter((item) => item.status !== "resolved").length;

  return (
    <div className="admin-page">
      <header className="admin-page-head">
        <div>
          <span className="admin-eyebrow">Tutoring delivery</span>
          <h1>Student portals</h1>
          <p>Create secure learning-record links, review student questions and see homework submitted through the portal.</p>
        </div>
      </header>

      <section className="admin-metrics admin-metrics-3">
        <div><span>Students</span><strong>{students.length}</strong></div>
        <div><span>Active portal links</span><strong>{links.length}</strong></div>
        <div><span>Open support requests</span><strong>{openRequests}</strong></div>
      </section>

      <section className="admin-panel admin-detail-card">
        <div className="admin-card-head"><div><h2>Portal access</h2><span>Passwordless, revocable student links</span></div></div>
        <p className="admin-portal-intro">Generating a new link automatically revokes the previous active link for that student. The full secret is only shown immediately after generation; the database stores a hash, not the raw link token.</p>
        <PortalAccessManager students={students} links={links} focusStudentId={params.student} />
      </section>

      <div className="admin-delivery-columns admin-portal-columns">
        <section className="admin-panel admin-detail-card">
          <div className="admin-card-head"><div><h2>Student support requests</h2><span>{support.length} recent</span></div></div>
          <div className="admin-support-list">
            {support.map((item) => {
              const student = studentById[item.student_id];
              return (
                <article key={item.id}>
                  <div className="admin-support-copy">
                    <div><span>{item.category}</span><strong>{student?.name || "Student"}</strong><small>{formatDateTime(item.created_at)}</small></div>
                    <p>{item.message}</p>
                    {student && <Link href={`/admin/students/${student.id}`}>Open student record →</Link>}
                  </div>
                  <form action={updateSupportRequest} className="admin-support-action">
                    <input type="hidden" name="requestId" value={item.id} />
                    <select name="status" defaultValue={item.status}>{portalSupportStatuses.map((status) => <option key={status} value={status}>{status.replace("_", " ")}</option>)}</select>
                    <input name="adminNote" defaultValue={item.admin_note || ""} placeholder="Internal note" />
                    <button type="submit">Save</button>
                  </form>
                </article>
              );
            })}
            {!support.length && <div className="admin-empty compact">No student support requests yet.</div>}
          </div>
        </section>

        <section className="admin-panel admin-detail-card">
          <div className="admin-card-head"><div><h2>Homework submissions</h2><span>{submissions.length} recent</span></div></div>
          <div className="admin-submission-list">
            {submissions.map((item) => {
              const student = studentById[item.student_id];
              const href = safeUrl(item.submission_url);
              return (
                <article key={item.id}>
                  <div><span>{formatDateTime(item.submitted_at)}</span><strong>{student?.name || "Student"}</strong>{item.homework?.title && <small>{item.homework.title}</small>}{item.note && <p>{item.note}</p>}</div>
                  <div className="admin-submission-actions">{href && <a href={href} target="_blank" rel="noopener noreferrer">Open work ↗</a>}{student && <Link href={`/admin/students/${student.id}`}>Student →</Link>}</div>
                </article>
              );
            })}
            {!submissions.length && <div className="admin-empty compact">No homework has been submitted through a portal yet.</div>}
          </div>
        </section>
      </div>
    </div>
  );
}
