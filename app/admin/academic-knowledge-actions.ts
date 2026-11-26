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

function conceptUrl(conceptId: string) {
  return `/admin/academic-knowledge/${conceptId}`;
}

export async function updateAcademicContentBlock(formData: FormData) {
  const session = await requireAdmin();

  const blockId = clean(formData.get("blockId"));
  const conceptId = clean(formData.get("conceptId"));
  const title = clean(formData.get("title"));
  const body = clean(formData.get("body"));
  const reviewNotes = clean(formData.get("reviewNotes"));
  const reviewerEmail = session.user.email?.trim() || "";

  if (!blockId || !conceptId || !body) {
    redirect(
      `${conceptUrl(conceptId)}?error=${encodeURIComponent(
        "Content block, concept and body are required.",
      )}`,
    );
  }

  if (!reviewerEmail) {
    redirect(
      `${conceptUrl(conceptId)}?error=${encodeURIComponent(
        "Admin reviewer identity is unavailable.",
      )}`,
    );
  }

  const supabase = createAdminClient();

  const { error } = await supabase.rpc(
    "mat_update_academic_content_block",
    {
      p_block_id: blockId,
      p_concept_id: conceptId,
      p_title: title,
      p_body: body,
      p_review_notes: reviewNotes,
      p_reviewer_user_id: session.user.id || null,
      p_reviewer_email: reviewerEmail,
    },
  );

  if (error) {
    redirect(
      `${conceptUrl(conceptId)}?error=${encodeURIComponent(
        error.message,
      )}`,
    );
  }

  revalidatePath("/admin/academic-knowledge");
  revalidatePath(conceptUrl(conceptId));

  redirect(`${conceptUrl(conceptId)}?saved=1`);
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
  const reviewerEmail = session.user.email?.trim() || "";

  if (
    !blockId ||
    !conceptId ||
    !lifecycleStatuses.includes(nextStatus)
  ) {
    redirect(
      `${conceptUrl(conceptId)}?error=${encodeURIComponent(
        "Invalid academic review transition.",
      )}`,
    );
  }

  if (!reviewerEmail) {
    redirect(
      `${conceptUrl(conceptId)}?error=${encodeURIComponent(
        "Admin reviewer identity is unavailable.",
      )}`,
    );
  }

  const supabase = createAdminClient();

  const { error } = await supabase.rpc(
    "mat_transition_academic_content_block",
    {
      p_block_id: blockId,
      p_concept_id: conceptId,
      p_next_status: nextStatus,
      p_reviewer_user_id: session.user.id || null,
      p_reviewer_email: reviewerEmail,
      p_note: null,
    },
  );

  if (error) {
    redirect(
      `${conceptUrl(conceptId)}?error=${encodeURIComponent(
        error.message,
      )}`,
    );
  }

  revalidatePath("/admin/academic-knowledge");
  revalidatePath(conceptUrl(conceptId));

  redirect(
    `${conceptUrl(conceptId)}?status=${encodeURIComponent(
      nextStatus,
    )}`,
  );
}
