"use server";

import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const allowedTypes = new Set(["invite", "recovery"]);

function value(formData: FormData, key: string, max = 5000) {
  return String(formData.get(key) || "").trim().slice(0, max);
}

export async function completeTutorPortalSetup(formData: FormData) {
  const tokenHash = value(formData, "tokenHash", 5000);
  const type = value(formData, "type", 50);
  const password = String(formData.get("password") || "");

  if (!tokenHash || !allowedTypes.has(type)) {
    return {
      ok: false as const,
      error: "This portal link is incomplete. Ask the MAT team to send a new access link.",
    };
  }

  if (password.length < 10) {
    return {
      ok: false as const,
      error: "Use at least 10 characters for your password.",
    };
  }

  const supabase = await createClient();

  const { data: verification, error: verificationError } =
    await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: type as EmailOtpType,
    });

  if (verificationError || !verification.user) {
    return {
      ok: false as const,
      error:
        "This access link is invalid, has expired, or was already used. Ask the MAT team to send a new portal link.",
    };
  }

  const admin = createAdminClient();
  const { data: tutor, error: tutorError } = await admin
    .from("tutors")
    .select("id,portal_enabled,status")
    .eq("auth_user_id", verification.user.id)
    .maybeSingle();

  if (
    tutorError ||
    !tutor ||
    tutor.portal_enabled !== true ||
    tutor.status !== "active"
  ) {
    await supabase.auth.signOut();
    return {
      ok: false as const,
      error: "Tutor portal access is not enabled for this account.",
    };
  }

  const { error: passwordError } = await supabase.auth.updateUser({
    password,
  });

  if (passwordError) {
    return {
      ok: false as const,
      error: passwordError.message || "Could not set your password.",
    };
  }

  return { ok: true as const };
}
