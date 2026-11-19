"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";

function text(formData: FormData, key: string, max = 4000) {
  return String(formData.get(key) || "").trim().slice(0, max);
}

export async function submitStudentFeedback(formData: FormData) {
  const token = text(formData, "token", 100);
  const displayName = text(formData, "displayName", 120);
  const displayContext = text(formData, "displayContext", 180) || null;
  const reviewText = text(formData, "reviewText", 4000);
  const rating = Number(text(formData, "rating", 10));
  const consent = formData.get("consentToPublish") === "on";

  if (!token) redirect("/testimonials");
  const back = `/feedback/${encodeURIComponent(token)}`;
  if (!displayName || displayName.length < 2) redirect(`${back}?error=${encodeURIComponent("Please add the name you want us to use with your feedback.")}`);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) redirect(`${back}?error=${encodeURIComponent("Please choose a rating from 1 to 5.")}`);
  if (reviewText.length < 20) redirect(`${back}?error=${encodeURIComponent("Please write at least a short sentence about your tutoring experience.")}`);

  const supabase = createAdminClient();
  const { data: request, error } = await supabase
    .from("testimonials")
    .select("id,status,request_expires_at")
    .eq("request_token", token)
    .single();
  if (error || !request) redirect(`${back}?invalid=1`);
  if (request.status !== "requested") redirect(`${back}?submitted=1`);
  if (new Date(request.request_expires_at).getTime() < Date.now()) redirect(`${back}?expired=1`);

  const { error: updateError } = await supabase.from("testimonials").update({
    status: "submitted",
    submitted_at: new Date().toISOString(),
    rating,
    review_text: reviewText,
    display_name: displayName,
    display_context: displayContext,
    consent_to_publish: consent,
    featured: false,
    updated_at: new Date().toISOString(),
  }).eq("id", request.id).eq("status", "requested");

  if (updateError) redirect(`${back}?error=${encodeURIComponent("We could not save your feedback. Please try again.")}`);
  revalidatePath("/admin/testimonials");
  redirect(`${back}?submitted=1`);
}
