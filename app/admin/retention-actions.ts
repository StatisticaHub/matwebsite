"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { runRetentionEngine } from "@/lib/retention-engine";

function text(formData: FormData, key: string, max = 5000) {
  return String(formData.get(key) || "").trim().slice(0, max);
}

async function adminContext() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  return { session, supabase: createAdminClient() };
}

export async function runRetentionScan() {
  await adminContext();
  const summary = await runRetentionEngine("manual");
  revalidatePath("/admin/retention");
  redirect(`/admin/retention?scan=1&scanned=${summary.scanned}&high=${summary.highAttention}`);
}

export async function updateRetentionSettings(formData: FormData) {
  const { supabase } = await adminContext();
  const number = (key: string, min: number, max: number) => {
    const raw = Number(text(formData, key, 20));
    return Number.isFinite(raw) ? Math.max(min, Math.min(max, Math.round(raw))) : min;
  };
  const payload = {
    automation_enabled: formData.get("automationEnabled") === "on",
    scan_interval_hours: number("scanIntervalHours", 1, 168),
    inactivity_days: number("inactivityDays", 7, 180),
    high_attention_days: number("highAttentionDays", 14, 365),
    disruption_threshold: number("disruptionThreshold", 1, 10),
    plan_completion_threshold: number("planCompletionThreshold", 50, 100),
    end_date_window_days: number("endDateWindowDays", 1, 90),
    updated_at: new Date().toISOString(),
  };
  const { error } = await supabase.from("retention_settings").update(payload).eq("id", 1);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/retention");
  redirect("/admin/retention?saved=1");
}

export async function updateRetentionCase(formData: FormData) {
  const { supabase } = await adminContext();
  const caseId = text(formData, "caseId", 100);
  const status = text(formData, "status", 30);
  const snoozedUntil = text(formData, "snoozedUntil", 20) || null;
  if (!caseId || !["open", "monitoring", "snoozed", "resolved", "dismissed"].includes(status)) return;

  const { error } = await supabase.from("retention_cases").update({
    status,
    snoozed_until: status === "snoozed" ? snoozedUntil : null,
    admin_note: text(formData, "adminNote", 5000) || null,
    resolved_at: status === "resolved" ? new Date().toISOString() : null,
    updated_at: new Date().toISOString(),
  }).eq("id", caseId);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/retention");
}

export async function logRetentionOutreach(formData: FormData) {
  const { session, supabase } = await adminContext();
  const caseId = text(formData, "caseId", 100);
  const engagementId = text(formData, "engagementId", 100);
  const studentId = text(formData, "studentId", 100);
  const tutorId = text(formData, "tutorId", 100) || null;
  const channel = text(formData, "channel", 30);
  const outcome = text(formData, "outcome", 30);
  if (!caseId || !engagementId || !studentId) return;
  if (!["email", "phone", "whatsapp", "portal", "other"].includes(channel)) return;
  if (!["contacted", "rebooked", "paused", "completed", "no_response", "declined", "other"].includes(outcome)) return;

  const now = new Date().toISOString();
  const { error: logError } = await supabase.from("retention_outreach_log").insert({
    engagement_id: engagementId,
    student_id: studentId,
    tutor_id: tutorId,
    channel,
    outcome,
    note: text(formData, "note", 5000) || null,
    actor_kind: "admin",
    actor_email: session.user.email || null,
  });
  if (logError) throw new Error(logError.message);

  const caseUpdate: Record<string, unknown> = {
    last_outreach_at: now,
    last_outcome: outcome,
    updated_at: now,
  };
  if (outcome === "rebooked") caseUpdate.status = "monitoring";
  if (outcome === "paused" || outcome === "completed" || outcome === "declined") {
    caseUpdate.status = "resolved";
    caseUpdate.resolved_at = now;
  }
  const { error: caseError } = await supabase.from("retention_cases").update(caseUpdate).eq("id", caseId);
  if (caseError) throw new Error(caseError.message);

  revalidatePath("/admin/retention");
}
