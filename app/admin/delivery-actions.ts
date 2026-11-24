"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin-auth";
import {
  engagementStatuses,
  homeworkStatuses,
  progressStatuses,
  sessionStatuses,
  type EngagementStatus,
  type HomeworkStatus,
  type ProgressStatus,
  type SessionStatus,
} from "@/lib/delivery-data";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendHomeworkNotification, sendSessionNotification } from "@/lib/email/student";
import { recordStudentCommunication } from "@/lib/student-communications";

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

function csvList(formData: FormData, key: string) {
  return text(formData, key, 3000).split(",").map((value) => value.trim()).filter(Boolean).slice(0, 50);
}

function dateOrNull(formData: FormData, key: string) {
  const value = text(formData, key, 40);
  return value || null;
}

function timestampOrNull(formData: FormData, key: string) {
  const value = text(formData, key, 80);
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export async function convertLeadToStudent(formData: FormData) {
  const { session, supabase } = await adminContext();
  const leadId = text(formData, "leadId", 100);
  if (!leadId) return;

  const { data: lead, error: leadError } = await supabase.from("tutoring_leads").select("*").eq("id", leadId).single();
  if (leadError || !lead) throw new Error(leadError?.message || "Lead not found.");

  const { data: existingStudent } = await supabase.from("students").select("id").eq("source_lead_id", leadId).maybeSingle();
  if (existingStudent?.id) redirect(`/admin/students/${existingStudent.id}`);

  const institution = nullableText(formData, "institution", 500) || lead.curriculum || null;
  const programme = nullableText(formData, "programme", 500);

  const { data: student, error: studentError } = await supabase
    .from("students")
    .insert({
      source_lead_id: lead.id,
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      country: lead.country,
      academic_level: lead.level,
      institution,
      programme,
      curriculum: lead.curriculum,
      status: "active",
      notes: nullableText(formData, "studentNotes", 5000),
    })
    .select("id")
    .single();
  if (studentError || !student) throw new Error(studentError?.message || "Could not create student.");

  const { error: onboardingError } = await supabase.from("student_onboarding").insert({ student_id: student.id, status: "awaiting_intake" });
  if (onboardingError && onboardingError.code !== "23505") throw new Error(onboardingError.message);

  let tutorRate: number | null = null;
  if (lead.assigned_tutor_id) {
    const { data: tutor } = await supabase.from("tutors").select("hourly_rate").eq("id", lead.assigned_tutor_id).maybeSingle();
    tutorRate = tutor?.hourly_rate ?? null;
  }

  const duration = nullableNumber(formData, "sessionDuration");
  const title = nullableText(formData, "engagementTitle", 500) || `${lead.subject} tutoring`;
  const { error: engagementError } = await supabase.from("tutoring_engagements").insert({
    student_id: student.id,
    source_lead_id: lead.id,
    tutor_id: lead.assigned_tutor_id,
    subject: lead.subject,
    title,
    module: nullableText(formData, "module", 500) || lead.topic || null,
    goal: nullableText(formData, "goal", 3000) || lead.requirements,
    target: nullableText(formData, "target", 1000),
    start_date: dateOrNull(formData, "startDate") || new Date().toISOString().slice(0, 10),
    status: "active",
    frequency: nullableText(formData, "frequency", 300),
    session_duration_minutes: duration && duration >= 15 && duration <= 480 ? Math.round(duration) : 60,
    student_rate: lead.quoted_rate,
    tutor_rate: tutorRate,
    currency: lead.currency || "GBP",
    current_focus: lead.topic || null,
    confidence: nullableNumber(formData, "confidence"),
    upcoming_deadline: dateOrNull(formData, "upcomingDeadline"),
    preferred_learning_style: nullableText(formData, "learningStyle", 1000),
    weak_topics: csvList(formData, "weakTopics"),
    assessment_summary: nullableText(formData, "assessmentSummary", 5000),
    notes: nullableText(formData, "engagementNotes", 5000),
  });
  if (engagementError) throw new Error(engagementError.message);

  const { error: leadUpdateError } = await supabase
    .from("tutoring_leads")
    .update({
      status: "ongoing",
      next_follow_up_at: null,
      follow_up_note: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", leadId);

  if (leadUpdateError) throw new Error(leadUpdateError.message);

  await supabase.from("lead_activity").insert({
    lead_id: leadId,
    event_type: "student_created",
    note: "Converted to an active student and tutoring engagement.",
    created_by: session.user.id,
    created_by_email: session.user.email || null,
  });

  revalidatePath("/admin");
  revalidatePath("/admin/follow-ups");
  revalidatePath("/admin/students");
  redirect(`/admin/students/${student.id}`);
}

export async function createStudentEngagement(formData: FormData) {
  const { supabase } = await adminContext();
  const name = text(formData, "name", 300);
  const email = text(formData, "email", 500).toLowerCase();
  const subject = text(formData, "subject", 300);
  if (!name || !email || !subject) return;

  const { data: student, error: studentError } = await supabase
    .from("students")
    .insert({
      name,
      email,
      phone: nullableText(formData, "phone", 100),
      country: nullableText(formData, "country", 200),
      academic_level: nullableText(formData, "academicLevel", 300),
      institution: nullableText(formData, "institution", 500),
      programme: nullableText(formData, "programme", 500),
      status: "active",
      notes: nullableText(formData, "notes", 5000),
    })
    .select("id")
    .single();
  if (studentError || !student) throw new Error(studentError?.message || "Could not create student.");

  const { error: onboardingError } = await supabase.from("student_onboarding").insert({ student_id: student.id, status: "awaiting_intake" });
  if (onboardingError && onboardingError.code !== "23505") throw new Error(onboardingError.message);

  const duration = nullableNumber(formData, "sessionDuration");
  const { error: engagementError } = await supabase.from("tutoring_engagements").insert({
    student_id: student.id,
    tutor_id: nullableText(formData, "tutorId", 100),
    subject,
    title: nullableText(formData, "engagementTitle", 500) || `${subject} tutoring`,
    module: nullableText(formData, "module", 500),
    goal: nullableText(formData, "goal", 3000),
    target: nullableText(formData, "target", 1000),
    start_date: dateOrNull(formData, "startDate") || new Date().toISOString().slice(0, 10),
    status: "active",
    frequency: nullableText(formData, "frequency", 300),
    session_duration_minutes: duration && duration >= 15 && duration <= 480 ? Math.round(duration) : 60,
    student_rate: nullableNumber(formData, "studentRate"),
    tutor_rate: nullableNumber(formData, "tutorRate"),
    currency: text(formData, "currency", 3).toUpperCase() || "GBP",
    current_focus: nullableText(formData, "currentFocus", 1000),
    confidence: nullableNumber(formData, "confidence"),
    upcoming_deadline: dateOrNull(formData, "upcomingDeadline"),
    preferred_learning_style: nullableText(formData, "learningStyle", 1000),
    weak_topics: csvList(formData, "weakTopics"),
    assessment_summary: nullableText(formData, "assessmentSummary", 5000),
  });
  if (engagementError) throw new Error(engagementError.message);

  revalidatePath("/admin/students");
  redirect(`/admin/students/${student.id}`);
}

export async function updateEngagement(formData: FormData) {
  const { supabase } = await adminContext();
  const engagementId = text(formData, "engagementId", 100);
  const studentId = text(formData, "studentId", 100);
  const status = text(formData, "status", 50) as EngagementStatus;
  if (!engagementId || !studentId || !engagementStatuses.includes(status)) return;

  const duration = nullableNumber(formData, "sessionDuration");
  const { error } = await supabase
    .from("tutoring_engagements")
    .update({
      tutor_id: nullableText(formData, "tutorId", 100),
      status,
      module: nullableText(formData, "module", 500),
      goal: nullableText(formData, "goal", 3000),
      target: nullableText(formData, "target", 1000),
      frequency: nullableText(formData, "frequency", 300),
      session_duration_minutes: duration && duration >= 15 && duration <= 480 ? Math.round(duration) : 60,
      current_focus: nullableText(formData, "currentFocus", 1000),
      confidence: nullableNumber(formData, "confidence"),
      upcoming_deadline: dateOrNull(formData, "upcomingDeadline"),
      preferred_learning_style: nullableText(formData, "learningStyle", 1000),
      weak_topics: csvList(formData, "weakTopics"),
      assessment_summary: nullableText(formData, "assessmentSummary", 5000),
      student_rate: nullableNumber(formData, "studentRate"),
      tutor_rate: nullableNumber(formData, "tutorRate"),
      currency: text(formData, "currency", 3).toUpperCase() || "GBP",
      notes: nullableText(formData, "notes", 5000),
      updated_at: new Date().toISOString(),
    })
    .eq("id", engagementId);
  if (error) throw new Error(error.message);

  revalidatePath(`/admin/students/${studentId}`);
  revalidatePath("/admin/students");
}

export async function addLearningPlanItem(formData: FormData) {
  const { supabase } = await adminContext();
  const engagementId = text(formData, "engagementId", 100);
  const studentId = text(formData, "studentId", 100);
  const topic = text(formData, "topic", 500);
  if (!engagementId || !studentId || !topic) return;

  const priority = ["high", "medium", "low"].includes(text(formData, "priority", 20)) ? text(formData, "priority", 20) : "medium";
  const { error } = await supabase.from("learning_plan_items").insert({
    engagement_id: engagementId,
    topic,
    objective: nullableText(formData, "objective", 2000),
    priority,
    progress_status: "needs_work",
    notes: nullableText(formData, "notes", 2000),
  });
  if (error) throw new Error(error.message);
  revalidatePath(`/admin/students/${studentId}`);
}

export async function updateLearningPlanProgress(formData: FormData) {
  const { supabase } = await adminContext();
  const itemId = text(formData, "itemId", 100);
  const studentId = text(formData, "studentId", 100);
  const progress = text(formData, "progress", 30) as ProgressStatus;
  if (!itemId || !studentId || !progressStatuses.includes(progress)) return;

  const { error } = await supabase.from("learning_plan_items").update({ progress_status: progress, updated_at: new Date().toISOString() }).eq("id", itemId);
  if (error) throw new Error(error.message);
  revalidatePath(`/admin/students/${studentId}`);
}

export async function addTutoringSession(formData: FormData) {
  const { session, supabase } = await adminContext();
  const engagementId = text(formData, "engagementId", 100);
  const studentId = text(formData, "studentId", 100);
  const topic = text(formData, "topic", 500);
  const status = text(formData, "status", 30) as SessionStatus;
  if (!engagementId || !studentId || !topic || !sessionStatuses.includes(status)) return;

  const duration = nullableNumber(formData, "durationMinutes");
  const rating = nullableNumber(formData, "understandingRating");
  const adminTimeZone =
    await getAdminTimeZone();

  const rawScheduledFor =
    text(
      formData,
      "scheduledFor",
      40,
    );

  const scheduledConversion =
    rawScheduledFor
      ? zonedLocalDateTimeToUtc(
          rawScheduledFor,
          adminTimeZone,
        )
      : null;

  if (
    scheduledConversion &&
    !scheduledConversion.ok
  ) {
    throw new Error(
      scheduledConversion.error,
    );
  }

  const scheduledFor =
    scheduledConversion?.ok
      ? scheduledConversion.iso
      : null;

  const rawCompletedAt =
    text(
      formData,
      "completedAt",
      40,
    );

  const completedConversion =
    rawCompletedAt
      ? zonedLocalDateTimeToUtc(
          rawCompletedAt,
          adminTimeZone,
        )
      : null;

  if (
    completedConversion &&
    !completedConversion.ok
  ) {
    throw new Error(
      completedConversion.error,
    );
  }

  const completedAt =
    status === "completed"
      ? (
          completedConversion?.ok
            ? completedConversion.iso
            : new Date().toISOString()
        )
      : null;

  const { data: created, error } = await supabase.from("tutoring_sessions").insert({
    engagement_id: engagementId,
    tutor_id: nullableText(formData, "tutorId", 100),
    scheduled_for: scheduledFor,
    completed_at: completedAt,
    duration_minutes: duration && duration >= 15 && duration <= 480 ? Math.round(duration) : 60,
    status,
    topic,
    lesson_notes: nullableText(formData, "lessonNotes", 8000),
    understanding_rating: rating && rating >= 1 && rating <= 5 ? Math.round(rating) : null,
    next_topic: nullableText(formData, "nextTopic", 1000),
    homework_summary: nullableText(formData, "homeworkSummary", 2000),
    student_rate: nullableNumber(formData, "studentRate"),
    tutor_rate: nullableNumber(formData, "tutorRate"),
    currency: text(formData, "currency", 3).toUpperCase() || "GBP",
  }).select("id,scheduled_for,status,topic,duration_minutes,next_topic,homework_summary").single();
  if (error || !created) throw new Error(error?.message || "Could not create session.");

  if (formData.get("notifyStudent") === "on") {
    const { data: student } = await supabase.from("students").select("name,email").eq("id", studentId).maybeSingle();
    if (student?.email) {
      const result = await sendSessionNotification({
        sessionId: created.id,
        name: student.name,
        email: student.email,
        topic: created.topic,
        status: created.status,
        scheduledFor: created.scheduled_for,
        durationMinutes: created.duration_minutes,
        nextTopic: created.next_topic,
        homeworkSummary: created.homework_summary,
      });
      const subject = created.status === "completed" ? `Session follow-up: ${created.topic}` : created.status === "cancelled" ? `Session update: ${created.topic}` : `Tutoring session scheduled: ${created.topic}`;
      await recordStudentCommunication({ studentId, engagementId, type: "session_update", recipient: student.email, subject, result, createdByEmail: session.user.email || null });
    }
  }

  revalidatePath(`/admin/students/${studentId}`);
  revalidatePath("/admin/sessions");
}

export async function updateTutoringSessionStatus(formData: FormData) {
  const { session, supabase } = await adminContext();
  const sessionId = text(formData, "sessionId", 100);
  const studentId = text(formData, "studentId", 100);
  const status = text(formData, "status", 30) as SessionStatus;
  if (!sessionId || !studentId || !sessionStatuses.includes(status)) return;

  const update: Record<string, string | null> = { status, updated_at: new Date().toISOString() };
  if (status === "completed") update.completed_at = new Date().toISOString();
  const { data: updated, error } = await supabase.from("tutoring_sessions").update(update).eq("id", sessionId).select("id,engagement_id,scheduled_for,status,topic,duration_minutes,next_topic,homework_summary").single();
  if (error || !updated) throw new Error(error?.message || "Could not update session.");

  if (formData.get("notifyStudent") === "on") {
    const { data: student } = await supabase.from("students").select("name,email").eq("id", studentId).maybeSingle();
    if (student?.email) {
      const result = await sendSessionNotification({
        sessionId: updated.id,
        name: student.name,
        email: student.email,
        topic: updated.topic,
        status: updated.status,
        scheduledFor: updated.scheduled_for,
        durationMinutes: updated.duration_minutes,
        nextTopic: updated.next_topic,
        homeworkSummary: updated.homework_summary,
      });
      const subject = updated.status === "completed" ? `Session follow-up: ${updated.topic}` : updated.status === "cancelled" ? `Session update: ${updated.topic}` : `Tutoring session scheduled: ${updated.topic}`;
      await recordStudentCommunication({ studentId, engagementId: updated.engagement_id, type: "session_update", recipient: student.email, subject, result, createdByEmail: session.user.email || null });
    }
  }

  revalidatePath(`/admin/students/${studentId}`);
  revalidatePath("/admin/sessions");
}

export async function addHomework(formData: FormData) {
  const { session, supabase } = await adminContext();
  const engagementId = text(formData, "engagementId", 100);
  const studentId = text(formData, "studentId", 100);
  const title = text(formData, "title", 500);
  if (!engagementId || !studentId || !title) return;

  const { data: created, error } = await supabase.from("homework").insert({
    engagement_id: engagementId,
    session_id: nullableText(formData, "sessionId", 100),
    title,
    description: nullableText(formData, "description", 5000),
    due_date: dateOrNull(formData, "dueDate"),
    status: "assigned",
  }).select("id,title,description,due_date,status").single();
  if (error || !created) throw new Error(error?.message || "Could not assign homework.");

  if (formData.get("notifyStudent") === "on") {
    const { data: student } = await supabase.from("students").select("name,email").eq("id", studentId).maybeSingle();
    if (student?.email) {
      const result = await sendHomeworkNotification({
        homeworkId: created.id,
        name: student.name,
        email: student.email,
        title: created.title,
        description: created.description,
        dueDate: created.due_date,
        status: created.status,
      });
      await recordStudentCommunication({ studentId, engagementId, type: "homework_assigned", recipient: student.email, subject: `New homework: ${created.title}`, result, createdByEmail: session.user.email || null });
    }
  }

  revalidatePath(`/admin/students/${studentId}`);
}

export async function updateHomeworkStatus(formData: FormData) {
  const { session, supabase } = await adminContext();
  const homeworkId = text(formData, "homeworkId", 100);
  const studentId = text(formData, "studentId", 100);
  const status = text(formData, "status", 30) as HomeworkStatus;
  if (!homeworkId || !studentId || !homeworkStatuses.includes(status)) return;

  const { data: updated, error } = await supabase.from("homework").update({
    status,
    tutor_feedback: nullableText(formData, "feedback", 5000),
    updated_at: new Date().toISOString(),
  }).eq("id", homeworkId).select("id,engagement_id,title,description,due_date,status,tutor_feedback").single();
  if (error || !updated) throw new Error(error?.message || "Could not update homework.");

  if (formData.get("notifyStudent") === "on") {
    const { data: student } = await supabase.from("students").select("name,email").eq("id", studentId).maybeSingle();
    if (student?.email) {
      const result = await sendHomeworkNotification({
        homeworkId: updated.id,
        name: student.name,
        email: student.email,
        title: updated.title,
        description: updated.description,
        dueDate: updated.due_date,
        status: updated.status,
        feedback: updated.tutor_feedback,
      });
      await recordStudentCommunication({ studentId, engagementId: updated.engagement_id, type: "homework_update", recipient: student.email, subject: `Homework update: ${updated.title}`, result, createdByEmail: session.user.email || null });
    }
  }

  revalidatePath(`/admin/students/${studentId}`);
}

export async function addLearningResource(formData: FormData) {
  const { supabase } = await adminContext();
  const engagementId = text(formData, "engagementId", 100);
  const studentId = text(formData, "studentId", 100);
  const title = text(formData, "title", 500);
  if (!engagementId || !studentId || !title) return;
  const type = ["link", "note", "worksheet", "syllabus", "other"].includes(text(formData, "resourceType", 30)) ? text(formData, "resourceType", 30) : "link";

  const { error } = await supabase.from("learning_resources").insert({
    engagement_id: engagementId,
    session_id: nullableText(formData, "sessionId", 100),
    title,
    resource_type: type,
    url: nullableText(formData, "url", 2000),
    note: nullableText(formData, "note", 5000),
  });
  if (error) throw new Error(error.message);
  revalidatePath(`/admin/students/${studentId}`);
}


/* ============================================================
   ADD ANOTHER COURSE TO AN EXISTING STUDENT
   ============================================================ */

export async function addCourseToExistingStudent(
  formData: FormData,
) {
  const {
    supabase,
  } =
    await adminContext();


  const studentId =
    text(
      formData,
      "studentId",
      100,
    );


  const subject =
    text(
      formData,
      "subject",
      300,
    );


  if (
    !studentId ||
    !subject
  ) {
    return;
  }


  const {
    data: student,
    error:
      studentError,
  } =
    await supabase
      .from(
        "students",
      )
      .select(
        "id",
      )
      .eq(
        "id",
        studentId,
      )
      .maybeSingle();


  if (
    studentError ||
    !student
  ) {
    throw new Error(
      "Student not found.",
    );
  }


  const tutorId =
    nullableText(
      formData,
      "tutorId",
      100,
    );


  /*
   * Tutor is optional initially, but if supplied
   * it must be a real active tutor.
   */
  if (tutorId) {
    const {
      data: tutor,
      error:
        tutorError,
    } =
      await supabase
        .from(
          "tutors",
        )
        .select(
          "id",
        )
        .eq(
          "id",
          tutorId,
        )
        .eq(
          "status",
          "active",
        )
        .maybeSingle();


    if (
      tutorError ||
      !tutor
    ) {
      throw new Error(
        "Selected tutor is not available.",
      );
    }
  }


  const duration =
    nullableNumber(
      formData,
      "sessionDuration",
    );


  const {
    data: engagement,
    error,
  } =
    await supabase
      .from(
        "tutoring_engagements",
      )
      .insert({
        student_id:
          studentId,

        tutor_id:
          tutorId,

        subject,

        title:
          nullableText(
            formData,
            "engagementTitle",
            500,
          ) ||
          `${subject} tutoring`,

        module:
          nullableText(
            formData,
            "module",
            500,
          ),

        goal:
          nullableText(
            formData,
            "goal",
            3000,
          ),

        target:
          nullableText(
            formData,
            "target",
            1000,
          ),

        start_date:
          dateOrNull(
            formData,
            "startDate",
          ) ||
          new Date()
            .toISOString()
            .slice(
              0,
              10,
            ),

        status:
          "active",

        frequency:
          nullableText(
            formData,
            "frequency",
            300,
          ),

        session_duration_minutes:
          duration &&
          duration >= 15 &&
          duration <= 480
            ? Math.round(
                duration,
              )
            : 60,

        student_rate:
          nullableNumber(
            formData,
            "studentRate",
          ),

        tutor_rate:
          nullableNumber(
            formData,
            "tutorRate",
          ),

        currency:
          text(
            formData,
            "currency",
            3,
          )
            .toUpperCase() ||
          "GBP",

        current_focus:
          nullableText(
            formData,
            "currentFocus",
            1000,
          ),

        preferred_learning_style:
          nullableText(
            formData,
            "learningStyle",
            1000,
          ),

        weak_topics:
          csvList(
            formData,
            "weakTopics",
          ),

        notes:
          nullableText(
            formData,
            "notes",
            5000,
          ),
      })
      .select(
        "id",
      )
      .single();


  if (
    error ||
    !engagement
  ) {
    throw new Error(
      error?.message ||
        "Could not create course.",
    );
  }


  revalidatePath(
    "/admin/students",
  );

  revalidatePath(
    `/admin/students/${studentId}`,
  );


  redirect(
    `/admin/students/${studentId}?engagement=${engagement.id}`,
  );
}
