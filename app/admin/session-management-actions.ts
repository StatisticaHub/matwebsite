"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendSessionNotification, sendSessionReminder } from "@/lib/email/student";
import { recordStudentCommunication } from "@/lib/student-communications";
import { sessionStatuses, type SessionStatus } from "@/lib/delivery-data";
import {
  createZoomMeeting,
  deleteZoomMeeting,
  updateZoomMeeting,
  zoomHostUserId,
} from "@/lib/zoom";

import { getAdminTimeZone } from "@/lib/admin-time-zone";
import { zonedLocalDateTimeToUtc } from "@/lib/time-zone";
async function adminContext() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  return { session, supabase: createAdminClient() };
}

function text(formData: FormData, key: string, max = 5000) {
  return String(formData.get(key) || "").trim().slice(0, max);
}

function nullableText(formData: FormData, key: string, max = 5000) {
  const value = text(formData, key, max);
  return value || null;
}

function nullableNumber(formData: FormData, key: string) {
  const raw = text(formData, key, 40);
  if (!raw) return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

function safeUrl(value: string | null) {
  if (!value) return null;

  try {
    const url = new URL(value);
    return ["https:", "http:"].includes(url.protocol) ? url.toString() : null;
  } catch {
    return null;
  }
}

function timezoneOffsetMs(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  const map = Object.fromEntries(
    parts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value])
  );

  const asUtc = Date.UTC(
    Number(map.year),
    Number(map.month) - 1,
    Number(map.day),
    Number(map.hour),
    Number(map.minute),
    Number(map.second)
  );

  return asUtc - date.getTime();
}

function ukLocalToIso(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
  if (!match) return null;

  const [, y, m, d, hh, mm] = match;

  const provisional = new Date(
    Date.UTC(
      Number(y),
      Number(m) - 1,
      Number(d),
      Number(hh),
      Number(mm),
      0
    )
  );

  const firstOffset = timezoneOffsetMs(provisional, "Europe/London");
  let resolved = new Date(provisional.getTime() - firstOffset);

  const secondOffset = timezoneOffsetMs(resolved, "Europe/London");
  if (secondOffset !== firstOffset) {
    resolved = new Date(provisional.getTime() - secondOffset);
  }

  return Number.isNaN(resolved.getTime()) ? null : resolved.toISOString();
}

function formatUkDateTimeForError(
  value: string
) {
  return new Intl.DateTimeFormat(
    "en-GB",
    {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "Europe/London",
    }
  ).format(new Date(value));
}

async function assertZoomSlotAvailable(args: {
  supabase: ReturnType<typeof createAdminClient>;
  scheduledFor: string;
  durationMinutes: number;
  excludeSessionId?: string | null;
}) {
  const { data, error } = await args.supabase
    .from("tutoring_sessions")
    .select("id,topic,scheduled_for,duration_minutes")
    .eq("status", "planned")
    .not("zoom_meeting_id", "is", null)
    .not("scheduled_for", "is", null);

  if (error) {
    throw new Error(error.message);
  }

  const newStart = new Date(args.scheduledFor).getTime();
  const newEnd =
    newStart +
    args.durationMinutes * 60 * 1000;

  const conflict = (data || []).find((item) => {
    if (
      args.excludeSessionId &&
      item.id === args.excludeSessionId
    ) {
      return false;
    }

    if (!item.scheduled_for) {
      return false;
    }

    const existingStart =
      new Date(item.scheduled_for).getTime();

    const existingEnd =
      existingStart +
      Number(item.duration_minutes || 60) *
        60 *
        1000;

    return (
      newStart < existingEnd &&
      existingStart < newEnd
    );
  });

  if (conflict) {
    throw new Error(
      `Zoom scheduling conflict: "${conflict.topic}" is already using the single MAT Zoom host from ${formatUkDateTimeForError(
        conflict.scheduled_for
      )} for ${conflict.duration_minutes} minutes. Choose a non-overlapping time.`
    );
  }
}

async function leadActivity(args: {
  supabase: ReturnType<typeof createAdminClient>;
  leadId: string;
  eventType: string;
  note: string;
  userId: string;
  userEmail: string | null;
}) {
  const { error } = await args.supabase.from("lead_activity").insert({
    lead_id: args.leadId,
    event_type: args.eventType,
    note: args.note,
    created_by: args.userId,
    created_by_email: args.userEmail,
  });

  if (error) throw new Error(error.message);
}

async function notifySession(args: {
  supabase: ReturnType<typeof createAdminClient>;
  adminEmail: string | null;
  studentId: string;
  engagementId: string;
  sessionRow: {
    id: string;
    scheduled_for: string | null;
    status: string;
    topic: string;
    duration_minutes: number;
    next_topic: string | null;
    homework_summary: string | null;
    meeting_url: string | null;
  };
}) {
  const [
    { data: student },
    { data: onboarding },
  ] = await Promise.all([
    args.supabase
      .from("students")
      .select("name,email")
      .eq("id", args.studentId)
      .maybeSingle(),

    args.supabase
      .from("student_onboarding")
      .select("timezone")
      .eq("student_id", args.studentId)
      .maybeSingle(),
  ]);

  if (!student?.email) return;

  const result = await sendSessionNotification({
    sessionId: args.sessionRow.id,
    name: student.name,
    email: student.email,
    topic: args.sessionRow.topic,
    status: args.sessionRow.status,
    scheduledFor: args.sessionRow.scheduled_for,
    durationMinutes: args.sessionRow.duration_minutes,
    nextTopic: args.sessionRow.next_topic,
    homeworkSummary: args.sessionRow.homework_summary,
    meetingUrl: args.sessionRow.meeting_url,
    timeZone:
      onboarding?.timezone ||
      "Europe/London",
  });

  const subject =
    args.sessionRow.status === "completed"
      ? `Session follow-up: ${args.sessionRow.topic}`
      : args.sessionRow.status === "cancelled"
        ? `Session update: ${args.sessionRow.topic}`
        : `Tutoring session scheduled: ${args.sessionRow.topic}`;

  await recordStudentCommunication({
    studentId: args.studentId,
    engagementId: args.engagementId,
    type: "session_update",
    recipient: student.email,
    subject,
    result,
    createdByEmail: args.adminEmail,
  });
}

export async function convertBookedTrialToStudent(formData: FormData) {
  const { session, supabase } = await adminContext();

  const leadId = text(formData, "leadId", 100);
  if (!leadId) return;

  const { data: lead, error: leadError } = await supabase
    .from("tutoring_leads")
    .select("*")
    .eq("id", leadId)
    .single();

  if (leadError || !lead) {
    throw new Error(leadError?.message || "Lead not found.");
  }

  const canConvert =
    lead.status === "booked" ||
    lead.trial_outcome === "Proceed with tutoring";

  if (!canConvert) {
    throw new Error(
      "Record a successful trial outcome before using quick conversion."
    );
  }

  const { data: existingStudent } = await supabase
    .from("students")
    .select("id")
    .eq("source_lead_id", leadId)
    .maybeSingle();

  if (existingStudent?.id) {
    redirect(`/admin/students/${existingStudent.id}`);
  }

  const { data: student, error: studentError } = await supabase
    .from("students")
    .insert({
      source_lead_id: lead.id,
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      country: lead.country,
      academic_level: lead.level,
      institution: lead.curriculum || null,
      curriculum: lead.curriculum || null,
      status: "active",
      notes: lead.trial_notes ? `Trial note: ${lead.trial_notes}` : null,
    })
    .select("id")
    .single();

  if (studentError || !student) {
    throw new Error(studentError?.message || "Could not create student.");
  }

  const { error: onboardingError } = await supabase
    .from("student_onboarding")
    .insert({
      student_id: student.id,
      status: "awaiting_intake",
    });

  if (onboardingError && onboardingError.code !== "23505") {
    throw new Error(onboardingError.message);
  }

  let tutorRate: number | null = null;
  let tutorName: string | null = null;

  if (lead.assigned_tutor_id) {
    const { data: tutor } = await supabase
      .from("tutors")
      .select("name,hourly_rate")
      .eq("id", lead.assigned_tutor_id)
      .maybeSingle();

    tutorRate = tutor?.hourly_rate ?? null;
    tutorName = tutor?.name || null;
  }

  const { data: engagement, error: engagementError } = await supabase
    .from("tutoring_engagements")
    .insert({
      student_id: student.id,
      source_lead_id: lead.id,
      tutor_id: lead.assigned_tutor_id,
      subject: lead.subject,
      title: `${lead.subject} tutoring`,
      module: lead.topic || null,
      goal: lead.requirements,
      start_date: new Date().toISOString().slice(0, 10),
      status: "active",
      session_duration_minutes: 60,
      student_rate: lead.quoted_rate,
      tutor_rate: tutorRate,
      currency: lead.currency || "GBP",
      current_focus: lead.topic || null,
      assessment_summary: lead.trial_notes || null,
    })
    .select("id")
    .single();

  if (engagementError || !engagement) {
    throw new Error(
      engagementError?.message || "Could not create tutoring engagement."
    );
  }

  const { error: updateError } = await supabase
    .from("tutoring_leads")
    .update({
      status: "ongoing",
      next_follow_up_at: null,
      follow_up_note: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", leadId);

  if (updateError) throw new Error(updateError.message);

  await leadActivity({
    supabase,
    leadId,
    eventType: "student_created",
    note: `Successful trial converted to an active student and tutoring engagement${
      tutorName ? ` with ${tutorName}` : ""
    }.`,
    userId: session.user.id,
    userEmail: session.user.email || null,
  });

  revalidatePath("/admin");
  revalidatePath("/admin/follow-ups");
  revalidatePath("/admin/students");
  revalidatePath("/admin/sessions");

  redirect(`/admin/students/${student.id}`);
}

export async function createTutoringSessionFromAdmin(formData: FormData) {
  const { session, supabase } = await adminContext();

  const engagementId = text(formData, "engagementId", 100);
  const supportRequestId = text(formData, "supportRequestId", 100);
  const topic = text(formData, "topic", 500);
  const status =
    (text(formData, "status", 30) || "planned") as SessionStatus;

  const rawScheduledFor = text(formData, "scheduledFor", 40);
  const adminTimeZone =
    await getAdminTimeZone();

  const convertedScheduledFor =
    rawScheduledFor
      ? zonedLocalDateTimeToUtc(
          rawScheduledFor,
          adminTimeZone,
        )
      : null;

  if (
    convertedScheduledFor &&
    !convertedScheduledFor.ok
  ) {
    throw new Error(
      convertedScheduledFor.error,
    );
  }

  const scheduledFor =
    convertedScheduledFor?.ok
      ? convertedScheduledFor.iso
      : null;

  const duration = nullableNumber(formData, "durationMinutes");
  const shouldRecordZoom =
    formData.get("recordZoomMeeting") === "on";

  const shouldCreateZoom =
    formData.get("createZoomMeeting") === "on" ||
    shouldRecordZoom;

  if (!engagementId || !topic || !sessionStatuses.includes(status)) {
    return;
  }

  const { data: engagement, error: engagementError } = await supabase
    .from("tutoring_engagements")
    .select(
      "id,student_id,tutor_id,session_duration_minutes,student_rate,tutor_rate,currency"
    )
    .eq("id", engagementId)
    .single();

  if (engagementError || !engagement) {
    throw new Error(engagementError?.message || "Engagement not found.");
  }

  const finalDuration =
    duration && duration >= 15 && duration <= 480
      ? Math.round(duration)
      : engagement.session_duration_minutes || 60;

  let zoomMeeting:
    | {
        id: string;
        uuid: string | null;
        joinUrl: string;
      }
    | null = null;

  if (shouldCreateZoom) {
    if (status !== "planned") {
      throw new Error(
        "Zoom meetings can only be created automatically for planned sessions."
      );
    }

    if (!scheduledFor) {
      throw new Error(
        "Choose a scheduled date and time before creating a Zoom meeting."
      );
    }

    await assertZoomSlotAvailable({
      supabase,
      scheduledFor,
      durationMinutes: finalDuration,
    });

    zoomMeeting = await createZoomMeeting({
      topic: `My Academic Tutor — ${topic}`,
      scheduledFor,
      durationMinutes: finalDuration,
      autoRecord: shouldRecordZoom,
    });
  }

  const manualMeetingUrl = safeUrl(
    nullableText(formData, "meetingUrl", 1000)
  );

  const now = new Date().toISOString();

  const { data: created, error } = await supabase
    .from("tutoring_sessions")
    .insert({
      engagement_id: engagement.id,
      tutor_id:
        nullableText(formData, "tutorId", 100) ||
        engagement.tutor_id,
      scheduled_for: scheduledFor,
      completed_at:
        status === "completed"
          ? now
          : null,
      duration_minutes: finalDuration,
      status,
      topic,
      lesson_notes: nullableText(formData, "lessonNotes", 8000),
      understanding_rating: null,
      next_topic: nullableText(formData, "nextTopic", 1000),
      homework_summary: nullableText(
        formData,
        "homeworkSummary",
        2000
      ),
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
      student_rate: engagement.student_rate,
      tutor_rate: engagement.tutor_rate,
      currency: engagement.currency || "GBP",
    })
    .select(
      "id,scheduled_for,status,topic,duration_minutes,next_topic,homework_summary,meeting_url,zoom_meeting_id"
    )
    .single();

  if (error || !created) {
    if (zoomMeeting?.id) {
      try {
        await deleteZoomMeeting(zoomMeeting.id);
      } catch (cleanupError) {
        console.error(
          "MAT session creation failed and Zoom cleanup also failed:",
          cleanupError
        );
      }
    }

    throw new Error(error?.message || "Could not create session.");
  }

  if (formData.get("notifyStudent") === "on") {
    await notifySession({
      supabase,
      adminEmail: session.user.email || null,
      studentId: engagement.student_id,
      engagementId: engagement.id,
      sessionRow: created,
    });
  }

  if (supportRequestId) {
    const { data: supportRequest, error: requestError } = await supabase
      .from("student_support_requests")
      .select(
        "id,student_id,engagement_id,category,admin_note,status"
      )
      .eq("id", supportRequestId)
      .maybeSingle();

    if (requestError) {
      throw new Error(requestError.message);
    }

    const belongsToSession =
      supportRequest &&
      supportRequest.category === "session_request" &&
      supportRequest.student_id === engagement.student_id &&
      (!supportRequest.engagement_id ||
        supportRequest.engagement_id === engagement.id);

    if (belongsToSession) {
      const resolutionNote =
        `Scheduled as tutoring session ${created.id}${
          created.zoom_meeting_id
            ? " with a Zoom meeting."
            : "."
        }`;

      const nextAdminNote = supportRequest.admin_note
        ? `${supportRequest.admin_note}\n${resolutionNote}`
        : resolutionNote;

      const { error: resolveError } = await supabase
        .from("student_support_requests")
        .update({
          status: "resolved",
          admin_note: nextAdminNote,
          resolved_at: now,
          updated_at: now,
        })
        .eq("id", supportRequestId);

      if (resolveError) {
        throw new Error(resolveError.message);
      }
    }
  }

  revalidatePath("/admin");
  revalidatePath("/admin/sessions");
  revalidatePath("/admin/portals");
  revalidatePath(`/admin/students/${engagement.student_id}`);

  redirect(`/admin/sessions/${created.id}`);
}

export async function updateTutoringSession(formData: FormData) {
  const { session, supabase } = await adminContext();

  const sessionId = text(formData, "sessionId", 100);
  const status = text(formData, "status", 30) as SessionStatus;
  const topic = text(formData, "topic", 500);
  const rawScheduledFor = text(formData, "scheduledFor", 40);
  const adminTimeZone =
    await getAdminTimeZone();

  const convertedScheduledFor =
    rawScheduledFor
      ? zonedLocalDateTimeToUtc(
          rawScheduledFor,
          adminTimeZone,
        )
      : null;

  if (
    convertedScheduledFor &&
    !convertedScheduledFor.ok
  ) {
    throw new Error(
      convertedScheduledFor.error,
    );
  }

  const scheduledFor =
    convertedScheduledFor?.ok
      ? convertedScheduledFor.iso
      : null;
  const duration = nullableNumber(formData, "durationMinutes");
  const rating = nullableNumber(formData, "understandingRating");

  if (!sessionId || !topic || !sessionStatuses.includes(status)) {
    return;
  }

  const { data: current, error: currentError } = await supabase
    .from("tutoring_sessions")
    .select(
      "id,engagement_id,completed_at,scheduled_for,status,topic,duration_minutes,meeting_url,zoom_meeting_id,zoom_meeting_uuid,zoom_host_user_id,tutoring_engagements(student_id)"
    )
    .eq("id", sessionId)
    .single();

  if (currentError || !current) {
    throw new Error(currentError?.message || "Session not found.");
  }

  const relation =
    current.tutoring_engagements as unknown as {
      student_id: string;
    } | null;

  if (!relation?.student_id) {
    throw new Error("Session student could not be resolved.");
  }

  const finalDuration =
    duration && duration >= 15 && duration <= 480
      ? Math.round(duration)
      : current.duration_minutes || 60;

  const completedAt =
    status === "completed"
      ? current.completed_at || new Date().toISOString()
      : null;

  let meetingUrl = safeUrl(
    nullableText(formData, "meetingUrl", 1000)
  );

  let zoomMeetingId =
    current.zoom_meeting_id as string | null;

  let zoomMeetingUuid =
    current.zoom_meeting_uuid as string | null;

  let zoomHost =
    current.zoom_host_user_id as string | null;

  let zoomSyncedAt:
    | string
    | null = null;

  if (zoomMeetingId) {
    if (status === "cancelled") {
      await deleteZoomMeeting(zoomMeetingId);

      zoomMeetingId = null;
      zoomMeetingUuid = null;
      zoomHost = null;
      meetingUrl = null;
      zoomSyncedAt = new Date().toISOString();
    } else {
      meetingUrl = current.meeting_url;

      const zoomDetailsChanged =
        status === "planned" &&
        Boolean(scheduledFor) &&
        (
          scheduledFor !== current.scheduled_for ||
          finalDuration !== current.duration_minutes ||
          topic !== current.topic
        );

      if (
        zoomDetailsChanged &&
        scheduledFor
      ) {
        await assertZoomSlotAvailable({
          supabase,
          scheduledFor,
          durationMinutes: finalDuration,
          excludeSessionId: sessionId,
        });

        await updateZoomMeeting(
          zoomMeetingId,
          {
            topic: `My Academic Tutor — ${topic}`,
            scheduledFor,
            durationMinutes: finalDuration,
          }
        );

        zoomSyncedAt = new Date().toISOString();
      }
    }
  }

  const updatePayload: Record<
    string,
    unknown
  > = {
    tutor_id: nullableText(formData, "tutorId", 100),
    scheduled_for: scheduledFor,
    completed_at: completedAt,
    duration_minutes: finalDuration,
    status,
    topic,
    lesson_notes: nullableText(formData, "lessonNotes", 8000),
    understanding_rating:
      rating && rating >= 1 && rating <= 5
        ? Math.round(rating)
        : null,
    next_topic: nullableText(formData, "nextTopic", 1000),
    homework_summary: nullableText(
      formData,
      "homeworkSummary",
      2000
    ),
    meeting_url: meetingUrl,
    zoom_meeting_id: zoomMeetingId,
    zoom_meeting_uuid: zoomMeetingUuid,
    zoom_host_user_id: zoomHost,
    updated_at: new Date().toISOString(),
  };

  if (zoomSyncedAt) {
    updatePayload.zoom_synced_at =
      zoomSyncedAt;
  }

  const { data: updated, error } = await supabase
    .from("tutoring_sessions")
    .update(updatePayload)
    .eq("id", sessionId)
    .select(
      "id,engagement_id,scheduled_for,status,topic,duration_minutes,next_topic,homework_summary,meeting_url"
    )
    .single();

  if (error || !updated) {
    throw new Error(error?.message || "Could not update session.");
  }

  if (formData.get("notifyStudent") === "on") {
    await notifySession({
      supabase,
      adminEmail: session.user.email || null,
      studentId: relation.student_id,
      engagementId: updated.engagement_id,
      sessionRow: updated,
    });
  }

  revalidatePath("/admin");
  revalidatePath("/admin/sessions");
  revalidatePath(`/admin/sessions/${sessionId}`);
  revalidatePath(`/admin/students/${relation.student_id}`);
}



export async function attachZoomMeetingToSession(
  formData: FormData
) {
  const {
    session,
    supabase,
  } = await adminContext();

  const sessionId = text(
    formData,
    "sessionId",
    100
  );

  if (!sessionId) {
    return;
  }

  const {
    data: current,
    error: currentError,
  } = await supabase
    .from(
      "tutoring_sessions"
    )
    .select(
      "id,engagement_id,scheduled_for,status,topic,duration_minutes,meeting_url,zoom_meeting_id,tutoring_engagements(student_id)"
    )
    .eq(
      "id",
      sessionId
    )
    .single();

  if (
    currentError ||
    !current
  ) {
    throw new Error(
      currentError?.message ||
        "Session not found."
    );
  }

  if (
    current.status !==
    "planned"
  ) {
    throw new Error(
      "Zoom can only be attached to a planned session."
    );
  }

  if (
    !current.scheduled_for
  ) {
    throw new Error(
      "Set the session date and time before creating a Zoom meeting."
    );
  }

  if (
    current.zoom_meeting_id
  ) {
    throw new Error(
      "This session already has a managed Zoom meeting."
    );
  }

  const scheduledTime =
    new Date(
      current.scheduled_for
    ).getTime();

  if (
    Number.isNaN(
      scheduledTime
    ) ||
    scheduledTime <=
      Date.now()
  ) {
    throw new Error(
      "Zoom can only be attached to an upcoming planned session."
    );
  }

  const relation =
    current
      .tutoring_engagements as unknown as {
        student_id: string;
      } | null;

  if (
    !relation?.student_id
  ) {
    throw new Error(
      "Session student could not be resolved."
    );
  }

  const durationMinutes =
    Number(
      current.duration_minutes ||
        60
    );

  await assertZoomSlotAvailable({
    supabase,

    scheduledFor:
      current.scheduled_for,

    durationMinutes,

    excludeSessionId:
      sessionId,
  });

  const zoomMeeting =
    await createZoomMeeting({
      topic:
        `My Academic Tutor — ${current.topic}`,

      scheduledFor:
        current.scheduled_for,

      durationMinutes,
    });

  const now =
    new Date()
      .toISOString();

  const {
    data: updated,
    error,
  } = await supabase
    .from(
      "tutoring_sessions"
    )
    .update({
      meeting_url:
        zoomMeeting.joinUrl,

      zoom_meeting_id:
        zoomMeeting.id,

      zoom_meeting_uuid:
        zoomMeeting.uuid,

      zoom_host_user_id:
        zoomHostUserId(),

      zoom_synced_at:
        now,

      updated_at:
        now,
    })
    .eq(
      "id",
      sessionId
    )
    .select(
      "id,engagement_id,scheduled_for,status,topic,duration_minutes,next_topic,homework_summary,meeting_url"
    )
    .single();

  if (
    error ||
    !updated
  ) {
    try {
      await deleteZoomMeeting(
        zoomMeeting.id
      );
    } catch (
      cleanupError
    ) {
      console.error(
        "MAT could not save the attached Zoom meeting and Zoom cleanup also failed:",
        cleanupError
      );
    }

    throw new Error(
      error?.message ||
        "Could not attach Zoom meeting to session."
    );
  }

  if (
    formData.get(
      "notifyStudent"
    ) === "on"
  ) {
    try {
      await notifySession({
        supabase,

        adminEmail:
          session.user.email ||
          null,

        studentId:
          relation.student_id,

        engagementId:
          updated.engagement_id,

        sessionRow:
          updated,
      });
    } catch (
      notificationError
    ) {
      console.error(
        "Zoom was attached successfully but the student notification failed:",
        notificationError
      );
    }
  }

  revalidatePath(
    "/admin"
  );

  revalidatePath(
    "/admin/sessions"
  );

  revalidatePath(
    `/admin/sessions/${sessionId}`
  );

  revalidatePath(
    `/admin/students/${relation.student_id}`
  );

  revalidatePath(
    "/admin/portals"
  );
}


export async function completeTutoringSession(
  formData: FormData
) {
  const {
    session,
    supabase,
  } = await adminContext();

  const sessionId = text(
    formData,
    "sessionId",
    100
  );

  const duration = nullableNumber(
    formData,
    "durationMinutes"
  );

  const rating = nullableNumber(
    formData,
    "understandingRating"
  );

  const lessonNotes = nullableText(
    formData,
    "lessonNotes",
    8000
  );

  const nextTopic = nullableText(
    formData,
    "nextTopic",
    1000
  );

  const homeworkSummary = nullableText(
    formData,
    "homeworkSummary",
    2000
  );

  const shouldCreateHomework =
    formData.get("createHomework") === "on";

  const homeworkTitle = nullableText(
    formData,
    "homeworkTitle",
    500
  );

  const homeworkDescription = nullableText(
    formData,
    "homeworkDescription",
    8000
  );

  const rawHomeworkDueDate = text(
    formData,
    "homeworkDueDate",
    20
  );

  const homeworkDueDate =
    /^\d{4}-\d{2}-\d{2}$/.test(
      rawHomeworkDueDate
    )
      ? rawHomeworkDueDate
      : null;

  if (!sessionId) return;

  if (
    shouldCreateHomework &&
    !homeworkTitle
  ) {
    throw new Error(
      "Add a homework title or untick the homework assignment option."
    );
  }

  const {
    data: current,
    error: currentError,
  } = await supabase
    .from("tutoring_sessions")
    .select(
      "id,engagement_id,status,duration_minutes,meeting_url,tutoring_engagements(student_id)"
    )
    .eq("id", sessionId)
    .single();

  if (
    currentError ||
    !current
  ) {
    throw new Error(
      currentError?.message ||
        "Session not found."
    );
  }

  if (
    current.status !==
    "planned"
  ) {
    throw new Error(
      "Only a planned session can be completed from the close-out workflow."
    );
  }

  const relation =
    current.tutoring_engagements as unknown as {
      student_id: string;
    } | null;

  if (!relation?.student_id) {
    throw new Error(
      "Session student could not be resolved."
    );
  }

  const finalDuration =
    duration &&
    duration >= 15 &&
    duration <= 480
      ? Math.round(duration)
      : current.duration_minutes ||
        60;

  const finalRating =
    rating &&
    rating >= 1 &&
    rating <= 5
      ? Math.round(rating)
      : null;

  const now =
    new Date().toISOString();

  /*
   * Create/update the standalone homework record before publishing
   * the completed session. source_session_id is unique, so a retry
   * cannot create a duplicate assignment for the same lesson.
   *
   * We intentionally omit homework.status so the existing homework
   * table's normal default status continues to be used.
   */
  if (shouldCreateHomework) {
    const {
      error: homeworkError,
    } = await supabase
      .from("homework")
      .upsert(
        {
          engagement_id:
            current.engagement_id,
          source_session_id:
            sessionId,
          title:
            homeworkTitle,
          description:
            homeworkDescription ||
            homeworkSummary,
          due_date:
            homeworkDueDate,
        },
        {
          onConflict:
            "source_session_id",
        }
      );

    if (homeworkError) {
      throw new Error(
        `Could not create homework: ${homeworkError.message}`
      );
    }
  }

  const {
    data: updated,
    error,
  } = await supabase
    .from("tutoring_sessions")
    .update({
      status: "completed",
      completed_at: now,
      duration_minutes:
        finalDuration,
      lesson_notes:
        lessonNotes,
      understanding_rating:
        finalRating,
      next_topic:
        nextTopic,
      homework_summary:
        homeworkSummary,
      updated_at: now,
    })
    .eq("id", sessionId)
    .select(
      "id,engagement_id,scheduled_for,status,topic,duration_minutes,next_topic,homework_summary,meeting_url"
    )
    .single();

  if (
    error ||
    !updated
  ) {
    /*
     * Keep the close-out atomic from the admin's perspective.
     * If the session update fails after homework was prepared,
     * remove that session-linked homework so the lesson can be retried.
     */
    if (shouldCreateHomework) {
      const {
        error: cleanupError,
      } = await supabase
        .from("homework")
        .delete()
        .eq(
          "source_session_id",
          sessionId
        );

      if (cleanupError) {
        console.error(
          "Session completion failed and homework cleanup also failed:",
          cleanupError
        );
      }
    }

    throw new Error(
      error?.message ||
        "Could not complete session."
    );
  }

  if (
    formData.get(
      "notifyStudent"
    ) === "on"
  ) {
    try {
      await notifySession({
        supabase,
        adminEmail:
          session.user.email ||
          null,
        studentId:
          relation.student_id,
        engagementId:
          updated.engagement_id,
        sessionRow:
          updated,
      });
    } catch (
      notificationError
    ) {
      console.error(
        "Session was completed but the student follow-up email failed:",
        notificationError
      );
    }
  }

  revalidatePath("/admin");
  revalidatePath(
    "/admin/sessions"
  );
  revalidatePath(
    `/admin/sessions/${sessionId}`
  );
  revalidatePath(
    `/admin/students/${relation.student_id}`
  );
  revalidatePath(
    "/admin/progress"
  );
  revalidatePath(
    "/admin/retention"
  );
  revalidatePath(
    "/admin/portals"
  );
}


export async function markTutoringSessionNoShow(
  formData: FormData
) {
  const {
    supabase,
  } = await adminContext();

  const sessionId = text(
    formData,
    "sessionId",
    100
  );

  const note = nullableText(
    formData,
    "noShowNote",
    2000
  );

  if (!sessionId) return;

  const {
    data: current,
    error: currentError,
  } = await supabase
    .from("tutoring_sessions")
    .select(
      "id,status,lesson_notes,tutoring_engagements(student_id)"
    )
    .eq("id", sessionId)
    .single();

  if (
    currentError ||
    !current
  ) {
    throw new Error(
      currentError?.message ||
        "Session not found."
    );
  }

  if (
    current.status !==
    "planned"
  ) {
    throw new Error(
      "Only a planned session can be marked as a no-show."
    );
  }

  const relation =
    current.tutoring_engagements as unknown as {
      student_id: string;
    } | null;

  if (!relation?.student_id) {
    throw new Error(
      "Session student could not be resolved."
    );
  }

  const noShowLine =
    note
      ? `Student no-show: ${note}`
      : "Student no-show.";

  const nextNotes =
    current.lesson_notes
      ? `${current.lesson_notes}\n\n${noShowLine}`
      : noShowLine;

  const {
    error,
  } = await supabase
    .from("tutoring_sessions")
    .update({
      status: "no_show",
      completed_at: null,
      lesson_notes:
        nextNotes,
      understanding_rating:
        null,
      updated_at:
        new Date().toISOString(),
    })
    .eq("id", sessionId);

  if (error) {
    throw new Error(
      error.message
    );
  }

  revalidatePath("/admin");
  revalidatePath(
    "/admin/sessions"
  );
  revalidatePath(
    `/admin/sessions/${sessionId}`
  );
  revalidatePath(
    `/admin/students/${relation.student_id}`
  );
  revalidatePath(
    "/admin/retention"
  );
}


export async function cancelTutoringSession(formData: FormData) {
  const { session, supabase } = await adminContext();

  const sessionId = text(formData, "sessionId", 100);
  if (!sessionId) return;

  const { data: current, error: currentError } = await supabase
    .from("tutoring_sessions")
    .select(
      "id,engagement_id,zoom_meeting_id,tutoring_engagements(student_id)"
    )
    .eq("id", sessionId)
    .single();

  if (currentError || !current) {
    throw new Error(currentError?.message || "Session not found.");
  }

  const relation =
    current.tutoring_engagements as unknown as {
      student_id: string;
    } | null;

  if (!relation?.student_id) {
    throw new Error("Session student could not be resolved.");
  }

  if (current.zoom_meeting_id) {
    await deleteZoomMeeting(
      current.zoom_meeting_id
    );
  }

  const now = new Date().toISOString();

  const cancelPayload: Record<string, unknown> = {
    status: "cancelled",
    completed_at: null,
    updated_at: now,
  };

  if (current.zoom_meeting_id) {
    cancelPayload.meeting_url = null;
    cancelPayload.zoom_meeting_id = null;
    cancelPayload.zoom_meeting_uuid = null;
    cancelPayload.zoom_host_user_id = null;
    cancelPayload.zoom_synced_at = now;
  }

  const { data: updated, error } = await supabase
    .from("tutoring_sessions")
    .update(cancelPayload)
    .eq("id", sessionId)
    .select(
      "id,engagement_id,scheduled_for,status,topic,duration_minutes,next_topic,homework_summary,meeting_url"
    )
    .single();

  if (error || !updated) {
    throw new Error(error?.message || "Could not cancel session.");
  }

  if (formData.get("notifyStudent") === "on") {
    await notifySession({
      supabase,
      adminEmail: session.user.email || null,
      studentId: relation.student_id,
      engagementId: updated.engagement_id,
      sessionRow: updated,
    });
  }

  revalidatePath("/admin");
  revalidatePath("/admin/sessions");
  revalidatePath(`/admin/sessions/${sessionId}`);
  revalidatePath(`/admin/students/${relation.student_id}`);
}


function supportMessageLine(
  message: string,
  label: string
) {
  const prefix = `${label}:`;

  const line =
    message
      .split(/\r?\n/)
      .find(
        (item) =>
          item
            .trim()
            .startsWith(
              prefix
            )
      );

  if (!line) {
    return null;
  }

  const value =
    line
      .trim()
      .slice(
        prefix.length
      )
      .trim();

  return value || null;
}

async function resolveSessionChangeRequest(args: {
  supabase: ReturnType<typeof createAdminClient>;
  requestId: string;
  note: string;
}) {
  const now =
    new Date()
      .toISOString();

  const {
    data: request,
    error:
      requestError,
  } =
    await args.supabase
      .from(
        "student_support_requests"
      )
      .select(
        "id,admin_note"
      )
      .eq(
        "id",
        args.requestId
      )
      .single();

  if (
    requestError ||
    !request
  ) {
    throw new Error(
      requestError?.message ||
        "Session change request not found."
    );
  }

  const nextAdminNote =
    request.admin_note
      ? `${request.admin_note}\n${args.note}`
      : args.note;

  const {
    error,
  } =
    await args.supabase
      .from(
        "student_support_requests"
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
        args.requestId
      );

  if (error) {
    throw new Error(
      error.message
    );
  }
}

async function sessionChangeContext(
  formData: FormData,
  expectedType:
    | "Reschedule"
    | "Cancellation"
) {
  const {
    session,
    supabase,
  } =
    await adminContext();

  const requestId =
    text(
      formData,
      "requestId",
      100
    );

  const sessionId =
    text(
      formData,
      "sessionId",
      100
    );

  if (
    !requestId ||
    !sessionId
  ) {
    throw new Error(
      "Session change request is incomplete."
    );
  }

  const {
    data: request,
    error:
      requestError,
  } =
    await supabase
      .from(
        "student_support_requests"
      )
      .select(
        "id,student_id,engagement_id,category,message,status"
      )
      .eq(
        "id",
        requestId
      )
      .single();

  if (
    requestError ||
    !request
  ) {
    throw new Error(
      requestError?.message ||
        "Session change request not found."
    );
  }

  if (
    request.category !==
      "session_request" ||
    request.status ===
      "resolved" ||
    !request.message.startsWith(
      "SESSION CHANGE REQUEST"
    )
  ) {
    throw new Error(
      "This request cannot be applied as a session change."
    );
  }

  const changeType =
    supportMessageLine(
      request.message,
      "Change type"
    );

  const referencedSessionId =
    supportMessageLine(
      request.message,
      "Session ID"
    );

  if (
    changeType !==
      expectedType ||
    referencedSessionId !==
      sessionId
  ) {
    throw new Error(
      "Session change request details do not match."
    );
  }

  const {
    data: sessionRow,
    error:
      sessionError,
  } =
    await supabase
      .from(
        "tutoring_sessions"
      )
      .select(
        "id,engagement_id,scheduled_for,status,topic,duration_minutes,next_topic,homework_summary,meeting_url,zoom_meeting_id,zoom_meeting_uuid,zoom_host_user_id,tutoring_engagements(student_id)"
      )
      .eq(
        "id",
        sessionId
      )
      .single();

  if (
    sessionError ||
    !sessionRow
  ) {
    throw new Error(
      sessionError?.message ||
        "Session not found."
    );
  }

  const relation =
    sessionRow
      .tutoring_engagements as unknown as {
        student_id: string;
      } | null;

  if (
    !relation?.student_id
  ) {
    throw new Error(
      "Session student could not be resolved."
    );
  }

  if (
    relation.student_id !==
    request.student_id
  ) {
    throw new Error(
      "This request does not belong to the session student."
    );
  }

  if (
    request.engagement_id &&
    request.engagement_id !==
      sessionRow.engagement_id
  ) {
    throw new Error(
      "This request does not belong to the session engagement."
    );
  }

  return {
    session,
    supabase,
    request,
    requestId,
    sessionId,
    sessionRow,
    studentId:
      relation.student_id,
  };
}

export async function acceptSessionRescheduleRequest(
  formData: FormData
) {
  const context =
    await sessionChangeContext(
      formData,
      "Reschedule"
    );

  const rawScheduledFor =
    text(
      formData,
      "scheduledFor",
      40
    );

  const scheduledFor =
    rawScheduledFor
      ? ukLocalToIso(
          rawScheduledFor
        )
      : null;

  if (
    !scheduledFor
  ) {
    throw new Error(
      "Choose a valid UK date and time."
    );
  }

  if (
    context.sessionRow
      .status !==
    "planned"
  ) {
    throw new Error(
      "Only planned sessions can be rescheduled."
    );
  }

  const zoomMeetingId =
    context.sessionRow
      .zoom_meeting_id as string | null;

  if (zoomMeetingId) {
    await assertZoomSlotAvailable({
      supabase: context.supabase,
      scheduledFor,
      durationMinutes:
        context.sessionRow.duration_minutes,
      excludeSessionId:
        context.sessionId,
    });

    await updateZoomMeeting(
      zoomMeetingId,
      {
        topic:
          `My Academic Tutor — ${context.sessionRow.topic}`,
        scheduledFor,
        durationMinutes:
          context.sessionRow.duration_minutes,
      }
    );
  }

  const now =
    new Date().toISOString();

  const {
    data: updated,
    error,
  } =
    await context.supabase
      .from(
        "tutoring_sessions"
      )
      .update({
        scheduled_for:
          scheduledFor,

        ...(zoomMeetingId
          ? {
              zoom_synced_at:
                now,
            }
          : {}),

        updated_at:
          now,
      })
      .eq(
        "id",
        context.sessionId
      )
      .select(
        "id,engagement_id,scheduled_for,status,topic,duration_minutes,next_topic,homework_summary,meeting_url"
      )
      .single();

  if (
    error ||
    !updated
  ) {
    throw new Error(
      error?.message ||
        "Could not reschedule session."
    );
  }

  await resolveSessionChangeRequest({
    supabase:
      context.supabase,

    requestId:
      context.requestId,

    note:
      `Accepted reschedule for session ${context.sessionId}. New UK time: ${rawScheduledFor}.`,
  });

  if (
    formData.get(
      "notifyStudent"
    ) === "on"
  ) {
    try {
      await notifySession({
        supabase:
          context.supabase,

        adminEmail:
          context.session.user.email ||
          null,

        studentId:
          context.studentId,

        engagementId:
          updated.engagement_id,

        sessionRow:
          updated,
      });
    } catch (
      notificationError
    ) {
      console.error(
        "Session was rescheduled but the student notification failed:",
        notificationError
      );
    }
  }

  revalidatePath(
    "/admin"
  );

  revalidatePath(
    "/admin/sessions"
  );

  revalidatePath(
    "/admin/portals"
  );

  revalidatePath(
    `/admin/sessions/${context.sessionId}`
  );

  revalidatePath(
    `/admin/students/${context.studentId}`
  );

  redirect(
    `/admin/sessions/${context.sessionId}`
  );
}

export async function acceptSessionCancellationRequest(
  formData: FormData
) {
  const context =
    await sessionChangeContext(
      formData,
      "Cancellation"
    );

  if (
    context.sessionRow
      .status !==
    "planned"
  ) {
    throw new Error(
      "Only planned sessions can be cancelled from a student request."
    );
  }

  const zoomMeetingId =
    context.sessionRow
      .zoom_meeting_id as string | null;

  if (zoomMeetingId) {
    await deleteZoomMeeting(
      zoomMeetingId
    );
  }

  const now =
    new Date().toISOString();

  const {
    data: updated,
    error,
  } =
    await context.supabase
      .from(
        "tutoring_sessions"
      )
      .update({
        status:
          "cancelled",

        completed_at:
          null,

        ...(zoomMeetingId
          ? {
              meeting_url:
                null,

              zoom_meeting_id:
                null,

              zoom_meeting_uuid:
                null,

              zoom_host_user_id:
                null,

              zoom_synced_at:
                now,
            }
          : {}),

        updated_at:
          now,
      })
      .eq(
        "id",
        context.sessionId
      )
      .select(
        "id,engagement_id,scheduled_for,status,topic,duration_minutes,next_topic,homework_summary,meeting_url"
      )
      .single();

  if (
    error ||
    !updated
  ) {
    throw new Error(
      error?.message ||
        "Could not cancel session."
    );
  }

  await resolveSessionChangeRequest({
    supabase:
      context.supabase,

    requestId:
      context.requestId,

    note:
      `Accepted cancellation request for session ${context.sessionId}.`,
  });

  if (
    formData.get(
      "notifyStudent"
    ) === "on"
  ) {
    try {
      await notifySession({
        supabase:
          context.supabase,

        adminEmail:
          context.session.user.email ||
          null,

        studentId:
          context.studentId,

        engagementId:
          updated.engagement_id,

        sessionRow:
          updated,
      });
    } catch (
      notificationError
    ) {
      console.error(
        "Session was cancelled but the student notification failed:",
        notificationError
      );
    }
  }

  revalidatePath(
    "/admin"
  );

  revalidatePath(
    "/admin/sessions"
  );

  revalidatePath(
    "/admin/portals"
  );

  revalidatePath(
    `/admin/sessions/${context.sessionId}`
  );

  revalidatePath(
    `/admin/students/${context.studentId}`
  );

  redirect(
    `/admin/sessions/${context.sessionId}`
  );
}

export async function sendTutoringSessionReminder(
  formData: FormData
) {
  const { session, supabase } = await adminContext();

  const sessionId = text(formData, "sessionId", 100);
  if (!sessionId) return;

  const { data: sessionRow, error } = await supabase
    .from("tutoring_sessions")
    .select(
      "id,engagement_id,tutor_id,scheduled_for,status,topic,duration_minutes,meeting_url,tutoring_engagements(student_id)"
    )
    .eq("id", sessionId)
    .single();

  if (error || !sessionRow) {
    throw new Error(error?.message || "Session not found.");
  }

  if (
    sessionRow.status !== "planned" ||
    !sessionRow.scheduled_for
  ) {
    throw new Error(
      "Only scheduled sessions can receive reminders."
    );
  }

  const relation =
    sessionRow.tutoring_engagements as unknown as {
      student_id: string;
    } | null;

  if (!relation?.student_id) {
    throw new Error("Session student could not be resolved.");
  }

  const [{ data: student }, { data: tutor }] =
    await Promise.all([
      supabase
        .from("students")
        .select("name,email")
        .eq("id", relation.student_id)
        .maybeSingle(),

      sessionRow.tutor_id
        ? supabase
            .from("tutors")
            .select("name")
            .eq("id", sessionRow.tutor_id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
    ]);

  if (!student?.email) {
    throw new Error("Student email not found.");
  }

  const {
    data: onboarding,
  } = await supabase
    .from("student_onboarding")
    .select("timezone")
    .eq(
      "student_id",
      relation.student_id,
    )
    .maybeSingle();

  const result = await sendSessionReminder({
    sessionId,
    name: student.name,
    email: student.email,
    topic: sessionRow.topic,
    scheduledFor: sessionRow.scheduled_for,
    durationMinutes: sessionRow.duration_minutes,
    tutorName: tutor?.name || null,
    meetingUrl: sessionRow.meeting_url,
    timeZone:
      onboarding?.timezone ||
      "Europe/London",
  });

  await recordStudentCommunication({
    studentId: relation.student_id,
    engagementId: sessionRow.engagement_id,
    type: "session_update",
    recipient: student.email,
    subject: `Reminder: ${sessionRow.topic}`,
    result,
    createdByEmail: session.user.email || null,
  });

  revalidatePath(`/admin/sessions/${sessionId}`);
  revalidatePath(`/admin/students/${relation.student_id}`);
}
