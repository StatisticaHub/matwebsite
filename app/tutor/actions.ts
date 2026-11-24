"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getTutorSession } from "@/lib/tutor-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  sendHomeworkNotification,
  sendSessionNotification,
} from "@/lib/email/student";
import { recordStudentCommunication } from "@/lib/student-communications";
import { sessionStatuses, type SessionStatus } from "@/lib/delivery-data";

import {
  DEFAULT_TIME_ZONE,
  normalizeTimeZone,
  zonedLocalDateTimeToUtc,
} from "@/lib/time-zone";
import {
  createZoomMeeting,
  deleteZoomMeeting,
  updateZoomMeeting,
  zoomHostUserId,
} from "@/lib/zoom";
function text(formData: FormData, key: string, max = 5000) {
  return String(formData.get(key) || "").trim().slice(0, max);
}
function nullableText(formData: FormData, key: string, max = 5000) {
  const value = text(formData, key, max);
  return value || null;
}
function nullableNumber(formData: FormData, key: string) {
  const raw = text(formData, key, 50);
  if (!raw) return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}
function safeUrl(value: string | null) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return ["https:", "http:"].includes(url.protocol) ? url.toString() : null;
  } catch { return null; }
}
async function tutorContext() {
  const session = await getTutorSession();
  if (!session) redirect("/tutor/login?unauthorized=1");
  return { session, supabase: createAdminClient() };
}

export async function updateTutorAvailabilityFromPortal(formData: FormData) {
  const { session, supabase } = await tutorContext();
  const availabilityDays = formData.getAll("availabilityDays").map(String).filter(Boolean);
  const availabilityPeriods = formData.getAll("availabilityPeriods").map(String).filter(Boolean);
  const capacity = nullableNumber(formData, "weeklyCapacityHours");
  const maxStudents = nullableNumber(formData, "maxActiveStudents");
  const timezone =
    normalizeTimeZone(
      text(
        formData,
        "timezone",
        120,
      ),
      DEFAULT_TIME_ZONE,
    );

  const { error } = await supabase.from("tutors").update({
    timezone,
    availability_notes: nullableText(formData, "availabilityNotes", 2000),
    availability_days: availabilityDays,
    availability_periods: availabilityPeriods,
    weekly_capacity_hours: capacity !== null ? Math.max(0, Math.min(80, capacity)) : null,
    max_active_students: maxStudents !== null ? Math.max(0, Math.min(100, Math.round(maxStudents))) : null,
    accepts_trials: formData.get("acceptsTrials") === "yes",
    updated_at: new Date().toISOString(),
  }).eq("id", session.tutor.id);
  if (error) throw new Error(error.message);
  revalidatePath("/tutor");
  revalidatePath("/tutor/availability");
  redirect("/tutor/availability?saved=1");
}

export async function updateTutorSessionRecord(formData: FormData) {
  const { session, supabase } = await tutorContext();
  const sessionId = text(formData, "sessionId", 100);
  const status = text(formData, "status", 30) as SessionStatus;

  if (!sessionId || !sessionStatuses.includes(status)) return;

  const { data: row, error: rowError } = await supabase
    .from("tutoring_sessions")
    .select(
      "id,tutor_id,completed_at,engagement_id,tutoring_engagements(tutor_id,student_id)",
    )
    .eq("id", sessionId)
    .single();

  if (rowError || !row) {
    throw new Error(
      rowError?.message || "Session not found.",
    );
  }

  const engagement =
    row.tutoring_engagements as unknown as {
      tutor_id: string | null;
      student_id: string;
    } | null;

  if (
    row.tutor_id !== session.tutor.id &&
    engagement?.tutor_id !== session.tutor.id
  ) {
    throw new Error(
      "You do not have access to this session.",
    );
  }

  const rating =
    nullableNumber(
      formData,
      "understandingRating",
    );

  const meetingUrl =
    safeUrl(
      nullableText(
        formData,
        "meetingUrl",
        1000,
      ),
    );

  const completedAt =
    status === "completed"
      ? (
          row.completed_at ||
          new Date().toISOString()
        )
      : null;

  const {
    data: updated,
    error,
  } = await supabase
    .from("tutoring_sessions")
    .update({
      status,
      completed_at: completedAt,
      lesson_notes:
        nullableText(
          formData,
          "lessonNotes",
          8000,
        ),
      understanding_rating:
        rating !== null &&
        rating >= 1 &&
        rating <= 5
          ? Math.round(rating)
          : null,
      next_topic:
        nullableText(
          formData,
          "nextTopic",
          1000,
        ),
      homework_summary:
        nullableText(
          formData,
          "homeworkSummary",
          3000,
        ),
      meeting_url: meetingUrl,
      updated_at:
        new Date().toISOString(),
    })
    .eq("id", sessionId)
    .select(
      "id,engagement_id,scheduled_for,status,topic,duration_minutes,next_topic,homework_summary,meeting_url",
    )
    .single();

  if (error || !updated) {
    throw new Error(
      error?.message ||
        "Could not update session.",
    );
  }

  /*
   * Optional post-session assignment.
   *
   * Reuses assignTutorHomework(), which already:
   * - verifies tutor ownership;
   * - links homework to this session;
   * - uses source_session_id;
   * - updates the existing assignment instead of duplicating it.
   */
  if (
    status === "completed" &&
    formData.get("createHomework") === "on"
  ) {
    const homeworkTitle =
      text(
        formData,
        "homeworkTitle",
        500,
      );

    if (!homeworkTitle) {
      throw new Error(
        "Add a homework title before creating the assignment.",
      );
    }

    const homeworkForm =
      new FormData();

    homeworkForm.set(
      "sessionId",
      sessionId,
    );

    homeworkForm.set(
      "title",
      homeworkTitle,
    );

    const homeworkDescription =
      nullableText(
        formData,
        "homeworkDescription",
        8000,
      );

    if (homeworkDescription) {
      homeworkForm.set(
        "description",
        homeworkDescription,
      );
    }

    const homeworkDueDate =
      text(
        formData,
        "homeworkDueDate",
        20,
      );

    if (homeworkDueDate) {
      homeworkForm.set(
        "dueDate",
        homeworkDueDate,
      );
    }

    await assignTutorHomework(
      homeworkForm,
    );
  }

  /*
   * Completed-session student follow-up.
   *
   * Notification failure must not roll back the
   * teaching record, matching the existing MAT
   * session scheduling behaviour.
   */
  if (
    status === "completed" &&
    formData.get("notifyStudent") === "on" &&
    engagement?.student_id
  ) {
    try {
      const {
        data: student,
      } = await supabase
        .from("students")
        .select("name,email")
        .eq(
          "id",
          engagement.student_id,
        )
        .maybeSingle();

      if (student?.email) {
        const result =
          await sendSessionNotification({
            sessionId:
              updated.id,
            name:
              student.name,
            email:
              student.email,
            topic:
              updated.topic,
            status:
              updated.status,
            scheduledFor:
              updated.scheduled_for,
            durationMinutes:
              updated.duration_minutes,
            nextTopic:
              updated.next_topic,
            homeworkSummary:
              updated.homework_summary,
            meetingUrl:
              updated.meeting_url,
          });

        await recordStudentCommunication({
          studentId:
            engagement.student_id,
          engagementId:
            updated.engagement_id,
          type:
            "session_update",
          recipient:
            student.email,
          subject:
            `Session follow-up: ${updated.topic}`,
          result,
          createdByEmail:
            session.user.email ||
            null,
        });
      }
    } catch (notificationError) {
      console.error(
        "Tutor completed the session, but the student follow-up notification failed:",
        notificationError,
      );
    }
  }

  revalidatePath("/tutor");
  revalidatePath("/tutor/sessions");
  revalidatePath(
    `/tutor/sessions/${sessionId}`,
  );
  revalidatePath(
    `/tutor/students/${row.engagement_id}`,
  );
  revalidatePath("/admin/sessions");

  if (engagement?.student_id) {
    revalidatePath(
      `/admin/students/${engagement.student_id}`,
    );
  }

  redirect(
    `/tutor/sessions/${sessionId}?saved=1`,
  );
}

export async function updateTutorTrialRecord(formData: FormData) {
  const { session, supabase } = await tutorContext();
  const leadId = text(formData, "leadId", 100);
  const status = text(formData, "trialStatus", 30);
  if (!leadId || !["scheduled", "completed", "cancelled", "no_show"].includes(status)) return;

  const { data: lead, error: leadError } = await supabase
    .from("tutoring_leads")
    .select("id,assigned_tutor_id")
    .eq("id", leadId)
    .single();
  if (leadError || !lead) throw new Error(leadError?.message || "Trial not found.");
  if (lead.assigned_tutor_id !== session.tutor.id) throw new Error("You do not have access to this trial.");

  const { error } = await supabase.from("tutoring_leads").update({
    trial_status: status,
    trial_completed_at: ["completed", "no_show"].includes(status) ? new Date().toISOString() : null,
    trial_tutor_feedback: nullableText(formData, "trialTutorFeedback", 5000),
    updated_at: new Date().toISOString(),
  }).eq("id", leadId);
  if (error) throw new Error(error.message);

  revalidatePath("/tutor");
  revalidatePath("/tutor/trials");
  redirect("/tutor/trials?saved=1");
}

export async function assignTutorHomework(
  formData: FormData
) {
  const { session, supabase } = await tutorContext();
  const sessionId = text(formData, "sessionId", 100);
  const title = text(formData, "title", 500);
  const description = nullableText(formData, "description", 8000);
  const rawDueDate = text(formData, "dueDate", 20);
  const dueDate = /^\d{4}-\d{2}-\d{2}$/.test(rawDueDate)
    ? rawDueDate
    : null;

  if (!sessionId || !title) return;

  const { data: row, error: rowError } = await supabase
    .from("tutoring_sessions")
    .select("id,tutor_id,engagement_id,tutoring_engagements(tutor_id)")
    .eq("id", sessionId)
    .single();

  if (rowError || !row) {
    throw new Error(rowError?.message || "Session not found.");
  }

  const engagement = row.tutoring_engagements as unknown as
    | { tutor_id: string | null }
    | null;

  if (
    row.tutor_id !== session.tutor.id &&
    engagement?.tutor_id !== session.tutor.id
  ) {
    throw new Error("You do not have access to this session.");
  }

  const { data: existing } = await supabase
    .from("homework")
    .select("id")
    .eq("engagement_id", row.engagement_id)
    .eq("source_session_id", sessionId)
    .maybeSingle();

  const payload = {
    engagement_id: row.engagement_id,
    session_id: sessionId,
    source_session_id: sessionId,
    title,
    description,
    due_date: dueDate,
    status: "assigned",
    updated_at: new Date().toISOString(),
  };

  if (existing?.id) {
    const { error } = await supabase
      .from("homework")
      .update(payload)
      .eq("id", existing.id);

    if (error) throw new Error(error.message || "Could not update homework.");
  } else {
    const { error } = await supabase
      .from("homework")
      .insert(payload);

    if (error) throw new Error(error.message || "Could not assign homework.");
  }

  revalidatePath(`/tutor/sessions/${sessionId}`);
  revalidatePath("/tutor/sessions");
}


export async function updateTutorAssignmentFromWorkspace(
  formData: FormData,
) {
  const {
    session,
    supabase,
  } =
    await tutorContext();


  const homeworkId =
    text(
      formData,
      "homeworkId",
      100,
    );


  const status =
    text(
      formData,
      "status",
      30,
    );


  const feedback =
    nullableText(
      formData,
      "feedback",
      5000,
    );


  const notifyStudent =
    formData.get(
      "notifyStudent",
    ) === "on";


  const validStatuses = [
    "assigned",
    "submitted",
    "reviewed",
    "completed",
    "skipped",
  ];


  if (
    !homeworkId ||
    !validStatuses.includes(
      status,
    )
  ) {
    return;
  }


  const {
    data: homework,
    error: homeworkError,
  } =
    await supabase
      .from(
        "homework",
      )
      .select(
        "id,engagement_id",
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
      homeworkError?.message ||
        "Assignment not found.",
    );
  }


  const {
    data: engagement,
    error: engagementError,
  } =
    await supabase
      .from(
        "tutoring_engagements",
      )
      .select(
        "id,tutor_id,student_id",
      )
      .eq(
        "id",
        homework.engagement_id,
      )
      .eq(
        "tutor_id",
        session.tutor.id,
      )
      .maybeSingle();


  if (
    engagementError ||
    !engagement
  ) {
    throw new Error(
      "You do not have access to this assignment.",
    );
  }


  const {
    data: updated,
    error: updateError,
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
        "id,engagement_id,title,description,due_date,status,tutor_feedback",
      )
      .single();


  if (
    updateError ||
    !updated
  ) {
    throw new Error(
      updateError?.message ||
        "Could not update assignment.",
    );
  }


  if (notifyStudent) {
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
          session.user.email ||
          null,
      });
    }
  }


  revalidatePath(
    "/tutor",
  );

  revalidatePath(
    "/tutor/assignments",
  );

  revalidatePath(
    `/tutor/students/${engagement.id}`,
  );
}


/* MAT_TUTOR_SESSION_SCHEDULING
   ========================================================================== */

function sessionRequestLine(
  message: string,
  label: string,
) {
  const prefix = `${label}:`;

  const line = message
    .split(/\r?\n/)
    .find((item) =>
      item.trim().startsWith(prefix),
    );

  if (!line) return null;

  return (
    line
      .trim()
      .slice(prefix.length)
      .trim() || null
  );
}


function sessionRequestSection(
  message: string,
  startLabel: string,
  endLabel?: string,
) {
  const startToken =
    `${startLabel}:`;

  const start =
    message.indexOf(startToken);

  if (start < 0) {
    return null;
  }

  const contentStart =
    start + startToken.length;

  let contentEnd =
    message.length;

  if (endLabel) {
    const endToken =
      `${endLabel}:`;

    const found =
      message.indexOf(
        endToken,
        contentStart,
      );

    if (found >= 0) {
      contentEnd = found;
    }
  }

  return (
    message
      .slice(
        contentStart,
        contentEnd,
      )
      .trim() || null
  );
}


function requestedSessionDuration(
  message: string,
) {
  const value =
    sessionRequestLine(
      message,
      "Session length",
    );

  const match =
    value?.match(
      /(\d{1,3})/,
    );

  if (!match) {
    return null;
  }

  const duration =
    Number(match[1]);

  return (
    Number.isFinite(duration) &&
    duration >= 15 &&
    duration <= 480
  )
    ? duration
    : null;
}


async function notifyTutorScheduledSession(
  args: {
    supabase:
      ReturnType<
        typeof createAdminClient
      >;

    createdByEmail:
      string | null;

    studentId:
      string;

    engagementId:
      string;

    sessionRow: {
      id: string;
      scheduled_for:
        string | null;
      status: string;
      topic: string;
      duration_minutes:
        number;
      meeting_url:
        string | null;
    };
  },
) {
  const {
    data: student,
  } =
    await args.supabase
      .from("students")
      .select("name,email")
      .eq(
        "id",
        args.studentId,
      )
      .maybeSingle();

  if (!student?.email) {
    return;
  }

  const result =
    await sendSessionNotification({
      sessionId:
        args.sessionRow.id,

      name:
        student.name,

      email:
        student.email,

      topic:
        args.sessionRow.topic,

      status:
        args.sessionRow.status,

      scheduledFor:
        args.sessionRow
          .scheduled_for,

      durationMinutes:
        args.sessionRow
          .duration_minutes,

      nextTopic:
        null,

      homeworkSummary:
        null,

      meetingUrl:
        args.sessionRow
          .meeting_url,
    });

  await recordStudentCommunication({
    studentId:
      args.studentId,

    engagementId:
      args.engagementId,

    type:
      "session_update",

    recipient:
      student.email,

    subject:
      `Tutoring session scheduled: ${args.sessionRow.topic}`,

    result,

    createdByEmail:
      args.createdByEmail,
  });
}


export async function scheduleTutorSessionFromPortal(
  formData: FormData,
) {
  const {
    session,
    supabase,
  } =
    await tutorContext();

  const requestId =
    text(
      formData,
      "requestId",
      100,
    );

  const useRequestedTime =
    formData.get(
      "useRequestedTime",
    ) === "yes";

  let engagementId =
    text(
      formData,
      "engagementId",
      100,
    );

  let topic =
    text(
      formData,
      "topic",
      500,
    );

  let duration =
    nullableNumber(
      formData,
      "durationMinutes",
    );

  let scheduledFor:
    string | null =
      null;

  let request:
    | {
        id: string;
        student_id: string;
        engagement_id:
          string | null;
        category: string;
        message: string;
        status: string;
        admin_note:
          string | null;
      }
    | null =
      null;


  /*
   * When this comes from a student's request,
   * resolve all ownership-sensitive details
   * from the database rather than trusting the form.
   */
  if (requestId) {
    const {
      data,
      error,
    } =
      await supabase
        .from(
          "student_support_requests",
        )
        .select(
          "id,student_id,engagement_id,category,message,status,admin_note",
        )
        .eq(
          "id",
          requestId,
        )
        .maybeSingle();

    if (
      error ||
      !data
    ) {
      throw new Error(
        error?.message ||
          "Session request not found.",
      );
    }

    if (
      data.category !==
        "session_request" ||
      data.status ===
        "resolved"
    ) {
      throw new Error(
        "This session request is no longer available.",
      );
    }

    if (!data.engagement_id) {
      throw new Error(
        "This request is not linked to an active tutoring engagement.",
      );
    }

    request = data;

    engagementId =
      data.engagement_id;

    if (
      useRequestedTime
    ) {
      const preferredUtc =
        sessionRequestLine(
          data.message,
          "Preferred UTC",
        );

      if (
        !preferredUtc ||
        Number.isNaN(
          new Date(
            preferredUtc,
          ).getTime(),
        )
      ) {
        throw new Error(
          "The student's requested time could not be read.",
        );
      }

      scheduledFor =
        new Date(
          preferredUtc,
        ).toISOString();

      topic =
        topic ||
        sessionRequestSection(
          data.message,
          "Topic / goal",
          "Additional notes",
        ) ||
        "";

      duration =
        duration ||
        requestedSessionDuration(
          data.message,
        );
    }
  }


  if (!engagementId) {
    throw new Error(
      "Choose a student before scheduling the session.",
    );
  }


  /*
   * Tutors may schedule only their own active engagements.
   */
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
        "id,student_id,tutor_id,status,subject,session_duration_minutes,student_rate,tutor_rate,currency",
      )
      .eq(
        "id",
        engagementId,
      )
      .eq(
        "tutor_id",
        session.tutor.id,
      )
      .eq(
        "status",
        "active",
      )
      .maybeSingle();

  if (
    engagementError ||
    !engagement
  ) {
    throw new Error(
      "You do not have access to this student's tutoring engagement.",
    );
  }


  if (
    request &&
    request.student_id !==
      engagement.student_id
  ) {
    throw new Error(
      "The session request does not belong to this student.",
    );
  }


  topic =
    topic ||
    engagement.subject ||
    "Tutoring session";


  /*
   * Tutor-selected date/time.
   *
   * datetime values are entered in the tutor's
   * configured timezone, then converted to UTC.
   */
  if (!scheduledFor) {
    const scheduledDate =
      text(
        formData,
        "scheduledDate",
        20,
      );

    const scheduledTime =
      text(
        formData,
        "scheduledTime",
        20,
      );

    const timeZone =
      normalizeTimeZone(
        text(
          formData,
          "timeZone",
          120,
        ) ||
          session.tutor
            .timezone,
        DEFAULT_TIME_ZONE,
      );

    if (
      !scheduledDate ||
      !scheduledTime
    ) {
      throw new Error(
        "Choose a date and time for the session.",
      );
    }

    const converted =
      zonedLocalDateTimeToUtc(
        scheduledDate,
        scheduledTime,
        timeZone,
      );

    if (!converted.ok) {
      throw new Error(
        converted.error,
      );
    }

    scheduledFor =
      converted.iso;
  }


  const scheduledMs =
    new Date(
      scheduledFor,
    ).getTime();

  if (
    Number.isNaN(
      scheduledMs,
    )
  ) {
    throw new Error(
      "Choose a valid session date and time.",
    );
  }

  if (
    scheduledMs <
    Date.now() - 60_000
  ) {
    throw new Error(
      "The session time must be in the future.",
    );
  }


  const finalDuration =
    duration !== null &&
    duration >= 15 &&
    duration <= 480
      ? Math.round(
          duration,
        )
      : engagement
          .session_duration_minutes ||
        60;


  /*
   * Prevent the tutor from double-booking themselves.
   */
  const proposedEnd =
    scheduledMs +
    finalDuration *
      60_000;

  const searchStart =
    new Date(
      scheduledMs -
        12 *
          60 *
          60 *
          1000,
    ).toISOString();

  const searchEnd =
    new Date(
      proposedEnd +
        12 *
          60 *
          60 *
          1000,
    ).toISOString();

  const {
    data:
      nearbySessions,
    error:
      conflictError,
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
        session.tutor.id,
      )
      .eq(
        "status",
        "planned",
      )
      .gte(
        "scheduled_for",
        searchStart,
      )
      .lte(
        "scheduled_for",
        searchEnd,
      );

  if (conflictError) {
    throw new Error(
      conflictError.message,
    );
  }

  const conflict =
    (
      nearbySessions ||
      []
    ).find(
      (
        existing,
      ) => {
        if (
          !existing
            .scheduled_for
        ) {
          return false;
        }

        const existingStart =
          new Date(
            existing
              .scheduled_for,
          ).getTime();

        const existingEnd =
          existingStart +
          Number(
            existing
              .duration_minutes ||
              60,
          ) *
            60_000;

        return (
          scheduledMs <
            existingEnd &&
          proposedEnd >
            existingStart
        );
      },
    );

  if (conflict) {
    throw new Error(
      `You already have "${conflict.topic}" scheduled at that time.`,
    );
  }


  const manualMeetingUrl =
    safeUrl(
      nullableText(
        formData,
        "meetingUrl",
        1000,
      ),
    );


  /*
   * If the tutor does not explicitly supply another
   * meeting URL, MAT creates a managed Zoom meeting.
   */
  let zoomMeeting:
    | {
        id: string;
        uuid: string | null;
        joinUrl: string;
      }
    | null = null;


  if (!manualMeetingUrl) {

    /*
     * MAT currently uses a managed Zoom host.
     * Prevent overlapping managed Zoom meetings,
     * even when they belong to different tutors.
     */
    const {
      data:
        managedZoomSessions,
      error:
        zoomConflictError,
    } =
      await supabase
        .from(
          "tutoring_sessions",
        )
        .select(
          "id,topic,scheduled_for,duration_minutes,zoom_meeting_id",
        )
        .eq(
          "status",
          "planned",
        )
        .not(
          "zoom_meeting_id",
          "is",
          null,
        )
        .gte(
          "scheduled_for",
          searchStart,
        )
        .lte(
          "scheduled_for",
          searchEnd,
        );

    if (zoomConflictError) {
      throw new Error(
        zoomConflictError.message,
      );
    }


    const zoomConflict =
      (
        managedZoomSessions ||
        []
      ).find(
        (
          existing,
        ) => {
          if (
            !existing
              .scheduled_for
          ) {
            return false;
          }

          const existingStart =
            new Date(
              existing
                .scheduled_for,
            ).getTime();

          const existingEnd =
            existingStart +
            Number(
              existing
                .duration_minutes ||
                60,
            ) *
              60_000;

          return (
            scheduledMs <
              existingEnd &&
            proposedEnd >
              existingStart
          );
        },
      );


    if (zoomConflict) {
      throw new Error(
        `The MAT Zoom host is already in use for "${zoomConflict.topic}" at that time. Choose another time or enter a different meeting link.`,
      );
    }


    zoomMeeting =
      await createZoomMeeting({
        topic:
          `My Academic Tutor — ${topic}`,

        scheduledFor,

        durationMinutes:
          finalDuration,
      });
  }


  const now =
    new Date()
      .toISOString();


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

        tutor_id:
          session.tutor.id,

        scheduled_for:
          scheduledFor,

        completed_at:
          null,

        duration_minutes:
          finalDuration,

        status:
          "planned",

        topic,

        lesson_notes:
          null,

        understanding_rating:
          null,

        next_topic:
          null,

        homework_summary:
          null,

        meeting_url:
          zoomMeeting?.joinUrl ||
          manualMeetingUrl,

        zoom_meeting_id:
          zoomMeeting?.id ||
          null,

        zoom_meeting_uuid:
          zoomMeeting?.uuid ||
          null,

        zoom_host_user_id:
          zoomMeeting
            ? zoomHostUserId()
            : null,

        zoom_synced_at:
          zoomMeeting
            ? now
            : null,

        student_rate:
          engagement
            .student_rate,

        tutor_rate:
          engagement
            .tutor_rate,

        currency:
          engagement.currency ||
          "GBP",

        updated_at:
          now,
      })
      .select(
        "id,scheduled_for,status,topic,duration_minutes,meeting_url,zoom_meeting_id",
      )
      .single();

  if (
    createError ||
    !created
  ) {

    /*
     * Do not leave an orphan Zoom meeting behind
     * if database creation fails.
     */
    if (zoomMeeting?.id) {
      try {
        await deleteZoomMeeting(
          zoomMeeting.id,
        );
      } catch (
        cleanupError
      ) {
        console.error(
          "Tutor session creation failed and Zoom cleanup also failed:",
          cleanupError,
        );
      }
    }

    throw new Error(
      createError?.message ||
        "Could not schedule the session.",
    );
  }


  /*
   * If this was a student's request,
   * mark that same request as resolved.
   */
  if (request) {
    const resolutionNote =
      `Tutor scheduled session ${created.id} for ${created.scheduled_for}.`;

    const nextNote =
      request.admin_note
        ? `${request.admin_note}\n${resolutionNote}`
        : resolutionNote;

    const {
      error:
        requestUpdateError,
    } =
      await supabase
        .from(
          "student_support_requests",
        )
        .update({
          status:
            "resolved",

          admin_note:
            nextNote,

          resolved_at:
            now,

          updated_at:
            now,
        })
        .eq(
          "id",
          request.id,
        );

    if (
      requestUpdateError
    ) {
      throw new Error(
        requestUpdateError
          .message,
      );
    }
  }


  /*
   * Session creation succeeds even if email delivery
   * has a temporary failure. The real session remains
   * visible in both portals and Admin.
   */
  try {
    await notifyTutorScheduledSession({
      supabase,

      createdByEmail:
        session.user.email ||
        null,

      studentId:
        engagement
          .student_id,

      engagementId:
        engagement.id,

      sessionRow:
        created,
    });
  } catch (
    notificationError
  ) {
    console.error(
      "Tutor scheduled the session, but the student notification failed:",
      notificationError,
    );
  }


  revalidatePath(
    "/tutor",
  );

  revalidatePath(
    "/tutor/sessions",
  );

  revalidatePath(
    `/tutor/students/${engagement.id}`,
  );

  revalidatePath(
    "/admin/sessions",
  );

  revalidatePath(
    "/admin/portals",
  );


  redirect(
    "/tutor/sessions?scheduled=1",
  );
}


/* MAT_TUTOR_SESSION_CHANGE_RESPONSES
   ========================================================================== */

export async function respondTutorSessionChangeRequest(
  formData: FormData,
) {
  const {
    session,
    supabase,
  } =
    await tutorContext();

  const requestId =
    text(
      formData,
      "requestId",
      100,
    );

  const responseKind =
    text(
      formData,
      "responseKind",
      40,
    );


  if (
    !requestId ||
    ![
      "cancel",
      "approve_reschedule",
      "propose_reschedule",
    ].includes(
      responseKind,
    )
  ) {
    return;
  }


  const {
    data: request,
    error: requestError,
  } =
    await supabase
      .from(
        "student_support_requests",
      )
      .select(
        "id,student_id,engagement_id,category,message,status,admin_note",
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
        "Session change request not found.",
    );
  }


  if (
    request.category !==
      "session_request" ||
    request.status ===
      "resolved" ||
    !request.message.startsWith(
      "SESSION CHANGE REQUEST",
    )
  ) {
    throw new Error(
      "This request is no longer available.",
    );
  }


  const changeType =
    sessionRequestLine(
      request.message,
      "Change type",
    );

  const sessionId =
    sessionRequestLine(
      request.message,
      "Session ID",
    );


  if (!sessionId) {
    throw new Error(
      "The requested session could not be identified.",
    );
  }


  const {
    data: sessionRow,
    error: sessionError,
  } =
    await supabase
      .from(
        "tutoring_sessions",
      )
      .select(
        "id,engagement_id,tutor_id,scheduled_for,status,topic,duration_minutes,meeting_url,zoom_meeting_id,zoom_meeting_uuid,zoom_host_user_id,tutoring_engagements(student_id,tutor_id)",
      )
      .eq(
        "id",
        sessionId,
      )
      .maybeSingle();


  if (
    sessionError ||
    !sessionRow
  ) {
    throw new Error(
      sessionError?.message ||
        "Session not found.",
    );
  }


  const relation =
    sessionRow.tutoring_engagements as unknown as
      | {
          student_id: string;
          tutor_id:
            string | null;
        }
      | null;


  /*
   * Never trust the request/form alone.
   *
   * The tutor must own the actual session and
   * the support request must belong to the
   * same student + engagement.
   */
  if (
    sessionRow.tutor_id !==
      session.tutor.id &&
    relation?.tutor_id !==
      session.tutor.id
  ) {
    throw new Error(
      "You do not have access to this session.",
    );
  }


  if (
    request.engagement_id !==
      sessionRow.engagement_id ||
    request.student_id !==
      relation?.student_id
  ) {
    throw new Error(
      "This request does not belong to this session.",
    );
  }


  if (
    sessionRow.status !==
      "planned"
  ) {
    throw new Error(
      "Only planned sessions can be changed.",
    );
  }


  const now =
    new Date()
      .toISOString();


  /*
   * ----------------------------------------------------------
   * CANCELLATION
   * ----------------------------------------------------------
   */

  if (
    responseKind ===
      "cancel"
  ) {
    if (
      changeType !==
        "Cancellation"
    ) {
      throw new Error(
        "This is not a cancellation request.",
      );
    }


    if (
      sessionRow.zoom_meeting_id
    ) {
      await deleteZoomMeeting(
        sessionRow.zoom_meeting_id,
      );
    }


    const {
      data: updated,
      error: updateError,
    } =
      await supabase
        .from(
          "tutoring_sessions",
        )
        .update({
          status:
            "cancelled",

          completed_at:
            null,

          meeting_url:
            sessionRow.zoom_meeting_id
              ? null
              : sessionRow.meeting_url,

          zoom_meeting_id:
            null,

          zoom_meeting_uuid:
            null,

          zoom_host_user_id:
            null,

          zoom_synced_at:
            sessionRow.zoom_meeting_id
              ? now
              : null,

          updated_at:
            now,
        })
        .eq(
          "id",
          sessionId,
        )
        .select(
          "id,engagement_id,scheduled_for,status,topic,duration_minutes,meeting_url",
        )
        .single();


    if (
      updateError ||
      !updated
    ) {
      throw new Error(
        updateError?.message ||
          "Could not cancel the session.",
      );
    }


    const note =
      `Tutor accepted cancellation request for session ${sessionId}.`;

    const nextAdminNote =
      request.admin_note
        ? `${request.admin_note}\n${note}`
        : note;


    const {
      error:
        resolveError,
    } =
      await supabase
        .from(
          "student_support_requests",
        )
        .update({
          status:
            "resolved",

          admin_note:
            nextAdminNote,

          resolved_at:
            now,

          updated_at:
            now,
        })
        .eq(
          "id",
          requestId,
        );


    if (resolveError) {
      throw new Error(
        resolveError.message,
      );
    }


    try {
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
            request.student_id,
          )
          .maybeSingle();


      if (student?.email) {
        const result =
          await sendSessionNotification({
            sessionId:
              updated.id,

            name:
              student.name,

            email:
              student.email,

            topic:
              updated.topic,

            status:
              updated.status,

            scheduledFor:
              updated.scheduled_for,

            durationMinutes:
              updated.duration_minutes,

            nextTopic:
              null,

            homeworkSummary:
              null,

            meetingUrl:
              updated.meeting_url,
          });


        await recordStudentCommunication({
          studentId:
            request.student_id,

          engagementId:
            updated.engagement_id,

          type:
            "session_update",

          recipient:
            student.email,

          subject:
            `Session update: ${updated.topic}`,

          result,

          createdByEmail:
            session.user.email ||
            null,
        });
      }

    } catch (
      notificationError
    ) {
      console.error(
        "Tutor cancelled the session, but student notification failed:",
        notificationError,
      );
    }


    revalidatePath(
      "/tutor",
    );

    revalidatePath(
      "/tutor/sessions",
    );

    revalidatePath(
      "/admin/sessions",
    );

    revalidatePath(
      "/admin/portals",
    );


    redirect(
      "/tutor/sessions?change=cancelled",
    );
  }


  /*
   * ----------------------------------------------------------
   * RESCHEDULE
   * ----------------------------------------------------------
   */

  if (
    changeType !==
      "Reschedule"
  ) {
    throw new Error(
      "This is not a reschedule request.",
    );
  }


  let newScheduledFor:
    string | null =
      null;


  if (
    responseKind ===
      "approve_reschedule"
  ) {
    const requestedUtc =
      sessionRequestLine(
        request.message,
        "Requested UTC",
      );


    if (
      !requestedUtc ||
      Number.isNaN(
        new Date(
          requestedUtc,
        ).getTime(),
      )
    ) {
      throw new Error(
        "The student's requested new time could not be read.",
      );
    }


    newScheduledFor =
      new Date(
        requestedUtc,
      ).toISOString();

  } else {
    const scheduledDate =
      text(
        formData,
        "scheduledDate",
        20,
      );

    const scheduledTime =
      text(
        formData,
        "scheduledTime",
        20,
      );

    const timeZone =
      normalizeTimeZone(
        text(
          formData,
          "timeZone",
          120,
        ) ||
          session.tutor
            .timezone,
        DEFAULT_TIME_ZONE,
      );


    if (
      !scheduledDate ||
      !scheduledTime
    ) {
      throw new Error(
        "Choose the new date and time.",
      );
    }


    const converted =
      zonedLocalDateTimeToUtc(
        scheduledDate,
        scheduledTime,
        timeZone,
      );


    if (!converted.ok) {
      throw new Error(
        converted.error,
      );
    }


    newScheduledFor =
      converted.iso;
  }


  const proposedStart =
    new Date(
      newScheduledFor,
    ).getTime();


  if (
    Number.isNaN(
      proposedStart,
    ) ||
    proposedStart <
      Date.now() - 60_000
  ) {
    throw new Error(
      "The new session time must be in the future.",
    );
  }


  const duration =
    Number(
      sessionRow.duration_minutes ||
        60,
    );

  const proposedEnd =
    proposedStart +
    duration *
      60_000;

  const searchStart =
    new Date(
      proposedStart -
        12 *
          60 *
          60 *
          1000,
    ).toISOString();

  const searchEnd =
    new Date(
      proposedEnd +
        12 *
          60 *
          60 *
          1000,
    ).toISOString();


  /*
   * Tutor calendar conflict.
   */
  const {
    data:
      nearbyTutorSessions,
    error:
      tutorConflictError,
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
        session.tutor.id,
      )
      .eq(
        "status",
        "planned",
      )
      .neq(
        "id",
        sessionId,
      )
      .gte(
        "scheduled_for",
        searchStart,
      )
      .lte(
        "scheduled_for",
        searchEnd,
      );


  if (tutorConflictError) {
    throw new Error(
      tutorConflictError.message,
    );
  }


  const tutorConflict =
    (
      nearbyTutorSessions ||
      []
    ).find(
      (
        existing,
      ) => {
        if (
          !existing
            .scheduled_for
        ) {
          return false;
        }

        const existingStart =
          new Date(
            existing
              .scheduled_for,
          ).getTime();

        const existingEnd =
          existingStart +
          Number(
            existing
              .duration_minutes ||
              60,
          ) *
            60_000;

        return (
          proposedStart <
            existingEnd &&
          proposedEnd >
            existingStart
        );
      },
    );


  if (tutorConflict) {
    throw new Error(
      `You already have "${tutorConflict.topic}" scheduled at that time.`,
    );
  }


  /*
   * MAT shared Zoom host conflict.
   */
  if (
    sessionRow.zoom_meeting_id
  ) {
    const {
      data:
        managedSessions,
      error:
        zoomConflictError,
    } =
      await supabase
        .from(
          "tutoring_sessions",
        )
        .select(
          "id,topic,scheduled_for,duration_minutes",
        )
        .eq(
          "status",
          "planned",
        )
        .not(
          "zoom_meeting_id",
          "is",
          null,
        )
        .neq(
          "id",
          sessionId,
        )
        .gte(
          "scheduled_for",
          searchStart,
        )
        .lte(
          "scheduled_for",
          searchEnd,
        );


    if (zoomConflictError) {
      throw new Error(
        zoomConflictError.message,
      );
    }


    const zoomConflict =
      (
        managedSessions ||
        []
      ).find(
        (
          existing,
        ) => {
          if (
            !existing
              .scheduled_for
          ) {
            return false;
          }

          const existingStart =
            new Date(
              existing
                .scheduled_for,
            ).getTime();

          const existingEnd =
            existingStart +
            Number(
              existing
                .duration_minutes ||
                60,
            ) *
              60_000;

          return (
            proposedStart <
              existingEnd &&
            proposedEnd >
              existingStart
          );
        },
      );


    if (zoomConflict) {
      throw new Error(
        `The MAT Zoom host is already in use for "${zoomConflict.topic}" at that time.`,
      );
    }


    await updateZoomMeeting(
      sessionRow.zoom_meeting_id,
      {
        topic:
          `My Academic Tutor — ${sessionRow.topic}`,

        scheduledFor:
          newScheduledFor,

        durationMinutes:
          duration,
      },
    );
  }


  const {
    data: updated,
    error: updateError,
  } =
    await supabase
      .from(
        "tutoring_sessions",
      )
      .update({
        scheduled_for:
          newScheduledFor,

        zoom_synced_at:
          sessionRow.zoom_meeting_id
            ? now
            : null,

        updated_at:
          now,
      })
      .eq(
        "id",
        sessionId,
      )
      .select(
        "id,engagement_id,scheduled_for,status,topic,duration_minutes,meeting_url",
      )
      .single();


  if (
    updateError ||
    !updated
  ) {
    throw new Error(
      updateError?.message ||
        "Could not reschedule the session.",
    );
  }


  const resolutionText =
    responseKind ===
      "approve_reschedule"
      ? `Tutor accepted requested reschedule for session ${sessionId}.`
      : `Tutor proposed and scheduled a new time for session ${sessionId}.`;

  const nextAdminNote =
    request.admin_note
      ? `${request.admin_note}\n${resolutionText}`
      : resolutionText;


  const {
    error:
      resolveError,
  } =
    await supabase
      .from(
        "student_support_requests",
      )
      .update({
        status:
          "resolved",

        admin_note:
          nextAdminNote,

        resolved_at:
          now,

        updated_at:
          now,
      })
      .eq(
        "id",
        requestId,
      );


  if (resolveError) {
    throw new Error(
      resolveError.message,
    );
  }


  try {
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
          request.student_id,
        )
        .maybeSingle();


    if (student?.email) {
      const result =
        await sendSessionNotification({
          sessionId:
            updated.id,

          name:
            student.name,

          email:
            student.email,

          topic:
            updated.topic,

          status:
            updated.status,

          scheduledFor:
            updated.scheduled_for,

          durationMinutes:
            updated.duration_minutes,

          nextTopic:
            null,

          homeworkSummary:
            null,

          meetingUrl:
            updated.meeting_url,
        });


      await recordStudentCommunication({
        studentId:
          request.student_id,

        engagementId:
          updated.engagement_id,

        type:
          "session_update",

        recipient:
          student.email,

        subject:
          `Tutoring session rescheduled: ${updated.topic}`,

        result,

        createdByEmail:
          session.user.email ||
          null,
      });
    }

  } catch (
    notificationError
  ) {
    console.error(
      "Tutor rescheduled the session, but student notification failed:",
      notificationError,
    );
  }


  revalidatePath(
    "/tutor",
  );

  revalidatePath(
    "/tutor/sessions",
  );

  revalidatePath(
    `/tutor/sessions/${sessionId}`,
  );

  revalidatePath(
    "/admin/sessions",
  );

  revalidatePath(
    "/admin/portals",
  );


  redirect(
    "/tutor/sessions?change=rescheduled",
  );
}

