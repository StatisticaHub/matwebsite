import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import ProgressReportView from "@/components/ProgressReportView";
import PrintButton from "@/components/PrintButton";

import type {
  ProgressReport,
} from "@/lib/progress";

import { resolvePortalLink } from "@/lib/student-portal";
import { createAdminClient } from "@/lib/supabase/admin";


export const dynamic = "force-dynamic";


export const metadata: Metadata = {
  title: "Progress report",

  robots: {
    index: false,
    follow: false,
    nocache: true,
  },

  referrer: "no-referrer",
};


type Params =
  Promise<{
    token: string;
    reportId: string;
  }>;


export default async function StudentPrintableProgressPage({
  params,
}: {
  params: Params;
}) {
  const {
    token,
    reportId,
  } =
    await params;


  const link =
    await resolvePortalLink(
      token,
    );


  if (!link) {
    notFound();
  }


  const supabase =
    createAdminClient();


  const {
    data: report,
    error,
  } =
    await supabase
      .from("progress_reports")
      .select("*")
      .eq("id", reportId)
      .eq(
        "student_id",
        link.student_id,
      )
      .eq(
        "student_visible",
        true,
      )
      .maybeSingle();


  if (
    error ||
    !report
  ) {
    notFound();
  }


  const {
    data: engagement,
  } =
    await supabase
      .from(
        "tutoring_engagements",
      )
      .select(
        "id,subject,tutor_id,students(name),tutors(name)",
      )
      .eq(
        "id",
        report.engagement_id,
      )
      .eq(
        "student_id",
        link.student_id,
      )
      .single();


  const viewedAt =
    new Date()
      .toISOString();


  const viewUpdate = {
    first_viewed_at:
      report.first_viewed_at ||
      viewedAt,

    last_viewed_at:
      viewedAt,

    view_count:
      Number(
        report.view_count ||
        0,
      ) + 1,
  };


  const {
    error: viewError,
  } =
    await supabase
      .from(
        "progress_reports",
      )
      .update(
        viewUpdate,
      )
      .eq(
        "id",
        report.id,
      )
      .eq(
        "student_id",
        link.student_id,
      );


  if (viewError) {
    console.error(
      "Could not record progress report view:",
      viewError.message,
    );
  }


  const viewedReport = {
    ...report,
    ...viewUpdate,
  } as ProgressReport;


  return (
    <div className="progress-print-page student-progress-print">

      <div className="progress-print-toolbar">

        <Link
          href={`/portal/${encodeURIComponent(
            token,
          )}?view=progress&course=${encodeURIComponent(
            report.engagement_id,
          )}`}
        >
          ← Back to portal
        </Link>

        <PrintButton />

      </div>


      <ProgressReportView
        report={
          viewedReport
        }
        studentName={
          (engagement as any)
            ?.students?.name ||
          "Student"
        }
        subject={
          (engagement as any)
            ?.subject ||
          "Tutoring"
        }
        tutorName={
          (engagement as any)
            ?.tutors?.name ||
          null
        }
      />

    </div>
  );
}
