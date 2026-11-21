"use server";

import { revalidatePath } from "next/cache";

import { getTutorSession } from "@/lib/tutor-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { uuidPattern } from "@/lib/learning-materials";


function clean(
  value: FormDataEntryValue | null,
  max = 5000,
) {
  return String(value || "")
    .trim()
    .slice(0, max);
}


function validDate(
  value: string,
) {
  return /^\d{4}-\d{2}-\d{2}$/.test(
    value,
  );
}


function parseObjectives(
  value: string,
) {
  return value
    .split(/\r?\n/)
    .map((item) =>
      item.trim(),
    )
    .filter(Boolean)
    .slice(0, 20)
    .map((item) =>
      item.slice(0, 300),
    );
}


async function getContext() {
  const auth =
    await getTutorSession();

  if (!auth) {
    throw new Error(
      "Tutor session expired.",
    );
  }

  return {
    auth,
    supabase:
      createAdminClient(),
  };
}


async function requireEngagement(
  engagementId: string,
  tutorId: string,
) {
  const supabase =
    createAdminClient();

  const {
    data,
    error,
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
        engagementId,
      )
      .eq(
        "tutor_id",
        tutorId,
      )
      .maybeSingle();

  if (
    error ||
    !data
  ) {
    throw new Error(
      "Student workspace not found.",
    );
  }

  return data;
}


async function requireWeek(
  weekId: string,
  tutorId: string,
) {
  const supabase =
    createAdminClient();

  const {
    data,
    error,
  } =
    await supabase
      .from(
        "tutoring_weeks",
      )
      .select(
        "id,engagement_id,status",
      )
      .eq(
        "id",
        weekId,
      )
      .maybeSingle();

  if (
    error ||
    !data
  ) {
    throw new Error(
      "Learning week not found.",
    );
  }

  await requireEngagement(
    data.engagement_id,
    tutorId,
  );

  return data;
}


function refreshWorkspace(
  engagementId: string,
) {
  revalidatePath(
    "/tutor/students",
  );

  revalidatePath(
    `/tutor/students/${engagementId}`,
  );

  revalidatePath(
    "/tutor/sessions",
  );

  revalidatePath(
    "/tutor/materials",
  );
}


/* ============================================================
   CREATE WEEK
   ============================================================ */

export async function createTutorWeek(
  formData: FormData,
) {
  const {
    auth,
    supabase,
  } =
    await getContext();

  const engagementId =
    clean(
      formData.get(
        "engagementId",
      ),
      100,
    );

  if (
    !uuidPattern.test(
      engagementId,
    )
  ) {
    throw new Error(
      "Invalid student workspace.",
    );
  }

  await requireEngagement(
    engagementId,
    auth.tutor.id,
  );

  const weekNumber =
    Number(
      clean(
        formData.get(
          "weekNumber",
        ),
        20,
      ),
    );

  const weekStart =
    clean(
      formData.get(
        "weekStart",
      ),
      20,
    );

  const weekEnd =
    clean(
      formData.get(
        "weekEnd",
      ),
      20,
    );

  const title =
    clean(
      formData.get(
        "title",
      ),
      200,
    );

  if (
    !Number.isInteger(
      weekNumber,
    ) ||
    weekNumber < 1 ||
    !validDate(
      weekStart,
    ) ||
    !validDate(
      weekEnd,
    ) ||
    !title
  ) {
    throw new Error(
      "Please complete the week number, dates and title.",
    );
  }

  if (
    weekEnd <
    weekStart
  ) {
    throw new Error(
      "Week end must be on or after week start.",
    );
  }

  const {
    error,
  } =
    await supabase
      .from(
        "tutoring_weeks",
      )
      .insert({
        engagement_id:
          engagementId,

        created_by_tutor_id:
          auth.tutor.id,

        week_number:
          weekNumber,

        week_start:
          weekStart,

        week_end:
          weekEnd,

        title,

        focus:
          clean(
            formData.get(
              "focus",
            ),
            2000,
          ) ||
          null,

        objectives:
          parseObjectives(
            clean(
              formData.get(
                "objectives",
              ),
              6000,
            ),
          ),

        student_summary:
          clean(
            formData.get(
              "studentSummary",
            ),
            3000,
          ) ||
          null,

        tutor_notes:
          clean(
            formData.get(
              "tutorNotes",
            ),
            5000,
          ) ||
          null,

        status:
          "draft",
      });

  if (error) {
    if (
      error.code ===
      "23505"
    ) {
      throw new Error(
        `Week ${weekNumber} already exists for this student.`,
      );
    }

    throw new Error(
      error.message,
    );
  }

  refreshWorkspace(
    engagementId,
  );
}


/* ============================================================
   UPDATE WEEK
   ============================================================ */

export async function updateTutorWeek(
  formData: FormData,
) {
  const {
    auth,
    supabase,
  } =
    await getContext();

  const weekId =
    clean(
      formData.get(
        "weekId",
      ),
      100,
    );

  if (
    !uuidPattern.test(
      weekId,
    )
  ) {
    throw new Error(
      "Invalid learning week.",
    );
  }

  const week =
    await requireWeek(
      weekId,
      auth.tutor.id,
    );

  const weekStart =
    clean(
      formData.get(
        "weekStart",
      ),
      20,
    );

  const weekEnd =
    clean(
      formData.get(
        "weekEnd",
      ),
      20,
    );

  const title =
    clean(
      formData.get(
        "title",
      ),
      200,
    );

  if (
    !validDate(
      weekStart,
    ) ||
    !validDate(
      weekEnd,
    ) ||
    !title
  ) {
    throw new Error(
      "Please enter valid week dates and a title.",
    );
  }

  if (
    weekEnd <
    weekStart
  ) {
    throw new Error(
      "Week end must be on or after week start.",
    );
  }

  const {
    error,
  } =
    await supabase
      .from(
        "tutoring_weeks",
      )
      .update({
        week_start:
          weekStart,

        week_end:
          weekEnd,

        title,

        focus:
          clean(
            formData.get(
              "focus",
            ),
            2000,
          ) ||
          null,

        objectives:
          parseObjectives(
            clean(
              formData.get(
                "objectives",
              ),
              6000,
            ),
          ),

        student_summary:
          clean(
            formData.get(
              "studentSummary",
            ),
            3000,
          ) ||
          null,

        tutor_notes:
          clean(
            formData.get(
              "tutorNotes",
            ),
            5000,
          ) ||
          null,

        updated_at:
          new Date()
            .toISOString(),
      })
      .eq(
        "id",
        weekId,
      );

  if (error) {
    throw new Error(
      error.message,
    );
  }

  refreshWorkspace(
    week.engagement_id,
  );
}


/* ============================================================
   WEEK STATUS
   ============================================================ */

export async function changeTutorWeekStatus(
  formData: FormData,
) {
  const {
    auth,
    supabase,
  } =
    await getContext();

  const weekId =
    clean(
      formData.get(
        "weekId",
      ),
      100,
    );

  const status =
    clean(
      formData.get(
        "status",
      ),
      30,
    );

  if (
    !uuidPattern.test(
      weekId,
    ) ||
    ![
      "draft",
      "published",
      "completed",
    ].includes(
      status,
    )
  ) {
    throw new Error(
      "Invalid learning week update.",
    );
  }

  const week =
    await requireWeek(
      weekId,
      auth.tutor.id,
    );

  const now =
    new Date()
      .toISOString();

  const update:
    Record<
      string,
      unknown
    > = {
      status,
      updated_at:
        now,
    };

  if (
    status ===
    "published"
  ) {
    update.published_at =
      now;

    update.completed_at =
      null;
  }

  if (
    status ===
    "completed"
  ) {
    update.completed_at =
      now;

    if (
      week.status ===
      "draft"
    ) {
      update.published_at =
        now;
    }
  }

  if (
    status ===
    "draft"
  ) {
    update.completed_at =
      null;
  }

  const {
    error,
  } =
    await supabase
      .from(
        "tutoring_weeks",
      )
      .update(
        update,
      )
      .eq(
        "id",
        weekId,
      );

  if (error) {
    throw new Error(
      error.message,
    );
  }

  refreshWorkspace(
    week.engagement_id,
  );
}


/* ============================================================
   ASSIGN SESSION TO WEEK
   ============================================================ */

export async function assignTutorSessionToWeek(
  formData: FormData,
) {
  const {
    auth,
    supabase,
  } =
    await getContext();

  const weekId =
    clean(
      formData.get(
        "weekId",
      ),
      100,
    );

  const sessionId =
    clean(
      formData.get(
        "sessionId",
      ),
      100,
    );

  if (
    !uuidPattern.test(
      weekId,
    ) ||
    !uuidPattern.test(
      sessionId,
    )
  ) {
    throw new Error(
      "Invalid week or session.",
    );
  }

  const week =
    await requireWeek(
      weekId,
      auth.tutor.id,
    );

  const {
    data: session,
    error:
      sessionError,
  } =
    await supabase
      .from(
        "tutoring_sessions",
      )
      .select(
        "id,engagement_id",
      )
      .eq(
        "id",
        sessionId,
      )
      .eq(
        "engagement_id",
        week.engagement_id,
      )
      .maybeSingle();

  if (
    sessionError ||
    !session
  ) {
    throw new Error(
      "Session not found for this student.",
    );
  }

  const {
    data: lastSession,
  } =
    await supabase
      .from(
        "tutoring_sessions",
      )
      .select(
        "week_position",
      )
      .eq(
        "week_id",
        weekId,
      )
      .order(
        "week_position",
        {
          ascending: false,
          nullsFirst: false,
        },
      )
      .limit(1);

  const nextPosition =
    Number(
      lastSession?.[0]
        ?.week_position ||
        0,
    ) + 1;

  const {
    error,
  } =
    await supabase
      .from(
        "tutoring_sessions",
      )
      .update({
        week_id:
          weekId,

        week_position:
          nextPosition,
      })
      .eq(
        "id",
        sessionId,
      )
      .eq(
        "engagement_id",
        week.engagement_id,
      );

  if (error) {
    throw new Error(
      error.message,
    );
  }

  refreshWorkspace(
    week.engagement_id,
  );
}


/* ============================================================
   REMOVE SESSION FROM WEEK
   ============================================================ */

export async function removeTutorSessionFromWeek(
  formData: FormData,
) {
  const {
    auth,
    supabase,
  } =
    await getContext();

  const weekId =
    clean(
      formData.get(
        "weekId",
      ),
      100,
    );

  const sessionId =
    clean(
      formData.get(
        "sessionId",
      ),
      100,
    );

  if (
    !uuidPattern.test(
      weekId,
    ) ||
    !uuidPattern.test(
      sessionId,
    )
  ) {
    throw new Error(
      "Invalid week or session.",
    );
  }

  const week =
    await requireWeek(
      weekId,
      auth.tutor.id,
    );

  const {
    error,
  } =
    await supabase
      .from(
        "tutoring_sessions",
      )
      .update({
        week_id: null,
        week_position:
          null,
      })
      .eq(
        "id",
        sessionId,
      )
      .eq(
        "engagement_id",
        week.engagement_id,
      )
      .eq(
        "week_id",
        weekId,
      );

  if (error) {
    throw new Error(
      error.message,
    );
  }

  refreshWorkspace(
    week.engagement_id,
  );
}
