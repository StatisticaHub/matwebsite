import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { loadBusinessIntelligence, type AttributionRange, type CurrencyTotals } from "@/lib/business-intelligence";

export const runtime = "nodejs";

function csvCell(value: string | number | boolean | null | undefined) {
  let text = String(value ?? "");
  if (/^[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}

function moneyText(value: CurrencyTotals) {
  return Object.entries(value)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([currency, amount]) => `${currency} ${amount.toFixed(2)}`)
    .join(" | ");
}

export async function GET(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const requested = request.nextUrl.searchParams.get("range");
  const range: AttributionRange = requested === "30" || requested === "all" ? requested : "90";
  const data = await loadBusinessIntelligence(range);
  const header = [
    "reference", "lead_created_at", "source", "landing_page", "campaign", "subject", "level", "support_type", "lead_status", "trial_scheduled", "trial_completed", "student_converted", "student_created_at", "active_engagement", "completed_sessions", "teaching_hours", "student_paid_sessions", "student_unpaid_sessions", "student_waived_sessions", "student_untracked_sessions", "student_collection_rate", "actual_revenue_received", "student_outstanding_expected_value", "tutor_paid_sessions", "tutor_unpaid_sessions", "tutor_not_applicable_sessions", "tutor_untracked_sessions", "tutor_payout_completion_rate", "actual_tutor_payouts", "tutor_outstanding_expected_value", "net_cash_retained", "chargeable_teaching_value", "waived_teaching_value", "gross_contribution",
  ];
  const rows = data.facts.map((fact) => [
    fact.reference,
    fact.createdAt,
    fact.source,
    fact.landingPage,
    fact.campaign,
    fact.subject,
    fact.level,
    fact.supportType,
    fact.status,
    fact.trialScheduled,
    fact.trialCompleted,
    fact.studentConverted,
    fact.studentCreatedAt,
    fact.activeEngagement,
    fact.completedSessions,
    (fact.teachingMinutes / 60).toFixed(2),

    fact.paidSessions,
    fact.unpaidSessions,
    fact.waivedSessions,
    fact.untrackedPaymentSessions,

    fact.paidSessions +
      fact.unpaidSessions
      ? (
          fact.paidSessions /
          (
            fact.paidSessions +
            fact.unpaidSessions
          )
        ).toFixed(4)
      : "0.0000",

    moneyText(
      fact.actualRevenue
    ),

    moneyText(
      fact.outstandingValue
    ),

    fact.tutorPaidSessions,
    fact.tutorUnpaidSessions,
    fact.tutorNotApplicableSessions,
    fact.tutorUntrackedSessions,

    fact.tutorPaidSessions +
      fact.tutorUnpaidSessions
      ? (
          fact.tutorPaidSessions /
          (
            fact.tutorPaidSessions +
            fact.tutorUnpaidSessions
          )
        ).toFixed(4)
      : "0.0000",

    moneyText(
      fact.actualTutorPayouts
    ),

    moneyText(
      fact.outstandingTutorPayouts
    ),

    moneyText(
      fact.actualCashMargin
    ),

    moneyText(
      fact.studentValue
    ),

    moneyText(
      fact.waivedValue
    ),

    moneyText(
      fact.grossContribution
    ),
  ]);
  const csv = [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\n");
  const stamp = new Date().toISOString().slice(0, 10);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="mat-attribution-${range}-${stamp}.csv"`,
      "Cache-Control": "private, no-store",
    },
  });
}
