import type { User } from "@supabase/supabase-js";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  resolvePortalLink,
  type StudentPortalLink,
} from "@/lib/student-portal";

type AuthenticatedPortalStudent = {
  user: User;
  link: StudentPortalLink;
  student: {
    id: string;
    name: string;
    email: string;
    status: string;
  };
};

export async function getAuthenticatedPortalStudent(
  token: string
): Promise<AuthenticatedPortalStudent | null> {
  const link = await resolvePortalLink(token);

  if (!link) {
    return null;
  }

  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return null;
  }

  const admin = createAdminClient();

  const { data: student, error: studentError } = await admin
    .from("students")
    .select("id,name,email,status,auth_user_id,portal_enabled")
    .eq("id", link.student_id)
    .eq("auth_user_id", user.id)
    .eq("portal_enabled", true)
    .eq("status", "active")
    .maybeSingle();

  if (
    studentError ||
    !student
  ) {
    return null;
  }

  return {
    user,
    link,
    student: {
      id: student.id,
      name: student.name,
      email: student.email,
      status: student.status,
    },
  };
}
