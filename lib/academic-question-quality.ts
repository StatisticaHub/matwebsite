export type QuestionQualityChecks = {
  title_present?: boolean;
  prompt_present?: boolean;
  source_note_present?: boolean;

  marks?: number | null;
  estimated_minutes?: number | null;

  concept_count?: number;
  primary_concept_count?: number;

  objective_count?: number;
  invalid_objective_mapping_count?: number;
  matching_cognitive_objective_count?: number;

  hint_count?: number;
  hint_levels_valid?: boolean;
  blank_hint_count?: number;

  option_count?: number;
  correct_option_count?: number;
  blank_option_count?: number;
  missing_option_explanation_count?: number;

  solution_count?: number;
  solution_text_present?: boolean;
  final_answer_present?: boolean;
  marking_guidance_present?: boolean;
  common_errors_present?: boolean;
};

export type QuestionQualityReport = {
  question_id: string;
  slug: string;
  lifecycle_status: string;
  question_type: string;
  cognitive_level: string;

  ready: boolean;

  error_count: number;
  warning_count: number;

  errors: string[];
  warnings: string[];

  checks: QuestionQualityChecks;
};

export type QuestionQualityRow = {
  question_id: string;
  lifecycle_status: string;
  ready: boolean;
  error_count: number;
  warning_count: number;
  report: QuestionQualityReport;
};

export type QuestionQualityState =
  | "ready"
  | "warning"
  | "blocked";

export type QuestionQualityCheck = {
  key: string;
  label: string;
  detail: string;
  passed: boolean;
  required: boolean;
};

function numberValue(
  value: number | null | undefined,
) {
  return typeof value === "number"
    ? value
    : 0;
}

export function questionQualityState(
  report: QuestionQualityReport,
): QuestionQualityState {
  if (
    !report.ready ||
    report.error_count > 0 ||
    report.errors?.length > 0
  ) {
    return "blocked";
  }

  if (
    report.warning_count > 0 ||
    report.warnings?.length > 0
  ) {
    return "warning";
  }

  return "ready";
}

export function questionQualityLabel(
  state: QuestionQualityState,
) {
  if (state === "blocked") {
    return "Blocked";
  }

  if (state === "warning") {
    return "Ready · warning";
  }

  return "Ready";
}

export function buildQuestionQualityChecklist(
  report: QuestionQualityReport,
): QuestionQualityCheck[] {
  const checks = report.checks || {};

  const conceptCount =
    numberValue(checks.concept_count);

  const primaryConceptCount =
    numberValue(
      checks.primary_concept_count,
    );

  const objectiveCount =
    numberValue(checks.objective_count);

  const invalidObjectives =
    numberValue(
      checks.invalid_objective_mapping_count,
    );

  const hintCount =
    numberValue(checks.hint_count);

  const optionCount =
    numberValue(checks.option_count);

  const correctOptionCount =
    numberValue(
      checks.correct_option_count,
    );

  const blankOptionCount =
    numberValue(
      checks.blank_option_count,
    );

  const missingOptionExplanations =
    numberValue(
      checks.missing_option_explanation_count,
    );

  const solutionCount =
    numberValue(checks.solution_count);

  const finalAnswerRequired = [
    "multiple_choice",
    "true_false",
    "short_answer",
    "numeric",
    "calculation",
  ].includes(report.question_type);

  const optionStructureRequired = [
    "multiple_choice",
    "true_false",
  ].includes(report.question_type);

  const optionStructurePassed =
    report.question_type === "multiple_choice"
      ? optionCount >= 2 &&
        correctOptionCount === 1 &&
        blankOptionCount === 0 &&
        missingOptionExplanations === 0
      : report.question_type === "true_false"
        ? optionCount === 2 &&
          correctOptionCount === 1 &&
          blankOptionCount === 0 &&
          missingOptionExplanations === 0
        : true;

  return [
    {
      key: "question_text",
      label: "Question identity & prompt",
      required: true,
      passed:
        checks.title_present === true &&
        checks.prompt_present === true,
      detail:
        "A canonical title and complete question prompt are present.",
    },
    {
      key: "provenance",
      label: "Academic provenance",
      required: true,
      passed:
        checks.source_note_present === true,
      detail:
        "A source or provenance note is recorded for academic traceability.",
    },
    {
      key: "assessment_metadata",
      label: "Assessment metadata",
      required: true,
      passed:
        numberValue(checks.marks) > 0 &&
        numberValue(
          checks.estimated_minutes,
        ) > 0,
      detail:
        "Positive marks and an estimated completion time are defined.",
    },
    {
      key: "concept_mapping",
      label: "Concept coverage",
      required: true,
      passed: conceptCount >= 1,
      detail:
        `${conceptCount} canonical concept mapping${
          conceptCount === 1 ? "" : "s"
        } recorded.`,
    },
    {
      key: "primary_concept",
      label: "Primary concept",
      required: true,
      passed:
        primaryConceptCount === 1,
      detail:
        `${primaryConceptCount} primary concept mapping${
          primaryConceptCount === 1
            ? ""
            : "s"
        } recorded; exactly one is required.`,
    },
    {
      key: "objective_mapping",
      label: "Learning-objective alignment",
      required: true,
      passed:
        objectiveCount >= 1 &&
        invalidObjectives === 0,
      detail:
        `${objectiveCount} learning objective mapping${
          objectiveCount === 1 ? "" : "s"
        }; ${invalidObjectives} invalid cross-concept mapping${
          invalidObjectives === 1 ? "" : "s"
        }.`,
    },
    {
      key: "hints",
      label: "Progressive hints",
      required: true,
      passed:
        hintCount >= 1 &&
        checks.hint_levels_valid === true &&
        numberValue(
          checks.blank_hint_count,
        ) === 0,
      detail:
        `${hintCount} hint${
          hintCount === 1 ? "" : "s"
        } with contiguous progression from level 1.`,
    },
    {
      key: "solution",
      label: "Canonical worked solution",
      required: true,
      passed:
        solutionCount === 1 &&
        checks.solution_text_present ===
          true,
      detail:
        "Exactly one complete canonical reasoning / worked-solution record is required.",
    },
    {
      key: "marking_guidance",
      label: "Marking guidance",
      required: true,
      passed:
        checks.marking_guidance_present ===
        true,
      detail:
        "The question includes canonical guidance for evaluating a learner response.",
    },
    {
      key: "common_errors",
      label: "Common-error guidance",
      required: true,
      passed:
        checks.common_errors_present ===
        true,
      detail:
        "Likely learner misconceptions or common mistakes are documented.",
    },
    {
      key: "final_answer",
      label: "Canonical final answer",
      required: finalAnswerRequired,
      passed:
        !finalAnswerRequired ||
        checks.final_answer_present === true,
      detail: finalAnswerRequired
        ? "This question type requires a canonical final answer."
        : "A standalone final answer is not mandatory for this question type.",
    },
    {
      key: "options",
      label: "Response-option structure",
      required: optionStructureRequired,
      passed: optionStructurePassed,
      detail:
        report.question_type ===
        "multiple_choice"
          ? `${optionCount} options, ${correctOptionCount} correct, ${missingOptionExplanations} without explanations.`
          : report.question_type ===
              "true_false"
            ? `${optionCount} options, ${correctOptionCount} correct; exactly two options and one correct answer are required.`
            : "Option validation is not a blocking requirement for this question type.",
    },
  ];
}

export function requiredQualityProgress(
  report: QuestionQualityReport,
) {
  const required =
    buildQuestionQualityChecklist(
      report,
    ).filter((item) => item.required);

  return {
    passed: required.filter(
      (item) => item.passed,
    ).length,
    total: required.length,
  };
}
