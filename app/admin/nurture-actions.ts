"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getAdminSession } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { runLeadNurtureEngine } from "@/lib/lead-nurture-engine";

async function requireAdmin() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  return session;
}

export async function updateNurtureSettings(formData: FormData) {
  await requireAdmin();
  const enabled = (name: string) => formData.get(name) === "on";
  const supabase = createAdminClient();
  const { error } = await supabase.from("lead_nurture_settings").update({
    updated_at: new Date().toISOString(),
    automation_enabled: enabled("automation_enabled"),
    service_checkin_enabled: enabled("service_checkin_enabled"),
    educational_day3_enabled: enabled("educational_day3_enabled"),
    educational_day7_enabled: enabled("educational_day7_enabled"),
    final_day14_enabled: enabled("final_day14_enabled"),
  }).eq("id", 1);
  if (error) redirect(`/admin/nurture?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/admin/nurture");
  redirect("/admin/nurture?saved=1");
}

export async function runNurtureNow() {
  await requireAdmin();
  try {
    const summary = await runLeadNurtureEngine("manual");
    revalidatePath("/admin/nurture");
    redirect(`/admin/nurture?run=1&sent=${summary.sent}&failed=${summary.failed}&skipped=${summary.skipped}&checked=${summary.checked}`);
  } catch (error) {
    redirect(`/admin/nurture?error=${encodeURIComponent(error instanceof Error ? error.message : "Nurture engine failed")}`);
  }
}

export async function toggleLeadNurture(formData: FormData) {
  await requireAdmin();
  const leadId = String(formData.get("lead_id") || "");
  const paused = formData.get("paused") === "true";
  if (!leadId) redirect("/admin/nurture?error=Missing%20lead");
  const supabase = createAdminClient();
  const { error } = await supabase.from("tutoring_leads").update({ nurture_paused: paused }).eq("id", leadId);
  if (error) redirect(`/admin/nurture?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/admin/nurture");
  redirect("/admin/nurture?lead_saved=1");
}
