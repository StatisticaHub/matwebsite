import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import styles from "../academic-knowledge.module.css";

export const metadata = { title: "Academic Concept" };
export const dynamic = "force-dynamic";

type Params = Promise<{ conceptId: string }>;

type Objective = {
  id: string;
  objective: string;
  objective_type: string;
  sort_order: number;
};

type ContentBlock = {
  id: string;
  block_type: string;
  title: string | null;
  body: string;
  lifecycle_status: string;
  sort_order: number;
  source_note: string | null;
  reviewed_at: string | null;
  review_notes: string | null;
};

type Relation = {
  id: string;
  source_concept_id: string;
  target_concept_id: string;
  relation_type: string;
  note: string | null;
};

type RelatedConcept = {
  id: string;
  name: string;
  slug: string;
};

function label(value: string) {
  return value.replaceAll("_", " ");
}

export default async function AcademicConceptPage({
  params,
}: {
  params: Params;
}) {
  const { conceptId } = await params;
  const supabase = createAdminClient();

  const { data: concept, error: conceptError } = await supabase
    .from("academic_concepts")
    .select(
      "id,topic_id,slug,name,summary,difficulty,estimated_learning_minutes,lifecycle_status,reviewed_at,review_notes",
    )
    .eq("id", conceptId)
    .maybeSingle();

  if (conceptError) {
    throw new Error(conceptError.message);
  }

  if (!concept) {
    notFound();
  }

  const { data: topic, error: topicError } = await supabase
    .from("academic_topics")
    .select("id,domain_id,slug,name,lifecycle_status")
    .eq("id", concept.topic_id)
    .single();

  if (topicError) throw new Error(topicError.message);

  const { data: domain, error: domainError } = await supabase
    .from("academic_domains")
    .select("id,subject_id,slug,name,lifecycle_status")
    .eq("id", topic.domain_id)
    .single();

  if (domainError) throw new Error(domainError.message);

  const { data: subject, error: subjectError } = await supabase
    .from("academic_subjects")
    .select("id,slug,name,lifecycle_status")
    .eq("id", domain.subject_id)
    .single();

  if (subjectError) throw new Error(subjectError.message);

  const [objectiveResult, contentResult, relationResult] =
    await Promise.all([
      supabase
        .from("academic_learning_objectives")
        .select("id,objective,objective_type,sort_order")
        .eq("concept_id", concept.id)
        .order("sort_order"),
      supabase
        .from("academic_content_blocks")
        .select(
          "id,block_type,title,body,lifecycle_status,sort_order,source_note,reviewed_at,review_notes",
        )
        .eq("concept_id", concept.id)
        .order("sort_order"),
      supabase
        .from("academic_concept_relations")
        .select(
          "id,source_concept_id,target_concept_id,relation_type,note",
        )
        .or(
          `source_concept_id.eq.${concept.id},target_concept_id.eq.${concept.id}`,
        ),
    ]);

  if (objectiveResult.error) {
    throw new Error(objectiveResult.error.message);
  }

  if (contentResult.error) {
    throw new Error(contentResult.error.message);
  }

  if (relationResult.error) {
    throw new Error(relationResult.error.message);
  }

  const objectives = (objectiveResult.data || []) as Objective[];
  const blocks = (contentResult.data || []) as ContentBlock[];
  const relations = (relationResult.data || []) as Relation[];

  const relatedIds = Array.from(
    new Set(
      relations.flatMap((relation) => [
        relation.source_concept_id,
        relation.target_concept_id,
      ]),
    ),
  ).filter((id) => id !== concept.id);

  let relatedConcepts: RelatedConcept[] = [];

  if (relatedIds.length) {
    const { data, error } = await supabase
      .from("academic_concepts")
      .select("id,name,slug")
      .in("id", relatedIds);

    if (error) throw new Error(error.message);

    relatedConcepts = (data || []) as RelatedConcept[];
  }

  const relatedById = new Map(
    relatedConcepts.map((item) => [item.id, item]),
  );

  const draftBlocks = blocks.filter(
    (block) => block.lifecycle_status === "draft",
  ).length;

  return (
    <div className="admin-page">
      <div className={styles.breadcrumbs}>
        <Link href="/admin/academic-knowledge">Academic Knowledge</Link>
        <span>›</span>
        <span>{subject.name}</span>
        <span>›</span>
        <span>{domain.name}</span>
        <span>›</span>
        <span>{topic.name}</span>
      </div>

      <header className="admin-page-head">
        <div>
          <span className="admin-eyebrow">Canonical concept</span>
          <h1>{concept.name}</h1>

          {concept.summary ? <p>{concept.summary}</p> : null}
        </div>

        <Link
          href="/admin/academic-knowledge"
          className="admin-secondary-button"
        >
          ← Knowledge map
        </Link>
      </header>

      <section className="admin-metrics admin-metrics-4">
        <div>
          <span>Lifecycle</span>
          <strong>{concept.lifecycle_status}</strong>
          <small>concept record</small>
        </div>

        <div>
          <span>Difficulty</span>
          <strong>
            {concept.difficulty ? `${concept.difficulty}/5` : "—"}
          </strong>
          <small>canonical estimate</small>
        </div>

        <div>
          <span>Learning time</span>
          <strong>
            {concept.estimated_learning_minutes
              ? `${concept.estimated_learning_minutes} min`
              : "—"}
          </strong>
          <small>estimated</small>
        </div>

        <div>
          <span>Draft blocks</span>
          <strong>{draftBlocks}</strong>
          <small>{blocks.length} total content blocks</small>
        </div>
      </section>

      <section className={styles.detailGrid}>
        <article className="admin-panel admin-detail-card">
          <div className="admin-card-head">
            <div>
              <span className="admin-eyebrow">Learning design</span>
              <h2>Learning objectives</h2>
            </div>

            <span>{objectives.length}</span>
          </div>

          {objectives.length ? (
            <div className={styles.objectiveList}>
              {objectives.map((objective) => (
                <div key={objective.id} className={styles.objective}>
                  <span>{label(objective.objective_type)}</span>
                  <p>{objective.objective}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="admin-empty">
              No learning objectives have been added yet.
            </div>
          )}
        </article>

        <article className="admin-panel admin-detail-card">
          <div className="admin-card-head">
            <div>
              <span className="admin-eyebrow">Knowledge graph</span>
              <h2>Concept relationships</h2>
            </div>

            <span>{relations.length}</span>
          </div>

          {relations.length ? (
            <div className={styles.relationList}>
              {relations.map((relation) => {
                const outgoing =
                  relation.source_concept_id === concept.id;

                const relatedId = outgoing
                  ? relation.target_concept_id
                  : relation.source_concept_id;

                const related = relatedById.get(relatedId);

                return (
                  <div key={relation.id} className={styles.relation}>
                    <span>
                      {outgoing ? "Outgoing" : "Incoming"}
                    </span>

                    <div>
                      <strong>{label(relation.relation_type)}</strong>
                      <p>{related?.name || "Related concept"}</p>

                      {relation.note ? (
                        <small>{relation.note}</small>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="admin-empty">
              No graph relationships have been recorded yet.
            </div>
          )}
        </article>
      </section>

      <section className="admin-panel admin-detail-card">
        <div className="admin-card-head">
          <div>
            <span className="admin-eyebrow">Academic review</span>
            <h2>Teaching content</h2>
          </div>

          <span>
            {blocks.length} block{blocks.length === 1 ? "" : "s"}
          </span>
        </div>

        {blocks.length ? (
          <div className={styles.blockList}>
            {blocks.map((block) => (
              <article key={block.id} className={styles.block}>
                <div className={styles.blockHead}>
                  <div>
                    <span className={styles.blockType}>
                      {label(block.block_type)}
                    </span>

                    <h3>{block.title || label(block.block_type)}</h3>
                  </div>

                  <span
                    className={`${styles.lifecycle} ${
                      block.lifecycle_status === "draft"
                        ? styles.draft
                        : ""
                    }`}
                  >
                    {block.lifecycle_status}
                  </span>
                </div>

                <div className={styles.blockBody}>{block.body}</div>

                {block.source_note ? (
                  <div className={styles.sourceNote}>
                    <strong>Provenance</strong>
                    <span>{block.source_note}</span>
                  </div>
                ) : null}

                {block.review_notes ? (
                  <div className={styles.reviewNote}>
                    <strong>Review notes</strong>
                    <span>{block.review_notes}</span>
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        ) : (
          <div className="admin-empty">
            This concept does not yet have teaching content.
          </div>
        )}
      </section>

      <section className="admin-panel admin-detail-card">
        <div className="admin-card-head">
          <div>
            <span className="admin-eyebrow">Review controls</span>
            <h2>Academic governance</h2>
          </div>
        </div>

        <p className="admin-muted">
          This first interface is intentionally read-only. Editing,
          reviewer attribution and lifecycle approval actions will be
          introduced as the next layer so academic publication cannot
          happen accidentally.
        </p>
      </section>
    </div>
  );
}
