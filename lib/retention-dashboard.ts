import { createAdminClient } from "@/lib/supabase/admin";
import type { RetentionCase, RetentionOutreach, RetentionSettings } from "@/lib/retention";

const DAY_MS = 86_400_000;

type Engagement = {
  id: string;
  created_at: string;
  student_id: string;
  source_lead_id: string | null;
  tutor_id: string | null;
  subject: string;
  title: string;
  start_date: string | null;
  end_date: string | null;
  status: "active" | "paused" | "completed";
};

type Student = { id: string; name: string; email: string; status: string; academic_level: string | null };
type Tutor = { id: string; name: string; email: string; status: string; weekly_capacity_hours: number | null; max_active_students: number | null };
type Lead = { id: string; source: string | null; landing_page: string | null; utm_source: string | null; utm_campaign: string | null };
type Session = { id: string; engagement_id: string; scheduled_for: string | null; completed_at: string | null; duration_minutes: number; status: "planned" | "completed" | "cancelled" | "no_show" };

type Breakdown = { key: string; engagements: number; eligible30: number; retained30: number; rate30: number | null; eligible60: number; retained60: number; rate60: number | null };

type TutorWorkload = {
  tutorId: string;
  tutorName: string;
  activeStudents: number;
  highAttention: number;
  noFutureSession: number;
  plannedHours7: number;
  plannedHours30: number;
  weeklyCapacityHours: number | null;
  maxActiveStudents: number | null;
};

function round(value: number, digits = 1) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function pct(n: number, d: number) {
  return d ? round((n / d) * 100, 1) : null;
}

function startMs(row: Engagement) {
  return new Date(`${row.start_date || row.created_at.slice(0, 10)}T12:00:00Z`).getTime();
}

function sessionTime(row: Session) {
  const value = row.completed_at || row.scheduled_for;
  return value ? new Date(value).getTime() : 0;
}

function buildBreakdown(engagements: Engagement[], sessionsByEngagement: Map<string, Session[]>, keyFn: (row: Engagement) => string, now: number): Breakdown[] {
  const buckets = new Map<string, Breakdown>();
  for (const engagement of engagements) {
    const key = keyFn(engagement) || "Unknown";
    const bucket = buckets.get(key) || { key, engagements: 0, eligible30: 0, retained30: 0, rate30: null, eligible60: 0, retained60: 0, rate60: null };
    bucket.engagements += 1;
    const start = startMs(engagement);
    const ageDays = (now - start) / DAY_MS;
    const completedTimes = (sessionsByEngagement.get(engagement.id) || []).filter((s) => s.status === "completed").map(sessionTime).filter(Boolean);
    if (ageDays >= 30) {
      bucket.eligible30 += 1;
      if (completedTimes.some((time) => time >= start + 30 * DAY_MS)) bucket.retained30 += 1;
    }
    if (ageDays >= 60) {
      bucket.eligible60 += 1;
      if (completedTimes.some((time) => time >= start + 60 * DAY_MS)) bucket.retained60 += 1;
    }
    buckets.set(key, bucket);
  }
  return [...buckets.values()].map((row) => ({ ...row, rate30: pct(row.retained30, row.eligible30), rate60: pct(row.retained60, row.eligible60) })).sort((a, b) => b.engagements - a.engagements || a.key.localeCompare(b.key));
}

export async function loadRetentionDashboard() {
  const supabase = createAdminClient();
  const now = Date.now();
  const in7 = now + 7 * DAY_MS;
  const in30 = now + 30 * DAY_MS;

  const [settingsResult, casesResult, engagementsResult, sessionsResult, studentsResult, tutorsResult, leadsResult, outreachResult] = await Promise.all([
    supabase.from("retention_settings").select("*").eq("id", 1).single(),
    supabase.from("retention_cases").select("*").order("attention_score", { ascending: false }).order("last_evaluated_at", { ascending: false }).limit(2000),
    supabase.from("tutoring_engagements").select("id,created_at,student_id,source_lead_id,tutor_id,subject,title,start_date,end_date,status").limit(3000),
    supabase.from("tutoring_sessions").select("id,engagement_id,scheduled_for,completed_at,duration_minutes,status").limit(5000),
    supabase.from("students").select("id,name,email,status,academic_level").limit(3000),
    supabase.from("tutors").select("id,name,email,status,weekly_capacity_hours,max_active_students").limit(1000),
    supabase.from("tutoring_leads").select("id,source,landing_page,utm_source,utm_campaign").limit(3000),
    supabase.from("retention_outreach_log").select("*").order("created_at", { ascending: false }).limit(100),
  ]);

  for (const result of [settingsResult, casesResult, engagementsResult, sessionsResult, studentsResult, tutorsResult, leadsResult, outreachResult]) {
    if (result.error) throw new Error(result.error.message);
  }

  const settings = settingsResult.data as RetentionSettings;
  const cases = (casesResult.data || []) as RetentionCase[];
  const engagements = (engagementsResult.data || []) as Engagement[];
  const sessions = (sessionsResult.data || []) as Session[];
  const students = (studentsResult.data || []) as Student[];
  const tutors = (tutorsResult.data || []) as Tutor[];
  const leads = (leadsResult.data || []) as Lead[];
  const outreach = (outreachResult.data || []) as RetentionOutreach[];

  const studentMap = new Map(students.map((row) => [row.id, row]));
  const tutorMap = new Map(tutors.map((row) => [row.id, row]));
  const leadMap = new Map(leads.map((row) => [row.id, row]));
  const engagementMap = new Map(engagements.map((row) => [row.id, row]));
  const sessionsByEngagement = new Map<string, Session[]>();
  const studentHours = new Map<string, number>();
  for (const row of sessions) {
    const list = sessionsByEngagement.get(row.engagement_id) || [];
    list.push(row);
    sessionsByEngagement.set(row.engagement_id, list);
    if (row.status === "completed") {
      const engagement = engagementMap.get(row.engagement_id);
      if (engagement) studentHours.set(engagement.student_id, (studentHours.get(engagement.student_id) || 0) + row.duration_minutes / 60);
    }
  }

  const activeEngagements = engagements.filter((row) => row.status === "active");
  const activeCases = cases.filter((row) => !["resolved", "dismissed"].includes(row.status));
  const visibleAttentionCases = activeCases.filter((row) => row.status !== "snoozed" || !row.snoozed_until || new Date(`${row.snoozed_until}T23:59:59Z`).getTime() < now);
  const highCases = visibleAttentionCases.filter((row) => row.risk_level === "high");
  const noFuture = activeCases.filter((row) => !row.next_session_at);

  const completedLast30Minutes = sessions.filter((row) => row.status === "completed" && sessionTime(row) >= now - 30 * DAY_MS).reduce((sum, row) => sum + row.duration_minutes, 0);
  const planned7Minutes = sessions.filter((row) => row.status === "planned" && row.scheduled_for && new Date(row.scheduled_for).getTime() >= now && new Date(row.scheduled_for).getTime() <= in7).reduce((sum, row) => sum + row.duration_minutes, 0);
  const planned30Minutes = sessions.filter((row) => row.status === "planned" && row.scheduled_for && new Date(row.scheduled_for).getTime() >= now && new Date(row.scheduled_for).getTime() <= in30).reduce((sum, row) => sum + row.duration_minutes, 0);

  const tutorWorkloads: TutorWorkload[] = tutors.filter((tutor) => tutor.status === "active").map((tutor) => {
    const tutorEngagements = activeEngagements.filter((row) => row.tutor_id === tutor.id);
    const tutorCases = activeCases.filter((row) => row.tutor_id === tutor.id);
    const tutorSessionIds = new Set(tutorEngagements.map((row) => row.id));
    const planned = sessions.filter((row) => tutorSessionIds.has(row.engagement_id) && row.status === "planned" && row.scheduled_for);
    return {
      tutorId: tutor.id,
      tutorName: tutor.name,
      activeStudents: new Set(tutorEngagements.map((row) => row.student_id)).size,
      highAttention: tutorCases.filter((row) => row.risk_level === "high").length,
      noFutureSession: tutorCases.filter((row) => !row.next_session_at).length,
      plannedHours7: round(planned.filter((row) => new Date(row.scheduled_for || 0).getTime() >= now && new Date(row.scheduled_for || 0).getTime() <= in7).reduce((sum, row) => sum + row.duration_minutes, 0) / 60, 1),
      plannedHours30: round(planned.filter((row) => new Date(row.scheduled_for || 0).getTime() >= now && new Date(row.scheduled_for || 0).getTime() <= in30).reduce((sum, row) => sum + row.duration_minutes, 0) / 60, 1),
      weeklyCapacityHours: tutor.weekly_capacity_hours,
      maxActiveStudents: tutor.max_active_students,
    };
  }).sort((a, b) => b.highAttention - a.highAttention || b.activeStudents - a.activeStudents);

  const sourceKey = (engagement: Engagement) => {
    const lead = engagement.source_lead_id ? leadMap.get(engagement.source_lead_id) : null;
    return lead?.utm_source || lead?.source || "Direct / unknown";
  };
  const tutorKey = (engagement: Engagement) => engagement.tutor_id ? (tutorMap.get(engagement.tutor_id)?.name || "Unassigned") : "Unassigned";

  const caseRows = cases.map((retentionCase) => {
    const engagement = engagementMap.get(retentionCase.engagement_id) || null;
    const student = studentMap.get(retentionCase.student_id) || null;
    const tutor = retentionCase.tutor_id ? tutorMap.get(retentionCase.tutor_id) || null : null;
    const lead = engagement?.source_lead_id ? leadMap.get(engagement.source_lead_id) || null : null;
    return { retentionCase, engagement, student, tutor, lead, studentLifetimeHours: round(studentHours.get(retentionCase.student_id) || 0, 1) };
  });

  const activeStudentRows = [...new Set(activeEngagements.map((row) => row.student_id))].map((studentId) => {
    const student = studentMap.get(studentId);
    const engagementList = activeEngagements.filter((row) => row.student_id === studentId);
    const currentCases = activeCases.filter((row) => row.student_id === studentId);
    return {
      studentId,
      name: student?.name || "Student",
      academicLevel: student?.academic_level || null,
      lifetimeHours: round(studentHours.get(studentId) || 0, 1),
      activeSubjects: engagementList.map((row) => row.subject),
      highestAttention: currentCases.length ? Math.max(...currentCases.map((row) => row.attention_score)) : 0,
      hasFutureSession: currentCases.some((row) => Boolean(row.next_session_at)),
    };
  }).sort((a, b) => b.lifetimeHours - a.lifetimeHours);

  return {
    settings,
    cases: caseRows,
    outreach,
    metrics: {
      activeEngagements: activeEngagements.length,
      highAttention: highCases.length,
      noFutureSession: noFuture.length,
      openCases: visibleAttentionCases.filter((row) => row.status === "open").length,
      completedHours30: round(completedLast30Minutes / 60, 1),
      plannedHours7: round(planned7Minutes / 60, 1),
      plannedHours30: round(planned30Minutes / 60, 1),
    },
    tutorWorkloads,
    bySubject: buildBreakdown(engagements, sessionsByEngagement, (row) => row.subject, now),
    byTutor: buildBreakdown(engagements, sessionsByEngagement, tutorKey, now),
    bySource: buildBreakdown(engagements, sessionsByEngagement, sourceKey, now),
    activeStudents: activeStudentRows,
  };
}
