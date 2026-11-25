type LearningHubResourceLike = {
  slug: string;
  title: string;
  category: string;
};

function inferSubject(
  value: string,
) {
  const text =
    value.toLowerCase();

  if (
    text.includes("bioinformatics")
  ) {
    return "Bioinformatics";
  }

  if (
    text.includes("data science") ||
    text.includes("machine learning") ||
    text.includes("artificial intelligence")
  ) {
    return "Data Science";
  }

  if (
    text.includes("computer science") ||
    text.includes("programming") ||
    text.includes("coding")
  ) {
    return "Computer Science";
  }

  if (
    text.includes("mathematics") ||
    text.includes("calculus") ||
    text.includes("algebra")
  ) {
    return "Mathematics";
  }

  if (
    text.includes("statistics") ||
    text.includes("statistical") ||
    text.includes("regression") ||
    text.includes("probability") ||
    text.includes("confidence interval") ||
    text.includes("p-value") ||
    text.includes("sampling distribution") ||
    text.includes("hypothesis test") ||
    text.includes("anova") ||
    text.includes("survival")
  ) {
    return "Statistics";
  }

  return "";
}

function tutoringHref({
  kind,
  slug,
  subject,
  topic,
}: {
  kind:
    | "hub"
    | "category"
    | "resource";
  slug?: string;
  subject?: string;
  topic?: string;
}) {
  const params =
    new URLSearchParams();

  params.set(
    "utm_source",
    "learning_hub",
  );

  params.set(
    "utm_medium",
    "content",
  );

  params.set(
    "utm_campaign",
    kind === "resource"
      ? "resource_to_tutoring"
      : kind === "category"
        ? "category_to_tutoring"
        : "hub_to_tutoring",
  );

  params.set(
    "utm_content",
    kind === "hub"
      ? "hub"
      : `${kind}:${slug || "unknown"}`,
  );

  if (subject) {
    params.set(
      "subject",
      subject,
    );
  }

  if (topic) {
    params.set(
      "topic",
      topic,
    );
  }

  return `/find-a-tutor?${params.toString()}`;
}

export function learningHubIndexTutoringHref() {
  return tutoringHref({
    kind: "hub",
  });
}

export function learningHubCategoryTutoringHref(
  slug: string,
  name: string,
) {
  const subject =
    inferSubject(
      `${slug} ${name}`,
    );

  return tutoringHref({
    kind: "category",
    slug,
    subject,
  });
}

export function learningHubResourceTutoringHref(
  resource:
    LearningHubResourceLike,
) {
  const subject =
    inferSubject(
      [
        resource.category,
        resource.slug,
        resource.title,
      ].join(" "),
    );

  return tutoringHref({
    kind: "resource",
    slug: resource.slug,
    subject,
    topic: resource.title,
  });
}
