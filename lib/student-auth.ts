import type { User } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type StudentPortalStudent = {
  id: string;
  name: string;
  email: string;
  status: string;
  auth_user_id: string | null;
  portal_enabled: boolean;
  portal_invited_at: string | null;
};

export type StudentSession = {
  user: User;
  student: StudentPortalStudent;
};

export async function getStudentSession(): Promise<StudentSession | null> {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    return null;
  }

  const admin = createAdminClient();

  const { data: student, error: studentError } = await admin
    .from("students")
    .select(
      "id,name,email,status,auth_user_id,portal_enabled,portal_invited_at"
    )
    .eq("auth_user_id", data.user.id)
    .eq("portal_enabled", true)
    .eq("status", "active")
    .maybeSingle();

  if (studentError || !student) {
    return null;
  }

  return {
    user: data.user,
    student: student as StudentPortalStudent,
  };
}
