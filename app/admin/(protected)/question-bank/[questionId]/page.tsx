import Link from "next/link";
import { notFound } from "next/navigation";
import {
  transitionAcademicQuestion,
  updateAcademicQuestion,
} from "@/app/admin/academic-question-actions";
import { createAdminClient } from "@/lib/supabase/admin";
import styles from "../question-bank.module.css";

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
  source_note: string | null;
  reviewed_at: string | null;
  review_notes: string | null;
};

type ConceptMapping = {
  concept_id: string;
  is_primary: boolean;
  sort_order: number;
};

type ObjectiveMapping = {
  learning_objective_id: string;
};

type Concept = {
  id: string;
  name: string;
  slug: string;
};

type Objective = {
  id: string;
  concept_id: string;
  objective: string;
  objective_type: string;
};

type Option = {
  id: string;
  option_key: string;
  option_text: string;
  is_correct: boolean;
  explanation: string | null;
  sort_order: number;
};

type Hint = {
  id: string;
  hint_text: string;
  hint_level: number;
  sort_order: number;
};

type Solution = {
  id: string;
  final_answer: string | null;
  solution_text: string;
  marking_guidance: string | null;
  common_errors: string | null;
};

type ReviewEvent = {
  id: string;
  event_type: string;
  from_status: string | null;
  to_status: string | null;
  reviewer_email: string | null;
  note: string | null;
  created_at: string;
  title_snapshot: string | null;
};

type SearchParams =
  Record<string, string | string[] | undefined>;

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

function utcDate(value: string) {
  return new Date(value).toLocaleString(
    "en-GB",
    {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "UTC",
    },
  );
}

function LifecycleForm({
  questionId,
  nextStatus,
  children,
  primary = false,
}: {
  questionId: string;
  nextStatus: string;
  children: React.ReactNode;
  primary?: boolean;
}) {
  return (
    <form action={transitionAcademicQuestion}>
      <input
        type="hidden"
        name="questionId"
        value={questionId}
      />
      <input
        type="hidden"
        name="nextStatus"
        value={nextStatus}
      />
      <button
        type="submit"
        className={
          primary
            ? "admin-primary-button"
            : "admin-secondary-button"
        }
      >
        {children}
      </button>
    </form>
  );
}

export default async function QuestionDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ questionId: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const { questionId } = await params;
  const query = await searchParams;
  const supabase = createAdminClient();

  const {
    data: questionData,
    error: questionError,
  } = await supabase
    .from("academic_questions")
    .select(
      "id,slug,title,prompt,question_type,difficulty,cognitive_level,estimated_minutes,marks,lifecycle_status,source_note,reviewed_at,review_notes",
    )
    .eq("id", questionId)
    .maybeSingle();

  if (questionError) {
    throw new Error(questionError.message);
  }

  if (!questionData) {
    notFound();
  }

  const question = questionData as Question;

  const [
    conceptResult,
    objectiveResult,
    optionResult,
    hintResult,
    solutionResult,
    historyResult,
  ] = await Promise.all([
    supabase
      .from("academic_question_concepts")
      .select(
        "concept_id,is_primary,sort_order",
      )
      .eq("question_id", question.id)
      .order("sort_order"),

    supabase
      .from("academic_question_objectives")
      .select("learning_objective_id")
      .eq("question_id", question.id),

    supabase
      .from("academic_question_options")
      .select(
        "id,option_key,option_text,is_correct,explanation,sort_order",
      )
      .eq("question_id", question.id)
      .order("sort_order"),

    supabase
      .from("academic_question_hints")
      .select(
        "id,hint_text,hint_level,sort_order",
      )
      .eq("question_id", question.id)
      .order("sort_order"),

    supabase
      .from("academic_question_solutions")
      .select(
        "id,final_answer,solution_text,marking_guidance,common_errors",
      )
      .eq("question_id", question.id)
      .maybeSingle(),

    supabase
      .from("academic_question_review_events")
      .select(
        "id,event_type,from_status,to_status,reviewer_email,note,created_at,title_snapshot",
      )
      .eq("question_id", question.id)
      .order("created_at", {
        ascending: false,
      })
      .limit(100),
  ]);

  for (const result of [
    conceptResult,
    objectiveResult,
    optionResult,
    hintResult,
    solutionResult,
    historyResult,
  ]) {
    if (result.error) {
      throw new Error(result.error.message);
    }
  }

  const conceptMappings =
    (conceptResult.data || []) as ConceptMapping[];

  const objectiveMappings =
    (objectiveResult.data || []) as ObjectiveMapping[];

  const options =
    (optionResult.data || []) as Option[];

  const hints =
    (hintResult.data || []) as Hint[];

  const solution =
    (solutionResult.data || null) as
      | Solution
      | null;

  const reviewEvents =
    (historyResult.data || []) as ReviewEvent[];

  const conceptIds = conceptMappings.map(
    (mapping) => mapping.concept_id,
  );

  const objectiveIds = objectiveMappings.map(
    (mapping) =>
      mapping.learning_objective_id,
  );

  let concepts: Concept[] = [];
  let objectives: Objective[] = [];

  if (conceptIds.length) {
    const result = await supabase
      .from("academic_concepts")
      .select("id,name,slug")
      .in("id", conceptIds);

    if (result.error) {
      throw new Error(result.error.message);
    }

    concepts =
      (result.data || []) as Concept[];
  }

  if (objectiveIds.length) {
    const result = await supabase
      .from("academic_learning_objectives")
      .select(
        "id,concept_id,objective,objective_type",
      )
      .in("id", objectiveIds);

    if (result.error) {
      throw new Error(result.error.message);
    }

    objectives =
      (result.data || []) as Objective[];
  }

  const conceptById = new Map(
    concepts.map((concept) => [
      concept.id,
      concept,
    ]),
  );

  const objectiveById = new Map(
    objectives.map((objective) => [
      objective.id,
      objective,
    ]),
  );

  return (
    <div className="admin-page">
      <div className={styles.breadcrumbs}>
        <Link href="/admin/question-bank">
          Question bank
        </Link>
        <span>›</span>
        <span>
          {question.title || question.slug}
        </span>
      </div>

      <header className="admin-page-head">
        <div>
          <span className="admin-eyebrow">
            Canonical assessment question
          </span>

          <h1>
            {question.title || question.slug}
          </h1>

          <p className={styles.slug}>
            {question.slug}
          </p>
        </div>

        <Link
          href="/admin/question-bank"
          className="admin-secondary-button"
        >
          ← Question bank
        </Link>
      </header>

      {firstParam(query.saved) ? (
        <div className="admin-alert success">
          Academic question saved and audit
          history updated.
        </div>
      ) : null}

      {firstParam(query.status) ? (
        <div className="admin-alert success">
          Question lifecycle updated to{" "}
          <strong>
            {firstParam(query.status)}
          </strong>
          .
        </div>
      ) : null}

      {firstParam(query.error) ? (
        <div className="admin-alert error">
          {firstParam(query.error)}
        </div>
      ) : null}

      <section className="admin-metrics admin-metrics-4">
        <div>
          <span>Lifecycle</span>
          <strong>
            {question.lifecycle_status}
          </strong>
          <small>question record</small>
        </div>

        <div>
          <span>Difficulty</span>
          <strong>
            {question.difficulty}/5
          </strong>
          <small>canonical estimate</small>
        </div>

        <div>
          <span>Cognitive level</span>
          <strong>
            {label(
              question.cognitive_level,
            )}
          </strong>
          <small>
            {label(question.question_type)}
          </small>
        </div>

        <div>
          <span>Assessment</span>
          <strong>
            {question.marks !== null
              ? `${question.marks} marks`
              : "—"}
          </strong>
          <small>
            {question.estimated_minutes
              ? `${question.estimated_minutes} min estimated`
              : "No time estimate"}
          </small>
        </div>
      </section>

      <section className="admin-panel admin-detail-card">
        <div className="admin-card-head">
          <div>
            <span className="admin-eyebrow">
              Question
            </span>
            <h2>Prompt</h2>
          </div>

          <span>
            {label(question.question_type)}
          </span>
        </div>

        <div className={styles.prompt}>
          {question.prompt}
        </div>

        <details
          className={styles.reviewEditor}
        >
          <summary>
            Edit question & review metadata
          </summary>

          <form
            action={updateAcademicQuestion}
            className={styles.reviewForm}
          >
            <input
              type="hidden"
              name="questionId"
              value={question.id}
            />

            <label>
              <span>Title</span>
              <input
                name="title"
                defaultValue={
                  question.title || ""
                }
              />
            </label>

            <label className={styles.fullField}>
              <span>Question prompt</span>
              <textarea
                name="prompt"
                rows={7}
                defaultValue={question.prompt}
                required
              />
            </label>

            <label>
              <span>Question type</span>
              <select
                name="questionType"
                defaultValue={
                  question.question_type
                }
              >
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
                  question.difficulty
                }
              >
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
                name="cognitiveLevel"
                defaultValue={
                  question.cognitive_level
                }
              >
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

            <label>
              <span>Estimated minutes</span>
              <input
                name="estimatedMinutes"
                type="number"
                min="1"
                step="1"
                defaultValue={
                  question.estimated_minutes ??
                  ""
                }
              />
            </label>

            <label>
              <span>Marks</span>
              <input
                name="marks"
                type="number"
                min="0"
                step="0.5"
                defaultValue={
                  question.marks ?? ""
                }
              />
            </label>

            <label className={styles.fullField}>
              <span>Source / provenance</span>
              <textarea
                name="sourceNote"
                rows={3}
                defaultValue={
                  question.source_note || ""
                }
              />
            </label>

            <label className={styles.fullField}>
              <span>Reviewer notes</span>
              <textarea
                name="reviewNotes"
                rows={4}
                defaultValue={
                  question.review_notes || ""
                }
                placeholder="Academic corrections, methodological checks, wording or provenance notes…"
              />
            </label>

            <div className={styles.fullField}>
              <button
                type="submit"
                className="admin-primary-button"
              >
                Save question
              </button>
            </div>
          </form>

          <div
            className={
              styles.lifecycleActions
            }
          >
            <div>
              <strong>
                Lifecycle governance
              </strong>
              <small>
                All transitions are recorded
                transactionally in structured
                review history.
              </small>
            </div>

            <div
              className={
                styles.lifecycleButtons
              }
            >
              {question.lifecycle_status ===
              "draft" ? (
                <>
                  <LifecycleForm
                    questionId={question.id}
                    nextStatus="review"
                    primary
                  >
                    Send to review
                  </LifecycleForm>

                  <LifecycleForm
                    questionId={question.id}
                    nextStatus="archived"
                  >
                    Archive
                  </LifecycleForm>
                </>
              ) : null}

              {question.lifecycle_status ===
              "review" ? (
                <>
                  <LifecycleForm
                    questionId={question.id}
                    nextStatus="approved"
                    primary
                  >
                    Approve
                  </LifecycleForm>

                  <LifecycleForm
                    questionId={question.id}
                    nextStatus="draft"
                  >
                    Return to draft
                  </LifecycleForm>

                  <LifecycleForm
                    questionId={question.id}
                    nextStatus="archived"
                  >
                    Archive
                  </LifecycleForm>
                </>
              ) : null}

              {question.lifecycle_status ===
              "approved" ? (
                <>
                  <LifecycleForm
                    questionId={question.id}
                    nextStatus="published"
                    primary
                  >
                    Publish
                  </LifecycleForm>

                  <LifecycleForm
                    questionId={question.id}
                    nextStatus="review"
                  >
                    Return to review
                  </LifecycleForm>

                  <LifecycleForm
                    questionId={question.id}
                    nextStatus="archived"
                  >
                    Archive
                  </LifecycleForm>
                </>
              ) : null}

              {question.lifecycle_status ===
              "published" ? (
                <>
                  <LifecycleForm
                    questionId={question.id}
                    nextStatus="approved"
                  >
                    Unpublish
                  </LifecycleForm>

                  <LifecycleForm
                    questionId={question.id}
                    nextStatus="archived"
                  >
                    Archive
                  </LifecycleForm>
                </>
              ) : null}

              {question.lifecycle_status ===
              "archived" ? (
                <LifecycleForm
                  questionId={question.id}
                  nextStatus="draft"
                  primary
                >
                  Restore to draft
                </LifecycleForm>
              ) : null}
            </div>
          </div>
        </details>
      </section>

      <section className={styles.detailGrid}>
        <article className="admin-panel admin-detail-card">
          <div className="admin-card-head">
            <div>
              <span className="admin-eyebrow">
                Knowledge graph
              </span>
              <h2>Concept mappings</h2>
            </div>

            <span>
              {conceptMappings.length}
            </span>
          </div>

          {conceptMappings.length ? (
            <div
              className={styles.mappingList}
            >
              {conceptMappings.map(
                (mapping) => {
                  const concept =
                    conceptById.get(
                      mapping.concept_id,
                    );

                  if (!concept) return null;

                  return (
                    <Link
                      key={
                        mapping.concept_id
                      }
                      href={`/admin/academic-knowledge/${concept.id}`}
                      className={
                        styles.mapping
                      }
                    >
                      <span>
                        {mapping.is_primary
                          ? "Primary"
                          : "Related"}
                      </span>

                      <div>
                        <strong>
                          {concept.name}
                        </strong>
                        <small>
                          {concept.slug}
                        </small>
                      </div>
                    </Link>
                  );
                },
              )}
            </div>
          ) : (
            <div className="admin-empty">
              No concept mappings.
            </div>
          )}
        </article>

        <article className="admin-panel admin-detail-card">
          <div className="admin-card-head">
            <div>
              <span className="admin-eyebrow">
                Learning design
              </span>
              <h2>
                Learning objectives
              </h2>
            </div>

            <span>
              {objectiveMappings.length}
            </span>
          </div>

          {objectiveMappings.length ? (
            <div
              className={styles.mappingList}
            >
              {objectiveMappings.map(
                (mapping) => {
                  const objective =
                    objectiveById.get(
                      mapping.learning_objective_id,
                    );

                  if (!objective) return null;

                  return (
                    <div
                      key={
                        mapping.learning_objective_id
                      }
                      className={
                        styles.mapping
                      }
                    >
                      <span>
                        {label(
                          objective.objective_type,
                        )}
                      </span>

                      <div>
                        <strong>
                          {
                            objective.objective
                          }
                        </strong>

                        {conceptById.get(
                          objective.concept_id,
                        ) ? (
                          <small>
                            {
                              conceptById.get(
                                objective.concept_id,
                              )?.name
                            }
                          </small>
                        ) : null}
                      </div>
                    </div>
                  );
                },
              )}
            </div>
          ) : (
            <div className="admin-empty">
              No learning-objective
              mappings.
            </div>
          )}
        </article>
      </section>

      {options.length ? (
        <section className="admin-panel admin-detail-card">
          <div className="admin-card-head">
            <div>
              <span className="admin-eyebrow">
                Response design
              </span>
              <h2>Answer options</h2>
            </div>

            <span>{options.length}</span>
          </div>

          <div
            className={styles.optionList}
          >
            {options.map((option) => (
              <article
                key={option.id}
                className={`${styles.option} ${
                  option.is_correct
                    ? styles.correctOption
                    : ""
                }`}
              >
                <div
                  className={styles.optionKey}
                >
                  {option.option_key}
                </div>

                <div>
                  <strong>
                    {option.option_text}
                  </strong>

                  <span
                    className={
                      styles.correctness
                    }
                  >
                    {option.is_correct
                      ? "Correct answer"
                      : "Distractor"}
                  </span>

                  {option.explanation ? (
                    <p>
                      {
                        option.explanation
                      }
                    </p>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <section className={styles.detailGrid}>
        <article className="admin-panel admin-detail-card">
          <div className="admin-card-head">
            <div>
              <span className="admin-eyebrow">
                Guided learning
              </span>
              <h2>Progressive hints</h2>
            </div>

            <span>{hints.length}</span>
          </div>

          {hints.length ? (
            <div className={styles.hintList}>
              {hints.map((hint) => (
                <div
                  key={hint.id}
                  className={styles.hint}
                >
                  <span>
                    Hint {hint.hint_level}
                  </span>
                  <p>{hint.hint_text}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="admin-empty">
              No hints recorded.
            </div>
          )}
        </article>

        <article className="admin-panel admin-detail-card">
          <div className="admin-card-head">
            <div>
              <span className="admin-eyebrow">
                Governance
              </span>
              <h2>Provenance</h2>
            </div>
          </div>

          <div className={styles.provenance}>
            <div>
              <span>Source note</span>
              <p>
                {question.source_note ||
                  "—"}
              </p>
            </div>

            <div>
              <span>Reviewed at</span>
              <p>
                {question.reviewed_at
                  ? utcDate(
                      question.reviewed_at,
                    )
                  : "Not reviewed"}
              </p>
            </div>

            <div>
              <span>Review notes</span>
              <p>
                {question.review_notes ||
                  "—"}
              </p>
            </div>
          </div>
        </article>
      </section>

      <section className="admin-panel admin-detail-card">
        <div className="admin-card-head">
          <div>
            <span className="admin-eyebrow">
              Canonical solution
            </span>
            <h2>Worked solution</h2>
          </div>

          <span>
            {solution
              ? "Available"
              : "Missing"}
          </span>
        </div>

        {solution ? (
          <div className={styles.solution}>
            {solution.final_answer ? (
              <section>
                <span>Final answer</span>
                <p>
                  {solution.final_answer}
                </p>
              </section>
            ) : null}

            <section>
              <span>
                Reasoning / working
              </span>
              <p>
                {solution.solution_text}
              </p>
            </section>

            {solution.marking_guidance ? (
              <section>
                <span>
                  Marking guidance
                </span>
                <p>
                  {
                    solution.marking_guidance
                  }
                </p>
              </section>
            ) : null}

            {solution.common_errors ? (
              <section>
                <span>Common errors</span>
                <p>
                  {
                    solution.common_errors
                  }
                </p>
              </section>
            ) : null}
          </div>
        ) : (
          <div className="admin-empty">
            No canonical solution has been
            added.
          </div>
        )}
      </section>

      <section className="admin-panel admin-detail-card">
        <div className="admin-card-head">
          <div>
            <span className="admin-eyebrow">
              Structured audit
            </span>
            <h2>Review history</h2>
          </div>

          <span>
            {reviewEvents.length} event
            {reviewEvents.length === 1
              ? ""
              : "s"}
          </span>
        </div>

        {reviewEvents.length ? (
          <div
            className={styles.historyList}
          >
            {reviewEvents.map((event) => (
              <article
                key={event.id}
                className={
                  styles.historyEvent
                }
              >
                <div
                  className={
                    styles.historyMarker
                  }
                />

                <div
                  className={
                    styles.historyContent
                  }
                >
                  <div
                    className={
                      styles.historyHead
                    }
                  >
                    <div>
                      <strong>
                        {label(
                          event.event_type,
                        )}
                      </strong>

                      <span>
                        {event.from_status ||
                          "—"}{" "}
                        →{" "}
                        {event.to_status ||
                          "—"}
                      </span>
                    </div>

                    <time>
                      {utcDate(
                        event.created_at,
                      )}{" "}
                      UTC
                    </time>
                  </div>

                  <div
                    className={
                      styles.historyMeta
                    }
                  >
                    <span>
                      Reviewer:{" "}
                      {event.reviewer_email ||
                        "Legacy / unattributed"}
                    </span>

                    {event.title_snapshot ? (
                      <span>
                        Snapshot:{" "}
                        {
                          event.title_snapshot
                        }
                      </span>
                    ) : null}
                  </div>

                  {event.note ? (
                    <p
                      className={
                        styles.historyNote
                      }
                    >
                      {event.note}
                    </p>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="admin-empty">
            No structured review events yet.
            This question has not entered the
            governed workflow.
          </div>
        )}
      </section>
    </div>
  );
}
