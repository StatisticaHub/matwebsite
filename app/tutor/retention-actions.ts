"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getTutorSession } from "@/lib/tutor-auth";
import { createAdminClient } from "@/lib/supabase/admin";

function text(formData: FormData, key: string, max = 5000) {
  return String(formData.get(key) || "").trim().slice(0, max);
}

async function tutorContext() {
  const session = await getTutorSession();
  if (!session) redirect("/tutor/login?unauthorized=1");
  return { session, supabase: createAdminClient() };
}

export async function reviewTutorRetentionCase(formData: FormData) {
  const { session, supabase } = await tutorContext();
  const caseId = text(formData, "caseId", 100);
  if (!caseId) return;
  const { data: row, error: rowError } = await supabase.from("retention_cases").select("id,tutor_id").eq("id", caseId).single();
  if (rowError || !row) throw new Error(rowError?.message || "Retention case not found.");
  if (row.tutor_id !== session.tutor.id) throw new Error("You do not have access to this retention case.");

  const { error } = await supabase.from("retention_cases").update({
    tutor_note: text(formData, "tutorNote", 5000) || null,
    tutor_reviewed_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }).eq("id", caseId);
  if (error) throw new Error(error.message);
  revalidatePath("/tutor/retention");
}

export async function logTutorRetentionOutreach(formData: FormData) {
  const { session, supabase } = await tutorContext();
  const caseId = text(formData, "caseId", 100);
  const engagementId = text(formData, "engagementId", 100);
  const studentId = text(formData, "studentId", 100);
  const channel = text(formData, "channel", 30);
  const outcome = text(formData, "outcome", 30);
  if (!caseId || !engagementId || !studentId) return;
  if (!["email", "phone", "whatsapp", "portal", "other"].includes(channel)) return;
  if (!["contacted", "rebooked", "paused", "completed", "no_response", "declined", "other"].includes(outcome)) return;

  const { data: row, error: rowError } = await supabase.from("retention_cases").select("id,tutor_id").eq("id", caseId).single();
  if (rowError || !row) throw new Error(rowError?.message || "Retention case not found.");
  if (row.tutor_id !== session.tutor.id) throw new Error("You do not have access to this retention case.");

  const now = new Date().toISOString();
  const { error: logError } = await supabase.from("retention_outreach_log").insert({
    engagement_id: engagementId,
    student_id: studentId,
    tutor_id: session.tutor.id,
    channel,
    outcome,
    note: text(formData, "note", 5000) || null,
    actor_kind: "tutor",
    actor_email: session.user.email || null,
  });
  if (logError) throw new Error(logError.message);

  const update: Record<string, unknown> = { last_outreach_at: now, last_outcome: outcome, tutor_reviewed_at: now, updated_at: now };
  if (outcome === "rebooked") update.status = "monitoring";
  const { error: caseError } = await supabase.from("retention_cases").update(update).eq("id", caseId);
  if (caseError) throw new Error(caseError.message);
  revalidatePath("/tutor/retention");
}
