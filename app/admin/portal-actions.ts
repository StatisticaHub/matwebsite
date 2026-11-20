"use server";

import {
  revalidatePath,
} from "next/cache";

import {
  redirect,
} from "next/navigation";

import {
  getAdminSession,
} from "@/lib/admin-auth";

import {
  portalSupportStatuses,
  type PortalSupportStatus,
} from "@/lib/student-portal";

import {
  createAdminClient,
} from "@/lib/supabase/admin";


function text(
  formData: FormData,
  key: string,
  max = 5000
) {
  return String(
    formData.get(key) || ""
  )
    .trim()
    .slice(
      0,
      max
    );
}


export async function updateSupportRequest(
  formData: FormData
) {
  const session =
    await getAdminSession();

  if (!session) {
    redirect(
      "/admin/login"
    );
  }


  const requestId =
    text(
      formData,
      "requestId",
      100
    );


  const status =
    text(
      formData,
      "status",
      30
    ) as PortalSupportStatus;


  const adminNote =
    text(
      formData,
      "adminNote",
      5000
    ) || null;


  if (
    !requestId ||
    !portalSupportStatuses.includes(
      status
    )
  ) {
    return;
  }


  const now =
    new Date()
      .toISOString();


  const supabase =
    createAdminClient();


  const {
    error,
  } =
    await supabase
      .from(
        "student_support_requests"
      )
      .update({
        status,

        admin_note:
          adminNote,

        resolved_at:
          status ===
          "resolved"
            ? now
            : null,

        updated_at:
          now,
      })
      .eq(
        "id",
        requestId
      );


  if (error) {
    throw new Error(
      error.message
    );
  }


  revalidatePath(
    "/admin/portals"
  );

  revalidatePath(
    "/admin/sessions"
  );
}
