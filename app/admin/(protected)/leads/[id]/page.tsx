import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { leadStatusLabels, leadStatuses, type LeadActivity, type LeadStatus, type Tutor, type TutoringLead } from "@/lib/admin-data";
import { saveLeadNotes, updateLeadAssignment, updateLeadStatus } from "@/app/admin/actions";
import { convertLeadToStudent } from "@/app/admin/delivery-actions";

export const dynamic = "force-dynamic";

type Params = Promise<{ id: string }>;

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function value(value: string | null | undefined) {
  return value || "Not provided";
}

export default async function LeadDetailPage({ params }: { params: Params }) {
  const { id } = await params;
  const supabase = createAdminClient();

  const [{ data: leadData, error }, { data: tutorsData }, { data: activityData }, { data: studentData }] = await Promise.all([
    supabase.from("tutoring_leads").select("*").eq("id", id).single(),
    supabase.from("tutors").select("*").eq("status", "active").order("name"),
    supabase.from("lead_activity").select("id,created_at,event_type,note,created_by_email").eq("lead_id", id).order("created_at", { ascending: false }),
    supabase.from("students").select("id").eq("source_lead_id", id).maybeSingle(),
  ]);

  if (error || !leadData) notFound();
  const lead = leadData as TutoringLead;
  const tutors = (tutorsData || []) as Tutor[];
  const activity = (activityData || []) as LeadActivity[];
  const assignedTutor = tutors.find((tutor) => tutor.id === lead.assigned_tutor_id);

  return (
    <div className="admin-page">
      <div className="admin-breadcrumb"><Link href="/admin">← Lead inbox</Link><span>{lead.reference}</span></div>
      <header className="admin-page-head admin-lead-head">
        <div>
          <span className="admin-eyebrow">{lead.subject} · {lead.level}</span>
          <h1>{lead.name}</h1>
          <p>{lead.email}{lead.phone ? ` · ${lead.phone}` : ""}</p>
        </div>
        <span className={`admin-status status-${lead.status}`}>{leadStatusLabels[lead.status]}</span>
      </header>

      <div className="admin-detail-grid">
        <div className="admin-detail-main">
          <section className="admin-panel admin-detail-card">
            <div className="admin-card-head"><h2>Student requirement</h2><span>{formatDate(lead.created_at)}</span></div>
            <p className="admin-requirement">{lead.requirements}</p>
            <dl className="admin-details-list">
              <div><dt>Country</dt><dd>{lead.country}</dd></div>
              <div><dt>Academic level</dt><dd>{lead.level}</dd></div>
              <div><dt>Subject</dt><dd>{lead.subject}</dd></div>
              <div><dt>Topic</dt><dd>{value(lead.topic)}</dd></div>
              <div><dt>Curriculum / university</dt><dd>{value(lead.curriculum)}</dd></div>
              <div><dt>Support type</dt><dd>{lead.support_type}</dd></div>
              <div><dt>Urgency</dt><dd>{value(lead.urgency)}</dd></div>
              <div><dt>Availability</dt><dd>{value(lead.availability)}</dd></div>
            </dl>
          </section>

          <section className="admin-panel admin-detail-card">
            <div className="admin-card-head"><h2>Activity</h2><span>{activity.length} events</span></div>
            <form action={saveLeadNotes} className="admin-note-form">
              <input type="hidden" name="leadId" value={lead.id} />
              <textarea name="note" required placeholder="Add a private note about the student, follow-up or matching decision…" />
              <button type="submit" className="admin-primary-button">Add note</button>
            </form>
            <div className="admin-activity-list">
              {activity.map((item) => (
                <article key={item.id}>
                  <div><strong>{item.event_type.replaceAll("_", " ")}</strong><span>{formatDate(item.created_at)}</span></div>
                  {item.note && <p>{item.note}</p>}
                  {item.created_by_email && <small>{item.created_by_email}</small>}
                </article>
              ))}
              {!activity.length && <div className="admin-empty">No activity yet.</div>}
            </div>
          </section>
        </div>

        <aside className="admin-detail-side">
          <section className="admin-panel admin-action-card">
            <h2>Lead status</h2>
            <form action={updateLeadStatus}>
              <input type="hidden" name="leadId" value={lead.id} />
              <select name="status" defaultValue={lead.status}>
                {leadStatuses.map((status) => <option key={status} value={status}>{leadStatusLabels[status]}</option>)}
              </select>
              <button type="submit" className="admin-primary-button">Update status</button>
            </form>
          </section>

          <section className="admin-panel admin-action-card">
            <h2>Tutor match</h2>
            <form action={updateLeadAssignment}>
              <input type="hidden" name="leadId" value={lead.id} />
              <label><span>Tutor</span><select name="tutorId" defaultValue={lead.assigned_tutor_id || ""}><option value="">Not assigned</option>{tutors.map((tutor) => <option key={tutor.id} value={tutor.id}>{tutor.name} — {tutor.subjects.slice(0,2).join(", ") || "General"}</option>)}</select></label>
              <label><span>Quoted hourly rate</span><div className="admin-rate-row"><select name="currency" defaultValue={lead.currency || "GBP"}><option>GBP</option><option>USD</option><option>EUR</option><option>INR</option></select><input name="quotedRate" type="number" min="0" step="0.01" defaultValue={lead.quoted_rate ?? ""} placeholder="45" /></div></label>
              <button type="submit" className="admin-primary-button">Save match</button>
            </form>
            {assignedTutor && <p className="admin-help">Currently assigned to <strong>{assignedTutor.name}</strong>.</p>}
          </section>


          <section className="admin-panel admin-action-card admin-convert-card">
            <h2>Tutoring delivery</h2>
            {studentData?.id ? (
              <>
                <p className="admin-help">This lead already has an active student record.</p>
                <Link className="admin-contact-button" href={`/admin/students/${studentData.id}`}>Open student record →</Link>
              </>
            ) : (
              <>
                <p className="admin-help">Once tutoring is agreed, create the operational student record and learning engagement from this lead.</p>
                <details className="admin-disclosure compact-disclosure">
                  <summary>Create student record</summary>
                  <form action={convertLeadToStudent} className="admin-compact-form">
                    <input type="hidden" name="leadId" value={lead.id} />
                    <label><span>Institution</span><input name="institution" defaultValue={lead.curriculum || ""} placeholder="University / school" /></label>
                    <label><span>Programme</span><input name="programme" placeholder="MSc Data Science" /></label>
                    <label><span>Module</span><input name="module" defaultValue={lead.topic || ""} /></label>
                    <label><span>Learning goal</span><textarea name="goal" defaultValue={lead.requirements} /></label>
                    <label><span>Target</span><input name="target" placeholder="Exam preparation / target grade / project milestone" /></label>
                    <label><span>Weak topics</span><input name="weakTopics" placeholder="Regression inference, ANOVA, R coding" /></label>
                    <div className="admin-form-grid-2"><label><span>Current confidence (1–5)</span><input name="confidence" type="number" min="1" max="5" /></label><label><span>Upcoming exam / deadline</span><input name="upcomingDeadline" type="date" /></label></div>
                    <label><span>Preferred learning style</span><input name="learningStyle" placeholder="Slow derivations, worked examples, exam practice…" /></label>
                    <label><span>Academic assessment note</span><textarea name="assessmentSummary" placeholder="Initial assessment of gaps, strengths and recommended approach" /></label>
                    <div className="admin-form-grid-2"><label><span>Frequency</span><input name="frequency" placeholder="Weekly" /></label><label><span>Session minutes</span><input name="sessionDuration" type="number" min="15" max="480" defaultValue="60" /></label></div>
                    <label><span>Start date</span><input name="startDate" type="date" /></label>
                    <button className="admin-primary-button" type="submit">Create student + engagement</button>
                  </form>
                </details>
              </>
            )}
          </section>

          <section className="admin-panel admin-action-card">
            <h2>Contact student</h2>
            <a className="admin-contact-button" href={`mailto:${lead.email}?subject=${encodeURIComponent(`My Academic Tutor — ${lead.reference}`)}`}>Email {lead.name.split(" ")[0]}</a>
            {lead.phone && <a className="admin-contact-button secondary" href={`https://wa.me/${lead.phone.replace(/\D/g, "")}`} target="_blank" rel="noreferrer">Open WhatsApp ↗</a>}
            <p className="admin-help">Last contacted: {lead.last_contacted_at ? formatDate(lead.last_contacted_at) : "Not recorded"}</p>
          </section>

          <section className="admin-panel admin-action-card admin-source-card">
            <h2>Acquisition</h2>
            <dl><div><dt>Source</dt><dd>{value(lead.utm_source || lead.source)}</dd></div><div><dt>Campaign</dt><dd>{value(lead.utm_campaign)}</dd></div><div><dt>Landing page</dt><dd className="break-word">{value(lead.landing_page)}</dd></div><div><dt>Referrer</dt><dd className="break-word">{value(lead.referrer)}</dd></div></dl>
          </section>
        </aside>
      </div>
    </div>
  );
}
