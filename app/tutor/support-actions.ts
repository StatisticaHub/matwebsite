"use server";

import {
  revalidatePath,
} from "next/cache";

import {
  getTutorSession,
} from "@/lib/tutor-auth";

import {
  createAdminClient,
} from "@/lib/supabase/admin";

import {
  portalSupportStatuses,
  type PortalSupportStatus,
} from "@/lib/student-portal";


function text(
  formData: FormData,
  key: string,
  max = 5000,
) {
  return String(
    formData.get(key) ||
    "",
  )
    .trim()
    .slice(
      0,
      max,
    );
}


export async function updateTutorSupportRequest(
  formData: FormData,
) {

  const auth =
    await getTutorSession();


  if (!auth) {
    throw new Error(
      "Tutor session required.",
    );
  }


  const requestId =
    text(
      formData,
      "requestId",
      100,
    );


  const status =
    text(
      formData,
      "status",
      30,
    ) as PortalSupportStatus;


  const appendNote =
    text(
      formData,
      "appendNote",
      3000,
    );


  if (
    !requestId ||
    !portalSupportStatuses.includes(
      status,
    )
  ) {
    return;
  }


  const supabase =
    createAdminClient();


  /*
   * Never trust engagement/student identifiers submitted
   * by the browser. Resolve the request first.
   */
  const {
    data:
      request,
    error:
      requestError,
  } =
    await supabase
      .from(
        "student_support_requests",
      )
      .select(
        "id,student_id,engagement_id,category,status,admin_note",
      )
      .eq(
        "id",
        requestId,
      )
      .maybeSingle();


  if (
    requestError ||
    !request
  ) {
    throw new Error(
      requestError?.message ||
      "Student request not found.",
    );
  }


  if (
    !request.engagement_id
  ) {
    throw new Error(
      "This request is not linked to a tutoring course.",
    );
  }


  /*
   * Ownership gate:
   * the tutor must own the actual engagement linked
   * to the support request.
   */
  const {
    data:
      engagement,
    error:
      engagementError,
  } =
    await supabase
      .from(
        "tutoring_engagements",
      )
      .select(
        "id,student_id,tutor_id",
      )
      .eq(
        "id",
        request.engagement_id,
      )
      .eq(
        "tutor_id",
        auth.tutor.id,
      )
      .maybeSingle();


  if (
    engagementError ||
    !engagement
  ) {
    throw new Error(
      "You do not have access to this student's request.",
    );
  }


  if (
    engagement.student_id !==
    request.student_id
  ) {
    throw new Error(
      "This request does not belong to this student.",
    );
  }


  const now =
    new Date()
      .toISOString();


  let internalHistory =
    request.admin_note ||
    null;


  if (
    appendNote
  ) {

    const actor =
      (auth.tutor as any).name ||
      (auth as any).user?.email ||
      (auth.tutor as any).email ||
      "Tutor";


    const line =
      `[Tutor · ${actor} · ${now}] ${appendNote}`;


    internalHistory =
      internalHistory
        ? `${internalHistory}\n\n${line}`
        : line;
  }


  const {
    error:
      updateError,
  } =
    await supabase
      .from(
        "student_support_requests",
      )
      .update({
        status,

        admin_note:
          internalHistory,

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
        request.id,
      )
      .eq(
        "engagement_id",
        engagement.id,
      );


  if (
    updateError
  ) {
    throw new Error(
      updateError.message,
    );
  }


  revalidatePath(
    `/tutor/students/${engagement.id}`,
  );

  revalidatePath(
    "/tutor",
  );

  revalidatePath(
    "/tutor/sessions",
  );

  revalidatePath(
    "/admin/requests",
  );

  revalidatePath(
    "/admin/portals",
  );

  revalidatePath(
    "/admin/sessions",
  );
}
