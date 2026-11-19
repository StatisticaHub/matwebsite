import { createAdminClient } from "@/lib/supabase/admin";
import type { StudentEmailResult } from "@/lib/email/student";

export const communicationTypes = [
  "intake_invitation",
  "portal_invitation",
  "session_update",
  "homework_assigned",
  "homework_update",
  "progress_report",
  "feedback_request",
] as const;

export type CommunicationType = (typeof communicationTypes)[number];

export type StudentCommunication = {
  id: string;
  created_at: string;
  student_id: string;
  engagement_id: string | null;
  communication_type: CommunicationType;
  channel: string;
  recipient: string;
  subject: string;
  status: "sent" | "failed" | "skipped";
  provider_id: string | null;
  error: string | null;
  created_by_email: string | null;
};

export async function recordStudentCommunication(input: {
  studentId: string;
  engagementId?: string | null;
  type: CommunicationType;
  recipient: string;
  subject: string;
  result: StudentEmailResult;
  createdByEmail?: string | null;
}) {
  const supabase = createAdminClient();
  const status: StudentCommunication["status"] = input.result.ok ? "sent" : input.result.skipped ? "skipped" : "failed";
  const { error } = await supabase.from("student_communications").insert({
    student_id: input.studentId,
    engagement_id: input.engagementId || null,
    communication_type: input.type,
    channel: "email",
    recipient: input.recipient,
    subject: input.subject,
    status,
    provider_id: input.result.id || null,
    error: input.result.error || null,
    created_by_email: input.createdByEmail || null,
  });
  if (error) console.error("Could not record student communication", error.message);
}
