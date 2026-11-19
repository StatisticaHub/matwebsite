"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendTutorPortalAccessEmail } from "@/lib/email/tutor";

function text(formData: FormData, key: string, max = 500) {
  return String(formData.get(key) || "").trim().slice(0, max);
}

async function adminContext() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  return { session, supabase: createAdminClient() };
}

async function findAuthUserByEmail(supabase: ReturnType<typeof createAdminClient>, email: string) {
  for (let page = 1; page <= 5; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const found = data.users.find((user) => user.email?.toLowerCase() === email.toLowerCase());
    if (found) return found;
    if (data.users.length < 200) break;
  }
  return null;
}

export async function sendTutorPortalInvite(formData: FormData) {
  const { supabase } = await adminContext();
  const tutorId = text(formData, "tutorId", 100);
  if (!tutorId) return;

  const { data: tutor, error: tutorError } = await supabase.from("tutors").select("id,name,email,auth_user_id").eq("id", tutorId).single();
  if (tutorError || !tutor) throw new Error(tutorError?.message || "Tutor not found.");

  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.myacademictutor.com").replace(/\/$/, "");
  const redirectTo = `${siteUrl}/tutor/welcome`;
  let userId = tutor.auth_user_id as string | null;
  let actionUrl = "";
  let isRecovery = Boolean(userId);

  if (!userId) {
    const invite = await supabase.auth.admin.generateLink({
      type: "invite",
      email: tutor.email,
      options: { redirectTo, data: { full_name: tutor.name } },
    });

    if (!invite.error && invite.data?.user?.id && invite.data.properties?.action_link) {
      userId = invite.data.user.id;
      actionUrl = invite.data.properties.action_link;
      isRecovery = false;
    } else {
      const existing = await findAuthUserByEmail(supabase, tutor.email);
      if (!existing) throw new Error(invite.error?.message || "Could not create tutor portal account.");
      userId = existing.id;
      const recovery = await supabase.auth.admin.generateLink({ type: "recovery", email: tutor.email, options: { redirectTo } });
      if (recovery.error || !recovery.data.properties?.action_link) throw new Error(recovery.error?.message || "Could not generate access link.");
      actionUrl = recovery.data.properties.action_link;
      isRecovery = true;
    }
  } else {
    const recovery = await supabase.auth.admin.generateLink({ type: "recovery", email: tutor.email, options: { redirectTo } });
    if (recovery.error || !recovery.data.properties?.action_link) throw new Error(recovery.error?.message || "Could not generate reset link.");
    actionUrl = recovery.data.properties.action_link;
  }

  const { error: updateError } = await supabase.from("tutors").update({
    auth_user_id: userId,
    portal_enabled: true,
    portal_invited_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }).eq("id", tutorId);
  if (updateError) throw new Error(updateError.message);

  const emailResult = await sendTutorPortalAccessEmail({ name: tutor.name, email: tutor.email, actionUrl, isRecovery });
  if (!emailResult.ok) throw new Error(emailResult.error || "Tutor access email could not be sent.");

  revalidatePath(`/admin/tutors/${tutorId}`);
  redirect(`/admin/tutors/${tutorId}?portal=sent`);
}

export async function disableTutorPortal(formData: FormData) {
  const { supabase } = await adminContext();
  const tutorId = text(formData, "tutorId", 100);
  if (!tutorId) return;
  const { error } = await supabase.from("tutors").update({ portal_enabled: false, updated_at: new Date().toISOString() }).eq("id", tutorId);
  if (error) throw new Error(error.message);
  revalidatePath(`/admin/tutors/${tutorId}`);
  redirect(`/admin/tutors/${tutorId}?portal=disabled`);
}
