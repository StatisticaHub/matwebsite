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

function normalizedEmail(value: string | null | undefined) {
  return String(value || "").trim().toLowerCase();
}

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

  if (userError || !user || !user.email) {
    return null;
  }

  const admin = createAdminClient();

  const { data: student, error: studentError } = await admin
    .from("students")
    .select("id,name,email,status")
    .eq("id", link.student_id)
    .maybeSingle();

  if (
    studentError ||
    !student ||
    normalizedEmail(student.email) !== normalizedEmail(user.email)
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
