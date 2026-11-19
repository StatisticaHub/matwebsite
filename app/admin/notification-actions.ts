"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getAdminSession } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { runNotificationEngine } from "@/lib/notification-engine";

async function requireAdmin() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  return session;
}

export async function updateNotificationSettings(formData: FormData) {
  await requireAdmin();
  const supabase = createAdminClient();
  const enabled = (name: string) => formData.get(name) === "on";
  const { error } = await supabase.from("notification_settings").update({
    updated_at: new Date().toISOString(),
    automation_enabled: enabled("automation_enabled"),
    session_24h_enabled: enabled("session_24h_enabled"),
    session_same_day_enabled: enabled("session_same_day_enabled"),
    trial_24h_enabled: enabled("trial_24h_enabled"),
    overdue_homework_enabled: enabled("overdue_homework_enabled"),
    tutor_missing_notes_enabled: enabled("tutor_missing_notes_enabled"),
    overdue_followups_enabled: enabled("overdue_followups_enabled"),
    monthly_progress_enabled: enabled("monthly_progress_enabled"),
  }).eq("id", 1);
  if (error) redirect(`/admin/notifications?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/admin/notifications");
  redirect("/admin/notifications?saved=1");
}

export async function runNotificationsNow() {
  await requireAdmin();
  try {
    const summary = await runNotificationEngine("manual");
    revalidatePath("/admin/notifications");
    redirect(`/admin/notifications?run=1&sent=${summary.sent}&failed=${summary.failed}&skipped=${summary.skipped}`);
  } catch (error) {
    redirect(`/admin/notifications?error=${encodeURIComponent(error instanceof Error ? error.message : "Reminder engine failed")}`);
  }
}
