"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

const lifecycleStatuses = [
  "draft",
  "review",
  "approved",
  "published",
  "archived",
] as const;

type LifecycleStatus = (typeof lifecycleStatuses)[number];

const allowedTransitions: Record<
  LifecycleStatus,
  LifecycleStatus[]
> = {
  draft: ["review", "archived"],
  review: ["draft", "approved", "archived"],
  approved: ["review", "published", "archived"],
  published: ["approved", "archived"],
  archived: ["draft"],
};

function clean(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

async function requireAdmin() {
  const session = await getAdminSession();

  if (!session) {
    redirect("/admin/login");
  }

  return session;
}

export async function updateAcademicContentBlock(formData: FormData) {
  await requireAdmin();

  const blockId = clean(formData.get("blockId"));
  const conceptId = clean(formData.get("conceptId"));
  const title = clean(formData.get("title"));
  const body = clean(formData.get("body"));
  const reviewNotes = clean(formData.get("reviewNotes"));

  if (!blockId || !conceptId || !body) {
    redirect(
      `/admin/academic-knowledge/${conceptId}?error=${encodeURIComponent(
        "Content block, concept and body are required.",
      )}`,
    );
  }

  const supabase = createAdminClient();

  const { error } = await supabase
    .from("academic_content_blocks")
    .update({
      title: title || null,
      body,
      review_notes: reviewNotes || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", blockId)
    .eq("concept_id", conceptId);

  if (error) {
    redirect(
      `/admin/academic-knowledge/${conceptId}?error=${encodeURIComponent(
        error.message,
      )}`,
    );
  }

  revalidatePath("/admin/academic-knowledge");
  revalidatePath(`/admin/academic-knowledge/${conceptId}`);

  redirect(
    `/admin/academic-knowledge/${conceptId}?saved=1`,
  );
}

export async function transitionAcademicContentBlock(
  formData: FormData,
) {
  const session = await requireAdmin();

  const blockId = clean(formData.get("blockId"));
  const conceptId = clean(formData.get("conceptId"));
  const nextStatus = clean(
    formData.get("nextStatus"),
  ) as LifecycleStatus;

  if (
    !blockId ||
    !conceptId ||
    !lifecycleStatuses.includes(nextStatus)
  ) {
    redirect(
      `/admin/academic-knowledge/${conceptId}?error=${encodeURIComponent(
        "Invalid academic review transition.",
      )}`,
    );
  }

  const supabase = createAdminClient();

  const { data: block, error: loadError } = await supabase
    .from("academic_content_blocks")
    .select("id,lifecycle_status,review_notes")
    .eq("id", blockId)
    .eq("concept_id", conceptId)
    .maybeSingle();

  if (loadError || !block) {
    redirect(
      `/admin/academic-knowledge/${conceptId}?error=${encodeURIComponent(
        loadError?.message || "Academic content block was not found.",
      )}`,
    );
  }

  const currentStatus =
    block.lifecycle_status as LifecycleStatus;

  if (!lifecycleStatuses.includes(currentStatus)) {
    redirect(
      `/admin/academic-knowledge/${conceptId}?error=${encodeURIComponent(
        "Current lifecycle status is invalid.",
      )}`,
    );
  }

  if (
    !allowedTransitions[currentStatus].includes(nextStatus)
  ) {
    redirect(
      `/admin/academic-knowledge/${conceptId}?error=${encodeURIComponent(
        `Illegal transition: ${currentStatus} → ${nextStatus}.`,
      )}`,
    );
  }

  const reviewer =
    session.user.email || "MAT admin";

  const timestamp = new Date().toISOString();

  const auditLine =
    nextStatus === "approved" || nextStatus === "published"
      ? `[${timestamp}] ${reviewer}: ${currentStatus} → ${nextStatus}`
      : null;

  const existingNotes =
    typeof block.review_notes === "string"
      ? block.review_notes.trim()
      : "";

  const reviewNotes = auditLine
    ? [existingNotes, auditLine]
        .filter(Boolean)
        .join("\n\n")
    : existingNotes || null;

  const { error: updateError } = await supabase
    .from("academic_content_blocks")
    .update({
      lifecycle_status: nextStatus,
      review_notes: reviewNotes,
      reviewed_at:
        nextStatus === "approved" ||
        nextStatus === "published"
          ? timestamp
          : null,
      updated_at: timestamp,
    })
    .eq("id", blockId)
    .eq("concept_id", conceptId);

  if (updateError) {
    redirect(
      `/admin/academic-knowledge/${conceptId}?error=${encodeURIComponent(
        updateError.message,
      )}`,
    );
  }

  revalidatePath("/admin/academic-knowledge");
  revalidatePath(`/admin/academic-knowledge/${conceptId}`);

  redirect(
    `/admin/academic-knowledge/${conceptId}?status=${nextStatus}`,
  );
}
