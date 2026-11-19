"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  contentPriorities,
  contentStages,
  contentTypes,
  currentSiteInventory,
  indexingStatuses,
  normaliseContentPath,
  searchIntents,
  type ContentPriority,
  type ContentStage,
  type ContentType,
  type IndexingStatus,
  type SearchIntent,
} from "@/lib/content-growth";

async function requireAdmin() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  return session;
}

function value(formData: FormData, key: string) {
  return String(formData.get(key) || "").trim();
}

function optional(value: string) {
  return value || null;
}

function oneOf<T extends readonly string[]>(raw: string, allowed: T, fallback: T[number]) {
  return allowed.includes(raw as T[number]) ? (raw as T[number]) : fallback;
}

function fail(message: string): never {
  redirect(`/admin/content-growth?error=${encodeURIComponent(message)}`);
}

export async function syncCurrentContentInventory() {
  await requireAdmin();
  const supabase = createAdminClient();
  const inventory = currentSiteInventory();
  const reviewDate = new Date();
  reviewDate.setMonth(reviewDate.getMonth() + 3);
  const nextReview = reviewDate.toISOString().slice(0, 10);

  const { data: existing, error: existingError } = await supabase
    .from("content_growth_items")
    .select("path")
    .in("path", inventory.map((item) => item.path));
  if (existingError) fail(existingError.message);

  const existingPaths = new Set((existing || []).map((item) => item.path));
  const missing = inventory.filter((item) => !existingPaths.has(item.path));

  if (missing.length) {
    const { error } = await supabase.from("content_growth_items").insert(
      missing.map((item) => ({ ...item, next_review_at: nextReview }))
    );
    if (error) fail(error.message);
  }

  revalidatePath("/admin/content-growth");
  redirect(`/admin/content-growth?synced=${missing.length}`);
}

export async function createContentGrowthItem(formData: FormData) {
  await requireAdmin();
  const supabase = createAdminClient();

  const title = value(formData, "title");
  if (!title) fail("A content title is required.");

  const rawPath = value(formData, "path");
  const path = rawPath ? normaliseContentPath(rawPath) : null;
  const stage = oneOf(value(formData, "stage"), contentStages, "idea") as ContentStage;
  const priority = oneOf(value(formData, "priority"), contentPriorities, "medium") as ContentPriority;
  const contentType = oneOf(value(formData, "content_type"), contentTypes, "guide") as ContentType;
  const intent = oneOf(value(formData, "search_intent"), searchIntents, "informational") as SearchIntent;

  const { error } = await supabase.from("content_growth_items").insert({
    title,
    path,
    category: optional(value(formData, "category")),
    content_type: contentType,
    stage,
    priority,
    search_intent: intent,
    target_query: optional(value(formData, "target_query")),
    next_review_at: optional(value(formData, "next_review_at")),
    notes: optional(value(formData, "notes")),
  });

  if (error) fail(error.message);
  revalidatePath("/admin/content-growth");
  redirect("/admin/content-growth?created=1");
}

export async function updateContentGrowthItem(formData: FormData) {
  await requireAdmin();
  const supabase = createAdminClient();
  const id = value(formData, "id");
  if (!id) fail("Missing content item.");

  const rawPath = value(formData, "path");
  const path = rawPath ? normaliseContentPath(rawPath) : null;
  const stage = oneOf(value(formData, "stage"), contentStages, "published") as ContentStage;
  const priority = oneOf(value(formData, "priority"), contentPriorities, "medium") as ContentPriority;
  const indexingStatus = oneOf(value(formData, "indexing_status"), indexingStatuses, "unknown") as IndexingStatus;

  const payload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
    path,
    stage,
    priority,
    indexing_status: indexingStatus,
    target_query: optional(value(formData, "target_query")),
    next_review_at: optional(value(formData, "next_review_at")),
    notes: optional(value(formData, "notes")),
  };

  if (value(formData, "mark_inspected") === "yes") {
    payload.last_inspected_at = new Date().toISOString();
  }

  const { error } = await supabase.from("content_growth_items").update(payload).eq("id", id);
  if (error) fail(error.message);
  revalidatePath("/admin/content-growth");
  redirect("/admin/content-growth?saved=1");
}

function parseCsv(text: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];
    if (char === '"') {
      if (quoted && next === '"') {
        field += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (char === "," && !quoted) {
      row.push(field.trim());
      field = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(field.trim());
      field = "";
      if (row.some((cell) => cell.length)) rows.push(row);
      row = [];
    } else {
      field += char;
    }
  }

  row.push(field.trim());
  if (row.some((cell) => cell.length)) rows.push(row);
  return rows;
}

function headerIndex(headers: string[], candidates: string[]) {
  return headers.findIndex((header) => candidates.includes(header));
}

function numberValue(raw: string | undefined) {
  const cleaned = String(raw || "").replace(/,/g, "").trim();
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
}

function ctrValue(raw: string | undefined) {
  const text = String(raw || "").trim();
  if (!text) return 0;
  if (text.endsWith("%")) return Math.max(0, Math.min(1, numberValue(text.slice(0, -1)) / 100));
  const parsed = numberValue(text);
  return Math.max(0, Math.min(1, parsed > 1 ? parsed / 100 : parsed));
}

export async function importSearchConsoleCsv(formData: FormData) {
  await requireAdmin();
  const supabase = createAdminClient();
  const csv = value(formData, "csv");
  const periodStart = value(formData, "period_start");
  const periodEnd = value(formData, "period_end");
  if (!csv || !periodStart || !periodEnd) fail("Paste a Search Console CSV and choose its date range.");

  const rows = parseCsv(csv);
  if (rows.length < 2) fail("The CSV does not contain any performance rows.");

  const headers = rows[0].map((header) => header.replace(/^\uFEFF/, "").trim().toLowerCase());
  const pageIndex = headerIndex(headers, ["top pages", "page", "pages", "url", "landing page"]);
  const clicksIndex = headerIndex(headers, ["clicks"]);
  const impressionsIndex = headerIndex(headers, ["impressions"]);
  const ctrIndex = headerIndex(headers, ["ctr"]);
  const positionIndex = headerIndex(headers, ["position", "average position"]);

  if ([pageIndex, clicksIndex, impressionsIndex, ctrIndex, positionIndex].some((index) => index < 0)) {
    fail("Could not recognise the CSV columns. Export the Pages table with Clicks, Impressions, CTR and Position from Search Console.");
  }

  const parsed = rows.slice(1).map((cells) => {
    const path = normaliseContentPath(cells[pageIndex] || "");
    return {
      path,
      clicks: Math.max(0, Math.round(numberValue(cells[clicksIndex]))),
      impressions: Math.max(0, Math.round(numberValue(cells[impressionsIndex]))),
      ctr: ctrValue(cells[ctrIndex]),
      average_position: Math.max(0, numberValue(cells[positionIndex])) || null,
    };
  }).filter((row) => row.path);

  if (!parsed.length) fail("No valid page URLs were found in the CSV.");
  const paths = Array.from(new Set(parsed.map((row) => row.path)));

  const { data: existing, error: existingError } = await supabase
    .from("content_growth_items")
    .select("id,path")
    .in("path", paths);
  if (existingError) fail(existingError.message);

  const byPath = new Map((existing || []).map((item) => [item.path, item.id]));
  const missing = paths.filter((path) => !byPath.has(path));

  if (missing.length) {
    const { data: created, error: createError } = await supabase
      .from("content_growth_items")
      .insert(missing.map((path) => ({
        path,
        title: path === "/" ? "Homepage" : path.split("/").filter(Boolean).at(-1)?.replace(/-/g, " ") || path,
        content_type: path.startsWith("/learn/") ? "guide" : path.startsWith("/tutoring/") ? "tutoring" : path.startsWith("/subjects/") ? "subject" : "other",
        stage: "published",
        priority: "medium",
        search_intent: path.startsWith("/learn/") ? "informational" : "commercial",
      })))
      .select("id,path");
    if (createError) fail(createError.message);
    for (const item of created || []) byPath.set(item.path, item.id);
  }

  const snapshotRows = parsed.map((row) => ({
    content_item_id: byPath.get(row.path),
    period_start: periodStart,
    period_end: periodEnd,
    clicks: row.clicks,
    impressions: row.impressions,
    ctr: row.ctr,
    average_position: row.average_position,
    source: "gsc",
  })).filter((row) => row.content_item_id);

  const { error: snapshotError } = await supabase
    .from("content_performance_snapshots")
    .upsert(snapshotRows, { onConflict: "content_item_id,period_start,period_end,source" });
  if (snapshotError) fail(snapshotError.message);

  revalidatePath("/admin/content-growth");
  redirect(`/admin/content-growth?imported=${snapshotRows.length}`);
}
