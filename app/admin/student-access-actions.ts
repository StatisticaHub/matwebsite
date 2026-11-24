"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getAdminSession } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendStudentPortalAccountEmail } from "@/lib/email/student-auth";

function text(
  formData: FormData,
  key: string,
  max = 500,
) {
  return String(
    formData.get(key) || "",
  )
    .trim()
    .slice(0, max);
}

async function adminContext() {
  const session =
    await getAdminSession();

  if (!session) {
    redirect("/admin/login");
  }

  return {
    supabase:
      createAdminClient(),
  };
}

async function findAuthUserByEmail(
  supabase:
    ReturnType<
      typeof createAdminClient
    >,
  email: string,
) {
  for (
    let page = 1;
    page <= 5;
    page += 1
  ) {
    const {
      data,
      error,
    } =
      await supabase
        .auth.admin
        .listUsers({
          page,
          perPage: 200,
        });

    if (error) {
      throw error;
    }

    const found =
      data.users.find(
        (user) =>
          user.email
            ?.toLowerCase() ===
          email.toLowerCase(),
      );

    if (found) {
      return found;
    }

    if (
      data.users.length < 200
    ) {
      break;
    }
  }

  return null;
}

function buildSetupUrl(
  siteUrl: string,
  properties: {
    hashed_token: string;
    verification_type: string;
  },
) {
  const url =
    new URL(
      "/portal/welcome",
      siteUrl,
    );

  url.searchParams.set(
    "token_hash",
    properties.hashed_token,
  );

  url.searchParams.set(
    "type",
    properties.verification_type,
  );

  return url.toString();
}

export async function sendStudentAccountInvite(
  formData: FormData,
) {
  const { supabase } =
    await adminContext();

  const studentId =
    text(
      formData,
      "studentId",
      100,
    );

  if (!studentId) {
    return;
  }

  const {
    data: student,
    error: studentError,
  } = await supabase
    .from("students")
    .select(
      "id,name,email,status,auth_user_id"
    )
    .eq("id", studentId)
    .single();

  if (
    studentError ||
    !student
  ) {
    throw new Error(
      studentError?.message ||
        "Student not found.",
    );
  }

  if (
    student.status !== "active"
  ) {
    throw new Error(
      "Only active, approved students can receive Student Portal login access.",
    );
  }

  const siteUrl =
    (
      process.env
        .NEXT_PUBLIC_SITE_URL ||
      "https://www.myacademictutor.com"
    ).replace(/\/$/, "");

  let userId =
    student.auth_user_id as
      | string
      | null;

  let actionUrl = "";
  let isRecovery =
    Boolean(userId);

  if (!userId) {
    const invite =
      await supabase
        .auth.admin
        .generateLink({
          type: "invite",
          email:
            student.email,

          options: {
            data: {
              full_name:
                student.name,
              account_type:
                "student",
            },
          },
        });

    if (
      !invite.error &&
      invite.data?.user?.id &&
      invite.data.properties
        ?.hashed_token &&
      invite.data.properties
        ?.verification_type
    ) {
      userId =
        invite.data.user.id;

      actionUrl =
        buildSetupUrl(
          siteUrl,
          {
            hashed_token:
              invite.data
                .properties
                .hashed_token,

            verification_type:
              invite.data
                .properties
                .verification_type,
          },
        );

      isRecovery = false;
    } else {
      const existing =
        await findAuthUserByEmail(
          supabase,
          student.email,
        );

      if (!existing) {
        throw new Error(
          invite.error?.message ||
            "Could not create student portal account.",
        );
      }

      if (existing.app_metadata?.role === "admin") {
        throw new Error(
          "This email already belongs to an MAT Admin account. Use a separate student email address.",
        );
      }

      const [
        existingTutorResult,
        existingStudentResult,
      ] = await Promise.all([
        supabase
          .from("tutors")
          .select("id,name")
          .eq("auth_user_id", existing.id)
          .maybeSingle(),

        supabase
          .from("students")
          .select("id,name")
          .eq("auth_user_id", existing.id)
          .neq("id", studentId)
          .maybeSingle(),
      ]);

      if (existingTutorResult.error) {
        throw new Error(existingTutorResult.error.message);
      }

      if (existingStudentResult.error) {
        throw new Error(existingStudentResult.error.message);
      }

      if (existingTutorResult.data) {
        throw new Error(
          "This email is already linked to a Tutor Portal account. Use a separate student email address.",
        );
      }

      if (existingStudentResult.data) {
        throw new Error(
          "This email is already linked to another Student Portal account.",
        );
      }

      userId =
        existing.id;

      const recovery =
        await supabase
          .auth.admin
          .generateLink({
            type: "recovery",
            email:
              student.email,
          });

      if (
        recovery.error ||
        !recovery.data.properties
          ?.hashed_token ||
        !recovery.data.properties
          ?.verification_type
      ) {
        throw new Error(
          recovery.error?.message ||
            "Could not create password link.",
        );
      }

      actionUrl =
        buildSetupUrl(
          siteUrl,
          {
            hashed_token:
              recovery.data
                .properties
                .hashed_token,

            verification_type:
              recovery.data
                .properties
                .verification_type,
          },
        );

      isRecovery = true;
    }
  } else {
    const recovery =
      await supabase
        .auth.admin
        .generateLink({
          type: "recovery",
          email:
            student.email,
        });

    if (
      recovery.error ||
      !recovery.data.properties
        ?.hashed_token ||
      !recovery.data.properties
        ?.verification_type
    ) {
      throw new Error(
        recovery.error?.message ||
          "Could not create password reset link.",
      );
    }

    actionUrl =
      buildSetupUrl(
        siteUrl,
        {
          hashed_token:
            recovery.data
              .properties
              .hashed_token,

          verification_type:
            recovery.data
              .properties
              .verification_type,
        },
      );

    isRecovery = true;
  }

  const now =
    new Date()
      .toISOString();

  const {
    error: updateError,
  } = await supabase
    .from("students")
    .update({
      auth_user_id:
        userId,

      portal_enabled:
        true,

      portal_invited_at:
        now,

      updated_at:
        now,
    })
    .eq(
      "id",
      studentId,
    );

  if (updateError) {
    throw new Error(
      updateError.message,
    );
  }

  const result =
    await sendStudentPortalAccountEmail({
      name:
        student.name,

      email:
        student.email,

      actionUrl,

      isRecovery,
    });

  if (!result.ok) {
    throw new Error(
      result.error ||
        "Student Portal email could not be sent.",
    );
  }

  revalidatePath(
    "/admin/student-access",
  );

  redirect(
    `/admin/student-access?student=${encodeURIComponent(studentId)}&sent=1`,
  );
}

export async function disableStudentAccount(
  formData: FormData,
) {
  const { supabase } =
    await adminContext();

  const studentId =
    text(
      formData,
      "studentId",
      100,
    );

  if (!studentId) {
    return;
  }

  const now =
    new Date()
      .toISOString();

  const {
    error,
  } = await supabase
    .from("students")
    .update({
      portal_enabled:
        false,

      updated_at:
        now,
    })
    .eq(
      "id",
      studentId,
    );

  if (error) {
    throw new Error(
      error.message,
    );
  }

  await supabase
    .from(
      "student_portal_links",
    )
    .update({
      revoked_at: now,
      updated_at: now,
    })
    .eq(
      "student_id",
      studentId,
    )
    .eq(
      "label",
      "Authenticated student login",
    )
    .is(
      "revoked_at",
      null,
    );

  revalidatePath(
    "/admin/student-access",
  );

  redirect(
    `/admin/student-access?student=${encodeURIComponent(studentId)}&disabled=1`,
  );
}
