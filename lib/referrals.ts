import { createHash } from "node:crypto";

import { createAdminClient } from "@/lib/supabase/admin";

const REFERRAL_PREFIX =
  "student_referral:";

export type ReferringStudent = {
  id: string;
  name: string;
  email: string;
  status: string;
};

export function normaliseReferralCode(
  value:
    | string
    | null
    | undefined,
) {
  return String(value || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 12);
}

export function referralCodeForStudentId(
  studentId: string,
) {
  return createHash("sha256")
    .update(
      `mat-referral-v1:${studentId}`,
    )
    .digest("hex")
    .slice(0, 10)
    .toUpperCase();
}

export function referralUtmContent(
  code: string,
) {
  const normalised =
    normaliseReferralCode(code);

  return normalised
    ? `${REFERRAL_PREFIX}${normalised}`
    : null;
}

export function referralCodeFromUtmContent(
  value:
    | string
    | null
    | undefined,
) {
  const text =
    String(value || "").trim();

  if (
    !text.startsWith(
      REFERRAL_PREFIX,
    )
  ) {
    return null;
  }

  return normaliseReferralCode(
    text.slice(
      REFERRAL_PREFIX.length,
    ),
  );
}

export function referralUrlForStudentId(
  studentId: string,
) {
  const siteUrl =
    (
      process.env
        .NEXT_PUBLIC_SITE_URL ||
      "https://www.myacademictutor.com"
    ).replace(/\/$/, "");

  const code =
    referralCodeForStudentId(
      studentId,
    );

  return `${siteUrl}/find-a-tutor?ref=${encodeURIComponent(
    code,
  )}`;
}

export async function resolveReferringStudent(
  code: string,
): Promise<ReferringStudent | null> {
  const normalised =
    normaliseReferralCode(code);

  if (!normalised) {
    return null;
  }

  const supabase =
    createAdminClient();

  const {
    data,
    error,
  } = await supabase
    .from("students")
    .select(
      "id,name,email,status",
    )
    .limit(5000);

  if (error) {
    console.error(
      "Could not resolve referral code",
      error.message,
    );

    return null;
  }

  for (const student of data || []) {
    if (
      referralCodeForStudentId(
        student.id,
      ) === normalised
    ) {
      return student as ReferringStudent;
    }
  }

  return null;
}
