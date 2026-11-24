"use server";

import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";

const REFERENCE_LINK_VALID_DAYS = 30;

function referenceLinkExpired(requestSentAt: string) {
  const sentAt = new Date(requestSentAt).getTime();

  if (!Number.isFinite(sentAt)) {
    return true;
  }

  return (
    Date.now() - sentAt >
    REFERENCE_LINK_VALID_DAYS * 24 * 60 * 60 * 1000
  );
}

function text(formData: FormData, key: string, max = 5000) {
  return String(formData.get(key) || "")
    .trim()
    .slice(0, max);
}

function rating(formData: FormData, key: string) {
  const value = Number(text(formData, key, 10));

  if (!Number.isInteger(value) || value < 1 || value > 5) {
    return null;
  }

  return value;
}

export async function submitTutorReference(
  formData: FormData,
) {
  const token = text(formData, "token", 100);

  if (!/^[0-9a-f-]{36}$/i.test(token)) {
    redirect("/tutor-reference/invalid");
  }

  const howLongKnown = text(
    formData,
    "howLongKnown",
    500,
  );

  const relationshipContext = text(
    formData,
    "relationshipContext",
    3000,
  );

  const reliability = rating(
    formData,
    "reliabilityRating",
  );

  const communication = rating(
    formData,
    "communicationRating",
  );

  const competence = rating(
    formData,
    "subjectCompetenceRating",
  );

  const professionalism = rating(
    formData,
    "professionalismRating",
  );

  const recommendation =
    text(formData, "wouldRecommend", 20);

  const declaration =
    text(formData, "declaration", 20) === "yes";

  if (
    !howLongKnown ||
    !relationshipContext ||
    reliability === null ||
    communication === null ||
    competence === null ||
    professionalism === null ||
    !["yes", "no"].includes(recommendation) ||
    !declaration
  ) {
    redirect(
      `/tutor-reference/${token}?error=incomplete`,
    );
  }

  const supabase = createAdminClient();

  const { data: reference, error: referenceError } =
    await supabase
      .from("tutor_application_references")
      .select("id,status,request_sent_at")
      .eq("request_token", token)
      .maybeSingle();

  if (
    referenceError ||
    !reference ||
    !reference.request_sent_at
  ) {
    redirect("/tutor-reference/invalid");
  }

  if (
    reference.status === "responded" ||
    reference.status === "verified"
  ) {
    redirect(
      `/tutor-reference/${token}?submitted=1`,
    );
  }

  if (referenceLinkExpired(reference.request_sent_at)) {
    redirect(
      `/tutor-reference/${token}?expired=1`,
    );
  }

  const now = new Date().toISOString();

  const { error } = await supabase
    .from("tutor_application_references")
    .update({
      status: "responded",
      responded_at: now,
      how_long_known: howLongKnown,
      relationship_context: relationshipContext,
      reliability_rating: reliability,
      communication_rating: communication,
      subject_competence_rating: competence,
      professionalism_rating: professionalism,
      would_recommend: recommendation === "yes",
      concerns:
        text(formData, "concerns", 3000) || null,
      referee_comments:
        text(formData, "comments", 5000) || null,
      declaration_confirmed: true,
      updated_at: now,
    })
    .eq("id", reference.id);

  if (error) {
    throw new Error(error.message);
  }

  redirect(
    `/tutor-reference/${token}?submitted=1`,
  );
}
