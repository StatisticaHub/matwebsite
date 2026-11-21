import type { Tutor, TutoringLead } from "@/lib/admin-data";

export type TutorWorkload = {
  activeStudents: number;
  upcomingSessionHours: number;
};

export type TutorMatch = {
  tutor: Tutor;
  score: number;
  label: "Excellent" | "Strong" | "Possible" | "Limited";
  reasons: string[];
  warnings: string[];
  workload: TutorWorkload;
};

const dayTokens: Record<string, string[]> = {
  monday: ["monday", "mon"],
  tuesday: ["tuesday", "tue", "tues"],
  wednesday: ["wednesday", "wed"],
  thursday: ["thursday", "thu", "thur", "thurs"],
  friday: ["friday", "fri"],
  saturday: ["saturday", "sat"],
  sunday: ["sunday", "sun"],
};

const periodTokens: Record<string, string[]> = {
  morning: ["morning", "am"],
  afternoon: ["afternoon", "midday"],
  evening: ["evening", "pm", "after 5", "after 6"],
};

function normalise(value: string | null | undefined) {
  return (value || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function listMatches(items: string[], target: string) {
  const t = normalise(target);
  if (!t) return false;
  return items.some((item) => {
    const i = normalise(item);
    return i === t || i.includes(t) || t.includes(i);
  });
}

function detectFromText(text: string | null, map: Record<string, string[]>) {
  const value = ` ${normalise(text)} `;
  return Object.entries(map)
    .filter(([, tokens]) => tokens.some((token) => value.includes(` ${normalise(token)} `)))
    .map(([key]) => key);
}

function matchingSpecialisms(tutor: Tutor, lead: TutoringLead) {
  const leadText = ` ${normalise(
    [
      lead.subject,
      lead.topic,
      lead.requirements,
      lead.support_type,
      lead.curriculum,
    ]
      .filter(Boolean)
      .join(" "),
  )} `;

  return (tutor.specialisms || []).filter((specialism) => {
    const phrase = normalise(specialism);
    if (!phrase) return false;

    if (leadText.includes(` ${phrase} `)) return true;

    const tokens = phrase.split(" ").filter(Boolean);
    return (
      tokens.length > 1 &&
      tokens.every((token) => leadText.includes(` ${token} `))
    );
  });
}

function timezoneAffinity(country: string, timezone: string | null) {
  const c = normalise(country);
  const tz = normalise(timezone);
  if (!tz) return false;
  if ((c.includes("united kingdom") || c === "uk" || c.includes("england") || c.includes("scotland") || c.includes("wales")) && tz.includes("europe london")) return true;
  if (c.includes("india") && (tz.includes("asia kolkata") || tz.includes("asia calcutta"))) return true;
  if ((c.includes("united states") || c === "usa" || c.includes("america")) && tz.includes("america")) return true;
  if (c.includes("canada") && tz.includes("america")) return true;
  if (c.includes("australia") && tz.includes("australia")) return true;
  return false;
}

export function rankTutorsForLead(
  lead: TutoringLead,
  tutors: Tutor[],
  workloads: Record<string, TutorWorkload>,
): TutorMatch[] {
  return tutors
    .filter((tutor) => tutor.status === "active")
    .map((tutor) => {
      let score = 0;
      const reasons: string[] = [];
      const warnings: string[] = [];
      const workload = workloads[tutor.id] || { activeStudents: 0, upcomingSessionHours: 0 };

      if (listMatches(tutor.subjects, lead.subject)) {
        score += 35;
        reasons.push(`Subject match: ${lead.subject}`);
      } else if (tutor.subjects.length) {
        warnings.push("Subject is not listed on the tutor profile");
      } else {
        warnings.push("Tutor subjects are not configured");
      }

      if (listMatches(tutor.levels, lead.level)) {
        score += 18;
        reasons.push(`Level match: ${lead.level}`);
      } else if (!tutor.levels.length) {
        warnings.push("Tutor levels are not configured");
      } else {
        warnings.push("Academic level is not an exact profile match");
      }

      const specialistMatches = matchingSpecialisms(tutor, lead);

      if (specialistMatches.length >= 2) {
        score += 12;
        reasons.push(
          `Specialist fit: ${specialistMatches.slice(0, 3).join(", ")}`,
        );
      } else if (specialistMatches.length === 1) {
        score += 8;
        reasons.push(`Specialist fit: ${specialistMatches[0]}`);
      } else if ((tutor.specialisms || []).length) {
        warnings.push("No specialist-topic match detected");
      }

      const requestedDays = detectFromText(lead.availability, dayTokens);
      const requestedPeriods = detectFromText(lead.availability, periodTokens);
      const tutorDays = (tutor.availability_days || []).map(normalise);
      const tutorPeriods = (tutor.availability_periods || []).map(normalise);

      if (requestedDays.length || requestedPeriods.length) {
        const dayOk = !requestedDays.length || requestedDays.some((day) => tutorDays.includes(day));
        const periodOk = !requestedPeriods.length || requestedPeriods.some((period) => tutorPeriods.includes(period));
        if (dayOk && periodOk && (tutorDays.length || tutorPeriods.length)) {
          score += 10;
          reasons.push("Availability matches the student's stated preference");
        } else if (dayOk || periodOk) {
          score += 5;
          reasons.push("Partial availability match");
        } else {
          warnings.push("Availability may need checking manually");
        }
      } else if (tutorDays.length || tutorPeriods.length || tutor.availability_notes) {
        score += 6;
        reasons.push("Tutor availability is documented");
      }

      const weeklyCapacity = tutor.weekly_capacity_hours ?? null;
      if (weeklyCapacity && weeklyCapacity > 0) {
        const ratio = workload.upcomingSessionHours / weeklyCapacity;
        if (ratio < 0.5) {
          score += 8;
          reasons.push("Good weekly capacity available");
        } else if (ratio < 0.8) {
          score += 6;
          reasons.push("Moderate weekly capacity available");
        } else if (ratio < 1) {
          score += 2;
          warnings.push("Tutor is close to weekly capacity");
        } else {
          warnings.push("Tutor is at or above stated weekly capacity");
        }
      } else {
        score += 4;
        warnings.push("Weekly capacity is not configured");
      }

      const maxStudents = tutor.max_active_students ?? null;
      if (maxStudents !== null && maxStudents > 0) {
        const ratio = workload.activeStudents / maxStudents;
        if (ratio < 0.6) {
          score += 4;
          reasons.push("Student load is comfortably below the tutor limit");
        } else if (ratio < 1) {
          score += 2;
          reasons.push("Tutor still has student capacity");
        } else {
          warnings.push("Tutor has reached the stated active-student limit");
        }
      } else {
        score += 2;
      }

      if (tutor.verified) {
        score += 6;
        reasons.push("Tutor is verified");
      }

      if (lead.trial_status === "not_scheduled" || !lead.trial_status) {
        if (tutor.accepts_trials !== false) {
          score += 5;
          reasons.push("Available for trial sessions");
        } else {
          warnings.push("Tutor is not currently accepting trial sessions");
        }
      } else {
        score += 5;
      }

      if (timezoneAffinity(lead.country, tutor.timezone)) {
        reasons.push("Timezone is naturally aligned with the student's country");
      }

      const finalScore = Math.max(0, Math.min(100, Math.round(score)));
      const label = finalScore >= 85 ? "Excellent" : finalScore >= 70 ? "Strong" : finalScore >= 50 ? "Possible" : "Limited";
      return { tutor, score: finalScore, label, reasons, warnings, workload } as TutorMatch;
    })
    .sort((a, b) => b.score - a.score || a.workload.upcomingSessionHours - b.workload.upcomingSessionHours || a.tutor.name.localeCompare(b.tutor.name));
}
