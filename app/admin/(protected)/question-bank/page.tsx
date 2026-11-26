import Link from "next/link";
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

type SearchParams = Record<string, string | string[] | undefined>;

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] || "" : value || "";
}

function label(value: string) {
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default async function QuestionBankPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const query = await searchParams;

  const search = firstParam(query.q).trim().toLowerCase();
  const lifecycle = firstParam(query.lifecycle);
  const questionType = firstParam(query.type);
  const cognitive = firstParam(query.cognitive);
  const difficulty = firstParam(query.difficulty);

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("academic_questions")
    .select(
      "id,slug,title,prompt,question_type,difficulty,cognitive_level,estimated_minutes,marks,lifecycle_status,updated_at",
    )
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const questions = (data || []) as Question[];
  const questionIds = questions.map((question) => question.id);

  let mappings: QuestionConcept[] = [];

  if (questionIds.length) {
    const result = await supabase
      .from("academic_question_concepts")
      .select("question_id,concept_id,is_primary")
      .in("question_id", questionIds);

    if (result.error) {
      throw new Error(result.error.message);
    }

    mappings = (result.data || []) as QuestionConcept[];
  }

  const conceptIds = Array.from(
    new Set(mappings.map((mapping) => mapping.concept_id)),
  );

  let concepts: Concept[] = [];

  if (conceptIds.length) {
    const result = await supabase
      .from("academic_concepts")
      .select("id,name,slug")
      .in("id", conceptIds);

    if (result.error) {
      throw new Error(result.error.message);
    }

    concepts = (result.data || []) as Concept[];
  }

  const conceptById = new Map(
    concepts.map((concept) => [concept.id, concept]),
  );

  const conceptsByQuestion = new Map<string, Concept[]>();

  for (const mapping of mappings) {
    const concept = conceptById.get(mapping.concept_id);
    if (!concept) continue;

    const current = conceptsByQuestion.get(mapping.question_id) || [];
    current.push(concept);
    conceptsByQuestion.set(mapping.question_id, current);
  }

  const filtered = questions.filter((question) => {
    const questionConcepts =
      conceptsByQuestion.get(question.id) || [];

    const haystack = [
      question.slug,
      question.title || "",
      question.prompt,
      ...questionConcepts.map((concept) => concept.name),
    ]
      .join(" ")
      .toLowerCase();

    if (search && !haystack.includes(search)) return false;

    if (
      lifecycle &&
      question.lifecycle_status !== lifecycle
    ) {
      return false;
    }

    if (
      questionType &&
      question.question_type !== questionType
    ) {
      return false;
    }

    if (
      cognitive &&
      question.cognitive_level !== cognitive
    ) {
      return false;
    }

    if (
      difficulty &&
      String(question.difficulty) !== difficulty
    ) {
      return false;
    }

    return true;
  });

  const draftCount = questions.filter(
    (question) => question.lifecycle_status === "draft",
  ).length;

  const reviewCount = questions.filter(
    (question) => question.lifecycle_status === "review",
  ).length;

  const approvedCount = questions.filter(
    (question) =>
      question.lifecycle_status === "approved" ||
      question.lifecycle_status === "published",
  ).length;

  return (
    <div className="admin-page">
      <header className="admin-page-head">
        <div>
          <span className="admin-eyebrow">Academic assessment</span>
          <h1>Question bank</h1>
          <p>
            Review canonical questions, concept mappings, difficulty,
            cognitive level, hints and worked solutions.
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
          <strong>{questions.length}</strong>
          <small>canonical records</small>
        </div>

        <div>
          <span>Draft</span>
          <strong>{draftCount}</strong>
          <small>awaiting review</small>
        </div>

        <div>
          <span>In review</span>
          <strong>{reviewCount}</strong>
          <small>review workflow</small>
        </div>

        <div>
          <span>Approved</span>
          <strong>{approvedCount}</strong>
          <small>approved or published</small>
        </div>
      </section>

      <section className="admin-panel admin-detail-card">
        <form method="get" className={styles.filters}>
          <label className={styles.search}>
            <span>Search</span>
            <input
              name="q"
              defaultValue={firstParam(query.q)}
              placeholder="Question, concept or slug"
            />
          </label>

          <label>
            <span>Lifecycle</span>
            <select
              name="lifecycle"
              defaultValue={lifecycle}
            >
              <option value="">All</option>
              <option value="draft">Draft</option>
              <option value="review">Review</option>
              <option value="approved">Approved</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </label>

          <label>
            <span>Question type</span>
            <select
              name="type"
              defaultValue={questionType}
            >
              <option value="">All</option>
              <option value="multiple_choice">
                Multiple choice
              </option>
              <option value="true_false">True / false</option>
              <option value="short_answer">Short answer</option>
              <option value="numeric">Numeric</option>
              <option value="calculation">Calculation</option>
              <option value="interpretation">
                Interpretation
              </option>
              <option value="proof">Proof</option>
              <option value="code">Code</option>
              <option value="extended_response">
                Extended response
              </option>
            </select>
          </label>

          <label>
            <span>Difficulty</span>
            <select
              name="difficulty"
              defaultValue={difficulty}
            >
              <option value="">All</option>
              {[1, 2, 3, 4, 5].map((value) => (
                <option key={value} value={value}>
                  {value}/5
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Cognitive level</span>
            <select
              name="cognitive"
              defaultValue={cognitive}
            >
              <option value="">All</option>
              <option value="remember">Remember</option>
              <option value="understand">Understand</option>
              <option value="apply">Apply</option>
              <option value="analyse">Analyse</option>
              <option value="evaluate">Evaluate</option>
              <option value="create">Create</option>
            </select>
          </label>

          <div className={styles.filterActions}>
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
            <span className="admin-eyebrow">Canonical assessment</span>
            <h2>Questions</h2>
          </div>

          <span>
            {filtered.length} shown
          </span>
        </div>

        {filtered.length ? (
          <div className={styles.questionList}>
            {filtered.map((question) => {
              const questionConcepts =
                conceptsByQuestion.get(question.id) || [];

              return (
                <Link
                  key={question.id}
                  href={`/admin/question-bank/${question.id}`}
                  className={styles.questionCard}
                >
                  <div className={styles.questionMain}>
                    <div className={styles.questionTop}>
                      <span>{label(question.question_type)}</span>

                      <span
                        className={`${styles.lifecycle} ${
                          question.lifecycle_status === "draft"
                            ? styles.draft
                            : ""
                        }`}
                      >
                        {question.lifecycle_status}
                      </span>
                    </div>

                    <h3>
                      {question.title || question.slug}
                    </h3>

                    <p>{question.prompt}</p>

                    <div className={styles.concepts}>
                      {questionConcepts.map((concept) => (
                        <span key={concept.id}>
                          {concept.name}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className={styles.questionMeta}>
                    <span>
                      Difficulty {question.difficulty}/5
                    </span>

                    <span>
                      {label(question.cognitive_level)}
                    </span>

                    {question.marks !== null ? (
                      <span>{question.marks} marks</span>
                    ) : null}

                    {question.estimated_minutes ? (
                      <span>
                        {question.estimated_minutes} min
                      </span>
                    ) : null}
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="admin-empty">
            No questions match these filters.
          </div>
        )}
      </section>
    </div>
  );
}
