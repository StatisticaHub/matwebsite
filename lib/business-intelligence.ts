import { createAdminClient } from "@/lib/supabase/admin";

export type AttributionRange = "30" | "90" | "all";

type LeadRow = {
  id: string;
  reference: string;
  created_at: string;
  status: string;
  subject: string;
  level: string;
  support_type: string;
  source: string | null;
  landing_page: string | null;
  referrer: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  trial_status: string | null;
  trial_scheduled_for: string | null;
  trial_completed_at: string | null;
  currency: string;
  quoted_rate: number | null;
};

type StudentRow = {
  id: string;
  created_at: string;
  status: string;
  source_lead_id: string | null;
};

type EngagementRow = {
  id: string;
  created_at: string;
  status: string;
  student_id: string;
  source_lead_id: string | null;
  student_rate: number | null;
  tutor_rate: number | null;
  currency: string;
};

type SessionRow = {
  id: string;
  engagement_id: string;
  status: string;
  scheduled_for: string | null;
  completed_at: string | null;
  duration_minutes: number;
  student_rate: number | null;
  tutor_rate: number | null;
  currency: string;
  payment_status:
    | "untracked"
    | "unpaid"
    | "paid"
    | "waived";
  amount_paid: number | null;
  tutor_payout_status:
    | "untracked"
    | "unpaid"
    | "paid"
    | "not_applicable";
  tutor_payout_amount: number | null;
};

export type CurrencyTotals = Record<string, number>;

export type LeadAttributionFact = {
  leadId: string;
  reference: string;
  createdAt: string;
  status: string;
  subject: string;
  level: string;
  supportType: string;
  source: string;
  landingPage: string;
  campaign: string;
  trialScheduled: boolean;
  trialCompleted: boolean;
  studentConverted: boolean;
  studentCreatedAt: string | null;
  activeEngagement: boolean;
  completedSessions: number;
  teachingMinutes: number;
  studentValue: CurrencyTotals;
  waivedValue: CurrencyTotals;
  tutorCost: CurrencyTotals;
  grossContribution: CurrencyTotals;

  actualRevenue: CurrencyTotals;
  outstandingValue: CurrencyTotals;

  actualTutorPayouts: CurrencyTotals;
  outstandingTutorPayouts: CurrencyTotals;

  actualCashMargin: CurrencyTotals;

  paidSessions: number;
  unpaidSessions: number;
  waivedSessions: number;
  untrackedPaymentSessions: number;

  tutorPaidSessions: number;
  tutorUnpaidSessions: number;
  tutorNotApplicableSessions: number;
  tutorUntrackedSessions: number;
};

export type AttributionGroup = {
  label: string;
  leads: number;
  trials: number;
  students: number;
  activeEngagements: number;
  completedSessions: number;
  teachingMinutes: number;
  studentValue: CurrencyTotals;
  waivedValue: CurrencyTotals;
  grossContribution: CurrencyTotals;

  actualRevenue: CurrencyTotals;
  outstandingValue: CurrencyTotals;

  actualTutorPayouts: CurrencyTotals;
  outstandingTutorPayouts: CurrencyTotals;

  actualCashMargin: CurrencyTotals;

  paidSessions: number;
  unpaidSessions: number;
  waivedSessions: number;
  untrackedPaymentSessions: number;

  tutorPaidSessions: number;
  tutorUnpaidSessions: number;
  tutorNotApplicableSessions: number;
  tutorUntrackedSessions: number;
};

export type BusinessIntelligence = {
  range: AttributionRange;
  rangeLabel: string;
  facts: LeadAttributionFact[];
  totals: AttributionGroup;
  trialCompleted: number;
  activeStudents: number;
  medianDaysToStudent: number | null;
  knownAcquisitionSources: number;
  lostLeads: number;
  bySource: AttributionGroup[];
  byLandingPage: AttributionGroup[];
  byCampaign: AttributionGroup[];
  bySubject: AttributionGroup[];
};

function addMoney(target: CurrencyTotals, currency: string | null | undefined, value: number) {
  if (!Number.isFinite(value) || value === 0) return;
  const code = (currency || "GBP").toUpperCase();
  target[code] = (target[code] || 0) + value;
}

function mergeMoney(target: CurrencyTotals, source: CurrencyTotals) {
  for (const [currency, value] of Object.entries(source)) addMoney(target, currency, value);
}

export function compactPath(value: string | null | undefined) {
  if (!value) return "Direct / unknown";
  try {
    const parsed = new URL(value);
    return parsed.pathname || "/";
  } catch {
    const path = value.split("?")[0]?.trim();
    return path || "Direct / unknown";
  }
}

export function sourceLabel(lead: Pick<LeadRow, "utm_source" | "utm_medium" | "referrer" | "source">) {
  const utmSource = lead.utm_source?.trim();
  if (utmSource) {
    const medium = lead.utm_medium?.trim();
    return medium ? `${utmSource} / ${medium}` : utmSource;
  }

  if (lead.referrer) {
    try {
      const host = new URL(lead.referrer).hostname.replace(/^www\./, "");
      if (host && !host.includes("myacademictutor.com")) return host;
    } catch {
      // Ignore malformed referrers and continue to source fallback.
    }
  }

  const source = lead.source?.trim();
  if (source && source.toLowerCase() !== "website") return source;
  return "Direct / website";
}

function rangeStart(range: AttributionRange) {
  if (range === "all") return null;
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (Number(range) - 1));
  return start;
}

function median(values: number[]) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

function emptyGroup(label: string): AttributionGroup {
  return {
    label,
    leads: 0,
    trials: 0,
    students: 0,
    activeEngagements: 0,
    completedSessions: 0,
    teachingMinutes: 0,
    studentValue: {},
    waivedValue: {},
    grossContribution: {},

    actualRevenue: {},
    outstandingValue: {},

    actualTutorPayouts: {},
    outstandingTutorPayouts: {},

    actualCashMargin: {},

    paidSessions: 0,
    unpaidSessions: 0,
    waivedSessions: 0,
    untrackedPaymentSessions: 0,

    tutorPaidSessions: 0,
    tutorUnpaidSessions: 0,
    tutorNotApplicableSessions: 0,
    tutorUntrackedSessions: 0,
  };
}

function groupFacts(facts: LeadAttributionFact[], getter: (fact: LeadAttributionFact) => string, limit = 12) {
  const map = new Map<string, AttributionGroup>();

  for (const fact of facts) {
    const label = getter(fact).trim() || "Not provided";
    const group = map.get(label) || emptyGroup(label);
    group.leads += 1;
    if (fact.trialScheduled) group.trials += 1;
    if (fact.studentConverted) group.students += 1;
    if (fact.activeEngagement) group.activeEngagements += 1;
    group.completedSessions += fact.completedSessions;
    group.teachingMinutes += fact.teachingMinutes;
    mergeMoney(group.studentValue, fact.studentValue);
    mergeMoney(group.waivedValue, fact.waivedValue);
    mergeMoney(group.grossContribution, fact.grossContribution);

    mergeMoney(group.actualRevenue, fact.actualRevenue);
    mergeMoney(group.outstandingValue, fact.outstandingValue);

    mergeMoney(
      group.actualTutorPayouts,
      fact.actualTutorPayouts
    );

    mergeMoney(
      group.outstandingTutorPayouts,
      fact.outstandingTutorPayouts
    );

    mergeMoney(
      group.actualCashMargin,
      fact.actualCashMargin
    );

    group.paidSessions += fact.paidSessions;
    group.unpaidSessions += fact.unpaidSessions;
    group.waivedSessions += fact.waivedSessions;

    group.untrackedPaymentSessions +=
      fact.untrackedPaymentSessions;

    group.tutorPaidSessions +=
      fact.tutorPaidSessions;

    group.tutorUnpaidSessions +=
      fact.tutorUnpaidSessions;

    group.tutorNotApplicableSessions +=
      fact.tutorNotApplicableSessions;

    group.tutorUntrackedSessions +=
      fact.tutorUntrackedSessions;

    map.set(label, group);
  }

  return [...map.values()]
    .sort((a, b) => b.students - a.students || b.leads - a.leads || b.completedSessions - a.completedSessions || a.label.localeCompare(b.label))
    .slice(0, limit);
}

function allTotals(facts: LeadAttributionFact[]) {
  const total = emptyGroup("All attributed leads");
  for (const fact of facts) {
    total.leads += 1;
    if (fact.trialScheduled) total.trials += 1;
    if (fact.studentConverted) total.students += 1;
    if (fact.activeEngagement) total.activeEngagements += 1;
    total.completedSessions += fact.completedSessions;
    total.teachingMinutes += fact.teachingMinutes;
    mergeMoney(total.studentValue, fact.studentValue);
    mergeMoney(total.waivedValue, fact.waivedValue);
    mergeMoney(total.grossContribution, fact.grossContribution);

    mergeMoney(total.actualRevenue, fact.actualRevenue);
    mergeMoney(total.outstandingValue, fact.outstandingValue);

    mergeMoney(
      total.actualTutorPayouts,
      fact.actualTutorPayouts
    );

    mergeMoney(
      total.outstandingTutorPayouts,
      fact.outstandingTutorPayouts
    );

    mergeMoney(
      total.actualCashMargin,
      fact.actualCashMargin
    );

    total.paidSessions += fact.paidSessions;
    total.unpaidSessions += fact.unpaidSessions;
    total.waivedSessions += fact.waivedSessions;

    total.untrackedPaymentSessions +=
      fact.untrackedPaymentSessions;

    total.tutorPaidSessions +=
      fact.tutorPaidSessions;

    total.tutorUnpaidSessions +=
      fact.tutorUnpaidSessions;

    total.tutorNotApplicableSessions +=
      fact.tutorNotApplicableSessions;

    total.tutorUntrackedSessions +=
      fact.tutorUntrackedSessions;
  }

  return total;
}

export async function loadBusinessIntelligence(range: AttributionRange = "90"): Promise<BusinessIntelligence> {
  const supabase = createAdminClient();

  const [leadResult, studentResult, engagementResult, sessionResult] = await Promise.all([
    supabase
      .from("tutoring_leads")
      .select("id,reference,created_at,status,subject,level,support_type,source,landing_page,referrer,utm_source,utm_medium,utm_campaign,trial_status,trial_scheduled_for,trial_completed_at,currency,quoted_rate")
      .order("created_at", { ascending: false })
      .limit(10000),
    supabase
      .from("students")
      .select("id,created_at,status,source_lead_id")
      .order("created_at", { ascending: false })
      .limit(10000),
    supabase
      .from("tutoring_engagements")
      .select("id,created_at,status,student_id,source_lead_id,student_rate,tutor_rate,currency")
      .order("created_at", { ascending: false })
      .limit(10000),
    supabase
      .from("tutoring_sessions")
      .select("id,engagement_id,status,scheduled_for,completed_at,duration_minutes,student_rate,tutor_rate,currency,payment_status,amount_paid,tutor_payout_status,tutor_payout_amount")
      .order("scheduled_for", { ascending: false })
      .limit(20000),
  ]);

  if (leadResult.error) throw new Error(leadResult.error.message);
  if (studentResult.error) throw new Error(studentResult.error.message);
  if (engagementResult.error) throw new Error(engagementResult.error.message);
  if (sessionResult.error) throw new Error(sessionResult.error.message);

  const leads = (leadResult.data || []) as LeadRow[];
  const students = (studentResult.data || []) as StudentRow[];
  const engagements = (engagementResult.data || []) as EngagementRow[];
  const sessions = (sessionResult.data || []) as SessionRow[];
  const start = rangeStart(range);
  const cohort = start ? leads.filter((lead) => new Date(lead.created_at) >= start) : leads;
  const cohortIds = new Set(cohort.map((lead) => lead.id));

  const studentByLead = new Map<string, StudentRow>();
  const leadByStudent = new Map<string, string>();
  for (const student of students) {
    if (!student.source_lead_id) continue;
    studentByLead.set(student.source_lead_id, student);
    leadByStudent.set(student.id, student.source_lead_id);
  }

  const engagementLead = new Map<string, string>();
  const engagementsByLead = new Map<string, EngagementRow[]>();
  for (const engagement of engagements) {
    const leadId = engagement.source_lead_id || leadByStudent.get(engagement.student_id) || null;
    if (!leadId) continue;
    engagementLead.set(engagement.id, leadId);
    const list = engagementsByLead.get(leadId) || [];
    list.push(engagement);
    engagementsByLead.set(leadId, list);
  }

  const sessionsByLead = new Map<string, SessionRow[]>();
  for (const session of sessions) {
    const leadId = engagementLead.get(session.engagement_id);
    if (!leadId || !cohortIds.has(leadId)) continue;
    const list = sessionsByLead.get(leadId) || [];
    list.push(session);
    sessionsByLead.set(leadId, list);
  }

  const facts: LeadAttributionFact[] = cohort.map((lead) => {
    const student = studentByLead.get(lead.id) || null;
    const leadEngagements = engagementsByLead.get(lead.id) || [];
    const leadSessions = (sessionsByLead.get(lead.id) || []).filter((session) => session.status === "completed");
    const studentValue: CurrencyTotals = {};
    const waivedValue: CurrencyTotals = {};
    const tutorCost: CurrencyTotals = {};
    const grossContribution: CurrencyTotals = {};

    const actualRevenue: CurrencyTotals = {};
    const outstandingValue: CurrencyTotals = {};

    const actualTutorPayouts: CurrencyTotals = {};
    const outstandingTutorPayouts: CurrencyTotals = {};

    const actualCashMargin: CurrencyTotals = {};

    let paidSessions = 0;
    let unpaidSessions = 0;
    let waivedSessions = 0;
    let untrackedPaymentSessions = 0;

    let tutorPaidSessions = 0;
    let tutorUnpaidSessions = 0;
    let tutorNotApplicableSessions = 0;
    let tutorUntrackedSessions = 0;

    let teachingMinutes = 0;

    for (const session of leadSessions) {
      const minutes = Math.max(0, Number(session.duration_minutes) || 0);
      teachingMinutes += minutes;
      const hours = minutes / 60;
      const studentRate =
        session.student_rate === null
          ? null
          : Number(session.student_rate);

      const tutorRate =
        session.tutor_rate === null
          ? null
          : Number(session.tutor_rate);

      const hasStudentRate =
        studentRate !== null &&
        Number.isFinite(studentRate);

      const hasTutorRate =
        tutorRate !== null &&
        Number.isFinite(tutorRate);

      if (session.payment_status === "waived") {
        if (hasStudentRate) {
          addMoney(
            waivedValue,
            session.currency,
            studentRate * hours
          );
        }
      } else {
        if (hasStudentRate) {
          addMoney(
            studentValue,
            session.currency,
            studentRate * hours
          );
        }

        if (
          hasStudentRate &&
          hasTutorRate
        ) {
          addMoney(
            grossContribution,
            session.currency,
            (studentRate - tutorRate) * hours
          );
        }
      }

      if (hasTutorRate) {
        addMoney(
          tutorCost,
          session.currency,
          tutorRate * hours
        );
      }

      if (session.payment_status === "paid") {
        paidSessions += 1;

        const received =
          session.amount_paid === null
            ? null
            : Number(session.amount_paid);

        if (
          received !== null &&
          Number.isFinite(received) &&
          received >= 0
        ) {
          addMoney(
            actualRevenue,
            session.currency,
            received
          );

          addMoney(
            actualCashMargin,
            session.currency,
            received
          );
        }
      } else if (session.payment_status === "unpaid") {
        unpaidSessions += 1;

        if (
          studentRate !== null &&
          Number.isFinite(studentRate)
        ) {
          addMoney(
            outstandingValue,
            session.currency,
            studentRate * hours
          );
        }
      } else if (session.payment_status === "waived") {
        waivedSessions += 1;
      } else {
        untrackedPaymentSessions += 1;
      }

      if (session.tutor_payout_status === "paid") {
        tutorPaidSessions += 1;

        const paidToTutor =
          session.tutor_payout_amount === null
            ? null
            : Number(session.tutor_payout_amount);

        if (
          paidToTutor !== null &&
          Number.isFinite(paidToTutor) &&
          paidToTutor >= 0
        ) {
          addMoney(
            actualTutorPayouts,
            session.currency,
            paidToTutor
          );

          addMoney(
            actualCashMargin,
            session.currency,
            -paidToTutor
          );
        }
      } else if (
        session.tutor_payout_status === "unpaid"
      ) {
        tutorUnpaidSessions += 1;

        if (
          tutorRate !== null &&
          Number.isFinite(tutorRate)
        ) {
          addMoney(
            outstandingTutorPayouts,
            session.currency,
            tutorRate * hours
          );
        }
      } else if (
        session.tutor_payout_status === "not_applicable"
      ) {
        tutorNotApplicableSessions += 1;
      } else {
        tutorUntrackedSessions += 1;
      }
    }

    return {
      leadId: lead.id,
      reference: lead.reference,
      createdAt: lead.created_at,
      status: lead.status,
      subject: lead.subject,
      level: lead.level,
      supportType: lead.support_type,
      source: sourceLabel(lead),
      landingPage: compactPath(lead.landing_page),
      campaign: lead.utm_campaign?.trim() || "No campaign",
      trialScheduled: Boolean(lead.trial_scheduled_for) || ["scheduled", "completed", "cancelled", "no_show"].includes(lead.trial_status || ""),
      trialCompleted: lead.trial_status === "completed" || Boolean(lead.trial_completed_at),
      studentConverted: Boolean(student),
      studentCreatedAt: student?.created_at || null,
      activeEngagement: leadEngagements.some((engagement) => engagement.status === "active"),
      completedSessions: leadSessions.length,
      teachingMinutes,
      studentValue,
      waivedValue,
      tutorCost,
      grossContribution,

      actualRevenue,
      outstandingValue,

      actualTutorPayouts,
      outstandingTutorPayouts,

      actualCashMargin,

      paidSessions,
      unpaidSessions,
      waivedSessions,
      untrackedPaymentSessions,

      tutorPaidSessions,
      tutorUnpaidSessions,
      tutorNotApplicableSessions,
      tutorUntrackedSessions,
    };
  });

  const conversionDays = facts
    .filter((fact) => fact.studentCreatedAt)
    .map((fact) => Math.max(0, (new Date(fact.studentCreatedAt as string).getTime() - new Date(fact.createdAt).getTime()) / 86400000));

  const knownAcquisitionSources = cohort.filter((lead) => {
    if (lead.utm_source?.trim()) return true;
    if (lead.source?.trim() && lead.source.trim().toLowerCase() !== "website") return true;
    if (!lead.referrer) return false;
    try {
      return !new URL(lead.referrer).hostname.includes("myacademictutor.com");
    } catch {
      return false;
    }
  }).length;

  const trialCompleted = facts.filter((fact) => fact.trialCompleted).length;
  const activeStudents = students.filter((student) => student.status === "active" && student.source_lead_id && cohortIds.has(student.source_lead_id)).length;

  return {
    range,
    rangeLabel: range === "all" ? "All time" : `Last ${range} days`,
    facts,
    totals: allTotals(facts),
    trialCompleted,
    activeStudents,
    medianDaysToStudent: median(conversionDays),
    knownAcquisitionSources,
    lostLeads: cohort.filter((lead) => lead.status === "lost").length,
    bySource: groupFacts(facts, (fact) => fact.source),
    byLandingPage: groupFacts(facts, (fact) => fact.landingPage, 15),
    byCampaign: groupFacts(facts.filter((fact) => fact.campaign !== "No campaign"), (fact) => fact.campaign, 12),
    bySubject: groupFacts(facts, (fact) => fact.subject, 15),
  };
}
