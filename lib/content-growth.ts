import { highIntentTutoringPages } from "@/lib/high-intent-tutoring";
import { resourceCategories, resources } from "@/lib/resources";
import { subjects } from "@/lib/tutoring-data";
import { tutoringServices } from "@/lib/tutoring-services";

export { resourceCategories };

export const contentStages = ["idea", "draft", "published", "refresh", "consolidate"] as const;
export const contentPriorities = ["low", "medium", "high"] as const;
export const contentTypes = ["guide", "topic_hub", "tutoring", "subject", "core", "other"] as const;
export const searchIntents = ["informational", "commercial", "transactional", "navigational"] as const;
export const indexingStatuses = ["unknown", "indexed", "not_indexed", "requested", "blocked"] as const;

export type ContentStage = (typeof contentStages)[number];
export type ContentPriority = (typeof contentPriorities)[number];
export type ContentType = (typeof contentTypes)[number];
export type SearchIntent = (typeof searchIntents)[number];
export type IndexingStatus = (typeof indexingStatuses)[number];

export type ContentGrowthItem = {
  id: string;
  created_at: string;
  updated_at: string;
  path: string | null;
  title: string;
  category: string | null;
  content_type: ContentType;
  stage: ContentStage;
  priority: ContentPriority;
  search_intent: SearchIntent;
  target_query: string | null;
  indexing_status: IndexingStatus;
  last_inspected_at: string | null;
  published_at: string | null;
  last_updated_at: string | null;
  next_review_at: string | null;
  notes: string | null;
};

export type ContentPerformanceSnapshot = {
  id: string;
  created_at: string;
  content_item_id: string;
  period_start: string;
  period_end: string;
  clicks: number;
  impressions: number;
  ctr: number;
  average_position: number | null;
  source: "gsc" | "manual";
};

export function normaliseContentPath(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  try {
    const parsed = new URL(trimmed);
    return parsed.pathname === "/" ? "/" : parsed.pathname.replace(/\/$/, "");
  } catch {
    const withoutQuery = trimmed.split(/[?#]/)[0] || "";
    if (!withoutQuery) return "";
    const withSlash = withoutQuery.startsWith("/") ? withoutQuery : `/${withoutQuery}`;
    return withSlash === "/" ? "/" : withSlash.replace(/\/$/, "");
  }
}

function titleFromPath(path: string) {
  if (path === "/") return "Homepage";
  return path
    .split("/")
    .filter(Boolean)
    .at(-1)
    ?.split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ") || path;
}

export function currentSiteInventory() {
  const core = [
    { path: "/", title: "Homepage", content_type: "core", category: "core", search_intent: "commercial", priority: "high" },
    { path: "/find-a-tutor", title: "Find a Tutor", content_type: "core", category: "conversion", search_intent: "transactional", priority: "high" },
    { path: "/learn", title: "Learning Hub", content_type: "core", category: "learning-hub", search_intent: "informational", priority: "high" },
    { path: "/subjects", title: "Subjects", content_type: "core", category: "subjects", search_intent: "commercial", priority: "medium" },
    { path: "/tutoring", title: "Tutoring", content_type: "core", category: "tutoring", search_intent: "commercial", priority: "high" },
  ];

  const hubs = resourceCategories.map((category) => ({
    path: `/learn/${category.slug}`,
    title: `${category.name} Learning Hub`,
    category: category.slug,
    content_type: "topic_hub",
    search_intent: "informational",
    priority: "medium",
  }));

  const guides = resources.map((resource) => ({
    path: `/learn/${resource.slug}`,
    title: resource.title,
    category: resource.categorySlug,
    content_type: "guide",
    search_intent: "informational",
    priority: resource.featured ? "high" : "medium",
    target_query: resource.keywords[0] || null,
    published_at: resource.publishedAt || null,
    last_updated_at: resource.updatedAt || resource.publishedAt || null,
  }));

  const subjectPages = subjects.map((subject) => ({
    path: `/subjects/${subject.slug}`,
    title: `${subject.name} Tutoring`,
    category: subject.slug,
    content_type: "subject",
    search_intent: "commercial",
    priority: ["statistics", "data-science", "research-methods", "bioinformatics", "mathematics"].includes(subject.slug) ? "high" : "medium",
  }));

  const servicePages = tutoringServices.map((service) => ({
    path: `/tutoring/${service.slug}`,
    title: service.title,
    category: "tutoring",
    content_type: "tutoring",
    search_intent: "commercial",
    priority: "medium",
  }));

  const specialistPages = highIntentTutoringPages.map((page) => ({
    path: `/tutoring/${page.slug}`,
    title: page.title,
    category: page.subject.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
    content_type: "tutoring",
    search_intent: "transactional",
    priority: "high",
    target_query: page.title.toLowerCase(),
  }));

  return [...core, ...hubs, ...guides, ...subjectPages, ...servicePages, ...specialistPages].map((item) => ({
    ...item,
    stage: "published" as const,
    indexing_status: "unknown" as const,
    title: item.title || titleFromPath(item.path),
  }));
}

export type OpportunitySignal = {
  label: string;
  tone: "good" | "watch" | "action";
};

export function getOpportunitySignals(
  item: ContentGrowthItem,
  snapshot: ContentPerformanceSnapshot | undefined,
  leads30d: number
): OpportunitySignal[] {
  const signals: OpportunitySignal[] = [];
  const today = new Date().toISOString().slice(0, 10);

  if (item.stage === "published" && ["unknown", "not_indexed", "blocked"].includes(item.indexing_status)) {
    signals.push({ label: item.indexing_status === "unknown" ? "Check indexing" : item.indexing_status.replace("_", " "), tone: "action" });
  }

  if (item.next_review_at && item.next_review_at <= today) {
    signals.push({ label: "Review due", tone: "action" });
  }

  if (snapshot) {
    const position = snapshot.average_position;
    if (snapshot.impressions >= 50 && position !== null && position >= 4 && position <= 20) {
      signals.push({ label: "Striking distance", tone: "good" });
    }
    if (snapshot.impressions >= 50 && snapshot.ctr < 0.02) {
      signals.push({ label: "Low CTR", tone: "watch" });
    }
    if (snapshot.impressions >= 25 && snapshot.clicks === 0) {
      signals.push({ label: "Impressions, no clicks", tone: "watch" });
    }
    if (snapshot.clicks >= 5 && leads30d === 0 && ["tutoring", "subject", "core"].includes(item.content_type)) {
      signals.push({ label: "Traffic, no leads", tone: "watch" });
    }
  }

  if (!signals.length && item.stage === "published" && item.indexing_status === "indexed") {
    signals.push({ label: "Monitor", tone: "good" });
  }

  return signals;
}

export function getInternalLinkSuggestions(item: ContentGrowthItem) {
  const category = item.category ? resourceCategories.find((entry) => entry.slug === item.category) : undefined;
  const sameCategory = item.category
    ? resources.filter((resource) => resource.categorySlug === item.category && `/learn/${resource.slug}` !== item.path).slice(0, 3)
    : [];

  const links: { label: string; href: string }[] = [];
  if (category) {
    links.push({ label: `${category.name} hub`, href: `/learn/${category.slug}` });
    if (category.tutoringHref) links.push({ label: category.tutoringLabel || "Relevant tutoring", href: category.tutoringHref });
  }
  for (const resource of sameCategory) links.push({ label: resource.title, href: `/learn/${resource.slug}` });
  return links.slice(0, 5);
}
