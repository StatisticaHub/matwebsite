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

const questionTypes = [
  "multiple_choice",
  "true_false",
  "short_answer",
  "numeric",
  "calculation",
  "interpretation",
  "proof",
  "code",
  "extended_response",
] as const;

const cognitiveLevels = [
  "remember",
  "understand",
  "apply",
  "analyse",
  "evaluate",
  "create",
] as const;

function clean(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

function optionalNumber(value: FormDataEntryValue | null) {
  const raw = clean(value);

  if (!raw) return null;

  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

async function requireAdmin() {
  const session = await getAdminSession();

  if (!session) {
    redirect("/admin/login");
  }

  return session;
}

function questionUrl(questionId: string) {
  return `/admin/question-bank/${questionId}`;
}

export async function updateAcademicQuestion(formData: FormData) {
  const session = await requireAdmin();

  const questionId = clean(formData.get("questionId"));
  const title = clean(formData.get("title"));
  const prompt = clean(formData.get("prompt"));
  const questionType = clean(formData.get("questionType"));
  const difficulty = Number(clean(formData.get("difficulty")));
  const cognitiveLevel = clean(formData.get("cognitiveLevel"));
  const estimatedMinutes = optionalNumber(
    formData.get("estimatedMinutes"),
  );
  const marks = optionalNumber(formData.get("marks"));
  const sourceNote = clean(formData.get("sourceNote"));
  const reviewNotes = clean(formData.get("reviewNotes"));
  const reviewerEmail = session.user.email?.trim() || "";

  if (
    !questionId ||
    !prompt ||
    !questionTypes.includes(
      questionType as (typeof questionTypes)[number],
    ) ||
    !Number.isInteger(difficulty) ||
    difficulty < 1 ||
    difficulty > 5 ||
    !cognitiveLevels.includes(
      cognitiveLevel as (typeof cognitiveLevels)[number],
    ) ||
    Number.isNaN(estimatedMinutes) ||
    Number.isNaN(marks)
  ) {
    redirect(
      `${questionUrl(questionId)}?error=${encodeURIComponent(
        "Invalid academic question data.",
      )}`,
    );
  }

  if (
    estimatedMinutes !== null &&
    (!Number.isInteger(estimatedMinutes) ||
      estimatedMinutes <= 0)
  ) {
    redirect(
      `${questionUrl(questionId)}?error=${encodeURIComponent(
        "Estimated minutes must be a positive whole number.",
      )}`,
    );
  }

  if (marks !== null && marks < 0) {
    redirect(
      `${questionUrl(questionId)}?error=${encodeURIComponent(
        "Marks cannot be negative.",
      )}`,
    );
  }

  if (!reviewerEmail) {
    redirect(
      `${questionUrl(questionId)}?error=${encodeURIComponent(
        "Admin reviewer identity is unavailable.",
      )}`,
    );
  }

  const supabase = createAdminClient();

  const { error } = await supabase.rpc(
    "mat_update_academic_question",
    {
      p_question_id: questionId,
      p_title: title,
      p_prompt: prompt,
      p_question_type: questionType,
      p_difficulty: difficulty,
      p_cognitive_level: cognitiveLevel,
      p_estimated_minutes: estimatedMinutes,
      p_marks: marks,
      p_source_note: sourceNote,
      p_review_notes: reviewNotes,
      p_reviewer_user_id: session.user.id || null,
      p_reviewer_email: reviewerEmail,
    },
  );

  if (error) {
    redirect(
      `${questionUrl(questionId)}?error=${encodeURIComponent(
        error.message,
      )}`,
    );
  }

  revalidatePath("/admin/question-bank");
  revalidatePath(questionUrl(questionId));

  redirect(`${questionUrl(questionId)}?saved=1`);
}

export async function transitionAcademicQuestion(
  formData: FormData,
) {
  const session = await requireAdmin();

  const questionId = clean(formData.get("questionId"));
  const nextStatus = clean(
    formData.get("nextStatus"),
  ) as LifecycleStatus;
  const reviewerEmail = session.user.email?.trim() || "";

  if (
    !questionId ||
    !lifecycleStatuses.includes(nextStatus)
  ) {
    redirect(
      `${questionUrl(questionId)}?error=${encodeURIComponent(
        "Invalid academic question lifecycle transition.",
      )}`,
    );
  }

  if (!reviewerEmail) {
    redirect(
      `${questionUrl(questionId)}?error=${encodeURIComponent(
        "Admin reviewer identity is unavailable.",
      )}`,
    );
  }

  const supabase = createAdminClient();

  const { error } = await supabase.rpc(
    "mat_transition_academic_question",
    {
      p_question_id: questionId,
      p_next_status: nextStatus,
      p_reviewer_user_id: session.user.id || null,
      p_reviewer_email: reviewerEmail,
      p_note: null,
    },
  );

  if (error) {
    redirect(
      `${questionUrl(questionId)}?error=${encodeURIComponent(
        error.message,
      )}`,
    );
  }

  revalidatePath("/admin/question-bank");
  revalidatePath(questionUrl(questionId));

  redirect(
    `${questionUrl(questionId)}?status=${encodeURIComponent(
      nextStatus,
    )}`,
  );
}
