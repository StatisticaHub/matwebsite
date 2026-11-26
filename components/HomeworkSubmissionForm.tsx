"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type ExistingSubmission = { note: string | null; submission_url: string | null } | null;

export default function HomeworkSubmissionForm({
  token,
  homeworkId,
  existing,
}: {
  token: string;
  homeworkId: string;
  existing: ExistingSubmission;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState(existing?.note || "");
  const [url, setUrl] = useState(existing?.submission_url || "");
  const [status, setStatus] = useState<"idle" | "sending" | "saved" | "error">("idle");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "sending") return;
    setStatus("sending");
    try {
      const response = await fetch(
        `/api/portal/${encodeURIComponent(token)}/homework/${encodeURIComponent(homeworkId)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ note, submissionUrl: url }),
        },
      );
      if (!response.ok) throw new Error("Request failed");
      setStatus("saved");
      setOpen(false);
      router.refresh();
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="portal-homework-submit">
      <button className="portal-text-button" type="button" onClick={() => setOpen((value) => !value)}>
        {existing || status === "saved" ? "Update submission" : "Submit / mark done"}
      </button>
      {open && (
        <form onSubmit={submit} className="portal-mini-form">
          <label>
            <span>Note for your tutor</span>
            <textarea value={note} maxLength={3000} onChange={(event) => setNote(event.target.value)} placeholder="What did you complete? Anything you found difficult?" />
          </label>
          <label>
            <span>Optional link</span>
            <input value={url} maxLength={2000} onChange={(event) => setUrl(event.target.value)} placeholder="https://…" inputMode="url" />
          </label>
          <button className="button button-primary" disabled={status === "sending"} type="submit">
            {status === "sending" ? "Saving…" : "Save submission"}
          </button>
        </form>
      )}
      {status === "saved" && !open && <small className="portal-saved-note">Submission saved.</small>}
      {status === "error" && <small className="portal-form-error" role="alert">Could not save. Please check the link and try again.</small>}
    </div>
  );
}
