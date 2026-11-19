"use server";

import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";

export async function unsubscribeLeadEmails(formData: FormData) {
  const token = String(formData.get("token") || "").trim();
  if (!/^[0-9a-f-]{36}$/i.test(token)) redirect("/email-preferences/invalid");

  const supabase = createAdminClient();
  const { data, error } = await supabase.from("tutoring_leads").update({
    marketing_email_consent: false,
    marketing_email_unsubscribed_at: new Date().toISOString(),
    nurture_paused: true,
  }).eq("email_preference_token", token).select("id").maybeSingle();

  if (error || !data) redirect(`/email-preferences/${encodeURIComponent(token)}?error=1`);
  redirect(`/email-preferences/${encodeURIComponent(token)}?unsubscribed=1`);
}
