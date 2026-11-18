"use client";

import { useMemo, useState } from "react";

type StudentRow = { id: string; name: string; email: string; status: string };
type LinkRow = {
  id: string;
  student_id: string;
  token_preview: string;
  expires_at: string | null;
  created_at: string;
  last_accessed_at: string | null;
};
type EmailResult = { ok: boolean; id?: string; skipped?: boolean; error?: string } | null;
type GeneratedPayload = {
  intakeUrl: string;
  emailSubject: string;
  emailBody: string;
  email: EmailResult;
  link: LinkRow;
  error?: string;
};

function formatDate(value: string | null) {
  if (!value) return "Never";
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export default function IntakeAccessManager({ students, links, focusStudentId }: { students: StudentRow[]; links: LinkRow[]; focusStudentId?: string }) {
  const [linkRows, setLinkRows] = useState(links);
  const [generated, setGenerated] = useState<Record<string, GeneratedPayload>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const activeByStudent = useMemo(() => Object.fromEntries(linkRows.map((link) => [link.student_id, link])), [linkRows]);

  async function createLink(studentId: string, expiryDays: number, sendEmail: boolean) {
    setBusy(studentId);
    setMessage(null);
    try {
      const response = await fetch("/api/admin/student-intake-links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId, expiryDays, sendEmail }),
      });
      const payload = (await response.json()) as GeneratedPayload;
      if (!response.ok || !payload.intakeUrl) throw new Error(payload.error || "Could not create intake link.");
      setLinkRows((current) => [payload.link, ...current.filter((item) => item.student_id !== studentId)]);
      setGenerated((current) => ({ ...current, [studentId]: payload }));
      if (sendEmail) {
        setMessage(payload.email?.ok
          ? "New intake link created and emailed to the student."
          : `Link created, but the email was not sent${payload.email?.error ? `: ${payload.email.error}` : "."}`);
      } else {
        setMessage("New intake link created. Any previous active intake link for this student has been revoked.");
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not create intake link.");
    } finally {
      setBusy(null);
    }
  }

  async function revokeLink(studentId: string, linkId: string) {
    setBusy(studentId);
    setMessage(null);
    try {
      const response = await fetch("/api/admin/student-intake-links", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ linkId }),
      });
      if (!response.ok) throw new Error("Could not revoke intake link.");
      setLinkRows((current) => current.filter((item) => item.id !== linkId));
      setGenerated((current) => {
        const next = { ...current };
        delete next[studentId];
        return next;
      });
      setMessage("Intake link revoked.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not revoke intake link.");
    } finally {
      setBusy(null);
    }
  }

  async function copy(value: string, label: string) {
    await navigator.clipboard.writeText(value);
    setMessage(`${label} copied.`);
  }

  const ordered = [...students].sort((a, b) => {
    if (a.id === focusStudentId) return -1;
    if (b.id === focusStudentId) return 1;
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="admin-intake-manager">
      {message && <div className="admin-portal-message">{message}</div>}
      {ordered.map((student) => {
        const link = activeByStudent[student.id];
        const draft = generated[student.id];
        return (
          <article key={student.id} className={student.id === focusStudentId ? "is-focus" : ""}>
            <div className="admin-portal-student"><strong>{student.name}</strong><span>{student.email}</span><small>{student.status}</small></div>
            <div className="admin-portal-state">
              {link ? <><strong>Active · {link.token_preview}</strong><span>Expires: {link.expires_at ? formatDate(link.expires_at) : "No expiry"}</span><small>Last opened: {formatDate(link.last_accessed_at)}</small></> : <><strong>No active intake link</strong><span>Create one when the student is ready to complete onboarding.</span></>}
            </div>
            <div className="admin-portal-actions">
              <select id={`intake-expiry-${student.id}`} defaultValue="14" aria-label={`Intake expiry for ${student.name}`}>
                <option value="7">7 days</option><option value="14">14 days</option><option value="30">30 days</option><option value="60">60 days</option>
              </select>
              <button type="button" className="admin-secondary-button" disabled={busy === student.id} onClick={() => {
                const select = document.getElementById(`intake-expiry-${student.id}`) as HTMLSelectElement | null;
                createLink(student.id, Number(select?.value || 14), false);
              }}>{busy === student.id ? "Working…" : link ? "Replace link" : "Create link"}</button>
              <button type="button" className="admin-primary-button" disabled={busy === student.id} onClick={() => {
                const select = document.getElementById(`intake-expiry-${student.id}`) as HTMLSelectElement | null;
                createLink(student.id, Number(select?.value || 14), true);
              }}>{busy === student.id ? "Working…" : link ? "Replace & email" : "Create & email"}</button>
              {link && <button type="button" className="admin-secondary-button" disabled={busy === student.id} onClick={() => revokeLink(student.id, link.id)}>Revoke</button>}
            </div>
            {draft && (
              <div className="admin-intake-generated">
                <div className="admin-intake-link-row"><input readOnly value={draft.intakeUrl} /><button type="button" onClick={() => copy(draft.intakeUrl, "Intake link")}>Copy link</button></div>
                <div className="admin-email-draft">
                  <div><span>Email subject</span><strong>{draft.emailSubject}</strong></div>
                  <pre>{draft.emailBody}</pre>
                  <div className="admin-email-draft-actions">
                    <button type="button" onClick={() => copy(`${draft.emailSubject}\n\n${draft.emailBody}`, "Email draft")}>Copy email</button>
                    <a href={`mailto:${encodeURIComponent(student.email)}?subject=${encodeURIComponent(draft.emailSubject)}&body=${encodeURIComponent(draft.emailBody)}`}>Open in email app ↗</a>
                  </div>
                </div>
              </div>
            )}
          </article>
        );
      })}
      {!students.length && <div className="admin-empty">No student records yet.</div>}
    </div>
  );
}
