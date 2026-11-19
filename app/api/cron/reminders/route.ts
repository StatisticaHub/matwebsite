import { runNotificationEngine } from "@/lib/notification-engine";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const authorization = request.headers.get("authorization");
  if (!secret || authorization !== `Bearer ${secret}`) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const summary = await runNotificationEngine("cron");
    return Response.json({ ok: true, summary });
  } catch (error) {
    console.error("Reminder cron failed", error);
    return Response.json({ ok: false, error: error instanceof Error ? error.message : "Reminder engine failed" }, { status: 500 });
  }
}
