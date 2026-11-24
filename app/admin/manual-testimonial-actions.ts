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
  createAdminClient,
} from "@/lib/supabase/admin";


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


function relationOne<T>(
  value:
    | T
    | T[]
    | null,
) {
  if (
    Array.isArray(
      value,
    )
  ) {
    return (
      value[0] ||
      null
    );
  }

  return value;
}


export async function createManualTestimonial(
  formData: FormData,
) {

  const session =
    await getAdminSession();


  if (!session) {
    redirect(
      "/admin/login",
    );
  }


  const engagementId =
    text(
      formData,
      "engagementId",
      100,
    );


  const reviewText =
    text(
      formData,
      "reviewText",
      5000,
    );


  const displayName =
    text(
      formData,
      "displayName",
      120,
    );


  const displayContext =
    text(
      formData,
      "displayContext",
      180,
    );


  const source =
    text(
      formData,
      "source",
      40,
    );


  const consentEvidence =
    text(
      formData,
      "consentEvidence",
      1500,
    );


  const sourceNote =
    text(
      formData,
      "sourceNote",
      1500,
    );


  const consentToPublish =
    formData.get(
      "consentToPublish",
    ) === "on";


  const rating =
    Number(
      formData.get(
        "rating",
      ),
    );


  if (
    !engagementId ||
    !reviewText ||
    !displayName ||
    !Number.isFinite(
      rating,
    ) ||
    rating < 1 ||
    rating > 5
  ) {
    redirect(
      "/admin/testimonials?error=Complete+the+student,+rating,+testimonial+and+public+attribution",
    );
  }


  if (
    ![
      "whatsapp",
      "email",
      "dm",
      "other",
    ].includes(
      source,
    )
  ) {
    redirect(
      "/admin/testimonials?error=Choose+a+valid+feedback+source",
    );
  }


  if (
    consentToPublish &&
    !consentEvidence
  ) {
    redirect(
      "/admin/testimonials?error=Record+how+the+student+gave+permission+before+marking+publication+consent",
    );
  }


  const supabase =
    createAdminClient();


  const {
    data:
      engagementData,
    error:
      engagementError,
  } =
    await supabase
      .from(
        "tutoring_engagements",
      )
      .select(`
        id,
        student_id,
        tutor_id,
        subject,
        students (
          academic_level
        )
      `)
      .eq(
        "id",
        engagementId,
      )
      .maybeSingle();


  if (
    engagementError ||
    !engagementData
  ) {
    redirect(
      `/admin/testimonials?error=${encodeURIComponent(
        engagementError?.message ||
        "Student engagement not found",
      )}`,
    );
  }


  const engagement =
    engagementData as any;


  const student =
    relationOne<any>(
      engagement.students,
    );


  const academicLevel =
    student?.academic_level ||
    null;


  const now =
    new Date()
      .toISOString();


  const actor =
    session.user.email ||
    "admin";


  const sourceLabel:
    Record<string, string> = {
      whatsapp:
        "WhatsApp",

      email:
        "Email",

      dm:
        "Direct message",

      other:
        "Other",
    };


  const internalLines = [
    `[Manual testimonial import · ${now}]`,

    `Imported by: ${actor}`,

    `Source: ${
      sourceLabel[source] ||
      source
    }`,

    `Publication consent recorded: ${
      consentToPublish
        ? "Yes"
        : "No"
    }`,
  ];


  if (
    consentEvidence
  ) {
    internalLines.push(
      `Consent evidence: ${consentEvidence}`,
    );
  }


  if (
    sourceNote
  ) {
    internalLines.push(
      `Source note: ${sourceNote}`,
    );
  }


  const fallbackContext =
    [
      academicLevel,
      engagement.subject,
    ]
      .filter(Boolean)
      .join(
        " · ",
      );


  const {
    error:
      insertError,
  } =
    await supabase
      .from(
        "testimonials",
      )
      .insert({
        student_id:
          engagement.student_id,

        engagement_id:
          engagement.id,

        tutor_id:
          engagement.tutor_id ||
          null,

        subject:
          engagement.subject ||
          null,

        academic_level:
          academicLevel,

        status:
          "submitted",

        rating:
          Math.round(
            rating,
          ),

        review_text:
          reviewText,

        display_name:
          displayName,

        display_context:
          displayContext ||
          fallbackContext ||
          null,

        consent_to_publish:
          consentToPublish,

        featured:
          false,

        submitted_at:
          now,

        admin_note:
          internalLines.join(
            "\n",
          ),

        updated_at:
          now,
      });


  if (
    insertError
  ) {
    redirect(
      `/admin/testimonials?error=${encodeURIComponent(
        insertError.message,
      )}`,
    );
  }


  revalidatePath(
    "/admin/testimonials",
  );

  redirect(
    "/admin/testimonials?manual=1",
  );
}
