import Link from "next/link";
import {
  createContentGrowthItem,
  importSearchConsoleCsv,
  syncCurrentContentInventory,
  updateContentGrowthItem,
} from "@/app/admin/content-growth-actions";
import {
  contentPriorities,
  contentStages,
  contentTypes,
  getInternalLinkSuggestions,
  getOpportunitySignals,
  indexingStatuses,
  resourceCategories,
  type ContentGrowthItem,
  type ContentPerformanceSnapshot,
} from "@/lib/content-growth";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata = { title: "Content Growth" };
export const dynamic = "force-dynamic";

type Search = Promise<Record<string, string | string[] | undefined>>;

type LeadPath = {
  landing_page: string | null;
  created_at: string;
  utm_source: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
};

function percent(value: number) {
  return `${(value * 100).toFixed(value * 100 < 10 ? 1 : 0)}%`;
}

function position(value: number | null) {
  return value === null ? "—" : value.toFixed(1);
}

function dateLabel(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(new Date(`${value}T12:00:00Z`));
}

function normaliseLandingPage(value: string | null) {
  if (!value) return "";
  try {
    const parsed = new URL(value);
    return parsed.pathname === "/" ? "/" : parsed.pathname.replace(/\/$/, "");
  } catch {
    const path = value.split(/[?#]/)[0] || "";
    if (!path) return "";
    return path === "/" ? "/" : path.replace(/\/$/, "");
  }
}

export default async function ContentGrowthPage({ searchParams }: { searchParams: Search }) {
  const params = await searchParams;
  const supabase = createAdminClient();
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();

  const [itemResult, snapshotResult, leadResult] = await Promise.all([
    supabase.from("content_growth_items").select("*").order("priority", { ascending: false }).order("updated_at", { ascending: false }).limit(500),
    supabase.from("content_performance_snapshots").select("*").order("period_end", { ascending: false }).limit(3000),
    supabase
      .from("tutoring_leads")
      .select(
        "landing_page,created_at,utm_source,utm_campaign,utm_content",
      )
      .gte(
        "created_at",
        thirtyDaysAgo,
      )
      .limit(5000),
  ]);

  if (itemResult.error) {
    return <div className="admin-page"><h1>Content Growth</h1><div className="admin-alert error">Content Growth tables are not ready: {itemResult.error.message}</div></div>;
  }
  if (snapshotResult.error) throw new Error(snapshotResult.error.message);
  if (leadResult.error) throw new Error(leadResult.error.message);

  const items = (itemResult.data || []) as ContentGrowthItem[];
  const snapshots = (snapshotResult.data || []) as ContentPerformanceSnapshot[];
  const leads = (leadResult.data || []) as LeadPath[];

  const latestByItem = new Map<string, ContentPerformanceSnapshot>();
  for (const snapshot of snapshots) {
    if (!latestByItem.has(snapshot.content_item_id)) latestByItem.set(snapshot.content_item_id, snapshot);
  }

  const leadsByPath =
    new Map<string, number>();

  for (const lead of leads) {
    let path =
      normaliseLandingPage(
        lead.landing_page,
      );

    if (
      lead.utm_source
        ?.trim()
        .toLowerCase() ===
      "learning_hub"
    ) {
      const content =
        lead.utm_content
          ?.trim() || "";

      if (content === "hub") {
        path = "/learn";
      }

      if (
        content.startsWith(
          "resource:",
        )
      ) {
        const slug =
          content
            .slice(
              "resource:".length,
            )
            .replace(
              /[^a-z0-9-]/gi,
              "",
            );

        if (slug) {
          path =
            `/learn/${slug}`;
        }
      }

      if (
        content.startsWith(
          "category:",
        )
      ) {
        const slug =
          content
            .slice(
              "category:".length,
            )
            .replace(
              /[^a-z0-9-]/gi,
              "",
            );

        if (slug) {
          path =
            `/learn/${slug}`;
        }
      }
    }

    if (path) {
      leadsByPath.set(
        path,
        (
          leadsByPath.get(
            path,
          ) || 0
        ) + 1,
      );
    }
  }

  const today = new Date().toISOString().slice(0, 10);
  const published = items.filter((item) => item.stage === "published");
  const indexingAttention = published.filter((item) => ["unknown", "not_indexed", "blocked"].includes(item.indexing_status)).length;
  const reviewsDue = items.filter((item) => item.next_review_at && item.next_review_at <= today).length;
  const measured = items.filter((item) => latestByItem.has(item.id)).length;
  const opportunities = items.filter((item) => getOpportunitySignals(item, latestByItem.get(item.id), item.path ? leadsByPath.get(item.path) || 0 : 0).some((signal) => signal.label !== "Monitor")).length;

  const ranked = [...items].sort((a, b) => {
    const aSignals = getOpportunitySignals(a, latestByItem.get(a.id), a.path ? leadsByPath.get(a.path) || 0 : 0).length;
    const bSignals = getOpportunitySignals(b, latestByItem.get(b.id), b.path ? leadsByPath.get(b.path) || 0 : 0).length;
    const priorityWeight = { high: 3, medium: 2, low: 1 } as const;
    return (bSignals * 10 + priorityWeight[b.priority]) - (aSignals * 10 + priorityWeight[a.priority]);
  });

  const planningItems = items.filter((item) => ["idea", "draft", "refresh"].includes(item.stage)).slice(0, 8);

  return (
    <div className="admin-page content-growth-page">
      <header className="admin-page-head content-growth-head">
        <div>
          <span className="admin-eyebrow">Search & content operations</span>
          <h1>Content Growth</h1>
          <p>Track indexing, Search Console performance, refresh priorities, lead contribution and the next content to publish.</p>
        </div>
        <div className="content-growth-head-actions">
          <a className="admin-secondary-button" href="https://search.google.com/search-console" target="_blank" rel="noreferrer">Open Search Console ↗</a>
          <form action={syncCurrentContentInventory}><button className="admin-primary-button" type="submit">Sync current site</button></form>
        </div>
      </header>

      {params.synced ? <div className="admin-alert success">Synced {String(params.synced)} current public URLs into the content inventory.</div> : null}
      {params.imported ? <div className="admin-alert success">Imported Search Console performance for {String(params.imported)} URLs.</div> : null}
      {params.created ? <div className="admin-alert success">Content idea added.</div> : null}
      {params.saved ? <div className="admin-alert success">Content item updated.</div> : null}
      {params.error ? <div className="admin-alert error">{String(params.error)}</div> : null}

      <section className="admin-metrics admin-metrics-4 content-growth-metrics">
        <div><span>Tracked URLs</span><strong>{items.length}</strong><small>{published.length} published</small></div>
        <div><span>GSC measured</span><strong>{measured}</strong><small>latest imported period</small></div>
        <div><span>Indexing attention</span><strong>{indexingAttention}</strong><small>unknown / excluded / blocked</small></div>
        <div><span>Growth opportunities</span><strong>{opportunities}</strong><small>{reviewsDue} reviews currently due</small></div>
      </section>

      <section className="content-growth-two-col">
        <article className="admin-panel admin-detail-card">
          <div className="admin-card-head"><div><span className="admin-eyebrow">Search Console</span><h2>Import page performance</h2></div><span className="admin-status">CSV</span></div>
          <p className="admin-muted">In Search Console → Performance → Search results → Pages, export Clicks, Impressions, CTR and Position for a fixed period, then paste the CSV here.</p>
          <form action={importSearchConsoleCsv} className="content-growth-import-form">
            <div className="content-growth-date-row">
              <label><span>Period start</span><input type="date" name="period_start" required /></label>
              <label><span>Period end</span><input type="date" name="period_end" required /></label>
            </div>
            <label><span>CSV contents</span><textarea name="csv" rows={8} required placeholder={'Top pages,Clicks,Impressions,CTR,Position\nhttps://www.myacademictutor.com/learn/example,12,850,1.4%,8.6'} /></label>
            <button className="admin-primary-button" type="submit">Import GSC snapshot</button>
          </form>
        </article>

        <article className="admin-panel admin-detail-card">
          <div className="admin-card-head"><div><span className="admin-eyebrow">Publishing queue</span><h2>Add a content idea</h2></div></div>
          <form action={createContentGrowthItem} className="content-growth-create-form">
            <label><span>Working title</span><input name="title" required placeholder="e.g. How to interpret logistic regression odds ratios" /></label>
            <label><span>Planned URL</span><input name="path" placeholder="/learn/logistic-regression-odds-ratios" /></label>
            <div className="content-growth-form-grid">
              <label><span>Category</span><select name="category" defaultValue="statistics"><option value="">Other</option>{resourceCategories.map((category) => <option key={category.slug} value={category.slug}>{category.name}</option>)}</select></label>
              <label><span>Type</span><select name="content_type" defaultValue="guide">{contentTypes.map((type) => <option key={type} value={type}>{type.replace("_", " ")}</option>)}</select></label>
              <label><span>Stage</span><select name="stage" defaultValue="idea">{contentStages.map((stage) => <option key={stage} value={stage}>{stage}</option>)}</select></label>
              <label><span>Priority</span><select name="priority" defaultValue="medium">{contentPriorities.map((priority) => <option key={priority} value={priority}>{priority}</option>)}</select></label>
            </div>
            <label><span>Primary target query</span><input name="target_query" placeholder="logistic regression odds ratio interpretation" /></label>
            <label><span>Next review / due date</span><input type="date" name="next_review_at" /></label>
            <label><span>Notes</span><textarea name="notes" rows={3} placeholder="Search intent, learner pain point, examples to include…" /></label>
            <input type="hidden" name="search_intent" value="informational" />
            <button className="admin-primary-button" type="submit">Add to content queue</button>
          </form>
        </article>
      </section>

      <section className="admin-panel admin-detail-card content-growth-workflow">
        <div className="admin-card-head"><div><span className="admin-eyebrow">Operating rhythm</span><h2>Search Console workflow</h2></div></div>
        <div className="content-growth-steps">
          <div><strong>1</strong><span><b>Publish & sitemap</b>Keep new or substantially updated URLs in the sitemap.</span></div>
          <div><strong>2</strong><span><b>Inspect priority URLs</b>Use URL Inspection for important pages; avoid manually requesting every URL.</span></div>
          <div><strong>3</strong><span><b>Import every 28 days</b>Bring the Pages CSV here so changes are comparable period to period.</span></div>
          <div><strong>4</strong><span><b>Act on signals</b>Improve CTR, refresh striking-distance pages, and strengthen conversion paths.</span></div>
        </div>
      </section>

      {planningItems.length ? (
        <section className="admin-panel admin-detail-card">
          <div className="admin-card-head"><div><span className="admin-eyebrow">Internal linking</span><h2>Links to plan before publishing or refreshing</h2></div></div>
          <div className="content-growth-link-suggestions">
            {planningItems.map((item) => {
              const suggestions = getInternalLinkSuggestions(item);
              return <article key={item.id}><div><strong>{item.title}</strong><span>{item.stage} · {item.category || "uncategorised"}</span></div><div>{suggestions.length ? suggestions.map((link) => <Link key={link.href} href={link.href} target="_blank">{link.label} ↗</Link>) : <span className="admin-muted">Choose a Learning Hub category to generate contextual link ideas.</span>}</div></article>;
            })}
          </div>
        </section>
      ) : null}

      <section className="admin-panel admin-detail-card">
        <div className="admin-card-head"><div><span className="admin-eyebrow">Priority URLs</span><h2>Content inventory & opportunities</h2></div><span>{items.length} items</span></div>
        {!items.length ? <div className="admin-empty">Run <strong>Sync current site</strong> once after installing the database layer.</div> : null}
        <div className="content-growth-list">
          {ranked.map((item) => {
            const snapshot = latestByItem.get(item.id);
            const leads30d = item.path ? leadsByPath.get(item.path) || 0 : 0;
            const signals = getOpportunitySignals(item, snapshot, leads30d);
            return (
              <article key={item.id} className="content-growth-item">
                <div className="content-growth-item-main">
                  <div className="content-growth-item-title">
                    <div><strong>{item.title}</strong><span>{item.path || "URL not assigned"}</span></div>
                    <div className="content-growth-signal-row">{signals.map((signal) => <span key={signal.label} className={`content-growth-signal ${signal.tone}`}>{signal.label}</span>)}</div>
                  </div>
                  <div className="content-growth-performance">
                    <div><span>Clicks</span><strong>{snapshot?.clicks ?? "—"}</strong></div>
                    <div><span>Impressions</span><strong>{snapshot?.impressions ?? "—"}</strong></div>
                    <div><span>CTR</span><strong>{snapshot ? percent(snapshot.ctr) : "—"}</strong></div>
                    <div><span>Position</span><strong>{snapshot ? position(snapshot.average_position) : "—"}</strong></div>
                    <div><span>Leads · 30d</span><strong>{leads30d}</strong></div>
                  </div>
                  <div className="content-growth-meta-row">
                    <span>{item.content_type.replace("_", " ")}</span><span>{item.stage}</span><span>{item.priority} priority</span><span>{item.indexing_status.replace("_", " ")}</span>{snapshot ? <span>GSC to {dateLabel(snapshot.period_end)}</span> : null}
                  </div>
                </div>

                <details className="content-growth-edit">
                  <summary>Update</summary>
                  <form action={updateContentGrowthItem}>
                    <input type="hidden" name="id" value={item.id} />
                    <label><span>URL</span><input name="path" defaultValue={item.path || ""} /></label>
                    <div className="content-growth-form-grid">
                      <label><span>Stage</span><select name="stage" defaultValue={item.stage}>{contentStages.map((stage) => <option key={stage} value={stage}>{stage}</option>)}</select></label>
                      <label><span>Priority</span><select name="priority" defaultValue={item.priority}>{contentPriorities.map((priority) => <option key={priority} value={priority}>{priority}</option>)}</select></label>
                      <label><span>Indexing</span><select name="indexing_status" defaultValue={item.indexing_status}>{indexingStatuses.map((status) => <option key={status} value={status}>{status.replace("_", " ")}</option>)}</select></label>
                      <label><span>Next review</span><input type="date" name="next_review_at" defaultValue={item.next_review_at || ""} /></label>
                    </div>
                    <label><span>Target query</span><input name="target_query" defaultValue={item.target_query || ""} /></label>
                    <label><span>Notes</span><textarea name="notes" rows={3} defaultValue={item.notes || ""} /></label>
                    <label className="content-growth-check"><input type="checkbox" name="mark_inspected" value="yes" /><span>Mark as inspected in Search Console today</span></label>
                    <div className="content-growth-edit-actions">{item.path ? <Link href={item.path} target="_blank" className="admin-secondary-button">Open page ↗</Link> : null}<button className="admin-primary-button" type="submit">Save</button></div>
                  </form>
                </details>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
