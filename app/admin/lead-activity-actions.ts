"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

const contactChannels = ["email", "whatsapp", "phone", "video", "other"] as const;
type ContactChannel = (typeof contactChannels)[number];

const contactLabels: Record<ContactChannel, string> = {
  email: "Email",
  whatsapp: "WhatsApp",
  phone: "Phone call",
  video: "Video call",
  other: "Other contact",
};

async function adminContext() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  return { session, supabase: createAdminClient() };
}

function text(formData: FormData, key: string, max = 5000) {
  return String(formData.get(key) || "").trim().slice(0, max);
}

export async function logLeadContact(formData: FormData) {
  const { session, supabase } = await adminContext();
  const leadId = text(formData, "leadId", 100);
  const channel = text(formData, "channel", 40) as ContactChannel;
  const note = text(formData, "note", 3000);
  if (!leadId || !contactChannels.includes(channel)) return;

  const { data: lead, error: leadError } = await supabase
    .from("tutoring_leads")
    .select("status")
    .eq("id", leadId)
    .single();
  if (leadError || !lead) throw new Error(leadError?.message || "Lead not found.");

  const now = new Date().toISOString();
  const update: Record<string, string> = {
    last_contacted_at: now,
    updated_at: now,
  };
  if (lead.status === "new") update.status = "contacted";

  const { error: updateError } = await supabase.from("tutoring_leads").update(update).eq("id", leadId);
  if (updateError) throw new Error(updateError.message);

  const summary = note ? `${contactLabels[channel]} — ${note}` : contactLabels[channel];
  const { error: activityError } = await supabase.from("lead_activity").insert({
    lead_id: leadId,
    event_type: "contact_logged",
    note: summary,
    created_by: session.user.id,
    created_by_email: session.user.email || null,
  });
  if (activityError) throw new Error(activityError.message);

  revalidatePath("/admin");
  revalidatePath(`/admin/leads/${leadId}`);
  revalidatePath("/admin/analytics");
}
