import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import styles from "./academic-knowledge.module.css";

export const metadata = { title: "Academic Knowledge" };
export const dynamic = "force-dynamic";

type Search = Promise<Record<string, string | string[] | undefined>>;

type Subject = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  lifecycle_status: string;
  sort_order: number;
};

type Domain = {
  id: string;
  subject_id: string;
  slug: string;
  name: string;
  description: string | null;
  lifecycle_status: string;
  sort_order: number;
};

type Topic = {
  id: string;
  domain_id: string;
  slug: string;
  name: string;
  description: string | null;
  lifecycle_status: string;
  sort_order: number;
};

type Concept = {
  id: string;
  topic_id: string;
  slug: string;
  name: string;
  summary: string | null;
  difficulty: number | null;
  estimated_learning_minutes: number | null;
  lifecycle_status: string;
  sort_order: number;
};

type ObjectiveRow = {
  id: string;
  concept_id: string;
};

type ContentRow = {
  id: string;
  concept_id: string;
  block_type: string;
  lifecycle_status: string;
};

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] || "" : value || "";
}

function increment(map: Map<string, number>, key: string) {
  map.set(key, (map.get(key) || 0) + 1);
}

export default async function AcademicKnowledgePage({
  searchParams,
}: {
  searchParams: Search;
}) {
  const params = await searchParams;
  const supabase = createAdminClient();

  const [
    subjectResult,
    domainResult,
    topicResult,
    conceptResult,
    objectiveResult,
    contentResult,
    relationResult,
  ] = await Promise.all([
    supabase
      .from("academic_subjects")
      .select("id,slug,name,description,lifecycle_status,sort_order")
      .order("sort_order")
      .order("name"),
    supabase
      .from("academic_domains")
      .select("id,subject_id,slug,name,description,lifecycle_status,sort_order")
      .order("sort_order")
      .order("name"),
    supabase
      .from("academic_topics")
      .select("id,domain_id,slug,name,description,lifecycle_status,sort_order")
      .order("sort_order")
      .order("name"),
    supabase
      .from("academic_concepts")
      .select(
        "id,topic_id,slug,name,summary,difficulty,estimated_learning_minutes,lifecycle_status,sort_order",
      )
      .order("sort_order")
      .order("name"),
    supabase
      .from("academic_learning_objectives")
      .select("id,concept_id"),
    supabase
      .from("academic_content_blocks")
      .select("id,concept_id,block_type,lifecycle_status"),
    supabase
      .from("academic_concept_relations")
      .select("id"),
  ]);

  const results = [
    subjectResult,
    domainResult,
    topicResult,
    conceptResult,
    objectiveResult,
    contentResult,
    relationResult,
  ];

  const failed = results.find((result) => result.error);

  if (failed?.error) {
    return (
      <div className="admin-page">
        <h1>Academic Knowledge</h1>
        <div className="admin-alert error">
          Knowledge Engine data could not be loaded: {failed.error.message}
        </div>
      </div>
    );
  }

  const subjects = (subjectResult.data || []) as Subject[];
  const domains = (domainResult.data || []) as Domain[];
  const topics = (topicResult.data || []) as Topic[];
  const concepts = (conceptResult.data || []) as Concept[];
  const objectives = (objectiveResult.data || []) as ObjectiveRow[];
  const content = (contentResult.data || []) as ContentRow[];

  const query = firstParam(params.q).trim().toLowerCase();
  const selectedStatus = firstParam(params.status);
  const selectedDomain = firstParam(params.domain);
  const selectedTopic = firstParam(params.topic);

  const domainById = new Map(domains.map((domain) => [domain.id, domain]));
  const topicById = new Map(topics.map((topic) => [topic.id, topic]));

  const objectiveCounts = new Map<string, number>();
  for (const objective of objectives) {
    increment(objectiveCounts, objective.concept_id);
  }

  const contentCounts = new Map<string, number>();
  const draftCounts = new Map<string, number>();

  for (const block of content) {
    increment(contentCounts, block.concept_id);

    if (block.lifecycle_status === "draft") {
      increment(draftCounts, block.concept_id);
    }
  }

  const draftBlocks = content.filter(
    (block) => block.lifecycle_status === "draft",
  ).length;

  const conceptsWithDraftContent = new Set(
    content
      .filter((block) => block.lifecycle_status === "draft")
      .map((block) => block.concept_id),
  ).size;

  const visibleConcepts = concepts.filter((concept) => {
    const topic = topicById.get(concept.topic_id);
    const domain = topic ? domainById.get(topic.domain_id) : undefined;

    if (selectedStatus && concept.lifecycle_status !== selectedStatus) {
      return false;
    }

    if (selectedDomain && domain?.slug !== selectedDomain) {
      return false;
    }

    if (selectedTopic && topic?.slug !== selectedTopic) {
      return false;
    }

    if (query) {
      const haystack = [
        concept.name,
        concept.slug,
        concept.summary || "",
        topic?.name || "",
        domain?.name || "",
      ]
        .join(" ")
        .toLowerCase();

      if (!haystack.includes(query)) {
        return false;
      }
    }

    return true;
  });

  const visibleIds = new Set(visibleConcepts.map((concept) => concept.id));

  const lifecycleStatuses = Array.from(
    new Set(concepts.map((concept) => concept.lifecycle_status)),
  ).sort();

  return (
    <div className="admin-page">
      <header className="admin-page-head">
        <div>
          <span className="admin-eyebrow">Academic Knowledge Engine</span>
          <h1>Academic Knowledge</h1>
          <p>
            Browse MAT&apos;s canonical academic structure, inspect concept
            coverage and review the content currently waiting for academic
            approval.
          </p>
        </div>

        <span className="admin-status">Review workspace · v0.1</span>
      </header>

      <section className="admin-metrics admin-metrics-4">
        <div>
          <span>Subjects</span>
          <strong>{subjects.length}</strong>
          <small>{domains.length} domains</small>
        </div>

        <div>
          <span>Topics</span>
          <strong>{topics.length}</strong>
          <small>{concepts.length} canonical concepts</small>
        </div>

        <div>
          <span>Learning objectives</span>
          <strong>{objectives.length}</strong>
          <small>linked to concepts</small>
        </div>

        <div>
          <span>Draft academic blocks</span>
          <strong>{draftBlocks}</strong>
          <small>{conceptsWithDraftContent} concepts awaiting review</small>
        </div>
      </section>

      <section className="admin-panel admin-detail-card">
        <div className="admin-card-head">
          <div>
            <span className="admin-eyebrow">Find knowledge</span>
            <h2>Browse concepts</h2>
          </div>

          <span>{visibleConcepts.length} shown</span>
        </div>

        <form
          method="get"
          action="/admin/academic-knowledge"
          className={styles.filters}
        >
          <label className={styles.search}>
            <span>Search</span>
            <input
              name="q"
              defaultValue={firstParam(params.q)}
              placeholder="e.g. variance, OLS, Cox model"
            />
          </label>

          <label>
            <span>Domain</span>
            <select name="domain" defaultValue={selectedDomain}>
              <option value="">All domains</option>
              {domains.map((domain) => (
                <option key={domain.id} value={domain.slug}>
                  {domain.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Topic</span>
            <select name="topic" defaultValue={selectedTopic}>
              <option value="">All topics</option>
              {topics.map((topic) => (
                <option key={topic.id} value={topic.slug}>
                  {topic.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Lifecycle</span>
            <select name="status" defaultValue={selectedStatus}>
              <option value="">All statuses</option>
              {lifecycleStatuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>

          <div className={styles.filterActions}>
            <button className="admin-primary-button" type="submit">
              Filter
            </button>

            <Link
              href="/admin/academic-knowledge"
              className="admin-secondary-button"
            >
              Reset
            </Link>
          </div>
        </form>
      </section>

      {subjects.map((subject) => {
        const subjectDomains = domains.filter(
          (domain) => domain.subject_id === subject.id,
        );

        const subjectHasVisibleConcepts = subjectDomains.some((domain) =>
          topics
            .filter((topic) => topic.domain_id === domain.id)
            .some((topic) =>
              concepts.some(
                (concept) =>
                  concept.topic_id === topic.id &&
                  visibleIds.has(concept.id),
              ),
            ),
        );

        if (!subjectHasVisibleConcepts) {
          return null;
        }

        return (
          <section
            className="admin-panel admin-detail-card"
            key={subject.id}
          >
            <div className="admin-card-head">
              <div>
                <span className="admin-eyebrow">Subject</span>
                <h2>{subject.name}</h2>
                {subject.description ? (
                  <p className="admin-muted">{subject.description}</p>
                ) : null}
              </div>

              <span className="admin-status">
                {subject.lifecycle_status}
              </span>
            </div>

            <div className={styles.domainGrid}>
              {subjectDomains.map((domain) => {
                const domainTopics = topics.filter(
                  (topic) => topic.domain_id === domain.id,
                );

                const domainVisibleConcepts = domainTopics.flatMap((topic) =>
                  concepts.filter(
                    (concept) =>
                      concept.topic_id === topic.id &&
                      visibleIds.has(concept.id),
                  ),
                );

                if (!domainVisibleConcepts.length) {
                  return null;
                }

                return (
                  <article className={styles.domainCard} key={domain.id}>
                    <div className={styles.domainHead}>
                      <div>
                        <span className="admin-eyebrow">Domain</span>
                        <h3>{domain.name}</h3>
                      </div>

                      <span>{domainVisibleConcepts.length} concepts</span>
                    </div>

                    {domainTopics.map((topic) => {
                      const topicConcepts = concepts.filter(
                        (concept) =>
                          concept.topic_id === topic.id &&
                          visibleIds.has(concept.id),
                      );

                      if (!topicConcepts.length) {
                        return null;
                      }

                      return (
                        <div className={styles.topic} key={topic.id}>
                          <div className={styles.topicHead}>
                            <div>
                              <strong>{topic.name}</strong>
                              {topic.description ? (
                                <small>{topic.description}</small>
                              ) : null}
                            </div>

                            <span>{topicConcepts.length}</span>
                          </div>

                          <div className={styles.conceptList}>
                            {topicConcepts.map((concept) => {
                              const objectiveCount =
                                objectiveCounts.get(concept.id) || 0;
                              const blockCount =
                                contentCounts.get(concept.id) || 0;
                              const draftCount =
                                draftCounts.get(concept.id) || 0;

                              return (
                                <Link
                                  href={`/admin/academic-knowledge/${concept.id}`}
                                  className={styles.concept}
                                  key={concept.id}
                                >
                                  <div className={styles.conceptMain}>
                                    <strong>{concept.name}</strong>

                                    {concept.summary ? (
                                      <span>{concept.summary}</span>
                                    ) : null}
                                  </div>

                                  <div className={styles.conceptMeta}>
                                    <span>{concept.lifecycle_status}</span>

                                    {concept.difficulty ? (
                                      <span>
                                        Difficulty {concept.difficulty}/5
                                      </span>
                                    ) : null}

                                    <span>
                                      {objectiveCount} objective
                                      {objectiveCount === 1 ? "" : "s"}
                                    </span>

                                    <span>
                                      {blockCount} block
                                      {blockCount === 1 ? "" : "s"}
                                    </span>

                                    {draftCount ? (
                                      <b>
                                        {draftCount} draft
                                        {draftCount === 1 ? "" : "s"}
                                      </b>
                                    ) : null}
                                  </div>
                                </Link>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </article>
                );
              })}
            </div>
          </section>
        );
      })}

      {!visibleConcepts.length ? (
        <div className="admin-empty">
          No concepts match the current filters.
        </div>
      ) : null}
    </div>
  );
}
