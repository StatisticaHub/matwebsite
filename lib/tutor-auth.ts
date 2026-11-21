import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Tutor } from "@/lib/admin-data";

export type TutorPortalTutor = Tutor & {
  auth_user_id: string | null;
  portal_enabled: boolean;
  portal_invited_at: string | null;
};

export type TutorSession = {
  user: User;
  tutor: TutorPortalTutor;
};

/**
 * Tutor account session.
 *
 * Used for login routing and onboarding. Pending tutors may use this
 * session, but inactive tutors and tutors without portal access may not.
 */
export async function getTutorAccountSession(): Promise<TutorSession | null> {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) return null;

  const admin = createAdminClient();

  const { data: tutor, error: tutorError } = await admin
    .from("tutors")
    .select("*")
    .eq("auth_user_id", data.user.id)
    .eq("portal_enabled", true)
    .in("status", ["active", "pending"])
    .maybeSingle();

  if (tutorError || !tutor) return null;

  return {
    user: data.user,
    tutor: tutor as TutorPortalTutor,
  };
}

/**
 * Active teaching session.
 *
 * All student/session/trial/progress server actions continue to use this
 * function. A pending tutor therefore cannot access teaching data.
 */
export async function getTutorSession(): Promise<TutorSession | null> {
  const session = await getTutorAccountSession();

  if (!session || session.tutor.status !== "active") {
    return null;
  }

  return session;
}
