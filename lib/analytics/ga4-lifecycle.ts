import { createAdminClient } from "@/lib/supabase/admin";

export const ga4LifecycleEvents = [
  "working_lead",
  "qualify_lead",
  "disqualify_lead",
  "close_convert_lead",
  "close_unconvert_lead",
] as const;

export type Ga4LifecycleEvent = (typeof ga4LifecycleEvents)[number];

type SendArgs = {
  leadId: string;
  eventName: Ga4LifecycleEvent;
  sourceAction: string;
  leadStatus?: string | null;
  reason?: string | null;
};

type SendResult = {
  ok: boolean;
  skipped?: boolean;
  error?: string;
};

function configured() {
  return Boolean(
    process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim() &&
    process.env.GA4_MEASUREMENT_PROTOCOL_SECRET?.trim()
  );
}

export function ga4LifecycleConfigStatus() {
  return {
    measurementId: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim() || "",
    secretConfigured: Boolean(process.env.GA4_MEASUREMENT_PROTOCOL_SECRET?.trim()),
  };
}

function cleanParam(value: unknown, max = 100) {
  return String(value ?? "").trim().slice(0, max);
}

async function writeLog(args: {
  leadId: string;
  eventName: Ga4LifecycleEvent;
  sourceAction: string;
  dedupeKey: string;
  status: "sent" | "failed" | "skipped";
  responseStatus?: number | null;
  error?: string | null;
  clientIdPresent: boolean;
}) {
  try {
    const supabase = createAdminClient();
    const now = new Date().toISOString();
    await supabase.from("ga4_lifecycle_event_log").upsert({
      lead_id: args.leadId,
      event_name: args.eventName,
      source_action: args.sourceAction,
      dedupe_key: args.dedupeKey,
      status: args.status,
      attempted_at: now,
      sent_at: args.status === "sent" ? now : null,
      response_status: args.responseStatus ?? null,
      error: args.error ?? null,
      client_id_present: args.clientIdPresent,
      updated_at: now,
    }, { onConflict: "dedupe_key" });
  } catch (error) {
    console.error("[MAT GA4 LOG ERROR]", error);
  }
}

export async function sendGa4LeadLifecycleEvent(args: SendArgs): Promise<SendResult> {
  const supabase = createAdminClient();
  const dedupeKey = `${args.leadId}:${args.eventName}`;

  try {
    const { data: existing } = await supabase
      .from("ga4_lifecycle_event_log")
      .select("status")
      .eq("dedupe_key", dedupeKey)
      .maybeSingle();

    if (existing?.status === "sent") {
      return { ok: true, skipped: true };
    }

    const { data: lead, error: leadError } = await supabase
      .from("tutoring_leads")
      .select("id,created_at,ga_client_id,ga_session_id,source,utm_source,utm_medium,utm_campaign,subject,level,support_type,status")
      .eq("id", args.leadId)
      .maybeSingle();

    if (leadError || !lead) {
      const message = leadError?.message || "Lead not found.";
      await writeLog({
        leadId: args.leadId,
        eventName: args.eventName,
        sourceAction: args.sourceAction,
        dedupeKey,
        status: "failed",
        error: message,
        clientIdPresent: false,
      });
      return { ok: false, error: message };
    }

    const clientId = cleanParam(lead.ga_client_id, 240);
    if (!clientId) {
      const message = "No GA client_id was captured for this lead.";
      await writeLog({
        leadId: args.leadId,
        eventName: args.eventName,
        sourceAction: args.sourceAction,
        dedupeKey,
        status: "skipped",
        error: message,
        clientIdPresent: false,
      });
      return { ok: false, skipped: true, error: message };
    }

    if (!configured()) {
      const message = "GA4 Measurement Protocol is not fully configured.";
      await writeLog({
        leadId: args.leadId,
        eventName: args.eventName,
        sourceAction: args.sourceAction,
        dedupeKey,
        status: "skipped",
        error: message,
        clientIdPresent: true,
      });
      return { ok: false, skipped: true, error: message };
    }

    const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID!.trim();
    const secret = process.env.GA4_MEASUREMENT_PROTOCOL_SECRET!.trim();
    const params: Record<string, string | number> = {
      engagement_time_msec: 1,
      lead_source: cleanParam(lead.utm_source || lead.source || "website", 100),
      lead_status: cleanParam(args.leadStatus || lead.status || "", 100),
      subject: cleanParam(lead.subject, 100),
      academic_level: cleanParam(lead.level, 100),
      support_type: cleanParam(lead.support_type, 100),
    };

    const medium = cleanParam(lead.utm_medium, 100);
    const campaign = cleanParam(lead.utm_campaign, 100);
    if (medium) params.utm_medium = medium;
    if (campaign) params.utm_campaign = campaign;

    if (args.eventName === "disqualify_lead" && args.reason) {
      params.disqualified_lead_reason = cleanParam(args.reason, 100);
    }
    if (args.eventName === "close_unconvert_lead" && args.reason) {
      params.unconvert_lead_reason = cleanParam(args.reason, 100);
    }

    // GA4 only guarantees original-session attribution when Measurement Protocol
    // events are sent within 24 hours of that session. Older lifecycle events are
    // therefore joined by client_id without forcing them into a stale session.
    const createdMs = Date.parse(lead.created_at);
    const ageMs = Number.isFinite(createdMs) ? Date.now() - createdMs : Number.POSITIVE_INFINITY;
    const sessionId = cleanParam(lead.ga_session_id, 500);
    if (sessionId && ageMs >= 0 && ageMs <= 24 * 60 * 60 * 1000) {
      params.session_id = sessionId;
    }

    const response = await fetch(
      `https://www.google-analytics.com/mp/collect?measurement_id=${encodeURIComponent(measurementId)}&api_secret=${encodeURIComponent(secret)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: clientId,
          events: [{ name: args.eventName, params }],
        }),
        cache: "no-store",
      }
    );

    if (!response.ok) {
      const message = `GA4 Measurement Protocol returned HTTP ${response.status}.`;
      await writeLog({
        leadId: args.leadId,
        eventName: args.eventName,
        sourceAction: args.sourceAction,
        dedupeKey,
        status: "failed",
        responseStatus: response.status,
        error: message,
        clientIdPresent: true,
      });
      return { ok: false, error: message };
    }

    await writeLog({
      leadId: args.leadId,
      eventName: args.eventName,
      sourceAction: args.sourceAction,
      dedupeKey,
      status: "sent",
      responseStatus: response.status,
      clientIdPresent: true,
    });

    return { ok: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown GA4 lifecycle sync error.";
    await writeLog({
      leadId: args.leadId,
      eventName: args.eventName,
      sourceAction: args.sourceAction,
      dedupeKey,
      status: "failed",
      error: message,
      clientIdPresent: false,
    });
    console.error("[MAT GA4 LIFECYCLE ERROR]", message);
    return { ok: false, error: message };
  }
}
