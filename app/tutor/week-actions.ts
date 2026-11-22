"use server";

import { revalidatePath } from "next/cache";

import { getTutorSession } from "@/lib/tutor-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  DEFAULT_TIME_ZONE,
  normalizeTimeZone,
} from "@/lib/time-zone";

import {
  sendHomeworkNotification,
  sendSessionNotification,
} from "@/lib/email/student";
import { recordStudentCommunication } from "@/lib/student-communications";

import {
  cleanupManagedZoomMeeting,
  createManagedZoomMeeting,
} from "@/lib/managed-session-zoom";

import {
  homeworkStatuses,
  type HomeworkStatus,
} from "@/lib/delivery-data";
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



/* ============================================================
   DIRECT SESSION CREATION INSIDE A WEEK
   ============================================================ */

function tutorSessionSafeUrl(
  value: string | null,
) {
  if (!value) {
    return null;
  }

  try {
    const url =
      new URL(value);

    if (
      url.protocol !== "https:" &&
      url.protocol !== "http:"
    ) {
      return null;
    }

    return url.toString();
  } catch {
    return null;
  }
}


function timezoneOffsetMs(
  date: Date,
  timeZone: string,
) {
  const parts =
    new Intl.DateTimeFormat(
      "en-GB",
      {
        timeZone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hourCycle: "h23",
      },
    ).formatToParts(
      date,
    );

  const map =
    Object.fromEntries(
      parts
        .filter(
          (part) =>
            part.type !==
            "literal",
        )
        .map(
          (part) => [
            part.type,
            part.value,
          ],
        ),
    );

  const asUtc =
    Date.UTC(
      Number(map.year),
      Number(map.month) - 1,
      Number(map.day),
      Number(map.hour),
      Number(map.minute),
      Number(map.second),
    );

  return (
    asUtc -
    date.getTime()
  );
}


function tutorLocalToIso(
  value: string,
  timeZone: string,
) {
  const match =
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(
      value,
    );

  if (!match) {
    return null;
  }

  const [
    ,
    year,
    month,
    day,
    hour,
    minute,
  ] = match;

  const provisional =
    new Date(
      Date.UTC(
        Number(year),
        Number(month) - 1,
        Number(day),
        Number(hour),
        Number(minute),
        0,
      ),
    );

  const firstOffset =
    timezoneOffsetMs(
      provisional,
      timeZone,
    );

  let resolved =
    new Date(
      provisional.getTime() -
        firstOffset,
    );

  const secondOffset =
    timezoneOffsetMs(
      resolved,
      timeZone,
    );

  if (
    secondOffset !==
    firstOffset
  ) {
    resolved =
      new Date(
        provisional.getTime() -
          secondOffset,
      );
  }

  return Number.isNaN(
    resolved.getTime(),
  )
    ? null
    : resolved.toISOString();
}


export async function createTutorSessionInWeek(
  formData: FormData,
) {
  const {
    auth,
    supabase,
  } =
    await getContext();

  const tutorTimeZone =
    normalizeTimeZone(
      auth.tutor.timezone,
      DEFAULT_TIME_ZONE,
    );



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


  /*
   * requireWeek also proves that the
   * engagement belongs to this tutor.
   */
  const ownedWeek =
    await requireWeek(
      weekId,
      auth.tutor.id,
    );


  const {
    data: week,
    error: weekError,
  } =
    await supabase
      .from(
        "tutoring_weeks",
      )
      .select(
        "id,engagement_id,week_start,week_end",
      )
      .eq(
        "id",
        weekId,
      )
      .eq(
        "engagement_id",
        ownedWeek.engagement_id,
      )
      .maybeSingle();


  if (
    weekError ||
    !week
  ) {
    throw new Error(
      "Learning week not found.",
    );
  }


  const {
    data: engagement,
    error:
      engagementError,
  } =
    await supabase
      .from(
        "tutoring_engagements",
      )
      .select(
        "id,student_id,tutor_id,subject,session_duration_minutes,student_rate,tutor_rate,currency",
      )
      .eq(
        "id",
        week.engagement_id,
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
      "You do not have access to this course workspace.",
    );
  }


  const topic =
    clean(
      formData.get(
        "topic",
      ),
      500,
    );


  const rawScheduledFor =
    clean(
      formData.get(
        "scheduledFor",
      ),
      40,
    );


  const rawDuration =
    Number(
      clean(
        formData.get(
          "durationMinutes",
        ),
        20,
      ),
    );


  const duration =
    Number.isFinite(
      rawDuration,
    ) &&
    rawDuration >= 15 &&
    rawDuration <= 480
      ? Math.round(
          rawDuration,
        )
      : Number(
          engagement.session_duration_minutes ||
            60,
        );


  if (
    !topic ||
    !rawScheduledFor
  ) {
    throw new Error(
      "Session topic and date/time are required.",
    );
  }


  /*
   * The session belongs to this exact week,
   * so keep its calendar date inside the
   * week boundaries.
   */
  const localDate =
    rawScheduledFor.slice(
      0,
      10,
    );


  if (
    localDate <
      week.week_start ||
    localDate >
      week.week_end
  ) {
    throw new Error(
      `Choose a session date between ${week.week_start} and ${week.week_end}.`,
    );
  }


  const scheduledFor =
    tutorLocalToIso(
      rawScheduledFor,
      tutorTimeZone,
    );


  if (!scheduledFor) {
    throw new Error(
      "Please choose a valid date and time in your tutor timezone.",
    );
  }


  /*
   * Check this tutor across ALL of their
   * courses and students.
   *
   * This is particularly important now that
   * one tutor may teach the same student on
   * more than one course.
   */
  const {
    data:
      existingSessions,
    error:
      sessionCheckError,
  } =
    await supabase
      .from(
        "tutoring_sessions",
      )
      .select(
        "id,topic,scheduled_for,duration_minutes,engagement_id",
      )
      .eq(
        "tutor_id",
        auth.tutor.id,
      )
      .eq(
        "status",
        "planned",
      )
      .not(
        "scheduled_for",
        "is",
        null,
      );


  if (sessionCheckError) {
    throw new Error(
      sessionCheckError.message,
    );
  }


  const newStart =
    new Date(
      scheduledFor,
    ).getTime();


  const newEnd =
    newStart +
    duration *
      60 *
      1000;


  const conflict =
    (
      existingSessions ||
      []
    ).find(
      (session) => {
        if (
          !session.scheduled_for
        ) {
          return false;
        }

        const existingStart =
          new Date(
            session.scheduled_for,
          ).getTime();

        const existingEnd =
          existingStart +
          Number(
            session.duration_minutes ||
              60,
          ) *
            60 *
            1000;

        return (
          newStart <
            existingEnd &&
          existingStart <
            newEnd
        );
      },
    );


  if (conflict) {
    const when =
      new Intl.DateTimeFormat(
        "en-GB",
        {
          dateStyle:
            "medium",

          timeStyle:
            "short",

          timeZone:
            tutorTimeZone,
        },
      ).format(
        new Date(
          conflict.scheduled_for,
        ),
      );

    throw new Error(
      `You already have "${conflict.topic}" scheduled at ${when}. Choose another time.`,
    );
  }


  const {
    data:
      lastPosition,
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


  const weekPosition =
    Number(
      lastPosition?.[0]
        ?.week_position ||
        0,
    ) + 1;


  const meetingUrl =
    tutorSessionSafeUrl(
      clean(
        formData.get(
          "meetingUrl",
        ),
        1000,
      ) ||
        null,
    );


  const lessonNotes =
    clean(
      formData.get(
        "lessonNotes",
      ),
      8000,
    ) ||
    null;


  const {
    data: created,
    error:
      createError,
  } =
    await supabase
      .from(
        "tutoring_sessions",
      )
      .insert({
        engagement_id:
          engagement.id,

        week_id:
          weekId,

        week_position:
          weekPosition,

        tutor_id:
          auth.tutor.id,

        scheduled_for:
          scheduledFor,

        completed_at:
          null,

        duration_minutes:
          duration,

        status:
          "planned",

        topic,

        lesson_notes:
          lessonNotes,

        understanding_rating:
          null,

        next_topic:
          null,

        homework_summary:
          null,

        meeting_url:
          meetingUrl,

        student_rate:
          engagement.student_rate,

        tutor_rate:
          engagement.tutor_rate,

        currency:
          engagement.currency ||
          "GBP",
      })
      .select(
        "id,scheduled_for,status,topic,duration_minutes,next_topic,homework_summary,meeting_url",
      )
      .single();


  if (
    createError ||
    !created
  ) {
    throw new Error(
      createError?.message ||
        "Could not create the session.",
    );
  }


  /*
   * Optional student notification.
   * Uses the same email workflow as the
   * existing admin session scheduler.
   */
  if (
    formData.get(
      "notifyStudent",
    ) === "on"
  ) {
    const {
      data: student,
    } =
      await supabase
        .from(
          "students",
        )
        .select(
          "name,email",
        )
        .eq(
          "id",
          engagement.student_id,
        )
        .maybeSingle();


    if (
      student?.email
    ) {
      const result =
        await sendSessionNotification({
          sessionId:
            created.id,

          name:
            student.name,

          email:
            student.email,

          topic:
            created.topic,

          status:
            created.status,

          scheduledFor:
            created.scheduled_for,

          durationMinutes:
            created.duration_minutes,

          nextTopic:
            created.next_topic,

          homeworkSummary:
            created.homework_summary,

          meetingUrl:
            created.meeting_url,
        });


      await recordStudentCommunication({
        studentId:
          engagement.student_id,

        engagementId:
          engagement.id,

        type:
          "session_update",

        recipient:
          student.email,

        subject:
          `Tutoring session scheduled: ${created.topic}`,

        result,

        createdByEmail:
          auth.user.email ||
          null,
      });
    }
  }


  refreshWorkspace(
    engagement.id,
  );
}



/* ============================================================
   MANAGED WEEK SESSION
   Creates the session and, when selected, a MAT-managed Zoom
   meeting using the shared host.
   ============================================================ */

export async function createTutorSessionInWeekManaged(
  formData: FormData,
) {
  const {
    auth,
    supabase,
  } =
    await getContext();

  const tutorTimeZone =
    normalizeTimeZone(
      auth.tutor.timezone,
      DEFAULT_TIME_ZONE,
    );



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


  const ownedWeek =
    await requireWeek(
      weekId,
      auth.tutor.id,
    );


  const {
    data: week,
    error: weekError,
  } =
    await supabase
      .from(
        "tutoring_weeks",
      )
      .select(
        "id,engagement_id,week_start,week_end",
      )
      .eq(
        "id",
        weekId,
      )
      .eq(
        "engagement_id",
        ownedWeek.engagement_id,
      )
      .maybeSingle();


  if (
    weekError ||
    !week
  ) {
    throw new Error(
      "Learning week not found.",
    );
  }


  const {
    data: engagement,
    error:
      engagementError,
  } =
    await supabase
      .from(
        "tutoring_engagements",
      )
      .select(
        "id,student_id,tutor_id,subject,session_duration_minutes,student_rate,tutor_rate,currency",
      )
      .eq(
        "id",
        week.engagement_id,
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
      "You do not have access to this course workspace.",
    );
  }


  const topic =
    clean(
      formData.get(
        "topic",
      ),
      500,
    );


  const rawScheduledFor =
    clean(
      formData.get(
        "scheduledFor",
      ),
      40,
    );


  const rawDuration =
    Number(
      clean(
        formData.get(
          "durationMinutes",
        ),
        20,
      ),
    );


  const duration =
    Number.isFinite(
      rawDuration,
    ) &&
    rawDuration >= 15 &&
    rawDuration <= 480
      ? Math.round(
          rawDuration,
        )
      : Number(
          engagement.session_duration_minutes ||
            60,
        );


  if (
    !topic ||
    !rawScheduledFor
  ) {
    throw new Error(
      "Session topic and date/time are required.",
    );
  }


  const localDate =
    rawScheduledFor.slice(
      0,
      10,
    );


  if (
    localDate <
      week.week_start ||
    localDate >
      week.week_end
  ) {
    throw new Error(
      `Choose a session date between ${week.week_start} and ${week.week_end}.`,
    );
  }


  const scheduledFor =
    tutorLocalToIso(
      rawScheduledFor,
      tutorTimeZone,
    );


  if (!scheduledFor) {
    throw new Error(
      "Please choose a valid date and time in your tutor timezone.",
    );
  }


  /*
   * Tutor conflict:
   * this tutor cannot teach two
   * students/courses simultaneously.
   */
  const {
    data:
      existingSessions,

    error:
      sessionCheckError,
  } =
    await supabase
      .from(
        "tutoring_sessions",
      )
      .select(
        "id,topic,scheduled_for,duration_minutes",
      )
      .eq(
        "tutor_id",
        auth.tutor.id,
      )
      .eq(
        "status",
        "planned",
      )
      .not(
        "scheduled_for",
        "is",
        null,
      );


  if (sessionCheckError) {
    throw new Error(
      sessionCheckError.message,
    );
  }


  const newStart =
    new Date(
      scheduledFor,
    ).getTime();


  const newEnd =
    newStart +
    duration *
      60 *
      1000;


  const tutorConflict =
    (
      existingSessions ||
      []
    ).find(
      (session) => {
        if (
          !session.scheduled_for
        ) {
          return false;
        }


        const existingStart =
          new Date(
            session.scheduled_for,
          ).getTime();


        const existingEnd =
          existingStart +
          Number(
            session.duration_minutes ||
              60,
          ) *
            60 *
            1000;


        return (
          newStart <
            existingEnd &&
          existingStart <
            newEnd
        );
      },
    );


  if (tutorConflict) {
    const when =
      new Intl.DateTimeFormat(
        "en-GB",
        {
          dateStyle:
            "medium",

          timeStyle:
            "short",

          timeZone:
            tutorTimeZone,
        },
      ).format(
        new Date(
          tutorConflict.scheduled_for,
        ),
      );


    throw new Error(
      `You already have "${tutorConflict.topic}" scheduled at ${when}. Choose another time.`,
    );
  }


  const {
    data:
      lastPosition,
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
          ascending:
            false,

          nullsFirst:
            false,
        },
      )
      .limit(1);


  const weekPosition =
    Number(
      lastPosition?.[0]
        ?.week_position ||
        0,
    ) + 1;


  const shouldCreateZoom =
    formData.get(
      "createZoomMeeting",
    ) === "on";


  const manualMeetingUrl =
    tutorSessionSafeUrl(
      clean(
        formData.get(
          "meetingUrl",
        ),
        1000,
      ) ||
        null,
    );


  const lessonNotes =
    clean(
      formData.get(
        "lessonNotes",
      ),
      8000,
    ) ||
    null;


  const {
    data: inserted,
    error:
      insertError,
  } =
    await supabase
      .from(
        "tutoring_sessions",
      )
      .insert({
        engagement_id:
          engagement.id,

        week_id:
          weekId,

        week_position:
          weekPosition,

        tutor_id:
          auth.tutor.id,

        scheduled_for:
          scheduledFor,

        completed_at:
          null,

        duration_minutes:
          duration,

        status:
          "planned",

        topic,

        lesson_notes:
          lessonNotes,

        understanding_rating:
          null,

        next_topic:
          null,

        homework_summary:
          null,

        meeting_url:
          shouldCreateZoom
            ? null
            : manualMeetingUrl,

        student_rate:
          engagement.student_rate,

        tutor_rate:
          engagement.tutor_rate,

        currency:
          engagement.currency ||
          "GBP",
      })
      .select(
        "id,scheduled_for,status,topic,duration_minutes,next_topic,homework_summary,meeting_url",
      )
      .single();


  if (
    insertError ||
    !inserted
  ) {
    throw new Error(
      insertError?.message ||
        "Could not create the session.",
    );
  }


  let created =
    inserted;


  let createdZoomId:
    | string
    | null =
    null;


  if (shouldCreateZoom) {
    try {
      const zoom =
        await createManagedZoomMeeting({
          supabase,
          topic,
          scheduledFor,
          durationMinutes:
            duration,
        });


      createdZoomId =
        zoom.zoomMeetingId;


      const {
        data:
          updated,

        error:
          zoomUpdateError,
      } =
        await supabase
          .from(
            "tutoring_sessions",
          )
          .update({
            meeting_url:
              zoom.meetingUrl,

            zoom_meeting_id:
              zoom.zoomMeetingId,

            zoom_meeting_uuid:
              zoom.zoomMeetingUuid,

            zoom_host_user_id:
              zoom.zoomHostUserId,

            zoom_synced_at:
              zoom.zoomSyncedAt,

            updated_at:
              new Date()
                .toISOString(),
          })
          .eq(
            "id",
            inserted.id,
          )
          .select(
            "id,scheduled_for,status,topic,duration_minutes,next_topic,homework_summary,meeting_url",
          )
          .single();


      if (
        zoomUpdateError ||
        !updated
      ) {
        await cleanupManagedZoomMeeting(
          createdZoomId,
        );


        await supabase
          .from(
            "tutoring_sessions",
          )
          .delete()
          .eq(
            "id",
            inserted.id,
          );


        throw new Error(
          zoomUpdateError?.message ||
            "Could not attach the Zoom meeting to the session.",
        );
      }


      created =
        updated;

    } catch (
      error
    ) {
      await supabase
        .from(
          "tutoring_sessions",
        )
        .delete()
        .eq(
          "id",
          inserted.id,
        );


      throw error;
    }
  }


  if (
    formData.get(
      "notifyStudent",
    ) === "on"
  ) {
    const {
      data: student,
    } =
      await supabase
        .from(
          "students",
        )
        .select(
          "name,email",
        )
        .eq(
          "id",
          engagement.student_id,
        )
        .maybeSingle();


    if (
      student?.email
    ) {
      const result =
        await sendSessionNotification({
          sessionId:
            created.id,

          name:
            student.name,

          email:
            student.email,

          topic:
            created.topic,

          status:
            created.status,

          scheduledFor:
            created.scheduled_for,

          durationMinutes:
            created.duration_minutes,

          nextTopic:
            created.next_topic,

          homeworkSummary:
            created.homework_summary,

          meetingUrl:
            created.meeting_url,
        });


      await recordStudentCommunication({
        studentId:
          engagement.student_id,

        engagementId:
          engagement.id,

        type:
          "session_update",

        recipient:
          student.email,

        subject:
          `Tutoring session scheduled: ${created.topic}`,

        result,

        createdByEmail:
          auth.user.email ||
          null,
      });
    }
  }


  refreshWorkspace(
    engagement.id,
  );
}


/* ============================================================
   WEEK / SESSION HOMEWORK
   ============================================================ */

export async function createTutorHomeworkInWeek(
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
    ) ||
    null;


  const title =
    clean(
      formData.get(
        "title",
      ),
      500,
    );


  const description =
    clean(
      formData.get(
        "description",
      ),
      5000,
    ) ||
    null;


  const rawDueDate =
    clean(
      formData.get(
        "dueDate",
      ),
      20,
    );


  const dueDate =
    rawDueDate &&
    validDate(
      rawDueDate,
    )
      ? rawDueDate
      : null;


  if (
    !uuidPattern.test(
      weekId,
    ) ||
    !title
  ) {
    throw new Error(
      "Week and homework title are required.",
    );
  }


  const week =
    await requireWeek(
      weekId,
      auth.tutor.id,
    );


  if (sessionId) {
    if (
      !uuidPattern.test(
        sessionId,
      )
    ) {
      throw new Error(
        "Invalid session.",
      );
    }


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
          "id",
        )
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
        )
        .maybeSingle();


    if (
      sessionError ||
      !session
    ) {
      throw new Error(
        "That session does not belong to this week.",
      );
    }
  }


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
        "id,student_id",
      )
      .eq(
        "id",
        week.engagement_id,
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
      "Course workspace not found.",
    );
  }


  const {
    data: created,
    error,
  } =
    await supabase
      .from(
        "homework",
      )
      .insert({
        engagement_id:
          engagement.id,

        week_id:
          weekId,

        session_id:
          sessionId,

        title,

        description,

        due_date:
          dueDate,

        status:
          "assigned",
      })
      .select(
        "id,title,description,due_date,status",
      )
      .single();


  if (
    error ||
    !created
  ) {
    throw new Error(
      error?.message ||
        "Could not assign homework.",
    );
  }


  if (
    formData.get(
      "notifyStudent",
    ) === "on"
  ) {
    const {
      data: student,
    } =
      await supabase
        .from(
          "students",
        )
        .select(
          "name,email",
        )
        .eq(
          "id",
          engagement.student_id,
        )
        .maybeSingle();


    if (
      student?.email
    ) {
      const result =
        await sendHomeworkNotification({
          homeworkId:
            created.id,

          name:
            student.name,

          email:
            student.email,

          title:
            created.title,

          description:
            created.description,

          dueDate:
            created.due_date,

          status:
            created.status,
        });


      await recordStudentCommunication({
        studentId:
          engagement.student_id,

        engagementId:
          engagement.id,

        type:
          "homework_assigned",

        recipient:
          student.email,

        subject:
          `New homework: ${created.title}`,

        result,

        createdByEmail:
          auth.user.email ||
          null,
      });
    }
  }


  refreshWorkspace(
    engagement.id,
  );
}


export async function reviewTutorHomeworkInWeek(
  formData: FormData,
) {
  const {
    auth,
    supabase,
  } =
    await getContext();


  const homeworkId =
    clean(
      formData.get(
        "homeworkId",
      ),
      100,
    );


  const status =
    clean(
      formData.get(
        "status",
      ),
      30,
    ) as HomeworkStatus;


  const feedback =
    clean(
      formData.get(
        "feedback",
      ),
      5000,
    ) ||
    null;


  if (
    !uuidPattern.test(
      homeworkId,
    ) ||
    !homeworkStatuses.includes(
      status,
    )
  ) {
    throw new Error(
      "Invalid homework update.",
    );
  }


  const {
    data:
      homework,
    error:
      homeworkError,
  } =
    await supabase
      .from(
        "homework",
      )
      .select(
        "id,engagement_id,title,description,due_date,status,tutor_feedback",
      )
      .eq(
        "id",
        homeworkId,
      )
      .maybeSingle();


  if (
    homeworkError ||
    !homework
  ) {
    throw new Error(
      "Homework item not found.",
    );
  }


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
        "id,student_id",
      )
      .eq(
        "id",
        homework.engagement_id,
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
      "You do not have access to this homework.",
    );
  }


  const {
    data:
      updated,
    error:
      updateError,
  } =
    await supabase
      .from(
        "homework",
      )
      .update({
        status,

        tutor_feedback:
          feedback,

        updated_at:
          new Date()
            .toISOString(),
      })
      .eq(
        "id",
        homeworkId,
      )
      .select(
        "id,title,description,due_date,status,tutor_feedback",
      )
      .single();


  if (
    updateError ||
    !updated
  ) {
    throw new Error(
      updateError?.message ||
        "Could not update homework.",
    );
  }


  if (
    formData.get(
      "notifyStudent",
    ) === "on"
  ) {
    const {
      data: student,
    } =
      await supabase
        .from(
          "students",
        )
        .select(
          "name,email",
        )
        .eq(
          "id",
          engagement.student_id,
        )
        .maybeSingle();


    if (
      student?.email
    ) {
      const result =
        await sendHomeworkNotification({
          homeworkId:
            updated.id,

          name:
            student.name,

          email:
            student.email,

          title:
            updated.title,

          description:
            updated.description,

          dueDate:
            updated.due_date,

          status:
            updated.status,

          feedback:
            updated.tutor_feedback,
        });


      await recordStudentCommunication({
        studentId:
          engagement.student_id,

        engagementId:
          engagement.id,

        type:
          "homework_update",

        recipient:
          student.email,

        subject:
          `Homework update: ${updated.title}`,

        result,

        createdByEmail:
          auth.user.email ||
          null,
      });
    }
  }


  refreshWorkspace(
    engagement.id,
  );
}
