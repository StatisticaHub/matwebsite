import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { leadStatusLabels, leadStatuses, type LeadActivity, type LeadStatus, type Tutor, type TutoringLead } from "@/lib/admin-data";
import { saveLeadNotes, updateLeadAssignment, updateLeadStatus } from "@/app/admin/actions";
import { logLeadContact } from "@/app/admin/lead-activity-actions";
import { clearLeadFollowUp, scheduleLeadTrial, setLeadFollowUp, updateLeadTrialOutcome } from "@/app/admin/follow-up-actions";
import { convertLeadToStudent } from "@/app/admin/delivery-actions";

export const dynamic = "force-dynamic";

type Params = Promise<{ id: string }>;

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/London" }).format(new Date(value));
}

function toDateTimeLocalUk(value: string | null | undefined) {
  if (!value) return "";
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(value));
  const map = Object.fromEntries(parts.filter((part) => part.type !== "literal").map((part) => [part.type, part.value]));
  return `${map.year}-${map.month}-${map.day}T${map.hour}:${map.minute}`;
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
              {lead.topic && <div><dt>Topic</dt><dd>{lead.topic}</dd></div>}
              {lead.curriculum && <div><dt>Curriculum / university</dt><dd>{lead.curriculum}</dd></div>}
              <div><dt>Support type</dt><dd>{lead.support_type}</dd></div>
              {lead.urgency && <div><dt>Urgency</dt><dd>{lead.urgency}</dd></div>}
              {lead.availability && <div><dt>Availability</dt><dd>{lead.availability}</dd></div>}
            </dl>
          </section>

          <section className="admin-panel admin-detail-card">
            <div className="admin-card-head"><div><span className="admin-eyebrow">CRM history</span><h2>Activity timeline</h2></div><span>{activity.length} events</span></div>
            <details className="admin-disclosure admin-contact-log">
              <summary>Log student contact</summary>
              <form action={logLeadContact} className="admin-compact-form">
                <input type="hidden" name="leadId" value={lead.id} />
                <label><span>Channel</span><select name="channel" defaultValue="email"><option value="email">Email</option><option value="whatsapp">WhatsApp</option><option value="phone">Phone call</option><option value="video">Video call</option><option value="other">Other</option></select></label>
                <label><span>Outcome / note</span><textarea name="note" placeholder="What was discussed, what did the student decide, and what happens next?" /></label>
                <button type="submit" className="admin-primary-button">Log contact now</button>
              </form>
            </details>
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

          <section className={`admin-panel admin-action-card admin-followup-card ${lead.next_follow_up_at && new Date(lead.next_follow_up_at) < new Date() ? "is-overdue" : ""}`}>
            <div className="admin-action-card-head"><h2>Next follow-up</h2>{lead.next_follow_up_at && <span>{new Date(lead.next_follow_up_at) < new Date() ? "Overdue" : "Scheduled"}</span>}</div>
            {lead.next_follow_up_at && <div className="admin-current-action"><strong>{formatDate(lead.next_follow_up_at)}</strong>{lead.follow_up_note && <p>{lead.follow_up_note}</p>}</div>}
            <form action={setLeadFollowUp} className="admin-compact-form">
              <input type="hidden" name="leadId" value={lead.id} />
              <label><span>Date & time (UK)</span><input type="datetime-local" name="followUpAt" defaultValue={toDateTimeLocalUk(lead.next_follow_up_at)} required /></label>
              <label><span>Reminder note</span><textarea name="followUpNote" defaultValue={lead.follow_up_note || ""} placeholder="Call after they review tutor options…" /></label>
              <button type="submit" className="admin-primary-button">{lead.next_follow_up_at ? "Update follow-up" : "Schedule follow-up"}</button>
            </form>
            {lead.next_follow_up_at && <form action={clearLeadFollowUp} className="admin-inline-form"><input type="hidden" name="leadId" value={lead.id} /><button type="submit" className="admin-text-button">Clear reminder</button></form>}
          </section>

          <section className="admin-panel admin-action-card admin-trial-card">
            <div className="admin-action-card-head"><h2>Trial session</h2><span className={`trial-${lead.trial_status || "not_scheduled"}`}>{(lead.trial_status || "not_scheduled").replaceAll("_", " ")}</span></div>
            {lead.trial_scheduled_for && <div className="admin-current-action"><strong>{formatDate(lead.trial_scheduled_for)}</strong><p>{lead.trial_duration_minutes || 30} minutes{assignedTutor ? ` · ${assignedTutor.name}` : ""}</p>{lead.trial_outcome && <p><strong>Outcome:</strong> {lead.trial_outcome}</p>}</div>}
            <details className="admin-disclosure compact-disclosure" open={!lead.trial_scheduled_for}>
              <summary>{lead.trial_scheduled_for ? "Reschedule / edit trial" : "Schedule trial"}</summary>
              <form action={scheduleLeadTrial} className="admin-compact-form">
                <input type="hidden" name="leadId" value={lead.id} />
                <label><span>Date & time (UK)</span><input type="datetime-local" name="trialScheduledFor" defaultValue={toDateTimeLocalUk(lead.trial_scheduled_for)} required /></label>
                <label><span>Duration</span><select name="trialDuration" defaultValue={String(lead.trial_duration_minutes || 30)}><option value="30">30 minutes</option><option value="45">45 minutes</option><option value="60">60 minutes</option><option value="90">90 minutes</option></select></label>
                <label><span>Meeting link</span><input name="trialMeetingUrl" type="url" defaultValue={lead.trial_meeting_url || ""} placeholder="https://meet.google.com/…" /></label>
                <label><span>Internal trial note</span><textarea name="trialNotes" defaultValue={lead.trial_notes || ""} placeholder="Tutor briefing, goals for the trial, anything to prepare…" /></label>
                <label className="admin-email-toggle admin-email-toggle-block"><input type="checkbox" name="notifyStudent" defaultChecked /><span>Email the student a trial confirmation</span></label>
                <button type="submit" className="admin-primary-button">{lead.trial_scheduled_for ? "Update trial" : "Schedule trial"}</button>
              </form>
            </details>
            {lead.trial_status && lead.trial_status !== "not_scheduled" && <details className="admin-disclosure compact-disclosure admin-trial-outcome"><summary>Record trial outcome</summary><form action={updateLeadTrialOutcome} className="admin-compact-form"><input type="hidden" name="leadId" value={lead.id} /><label><span>Outcome</span><select name="trialOutcome" defaultValue="completed_proceed"><option value="completed_proceed">Completed — proceed with tutoring</option><option value="completed_follow_up">Completed — follow-up needed</option><option value="no_show">Student did not attend</option><option value="cancelled">Trial cancelled</option><option value="declined">Completed — not proceeding</option></select></label><label><span>Outcome note</span><textarea name="outcomeNotes" placeholder="How did the trial go? What was agreed?" /></label><label><span>Next follow-up (optional, UK)</span><input type="datetime-local" name="nextFollowUpAt" /></label><button type="submit" className="admin-secondary-button">Save trial outcome</button></form></details>}
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
            <dl>
              <div><dt>Source</dt><dd>{value(lead.utm_source || lead.source)}</dd></div>
              {lead.utm_campaign && <div><dt>Campaign</dt><dd>{lead.utm_campaign}</dd></div>}
              {lead.landing_page && <div><dt>Landing page</dt><dd className="break-word">{lead.landing_page}</dd></div>}
              {lead.referrer && <div><dt>Referrer</dt><dd className="break-word">{lead.referrer}</dd></div>}
            </dl>
          </section>
        </aside>
      </div>
    </div>
  );
}
