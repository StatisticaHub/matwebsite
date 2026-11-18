import { NextRequest, NextResponse } from "next/server";
import { portalSupportCategories, resolvePortalLink } from "@/lib/student-portal";
import { createAdminClient } from "@/lib/supabase/admin";

type Params = Promise<{ token: string }>;

function sameOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    return new URL(origin).host === request.headers.get("host");
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest, { params }: { params: Params }) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Invalid origin." }, { status: 403 });
  if (Number(request.headers.get("content-length") || 0) > 20_000) {
    return NextResponse.json({ error: "Request too large." }, { status: 413 });
  }

  const { token } = await params;
  const link = await resolvePortalLink(token);
  if (!link) return NextResponse.json({ error: "Portal link is invalid or expired." }, { status: 404 });

  let body: { category?: string; message?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const category = String(body.category || "general");
  const message = String(body.message || "").trim().slice(0, 3000);
  if (!portalSupportCategories.includes(category as (typeof portalSupportCategories)[number]) || !message) {
    return NextResponse.json({ error: "Please enter a valid request." }, { status: 400 });
  }

  const supabase = createAdminClient();
  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  const { count: recentRequestCount } = await supabase
    .from("student_support_requests")
    .select("id", { count: "exact", head: true })
    .eq("portal_link_id", link.id)
    .gte("created_at", tenMinutesAgo);

  if ((recentRequestCount || 0) >= 5) {
    return NextResponse.json({ error: "Too many recent requests. Please try again later." }, { status: 429 });
  }

  const { data: engagement } = await supabase
    .from("tutoring_engagements")
    .select("id")
    .eq("student_id", link.student_id)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = await supabase.from("student_support_requests").insert({
    student_id: link.student_id,
    engagement_id: engagement?.id || null,
    portal_link_id: link.id,
    category,
    message,
    status: "new",
  });

  if (error) return NextResponse.json({ error: "Could not save request." }, { status: 500 });
  return NextResponse.json({ ok: true }, { status: 201 });
}
