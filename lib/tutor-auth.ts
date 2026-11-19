import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Tutor } from "@/lib/admin-data";

export type TutorPortalTutor = Tutor & {
  auth_user_id: string | null;
  portal_enabled: boolean;
  portal_invited_at: string | null;
};

export type TutorSession = { user: User; tutor: TutorPortalTutor };

export async function getTutorSession(): Promise<TutorSession | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;

  const admin = createAdminClient();
  const { data: tutor, error: tutorError } = await admin
    .from("tutors")
    .select("*")
    .eq("auth_user_id", data.user.id)
    .eq("portal_enabled", true)
    .eq("status", "active")
    .maybeSingle();

  if (tutorError || !tutor) return null;
  return { user: data.user, tutor: tutor as TutorPortalTutor };
}
