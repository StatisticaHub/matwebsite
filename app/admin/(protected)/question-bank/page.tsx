import Link from "next/link";
import {
  questionQualityLabel,
  questionQualityState,
  type QuestionQualityRow,
} from "@/lib/academic-question-quality";
import { createAdminClient } from "@/lib/supabase/admin";
import styles from "./question-bank.module.css";

type Question = {
  id: string;
  slug: string;
  title: string | null;
  prompt: string;
  question_type: string;
  difficulty: number;
  cognitive_level: string;
  estimated_minutes: number | null;
  marks: number | null;
  lifecycle_status: string;
  updated_at: string;
};

type QuestionConcept = {
  question_id: string;
  concept_id: string;
  is_primary: boolean;
};

type Concept = {
  id: string;
  name: string;
  slug: string;
};

type SearchParams = Record<
  string,
  string | string[] | undefined
>;

function firstParam(
  value: string | string[] | undefined,
) {
  return Array.isArray(value)
    ? value[0] || ""
    : value || "";
}

function label(value: string) {
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase(),
    );
}

export default async function QuestionBankPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const query = await searchParams;

  const search = firstParam(query.q)
    .trim()
    .toLowerCase();

  const lifecycle =
    firstParam(query.lifecycle);

  const questionType =
    firstParam(query.type);

  const cognitive =
    firstParam(query.cognitive);

  const difficulty =
    firstParam(query.difficulty);

  const quality =
    firstParam(query.quality);

  const supabase = createAdminClient();

  const [
    questionResult,
    qualityResult,
  ] = await Promise.all([
    supabase
      .from("academic_questions")
      .select(
        "id,slug,title,prompt,question_type,difficulty,cognitive_level,estimated_minutes,marks,lifecycle_status,updated_at",
      )
      .order("updated_at", {
        ascending: false,
      }),

    supabase.rpc(
      "mat_academic_question_quality_reports",
    ),
  ]);

  if (questionResult.error) {
    throw new Error(
      questionResult.error.message,
    );
  }

  if (qualityResult.error) {
    throw new Error(
      qualityResult.error.message,
    );
  }

  const questions =
    (questionResult.data || []) as Question[];

  const qualityRows =
    (qualityResult.data ||
      []) as QuestionQualityRow[];

  const qualityByQuestion =
    new Map(
      qualityRows.map((row) => [
        row.question_id,
        row,
      ]),
    );

  const questionIds = questions.map(
    (question) => question.id,
  );

  let mappings: QuestionConcept[] = [];

  if (questionIds.length) {
    const result = await supabase
      .from(
        "academic_question_concepts",
      )
      .select(
        "question_id,concept_id,is_primary",
      )
      .in("question_id", questionIds);

    if (result.error) {
      throw new Error(
        result.error.message,
      );
    }

    mappings =
      (result.data ||
        []) as QuestionConcept[];
  }

  const conceptIds = Array.from(
    new Set(
      mappings.map(
        (mapping) =>
          mapping.concept_id,
      ),
    ),
  );

  let concepts: Concept[] = [];

  if (conceptIds.length) {
    const result = await supabase
      .from("academic_concepts")
      .select("id,name,slug")
      .in("id", conceptIds);

    if (result.error) {
      throw new Error(
        result.error.message,
      );
    }

    concepts =
      (result.data || []) as Concept[];
  }

  const conceptById = new Map(
    concepts.map((concept) => [
      concept.id,
      concept,
    ]),
  );

  const conceptsByQuestion =
    new Map<string, Concept[]>();

  for (const mapping of mappings) {
    const concept =
      conceptById.get(
        mapping.concept_id,
      );

    if (!concept) continue;

    const current =
      conceptsByQuestion.get(
        mapping.question_id,
      ) || [];

    current.push(concept);

    conceptsByQuestion.set(
      mapping.question_id,
      current,
    );
  }

  const qualityCounts = {
    ready: 0,
    warning: 0,
    blocked: 0,
  };

  for (const question of questions) {
    const row =
      qualityByQuestion.get(
        question.id,
      );

    if (!row?.report) {
      qualityCounts.blocked += 1;
      continue;
    }

    qualityCounts[
      questionQualityState(
        row.report,
      )
    ] += 1;
  }

  const filtered =
    questions.filter((question) => {
      const questionConcepts =
        conceptsByQuestion.get(
          question.id,
        ) || [];

      const haystack = [
        question.slug,
        question.title || "",
        question.prompt,
        ...questionConcepts.map(
          (concept) => concept.name,
        ),
      ]
        .join(" ")
        .toLowerCase();

      if (
        search &&
        !haystack.includes(search)
      ) {
        return false;
      }

      if (
        lifecycle &&
        question.lifecycle_status !==
          lifecycle
      ) {
        return false;
      }

      if (
        questionType &&
        question.question_type !==
          questionType
      ) {
        return false;
      }

      if (
        cognitive &&
        question.cognitive_level !==
          cognitive
      ) {
        return false;
      }

      if (
        difficulty &&
        String(
          question.difficulty,
        ) !== difficulty
      ) {
        return false;
      }

      if (quality) {
        const row =
          qualityByQuestion.get(
            question.id,
          );

        const state = row?.report
          ? questionQualityState(
              row.report,
            )
          : "blocked";

        if (state !== quality) {
          return false;
        }
      }

      return true;
    });

  return (
    <div className="admin-page">
      <header className="admin-page-head">
        <div>
          <span className="admin-eyebrow">
            Academic assessment
          </span>

          <h1>Question bank</h1>

          <p>
            Review canonical assessment
            content, academic mappings and
            machine-enforced quality
            readiness before approval and
            publication.
          </p>
        </div>

        <Link
          href="/admin/academic-knowledge"
          className="admin-secondary-button"
        >
          Academic knowledge
        </Link>
      </header>

      <section className="admin-metrics admin-metrics-4">
        <div>
          <span>Total questions</span>
          <strong>
            {questions.length}
          </strong>
          <small>
            canonical assessment records
          </small>
        </div>

        <div>
          <span>Quality ready</span>
          <strong>
            {qualityCounts.ready}
          </strong>
          <small>
            no blocking issues or warnings
          </small>
        </div>

        <div>
          <span>Ready with warning</span>
          <strong>
            {qualityCounts.warning}
          </strong>
          <small>
            approvable but needs attention
          </small>
        </div>

        <div>
          <span>Blocked</span>
          <strong>
            {qualityCounts.blocked}
          </strong>
          <small>
            cannot pass approval gate
          </small>
        </div>
      </section>

      <section className="admin-panel admin-detail-card">
        <form
          method="get"
          className={styles.filters}
        >
          <label
            className={styles.search}
          >
            <span>Search</span>
            <input
              name="q"
              defaultValue={firstParam(
                query.q,
              )}
              placeholder="Question, concept or slug"
            />
          </label>

          <label>
            <span>Quality</span>
            <select
              name="quality"
              defaultValue={quality}
            >
              <option value="">
                All
              </option>
              <option value="ready">
                Ready
              </option>
              <option value="warning">
                Ready · warning
              </option>
              <option value="blocked">
                Blocked
              </option>
            </select>
          </label>

          <label>
            <span>Lifecycle</span>
            <select
              name="lifecycle"
              defaultValue={lifecycle}
            >
              <option value="">
                All
              </option>
              <option value="draft">
                Draft
              </option>
              <option value="review">
                Review
              </option>
              <option value="approved">
                Approved
              </option>
              <option value="published">
                Published
              </option>
              <option value="archived">
                Archived
              </option>
            </select>
          </label>

          <label>
            <span>Question type</span>
            <select
              name="type"
              defaultValue={
                questionType
              }
            >
              <option value="">
                All
              </option>
              <option value="multiple_choice">
                Multiple choice
              </option>
              <option value="true_false">
                True / false
              </option>
              <option value="short_answer">
                Short answer
              </option>
              <option value="numeric">
                Numeric
              </option>
              <option value="calculation">
                Calculation
              </option>
              <option value="interpretation">
                Interpretation
              </option>
              <option value="proof">
                Proof
              </option>
              <option value="code">
                Code
              </option>
              <option value="extended_response">
                Extended response
              </option>
            </select>
          </label>

          <label>
            <span>Difficulty</span>
            <select
              name="difficulty"
              defaultValue={
                difficulty
              }
            >
              <option value="">
                All
              </option>

              {[1, 2, 3, 4, 5].map(
                (value) => (
                  <option
                    key={value}
                    value={value}
                  >
                    {value}/5
                  </option>
                ),
              )}
            </select>
          </label>

          <label>
            <span>Cognitive level</span>
            <select
              name="cognitive"
              defaultValue={cognitive}
            >
              <option value="">
                All
              </option>
              <option value="remember">
                Remember
              </option>
              <option value="understand">
                Understand
              </option>
              <option value="apply">
                Apply
              </option>
              <option value="analyse">
                Analyse
              </option>
              <option value="evaluate">
                Evaluate
              </option>
              <option value="create">
                Create
              </option>
            </select>
          </label>

          <div
            className={
              styles.filterActions
            }
          >
            <button
              type="submit"
              className="admin-primary-button"
            >
              Apply filters
            </button>

            <Link
              href="/admin/question-bank"
              className="admin-secondary-button"
            >
              Clear
            </Link>
          </div>
        </form>
      </section>

      <section className="admin-panel admin-detail-card">
        <div className="admin-card-head">
          <div>
            <span className="admin-eyebrow">
              Canonical assessment
            </span>
            <h2>Questions</h2>
          </div>

          <span>
            {filtered.length} shown
          </span>
        </div>

        {filtered.length ? (
          <div
            className={
              styles.questionList
            }
          >
            {filtered.map(
              (question) => {
                const questionConcepts =
                  conceptsByQuestion.get(
                    question.id,
                  ) || [];

                const qualityRow =
                  qualityByQuestion.get(
                    question.id,
                  );

                const qualityState =
                  qualityRow?.report
                    ? questionQualityState(
                        qualityRow.report,
                      )
                    : "blocked";

                return (
                  <Link
                    key={question.id}
                    href={`/admin/question-bank/${question.id}`}
                    className={
                      styles.questionCard
                    }
                  >
                    <div
                      className={
                        styles.questionMain
                      }
                    >
                      <div
                        className={
                          styles.questionTop
                        }
                      >
                        <span>
                          {label(
                            question.question_type,
                          )}
                        </span>

                        <span
                          className={`${styles.lifecycle} ${
                            question.lifecycle_status ===
                            "draft"
                              ? styles.draft
                              : ""
                          }`}
                        >
                          {
                            question.lifecycle_status
                          }
                        </span>

                        <span
                          className={`${styles.qualityBadge} ${
                            styles[
                              `quality_${qualityState}`
                            ]
                          }`}
                        >
                          {qualityRow?.report
                            ? questionQualityLabel(
                                qualityState,
                              )
                            : "Quality unavailable"}
                        </span>
                      </div>

                      <h3>
                        {question.title ||
                          question.slug}
                      </h3>

                      <p>
                        {question.prompt}
                      </p>

                      <div
                        className={
                          styles.concepts
                        }
                      >
                        {questionConcepts.map(
                          (concept) => (
                            <span
                              key={
                                concept.id
                              }
                            >
                              {
                                concept.name
                              }
                            </span>
                          ),
                        )}
                      </div>
                    </div>

                    <div
                      className={
                        styles.questionMeta
                      }
                    >
                      <span>
                        Difficulty{" "}
                        {
                          question.difficulty
                        }
                        /5
                      </span>

                      <span>
                        {label(
                          question.cognitive_level,
                        )}
                      </span>

                      {question.marks !==
                      null ? (
                        <span>
                          {question.marks}{" "}
                          marks
                        </span>
                      ) : null}

                      {question.estimated_minutes ? (
                        <span>
                          {
                            question.estimated_minutes
                          }{" "}
                          min
                        </span>
                      ) : null}

                      {qualityRow ? (
                        <>
                          <span>
                            {
                              qualityRow.error_count
                            }{" "}
                            blocking
                          </span>

                          <span>
                            {
                              qualityRow.warning_count
                            }{" "}
                            warning
                            {qualityRow.warning_count ===
                            1
                              ? ""
                              : "s"}
                          </span>
                        </>
                      ) : null}
                    </div>
                  </Link>
                );
              },
            )}
          </div>
        ) : (
          <div className="admin-empty">
            No questions match these
            filters.
          </div>
        )}
      </section>
    </div>
  );
}
