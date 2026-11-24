import { NextRequest, NextResponse } from "next/server";

import { runNotificationEngine } from "@/lib/notification-engine";
import { runLeadNurtureEngine } from "@/lib/lead-nurture-engine";
import { runRetentionEngine } from "@/lib/retention-engine";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const authorization = request.headers.get("authorization");
  const secret = process.env.CRON_SECRET;

  if (!secret || authorization !== `Bearer ${secret}`) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 },
    );
  }

  try {
    const [notifications, nurture, retention] = await Promise.all([
      runNotificationEngine("cron"),
      runLeadNurtureEngine("cron"),
      runRetentionEngine("cron"),
    ]);

    return NextResponse.json({
      ok: true,
      notifications,
      nurture,
      retention,
    });
  } catch (error) {
    console.error("MAT operations cron failed", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Scheduled operations failed.",
      },
      { status: 500 },
    );
  }
}
