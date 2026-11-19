export type ResourceSection = {
  heading: string;
  body: string[];
  bullets?: string[];
  note?: string;
};

export type ResourceLink = {
  label: string;
  href: string;
};

export type ResourceCategory = {
  slug: string;
  name: string;
  description: string;
  subjectHref?: string;
  tutoringHref?: string;
  tutoringLabel?: string;
};

export type Resource = {
  slug: string;
  title: string;
  category: string;
  categorySlug: string;
  description: string;
  readTime: string;
  level: string;
  subjectSlugs: string[];
  keywords: string[];
  takeaways: string[];
  sections: ResourceSection[];
  tutoringLinks: ResourceLink[];
  relatedSlugs?: string[];
  publishedAt?: string;
  updatedAt?: string;
  featured?: boolean;
};

export const resourceCategories: ResourceCategory[] = [
  {
    slug: "statistics",
    name: "Statistics",
    description: "Core statistical reasoning, inference, regression, correlation and model interpretation for university and research learners.",
    subjectHref: "/subjects/statistics",
    tutoringHref: "/tutoring/statistics-tutor-online",
    tutoringLabel: "Statistics tutoring",
  },
  {
    slug: "medical-statistics",
    name: "Medical Statistics",
    description: "Survival analysis, diagnostic accuracy, missing data and applied statistical reasoning for health and medical research.",
    subjectHref: "/subjects/statistics",
    tutoringHref: "/tutoring/medical-statistics-tutor",
    tutoringLabel: "Medical statistics tutoring",
  },
  {
    slug: "r-programming",
    name: "R & Statistical Programming",
    description: "Practical R workflows that connect code to statistical reasoning rather than treating software output as the analysis itself.",
    subjectHref: "/subjects/data-science",
    tutoringHref: "/tutoring/r-statistics-tutor",
    tutoringLabel: "R statistics tutoring",
  },
  {
    slug: "spss",
    name: "SPSS",
    description: "Step-by-step guidance for running, checking and interpreting common analyses in SPSS.",
    subjectHref: "/subjects/statistics",
    tutoringHref: "/tutoring/spss-tutor",
    tutoringLabel: "SPSS tutoring",
  },
  {
    slug: "econometrics",
    name: "Econometrics",
    description: "Regression assumptions, interpretation and model reasoning for economics, finance and quantitative social-science courses.",
    subjectHref: "/subjects/statistics",
    tutoringHref: "/tutoring/econometrics-tutor",
    tutoringLabel: "Econometrics tutoring",
  },
  {
    slug: "data-science",
    name: "Data Science",
    description: "Reproducible data workflows, model evaluation and practical reasoning for Python, R and machine-learning projects.",
    subjectHref: "/subjects/data-science",
    tutoringHref: "/tutoring/data-science-tutor",
    tutoringLabel: "Data science tutoring",
  },
  {
    slug: "bioinformatics",
    name: "Bioinformatics",
    description: "Genomics and omics workflows with emphasis on quality control, modelling choices and biological interpretation.",
    subjectHref: "/subjects/bioinformatics",
    tutoringHref: "/subjects/bioinformatics",
    tutoringLabel: "Bioinformatics tutoring",
  },
  {
    slug: "research-methods",
    name: "Research Methods",
    description: "Study design, analysis planning, dissertations and reproducible research from question formulation to interpretation.",
    subjectHref: "/subjects/research-methods",
    tutoringHref: "/tutoring/research-methods-tutor",
    tutoringLabel: "Research methods tutoring",
  },
  {
    slug: "mathematics",
    name: "Mathematics",
    description: "Clear explanations of mathematical ideas that support statistics, science and quantitative problem-solving.",
    subjectHref: "/subjects/mathematics",
    tutoringHref: "/subjects/mathematics",
    tutoringLabel: "Mathematics tutoring",
  },
  {
    slug: "study-support",
    name: "Study Support",
    description: "Practical ways to use tutoring, practice and feedback more effectively without outsourcing your academic work.",
    tutoringHref: "/find-a-tutor",
    tutoringLabel: "Personalised tutoring",
  },
];

export const resources: Resource[] = [
  {
    slug: "understanding-p-values",
    title: "Understanding p-values without the common myths",
    category: "Statistics",
    categorySlug: "statistics",
    description: "A clear explanation of what a p-value does—and does not—tell you.",
    readTime: "6 min",
    level: "Undergraduate · Master's",
    subjectSlugs: ["statistics", "research-methods"],
    keywords: ["p-value", "hypothesis testing", "statistical significance", "inference"],
    takeaways: [
      "A p-value is calculated under an assumed null model; it is not the probability that the null hypothesis is true.",
      "Statistical significance does not tell you whether an effect is large or practically important.",
      "Interpret p-values alongside effect estimates, uncertainty, design and subject-matter context.",
    ],
    sections: [
      {
        heading: "What a p-value represents",
        body: [
          "A p-value describes how compatible the observed data are with a statistical model in which the null hypothesis is assumed to be true. More precisely, it measures how unusual the observed result—or something at least as extreme—would be if the assumptions used to calculate the test were correct.",
          "That wording matters. A p-value is conditional on the null model. It does not reverse the conditioning and tell you the probability that the null hypothesis is true after seeing the data.",
        ],
      },
      {
        heading: "Why context matters",
        body: [
          "A small p-value can occur with a very small effect in a large sample because the estimate is precise. A larger p-value can occur when an important effect is estimated imprecisely in a small sample. The p-value alone therefore does not tell you the size or importance of an effect.",
          "Good statistical interpretation combines the test result with an effect estimate, a confidence interval or other uncertainty measure, the design of the study and the real-world meaning of the effect.",
        ],
      },
      {
        heading: "A better question to ask",
        body: [
          "Instead of asking only whether a result is statistically significant, ask what was estimated, how uncertain that estimate is, whether the assumptions are plausible and whether the magnitude would matter in the context of the problem.",
          "This shift turns hypothesis testing from a binary label into part of a wider inferential argument.",
        ],
      },
    ],
    tutoringLinks: [
      { label: "Online statistics tutoring", href: "/tutoring/statistics-tutor-online" },
      { label: "Research methods tutoring", href: "/tutoring/research-methods-tutor" },
    ],
    relatedSlugs: ["confidence-intervals", "how-to-choose-statistical-test", "independent-vs-paired-t-test"],
    featured: true,
  },
  {
    slug: "confidence-intervals",
    title: "Confidence intervals: estimate, uncertainty and interpretation",
    category: "Statistics",
    categorySlug: "statistics",
    description: "How to read a confidence interval without treating it as a simple significance label.",
    readTime: "6 min",
    level: "Undergraduate · Master's",
    subjectSlugs: ["statistics", "research-methods"],
    keywords: ["confidence interval", "standard error", "uncertainty", "effect estimate"],
    takeaways: [
      "Start with the effect estimate, then use the interval to judge precision and plausible values.",
      "A wide interval signals substantial uncertainty even if the point estimate looks large.",
      "Do not reduce every interval to whether it includes a null value.",
    ],
    sections: [
      { heading: "Start with the estimate", body: ["A confidence interval is built around an estimated quantity such as a mean difference, regression coefficient or risk ratio. The estimate tells you the central value supported by the sample, while the interval communicates uncertainty around it.", "The interval is most useful when you read the estimate and the range together. A large point estimate with a very wide interval tells a different story from the same point estimate with a narrow interval."] },
      { heading: "Width matters", body: ["Narrower intervals generally indicate more precise estimation; wider intervals indicate greater uncertainty. Sample size, outcome variability, model structure and study design all affect precision.", "Precision should not be confused with validity. A very narrow interval can still be misleading if the study design, measurement or model is badly biased."] },
      { heading: "Do not stop at whether zero is inside", body: ["For differences and regression coefficients, whether an interval contains zero relates to a conventional two-sided hypothesis test at a corresponding significance level. For ratios, the comparable null value is usually one.", "But interpretation should still consider the magnitude and practical meaning of the values inside the interval. Ask which effects remain plausible and whether those effects would change your scientific or practical conclusion."] },
    ],
    tutoringLinks: [{ label: "Statistics tutoring", href: "/tutoring/statistics-tutor-online" }],
    relatedSlugs: ["understanding-p-values", "sampling-distribution-mean", "multiple-linear-regression"],
    featured: true,
  },
  {
    slug: "sampling-distribution-mean",
    title: "Sampling distributions of the mean: the idea behind standard errors",
    category: "Statistics",
    categorySlug: "statistics",
    description: "Understand why sample means vary and how that leads to standard errors and inference.",
    readTime: "7 min",
    level: "Foundation · Undergraduate",
    subjectSlugs: ["statistics", "mathematics"],
    keywords: ["sampling distribution", "standard error", "sample mean", "central limit theorem"],
    takeaways: ["Statistics vary from sample to sample.", "The standard error describes the typical sampling variability of an estimator.", "Larger samples usually reduce the standard error of the mean."],
    sections: [
      { heading: "Imagine repeated samples", body: ["Take many random samples of the same size from the same population and calculate the mean of each sample. Those sample means will not all be identical. Their distribution is the sampling distribution of the mean.", "The sampling distribution is a conceptual repeated-sampling distribution. In a real study you normally observe one sample, but the repeated-sampling idea helps explain uncertainty in the estimate you obtained."] },
      { heading: "The standard error", body: ["The standard deviation of the sampling distribution is the standard error. When observations are independent and the population standard deviation is σ, the standard error of the sample mean is σ divided by the square root of n.", "In practice σ is often unknown and is estimated using the sample standard deviation, leading to an estimated standard error."] },
      { heading: "Why larger samples help", body: ["As n increases, the standard error decreases at a square-root rate. That means the sample mean tends to vary less from sample to sample, giving more precise estimation of the population mean.", "Doubling a sample size does not halve the standard error. To halve it, the sample size must be multiplied by four, all else equal."] },
    ],
    tutoringLinks: [{ label: "Statistics tutoring", href: "/tutoring/statistics-tutor-online" }],
    relatedSlugs: ["confidence-intervals", "normal-distribution-z-scores", "sample-size-power-basics"],
  },
  {
    slug: "logistic-regression-odds-ratios",
    title: "Logistic regression odds ratios explained",
    category: "Statistics",
    categorySlug: "statistics",
    description: "How coefficients become odds ratios and how to interpret them carefully.",
    readTime: "7 min",
    level: "Undergraduate · Master's",
    subjectSlugs: ["statistics", "data-science"],
    keywords: ["logistic regression", "odds ratio", "binary outcome", "log odds"],
    takeaways: ["Logistic regression models log-odds rather than probabilities directly.", "Exponentiating a coefficient gives an odds ratio for a one-unit predictor change.", "Odds ratios and risk ratios are not interchangeable, especially for common outcomes."],
    sections: [
      { heading: "From log-odds to odds ratios", body: ["Logistic regression models the log-odds of a binary outcome as a linear combination of predictors. A coefficient therefore represents a change on the log-odds scale.", "Exponentiating a coefficient converts it to an odds ratio, which is often easier to communicate. The interpretation should state the predictor change and what variables are being held constant in an adjusted model."] },
      { heading: "A simple example", body: ["If exp(β)=1.50 for a predictor, the model says that a one-unit increase in that predictor is associated with 50% higher odds of the outcome, holding the other variables in the model constant.", "If exp(β)=0.70, the odds are 30% lower for a one-unit increase. The wording should remain about odds unless you have transformed the model output into another effect measure."] },
      { heading: "Avoid a common mistake", body: ["An odds ratio is not automatically the same as a risk ratio. When outcomes are uncommon, the numbers can be similar; when outcomes are common, the difference can be substantial.", "For communication, it can be useful to supplement odds ratios with predicted probabilities for representative cases, provided the model is appropriate for that purpose."] },
    ],
    tutoringLinks: [{ label: "Statistics tutoring", href: "/tutoring/statistics-tutor-online" }, { label: "R statistics tutoring", href: "/tutoring/r-statistics-tutor" }],
    relatedSlugs: ["logistic-regression-in-r", "sensitivity-specificity-ppv-npv", "multiple-linear-regression"],
  },
  {
    slug: "linear-regression-slope",
    title: "Linear regression: what the slope actually means",
    category: "Statistics",
    categorySlug: "statistics",
    description: "Move beyond the formula and interpret a regression coefficient in context.",
    readTime: "6 min",
    level: "Foundation · Undergraduate",
    subjectSlugs: ["statistics", "data-science"],
    keywords: ["linear regression", "slope", "regression coefficient", "interpretation"],
    takeaways: ["A slope is an expected outcome change per one-unit predictor increase.", "Always state units and adjustment context.", "Regression association is not automatically causal."],
    sections: [
      { heading: "The basic model", body: ["In simple linear regression, the expected outcome is represented as an intercept plus a slope multiplied by the predictor. The slope describes the expected change in the outcome for a one-unit increase in the predictor.", "The intercept is the expected outcome when the predictor equals zero. Whether that has a useful interpretation depends on whether zero is meaningful and within the observed range."] },
      { heading: "Interpret with units", body: ["A coefficient becomes much clearer when you state the units. For example, a slope of 2.4 could mean an expected 2.4-point increase in an outcome for every additional hour of study, depending on how the variables were measured.", "In multiple regression, add the phrase 'holding the other variables in the model constant' when that accurately describes the coefficient you are interpreting."] },
      { heading: "Association is not automatically causation", body: ["Regression can describe adjusted or unadjusted associations, but a causal interpretation requires stronger assumptions about design, confounding, measurement and the data-generating process.", "A model can be technically well fitted and still answer the wrong scientific question, so interpretation begins with the research question rather than the software output."] },
    ],
    tutoringLinks: [{ label: "Statistics tutoring", href: "/tutoring/statistics-tutor-online" }],
    relatedSlugs: ["multiple-linear-regression", "regression-assumptions-diagnostics", "interpreting-r-squared"],
  },
  {
    slug: "cox-proportional-hazards",
    title: "Cox proportional hazards: what the assumption really means",
    category: "Medical Statistics",
    categorySlug: "medical-statistics",
    description: "An intuitive introduction to hazards, hazard ratios and proportionality.",
    readTime: "8 min",
    level: "Master's · Research",
    subjectSlugs: ["statistics", "research-methods"],
    keywords: ["Cox regression", "proportional hazards", "hazard ratio", "survival analysis"],
    takeaways: ["The Cox model compares instantaneous event rates through hazard ratios.", "Proportional hazards means the modeled hazard ratio does not systematically change over follow-up unless time-varying effects are included.", "Diagnostics should be interpreted alongside plots, follow-up patterns and subject-matter knowledge."],
    sections: [
      { heading: "What the model compares", body: ["The Cox model compares instantaneous event rates between individuals or groups while allowing the baseline hazard to remain unspecified. This makes it a flexible model for time-to-event outcomes.", "The hazard is not the same as a probability. It is an instantaneous rate conditional on being event-free up to that time."] },
      { heading: "The proportional hazards assumption", body: ["The model assumes that covariate effects act multiplicatively on the hazard and remain proportional over follow-up unless time-varying effects are included.", "For a binary exposure, a constant hazard ratio means the relative hazard between the two groups is assumed to remain the same over time, even though the baseline hazard itself may change."] },
      { heading: "Checking the assumption", body: ["Schoenfeld-residual-based diagnostics are commonly used to investigate whether covariate effects appear to vary systematically with time. Graphical checks and subject-matter reasoning are also valuable.", "A statistically detectable deviation does not automatically tell you how important the violation is. Consider the size and pattern of time variation and whether a time-varying effect or alternative model would answer the research question better."] },
    ],
    tutoringLinks: [{ label: "Medical statistics tutoring", href: "/tutoring/medical-statistics-tutor" }],
    relatedSlugs: ["kaplan-meier-survival-curves", "hazard-ratio-vs-risk-ratio", "missing-data-mcar-mar-mnar"],
    featured: true,
  },
  {
    slug: "chain-rule-calculus",
    title: "The chain rule: a practical way to recognise it",
    category: "Mathematics",
    categorySlug: "mathematics",
    description: "Learn how to spot nested functions and differentiate them step by step.",
    readTime: "5 min",
    level: "School · Undergraduate",
    subjectSlugs: ["mathematics"],
    keywords: ["chain rule", "calculus", "differentiation", "nested functions"],
    takeaways: ["Use the chain rule when one function is composed inside another.", "Differentiate the outside function first, keep the inside expression, then multiply by the derivative of the inside.", "Identifying the inner expression before differentiating reduces mistakes."],
    sections: [
      { heading: "The core idea", body: ["Use the chain rule when one function is applied inside another function. A useful verbal pattern is: differentiate the outside, keep the inside, then multiply by the derivative of the inside.", "This is a rule for composition. If y=f(g(x)), then dy/dx=f'(g(x))g'(x)."] },
      { heading: "Worked example", body: ["For y=(3x²+1)^5, differentiate the outside first: 5(3x²+1)^4. Then multiply by the derivative of the inside, 6x. The derivative is 30x(3x²+1)^4.", "The same structure appears with exponentials, logarithms and trigonometric functions whenever their input is itself a function of x."] },
      { heading: "How to practise", body: ["Start by circling the inner expression. Then identify the outer operation. This makes the chain structure much easier to see.", "After differentiating, check whether every nested layer has contributed a derivative factor. Missing the derivative of an inner layer is one of the most common chain-rule errors."] },
    ],
    tutoringLinks: [{ label: "Mathematics tutoring", href: "/subjects/mathematics" }],
  },
  {
    slug: "normal-distribution-z-scores",
    title: "Normal distributions and z-scores: from raw values to relative position",
    category: "Statistics",
    categorySlug: "statistics",
    description: "Understand standardisation and how a z-score locates a value relative to a mean.",
    readTime: "6 min",
    level: "Foundation · Undergraduate",
    subjectSlugs: ["statistics", "mathematics"],
    keywords: ["normal distribution", "z-score", "standardisation", "probability"],
    takeaways: ["A z-score expresses a value in standard-deviation units relative to the mean.", "Positive z-scores are above the mean and negative values are below it.", "A z-score becomes a probability only after you connect it to an appropriate reference distribution."],
    sections: [
      { heading: "Why standardise?", body: ["Raw scores from different scales are hard to compare directly. A z-score expresses a value in standard-deviation units relative to the mean.", "Standardisation is especially useful when a normal model is appropriate and you want to connect raw values to areas under the standard normal curve."] },
      { heading: "The calculation", body: ["For a value x, mean μ and standard deviation σ, the z-score is (x−μ)/σ. A positive z-score lies above the mean and a negative z-score lies below it.", "The numerator tells you the distance from the mean; dividing by the standard deviation expresses that distance in a common unit."] },
      { heading: "Interpreting the number", body: ["A z-score of 1.5 means the observation is 1.5 standard deviations above the mean. The score does not by itself tell you a probability until it is connected to a distributional assumption or reference table.", "In sampling problems, be careful to distinguish the standard deviation of individual observations from the standard error of a sample mean."] },
    ],
    tutoringLinks: [{ label: "Statistics tutoring", href: "/tutoring/statistics-tutor-online" }],
    relatedSlugs: ["sampling-distribution-mean", "confidence-intervals"],
  },
  {
    slug: "python-data-analysis-workflow",
    title: "A sensible Python data-analysis workflow",
    category: "Data Science",
    categorySlug: "data-science",
    description: "A practical sequence from understanding the data to modelling and communication.",
    readTime: "7 min",
    level: "Undergraduate · Master's",
    subjectSlugs: ["data-science", "computer-science"],
    keywords: ["Python data analysis", "pandas", "data workflow", "reproducibility"],
    takeaways: ["Understand the unit of analysis before transforming data.", "Separate import, cleaning, exploration, modelling, diagnostics and output.", "A successful code run does not prove that the analysis is appropriate."],
    sections: [
      { heading: "Understand before transforming", body: ["Start by identifying what each row and column represents, the unit of analysis, variable types, missingness and any obvious data-quality issues. Code should follow the data-generating context, not replace it.", "Write down the outcome, predictors and key identifiers before you start a long sequence of transformations. This makes it easier to notice accidental duplication, aggregation or filtering."] },
      { heading: "Separate stages of the workflow", body: ["A reproducible workflow usually separates import, cleaning, exploration, modelling, diagnostics and output. This makes errors easier to find and the analysis easier to explain.", "Save raw data separately from processed data and make the processing code reproducible. Avoid hand-editing values in a spreadsheet when the same transformation can be documented in code."] },
      { heading: "Keep interpretation close to the model", body: ["A fitted model is only useful if you understand its assumptions, variables and output. Avoid treating a successful code run as proof that the analysis is appropriate.", "Record why the model was chosen, what diagnostics were checked and what limitations remain. That reasoning is often more important than the exact syntax used to fit the model."] },
    ],
    tutoringLinks: [{ label: "Data science tutoring", href: "/tutoring/data-science-tutor" }],
    relatedSlugs: ["cross-validation-train-test-split", "multiple-linear-regression"],
  },
  {
    slug: "rna-seq-workflow",
    title: "RNA-seq analysis: the workflow before differential expression",
    category: "Bioinformatics",
    categorySlug: "bioinformatics",
    description: "Why quality control, filtering and experimental design come before a volcano plot.",
    readTime: "8 min",
    level: "Master's · Research",
    subjectSlugs: ["bioinformatics", "data-science"],
    keywords: ["RNA-seq", "differential expression", "quality control", "experimental design"],
    takeaways: ["Experimental design determines what comparisons are defensible.", "Quality control should happen before differential-expression testing.", "Effect sizes and biological context matter alongside adjusted p-values."],
    sections: [
      { heading: "Begin with the design", body: ["Before modelling expression, understand samples, groups, replicates, covariates, pairing and batch structure. A statistical model cannot rescue a misunderstood experiment.", "Write down the biological comparison you want to estimate and identify which sample-level variables could confound or explain expression differences."] },
      { heading: "Quality control first", body: ["Inspect library sizes, sample relationships, outliers and major sources of variation before differential-expression testing.", "Principal component plots, sample-to-sample distances and count summaries can reveal unexpected grouping, technical problems or mislabeled samples that should be investigated rather than automatically removed."] },
      { heading: "Interpretation is the final stage", body: ["Differential expression is not simply a list of low p-values. Effect sizes, uncertainty, multiple-testing control, biological plausibility and downstream validation all matter.", "A useful result connects the statistical contrast back to the experiment: which groups were compared, what covariates were controlled, and what biological question the change in expression helps answer."] },
    ],
    tutoringLinks: [{ label: "Bioinformatics tutoring", href: "/subjects/bioinformatics" }],
    relatedSlugs: ["deseq2-differential-expression", "cross-validation-train-test-split"],
    featured: true,
  },
  {
    slug: "research-question-to-analysis",
    title: "From research question to analysis plan",
    category: "Research Methods",
    categorySlug: "research-methods",
    description: "A practical framework for moving from a broad question to variables, design and method.",
    readTime: "7 min",
    level: "Undergraduate · Master's · Research",
    subjectSlugs: ["research-methods", "statistics"],
    keywords: ["analysis plan", "research question", "study design", "methodology"],
    takeaways: ["Start with a precise question, not a favourite statistical test.", "Let the study design and data structure constrain the method.", "Decide which estimand or quantity will answer the question before producing output."],
    sections: [
      { heading: "Define the question first", body: ["An analysis plan should begin with a clear research question, not with a favourite statistical test. Specify the population, variables or exposures, outcome and the comparison or relationship of interest.", "If the question is vague, the analysis usually becomes a sequence of disconnected tests. A precise question makes it easier to decide what should be estimated and which data are actually needed."] },
      { heading: "Let the design constrain the method", body: ["Cross-sectional, longitudinal, experimental and time-to-event data create different analytical structures. Repeated observations, clustering and censoring are examples of features that change what methods are appropriate.", "The same variable names can require different models under different designs, so method selection should follow the way the data were generated."] },
      { heading: "Plan interpretation as well as estimation", body: ["Decide in advance what quantities you want to estimate and how they answer the research question. This helps avoid producing a large collection of outputs with no clear inferential purpose.", "Also plan sensitivity analyses, missing-data handling and the assumptions you will need to discuss. A good analysis plan anticipates interpretation, not just software commands."] },
    ],
    tutoringLinks: [{ label: "Research methods tutoring", href: "/tutoring/research-methods-tutor" }, { label: "Dissertation statistics support", href: "/tutoring/dissertation-statistics-support" }],
    relatedSlugs: ["dissertation-statistical-analysis-plan", "how-to-choose-statistical-test", "missing-data-mcar-mar-mnar"],
  },
  {
    slug: "choosing-statistics-tutor",
    title: "How to get more from statistics tutoring",
    category: "Study Support",
    categorySlug: "study-support",
    description: "What to bring to a session and how to turn one explanation into lasting understanding.",
    readTime: "5 min",
    level: "All levels",
    subjectSlugs: ["statistics"],
    keywords: ["statistics tutor", "study support", "one-to-one tutoring", "statistics help"],
    takeaways: ["Bring the real module context and notation.", "Ask why the method works, not only which buttons to press.", "Finish each session with independent practice."],
    sections: [
      { heading: "Bring the real academic context", body: ["Share the module outline, notation, software and type of questions you are being asked. Statistics is easier to teach well when the tutor understands how the method appears in your course.", "A useful session can then distinguish between what your course expects you to calculate by hand, what it expects you to interpret and what can be delegated to software."] },
      { heading: "Ask about the why, not only the how", body: ["Do not stop once the software produces output. Ask why the method is suitable, what assumptions matter, what each quantity means and what would make the conclusion change.", "Understanding the reasoning makes it easier to transfer the method to a new dataset or exam question rather than memorising one procedure."] },
      { heading: "Leave with something to practise", body: ["A strong session should end with a small independent task or fresh example that tests whether you can reproduce the reasoning without prompts.", "Review that task before the next session and bring back the exact step where the reasoning broke down. That turns tutoring into a learning cycle rather than a one-off explanation."] },
    ],
    tutoringLinks: [{ label: "Find a statistics tutor", href: "/tutoring/statistics-tutor-online" }],
  },

  // -------------------------------------------------------------------------
  // Flagship learning guides added in the content-engine expansion.
  // -------------------------------------------------------------------------
  {
    slug: "how-to-choose-statistical-test",
    title: "How to choose a statistical test: start with the question, not the menu",
    category: "Statistics",
    categorySlug: "statistics",
    description: "A decision framework for choosing between common tests by outcome type, comparison, design and assumptions.",
    readTime: "10 min",
    level: "Undergraduate · Master's",
    subjectSlugs: ["statistics", "research-methods"],
    keywords: ["choose statistical test", "statistical test selection", "t-test", "ANOVA", "chi-square", "regression"],
    takeaways: [
      "Identify the outcome, predictor or grouping variable and the exact question before naming a test.",
      "Paired, repeated or clustered data require methods that respect dependence between observations.",
      "Assumptions and estimands matter more than matching variable types to a memorised flowchart.",
      "Regression often provides a more flexible framework than a collection of separate tests.",
    ],
    sections: [
      {
        heading: "Step 1: define what you are trying to estimate",
        body: [
          "Before choosing a test, write the research question as a comparison or relationship. Are you comparing two group means, estimating an association between two continuous variables, comparing proportions, modelling a binary outcome, or studying time until an event?",
          "This step prevents a common mistake: choosing a method because its name appears in a lecture rather than because it estimates the quantity your question needs.",
        ],
        bullets: [
          "Continuous outcome: mean differences or regression coefficients may be natural targets.",
          "Binary outcome: proportions, odds, risks or predicted probabilities may be relevant.",
          "Count outcome: rates or count models may be more appropriate than ordinary linear regression.",
          "Time-to-event outcome: censoring usually requires survival-analysis methods.",
        ],
      },
      {
        heading: "Step 2: check whether observations are independent",
        body: [
          "Two datasets can contain the same variables but require different methods because of the design. If the same participant is measured twice, the observations are paired. If students are nested within schools, observations may be clustered. Repeated measures over time create within-person dependence.",
          "Ignoring dependence usually makes the uncertainty calculation wrong, even if the estimated mean or proportion looks sensible.",
        ],
        note: "A paired t-test and an independent-samples t-test answer similar-looking questions but use different information because the data structure is different.",
      },
      {
        heading: "Step 3: use common methods as starting points, not automatic rules",
        body: [
          "For two independent groups and a continuous outcome, a two-sample t-test or linear regression may be appropriate. For paired continuous measurements, a paired t-test or a repeated-measures model may be more appropriate. For several groups, ANOVA is closely related to linear regression with categorical predictors.",
          "For two categorical variables, a chi-square test can assess association when expected counts are adequate. For a binary outcome with predictors, logistic regression often gives a more informative adjusted analysis.",
        ],
      },
      {
        heading: "Step 4: check assumptions and reporting needs",
        body: [
          "Assumptions should be connected to the model and the inferential quantity. For example, a t-test is more robust to moderate non-normality than many students expect, especially with reasonable sample sizes, but severe skew, extreme outliers or very small samples can still matter.",
          "Also ask what you need to report. If you need an adjusted effect estimate with confidence intervals, regression may be preferable to a simple unadjusted test even when both are mathematically related.",
        ],
      },
    ],
    tutoringLinks: [{ label: "Statistics tutor online", href: "/tutoring/statistics-tutor-online" }, { label: "Dissertation statistics support", href: "/tutoring/dissertation-statistics-support" }],
    relatedSlugs: ["independent-vs-paired-t-test", "anova-explained", "research-question-to-analysis"],
    publishedAt: "2026-11-19",
    updatedAt: "2026-11-19",
    featured: true,
  },
  {
    slug: "independent-vs-paired-t-test",
    title: "Independent vs paired t-test: how to tell which one your design needs",
    category: "Statistics",
    categorySlug: "statistics",
    description: "Understand the design difference between independent groups and paired measurements before choosing a t-test.",
    readTime: "8 min",
    level: "Foundation · Undergraduate",
    subjectSlugs: ["statistics"],
    keywords: ["independent t-test", "paired t-test", "two sample t-test", "before after"],
    takeaways: ["Use an independent t-test for two unrelated groups.", "Use a paired t-test when each observation has a meaningful partner.", "The paired analysis works on within-pair differences and can remove between-person variability."],
    sections: [
      { heading: "The question may look the same, but the data structure is different", body: ["Both tests can compare two means, but they make different assumptions about the relationship between observations. An independent-samples t-test treats observations in one group as unrelated to observations in the other group. A paired t-test explicitly uses one-to-one pairing.", "Typical paired designs include before-and-after measurements on the same people, matched case-control pairs, or twins where the pairing is part of the design."] },
      { heading: "What the paired t-test actually tests", body: ["For each pair, calculate the difference between the two measurements. The paired t-test is then essentially a one-sample t-test on those differences, asking whether the mean difference is compatible with zero under the null hypothesis.", "That is why the assumptions concern the distribution of the differences rather than the two raw measurement distributions separately."] },
      { heading: "Why pairing can improve precision", body: ["When paired measurements are strongly positively correlated, subtracting within pairs removes some between-person variability. This can make the estimated mean change more precise than analysing the measurements as if they came from unrelated groups.", "But pairing only helps when the pairing is real and meaningful. You cannot manufacture pairing by sorting two independent groups and matching observations after the fact."] },
      { heading: "A quick decision check", body: ["Ask whether one observation in group A naturally belongs with exactly one observation in group B. If yes, and that pairing is part of the design, a paired analysis is likely relevant. If the groups contain different unrelated participants, use an independent-group approach."] },
    ],
    tutoringLinks: [{ label: "Statistics tutoring", href: "/tutoring/statistics-tutor-online" }],
    relatedSlugs: ["how-to-choose-statistical-test", "anova-explained", "confidence-intervals"],
    publishedAt: "2026-11-19",
    updatedAt: "2026-11-19",
  },
  {
    slug: "anova-explained",
    title: "ANOVA explained: what the F-test is comparing",
    category: "Statistics",
    categorySlug: "statistics",
    description: "Build an intuitive understanding of one-way ANOVA, the F-statistic and what to do after an overall test.",
    readTime: "9 min",
    level: "Undergraduate",
    subjectSlugs: ["statistics"],
    keywords: ["ANOVA", "F test", "one way ANOVA", "post hoc tests", "group means"],
    takeaways: ["One-way ANOVA tests whether a set of group means can all be equal under the model.", "The F-statistic compares between-group variation with within-group variation.", "A significant overall test does not by itself tell you which groups differ."],
    sections: [
      { heading: "Why not run many t-tests?", body: ["If you have three or more groups, repeatedly testing every pair at the same nominal significance level increases the chance of at least one false positive across the collection of tests. One-way ANOVA provides a single overall test of the hypothesis that all group means are equal.", "ANOVA does not mean 'analysis without effect sizes'. You should still describe group means, uncertainty and the magnitude of differences that matter."] },
      { heading: "The logic of the F-statistic", body: ["ANOVA decomposes variability into variation associated with differences between group means and residual variation within groups. The F-statistic is a ratio of mean-square quantities derived from these sources.", "If the group means are very similar relative to the variability within groups, the F-statistic tends to be closer to one. Larger ratios provide evidence against the model in which all group means are equal."] },
      { heading: "What happens after the overall test", body: ["If the overall test suggests that not all means are equal, you still need a principled way to identify the differences of interest. Pre-specified contrasts can test scientifically meaningful comparisons. Post-hoc procedures such as Tukey's method can control family-wise error when exploring many pairwise comparisons.", "Do not let the post-hoc menu replace the research question. A small number of planned contrasts is often clearer than testing every possible pair."] },
      { heading: "ANOVA and regression are close relatives", body: ["A one-way ANOVA can be represented as a linear regression with a categorical predictor coded using indicator variables. This connection becomes useful when you later add continuous covariates, interactions or more complex designs."] },
    ],
    tutoringLinks: [{ label: "Statistics tutoring", href: "/tutoring/statistics-tutor-online" }],
    relatedSlugs: ["how-to-choose-statistical-test", "independent-vs-paired-t-test", "multiple-linear-regression"],
    publishedAt: "2026-11-19",
    updatedAt: "2026-11-19",
  },
  {
    slug: "pearson-vs-spearman",
    title: "Pearson vs Spearman correlation: choose based on the relationship you want to measure",
    category: "Statistics",
    categorySlug: "statistics",
    description: "Compare Pearson correlation with Spearman rank correlation without reducing the decision to a normality checkbox.",
    readTime: "8 min",
    level: "Undergraduate · Master's",
    subjectSlugs: ["statistics", "data-science"],
    keywords: ["Pearson correlation", "Spearman correlation", "correlation coefficient", "rank correlation"],
    takeaways: ["Pearson correlation measures linear association on the original scale.", "Spearman correlation measures monotonic association using ranks.", "A scatterplot should usually come before either coefficient."],
    sections: [
      { heading: "Start with the shape of the relationship", body: ["Pearson's correlation coefficient summarises the strength and direction of a linear relationship between two variables. Spearman's rank correlation summarises monotonic association: as one variable increases, the other tends to consistently increase or decrease, even if the relationship is curved.", "A scatterplot is therefore more informative than choosing a coefficient from variable labels alone."] },
      { heading: "Why outliers matter", body: ["Pearson correlation uses the original numerical values and can be strongly affected by extreme observations. Spearman correlation replaces values with ranks, which can reduce the influence of extreme magnitudes, although unusual observations can still change the rank pattern.", "Do not switch automatically to Spearman because you see one outlier. First investigate whether the observation is an error, a genuine influential case or evidence that the relationship is not well summarised by one coefficient."] },
      { heading: "Correlation is not agreement or causation", body: ["A high correlation does not mean two measurement methods agree numerically, and it does not establish a causal relationship. Two variables can be strongly correlated because of confounding, shared trends or selection mechanisms.", "Use correlation to answer a narrow descriptive question about association, then choose a model that matches the wider scientific question if adjustment or prediction is needed."] },
    ],
    tutoringLinks: [{ label: "Statistics tutoring", href: "/tutoring/statistics-tutor-online" }, { label: "SPSS tutoring", href: "/tutoring/spss-tutor" }],
    relatedSlugs: ["how-to-choose-statistical-test", "linear-regression-slope", "spss-linear-regression"],
    publishedAt: "2026-11-19",
    updatedAt: "2026-11-19",
  },
  {
    slug: "multiple-linear-regression",
    title: "Multiple linear regression: what an adjusted coefficient means",
    category: "Statistics",
    categorySlug: "statistics",
    description: "Interpret multiple-regression coefficients, adjustment and model comparisons in a way that matches the research question.",
    readTime: "10 min",
    level: "Undergraduate · Master's",
    subjectSlugs: ["statistics", "data-science", "research-methods"],
    keywords: ["multiple linear regression", "adjusted coefficient", "confounding", "regression interpretation"],
    takeaways: ["Each coefficient is conditional on the other predictors included in the model.", "Adjustment can change a coefficient because predictors share information about the outcome and each other.", "Adding variables is not automatically better; the model should be motivated by the analytical goal."],
    sections: [
      { heading: "From one predictor to several", body: ["Multiple linear regression extends the simple linear model by including several predictors at once. The model estimates the expected outcome as a linear combination of those predictors.", "For a continuous predictor, its coefficient is the expected change in the outcome for a one-unit increase in that predictor, holding the other model predictors constant. For categorical predictors, coefficients usually compare categories with a chosen reference group."] },
      { heading: "What adjustment is doing", body: ["Suppose age and physical activity are both related to an outcome and are also related to each other. A coefficient for physical activity in a model that includes age describes the association after accounting for the age information represented in the model.", "That does not automatically make the coefficient causal. Confounding control requires assumptions about which variables should be adjusted for and how they are measured."] },
      { heading: "Do not add every available variable", body: ["Including variables purely because they are available can reduce interpretability, amplify measurement problems or introduce bias if you condition on mediators or colliders. Predictor selection should follow the purpose of the model: explanation, causal estimation, prediction or another goal.", "For prediction, model complexity is often judged using validation performance. For causal or explanatory analyses, subject-matter reasoning about the data-generating process is central."] },
      { heading: "Interpret the model as a whole", body: ["Alongside coefficients, inspect residuals, influential observations, non-linearity, interaction terms where relevant and the range over which predictions are being made. A coefficient table is only one part of model evaluation."] },
    ],
    tutoringLinks: [{ label: "Statistics tutoring", href: "/tutoring/statistics-tutor-online" }, { label: "R statistics tutoring", href: "/tutoring/r-statistics-tutor" }],
    relatedSlugs: ["regression-assumptions-diagnostics", "interpreting-r-squared", "linear-regression-in-r"],
    publishedAt: "2026-11-19",
    updatedAt: "2026-11-19",
    featured: true,
  },
  {
    slug: "regression-assumptions-diagnostics",
    title: "Linear regression assumptions and diagnostics: what each check is for",
    category: "Statistics",
    categorySlug: "statistics",
    description: "Connect residual plots and common diagnostics to the assumptions they are actually investigating.",
    readTime: "11 min",
    level: "Undergraduate · Master's",
    subjectSlugs: ["statistics", "data-science"],
    keywords: ["regression assumptions", "residual plots", "heteroskedasticity", "linearity", "influential observations"],
    takeaways: ["Linearity is about the conditional mean structure, not whether every variable is normally distributed.", "Constant variance concerns the spread of residuals across fitted values or predictor levels.", "Normal residual assumptions are mainly relevant to some small-sample inference procedures, not to whether the fitted line exists.", "Influence diagnostics identify observations that can materially affect estimates."],
    sections: [
      { heading: "Linearity: is the mean structure adequately represented?", body: ["A linear regression model assumes that the expected outcome can be represented by the specified linear predictor. A residual-versus-fitted plot can reveal systematic curvature suggesting that the functional form is inadequate.", "Linearity does not mean every raw variable must have a straight-line relationship in every plot. Transformations, polynomial terms and splines can still be part of a linear model because the model is linear in its parameters."] },
      { heading: "Constant variance: is residual spread changing?", body: ["Homoskedasticity means the conditional variance of the errors is constant under the classical model. A fan-shaped residual plot may suggest heteroskedasticity, where residual variability changes across fitted values.", "Heteroskedasticity can affect conventional standard errors even if coefficient estimates remain useful. Depending on the goal, robust standard errors or a better variance/model specification may be appropriate."] },
      { heading: "Normality: understand what is supposed to be normal", body: ["The common normality assumption concerns model errors or residual behaviour for certain inferential results; it does not require predictors or the outcome to be marginally normal. With larger samples, coefficient inference can often be less sensitive to moderate departures than introductory rules imply.", "A Q-Q plot is usually more informative than a formal normality test on residuals, because tiny deviations can become statistically detectable in large samples without being practically important."] },
      { heading: "Influence and leverage", body: ["Some observations have unusual predictor combinations, large residuals or both. Leverage and influence diagnostics such as Cook's distance help identify observations whose removal could materially change fitted coefficients.", "The purpose is investigation, not automatic deletion. Check data quality, understand the case and consider whether the model should represent that part of the data space."] },
    ],
    tutoringLinks: [{ label: "Statistics tutoring", href: "/tutoring/statistics-tutor-online" }, { label: "Econometrics tutoring", href: "/tutoring/econometrics-tutor" }],
    relatedSlugs: ["multiple-linear-regression", "econometrics-ols-assumptions", "linear-regression-in-r"],
    publishedAt: "2026-11-19",
    updatedAt: "2026-11-19",
  },
  {
    slug: "interpreting-r-squared",
    title: "R-squared explained: useful summary, not a model-quality score",
    category: "Statistics",
    categorySlug: "statistics",
    description: "Understand what R-squared measures, why a high value can still accompany a poor model and when adjusted R-squared helps.",
    readTime: "7 min",
    level: "Undergraduate · Master's",
    subjectSlugs: ["statistics", "econometrics", "data-science"],
    keywords: ["R-squared", "adjusted R-squared", "regression fit", "coefficient of determination"],
    takeaways: ["R-squared describes the proportion of sample outcome variability accounted for by the fitted linear model.", "A high R-squared does not establish causality, good prediction or correct model assumptions.", "Adjusted R-squared penalises added predictors, but it is still only one model summary."],
    sections: [
      { heading: "What R-squared is measuring", body: ["In ordinary least squares regression with an intercept, R-squared compares the residual sum of squares from the fitted model with the total variation around the sample mean. Values closer to one indicate that the fitted values account for a larger proportion of the observed sample variation.", "The statistic is descriptive of model fit in that dataset. It does not tell you whether the model specification is scientifically sensible."] },
      { heading: "Why high can still be bad", body: ["A model can have a high R-squared because both variables trend strongly over time, because many flexible terms were added, or because the outcome is intrinsically predictable from the included variables. None of those facts alone demonstrate causality or out-of-sample performance.", "Residual diagnostics and validation may reveal problems that R-squared cannot see."] },
      { heading: "What adjusted R-squared changes", body: ["Ordinary R-squared cannot decrease when you add predictors to a least-squares model. Adjusted R-squared includes a penalty related to model size, so an unhelpful additional predictor can reduce it.", "That makes adjusted R-squared useful for some descriptive model comparisons, but it should not replace principled variable selection, validation or subject-matter reasoning."] },
    ],
    tutoringLinks: [{ label: "Statistics tutoring", href: "/tutoring/statistics-tutor-online" }, { label: "Econometrics tutoring", href: "/tutoring/econometrics-tutor" }],
    relatedSlugs: ["multiple-linear-regression", "regression-assumptions-diagnostics", "econometrics-ols-assumptions"],
    publishedAt: "2026-11-19",
    updatedAt: "2026-11-19",
  },
  {
    slug: "kaplan-meier-survival-curves",
    title: "Kaplan–Meier survival curves: how to read them correctly",
    category: "Medical Statistics",
    categorySlug: "medical-statistics",
    description: "Understand survival probabilities, censoring, risk sets and why visual separation is not the whole analysis.",
    readTime: "10 min",
    level: "Master's · Research",
    subjectSlugs: ["statistics", "research-methods"],
    keywords: ["Kaplan Meier", "survival curve", "censoring", "risk set", "log rank test"],
    takeaways: ["The Kaplan–Meier curve estimates the probability of remaining event-free beyond each time point.", "Censored observations contribute information up to the time they are censored.", "Risk-set size and uncertainty become increasingly important late in follow-up.", "A log-rank test and a Cox model answer related but different questions."],
    sections: [
      { heading: "What the curve estimates", body: ["The Kaplan–Meier estimator describes survival over time by multiplying conditional probabilities of surviving each observed event time. The curve changes at event times and remains flat between them.", "Here 'survival' can mean freedom from any defined event: death, relapse, device failure, discharge or another time-to-event outcome."] },
      { heading: "What censoring means on the plot", body: ["A censored participant has not had the event observed by the end of their available follow-up. They contribute to the risk set up to their censoring time and then stop contributing afterward.", "Standard Kaplan–Meier estimation relies on assumptions about the censoring mechanism. If censoring is strongly related to unobserved future event risk, interpretation can become problematic."] },
      { heading: "Why the number at risk matters", body: ["Late in follow-up, only a small number of participants may remain under observation. Large visual jumps or apparent group differences based on very few people should therefore be interpreted cautiously.", "Plots should ideally show numbers at risk and confidence intervals so the reader can see how much information supports each part of the curve."] },
      { heading: "Comparing groups", body: ["The log-rank test assesses whether survival experiences differ across groups under a weighting that is sensitive to differences over follow-up. A Cox model can estimate hazard ratios and incorporate covariates.", "If survival curves cross or effects vary over time, a single proportional-hazards summary may not capture the full pattern."] },
    ],
    tutoringLinks: [{ label: "Medical statistics tutoring", href: "/tutoring/medical-statistics-tutor" }],
    relatedSlugs: ["cox-proportional-hazards", "hazard-ratio-vs-risk-ratio", "missing-data-mcar-mar-mnar"],
    publishedAt: "2026-11-19",
    updatedAt: "2026-11-19",
    featured: true,
  },
  {
    slug: "hazard-ratio-vs-risk-ratio",
    title: "Hazard ratio vs risk ratio: why they answer different questions",
    category: "Medical Statistics",
    categorySlug: "medical-statistics",
    description: "Separate instantaneous event rates from cumulative risk before interpreting survival-analysis results.",
    readTime: "8 min",
    level: "Master's · Research",
    subjectSlugs: ["statistics", "research-methods"],
    keywords: ["hazard ratio", "risk ratio", "relative risk", "survival analysis"],
    takeaways: ["Risk compares cumulative event probabilities over a defined period.", "Hazard is an instantaneous event rate among those still at risk.", "A hazard ratio cannot generally be read as a percentage change in probability."],
    sections: [
      { heading: "Risk is a probability over a time window", body: ["A risk is the probability that an event occurs within a specified period. A risk ratio compares those probabilities between groups. For example, a 1-year risk ratio compares the probability of experiencing the event by one year.", "The time horizon is part of the estimand. A 30-day risk ratio and a 5-year risk ratio can tell different stories."] },
      { heading: "Hazard is an instantaneous rate", body: ["The hazard describes how quickly events are occurring at a particular time among people who have remained event-free up to that point. It is a rate-like quantity, not a probability.", "A hazard ratio compares those instantaneous hazards between groups. In a proportional-hazards model, that ratio is assumed constant over time unless the model allows it to vary."] },
      { heading: "Why the numbers are not interchangeable", body: ["A hazard ratio of 0.70 does not mean that the probability of the event is 30% lower at every time point. The relationship between hazards and cumulative risks depends on the baseline hazard and follow-up pattern.", "When communicating results, state the measure explicitly and consider showing absolute risks or survival probabilities at clinically meaningful times alongside a hazard ratio."] },
    ],
    tutoringLinks: [{ label: "Medical statistics tutoring", href: "/tutoring/medical-statistics-tutor" }],
    relatedSlugs: ["kaplan-meier-survival-curves", "cox-proportional-hazards", "sensitivity-specificity-ppv-npv"],
    publishedAt: "2026-11-19",
    updatedAt: "2026-11-19",
  },
  {
    slug: "sensitivity-specificity-ppv-npv",
    title: "Sensitivity, specificity, PPV and NPV: keep the conditioning straight",
    category: "Medical Statistics",
    categorySlug: "medical-statistics",
    description: "A practical framework for interpreting diagnostic accuracy without mixing up test properties and predictive values.",
    readTime: "9 min",
    level: "Undergraduate · Master's",
    subjectSlugs: ["statistics", "biology"],
    keywords: ["sensitivity", "specificity", "positive predictive value", "negative predictive value", "diagnostic accuracy"],
    takeaways: ["Sensitivity conditions on truly diseased individuals; specificity conditions on truly non-diseased individuals.", "PPV and NPV condition on the observed test result.", "Predictive values change with prevalence even when sensitivity and specificity remain fixed."],
    sections: [
      { heading: "Start with a 2×2 table", body: ["Arrange disease status as the reference condition and test result as positive or negative. Sensitivity is the proportion of truly diseased individuals who test positive. Specificity is the proportion of truly non-diseased individuals who test negative.", "Writing the denominator in words is a reliable way to avoid swapping definitions."] },
      { heading: "Predictive values reverse the conditioning", body: ["Positive predictive value asks: among people who tested positive, what proportion truly have the condition? Negative predictive value asks: among people who tested negative, what proportion truly do not have the condition?", "These are often the questions patients and clinicians care about after receiving a test result, but they are not intrinsic constants of the test."] },
      { heading: "Why prevalence changes PPV and NPV", body: ["When the condition is rare, false positives can outnumber true positives even for a test with good sensitivity and specificity, reducing PPV. In a high-prevalence setting, PPV tends to increase while NPV can decrease.", "That is why predictive values should be reported in the population and clinical setting where the test is intended to be used."] },
    ],
    tutoringLinks: [{ label: "Medical statistics tutoring", href: "/tutoring/medical-statistics-tutor" }],
    relatedSlugs: ["hazard-ratio-vs-risk-ratio", "logistic-regression-odds-ratios"],
    publishedAt: "2026-11-19",
    updatedAt: "2026-11-19",
  },
  {
    slug: "missing-data-mcar-mar-mnar",
    title: "MCAR, MAR and MNAR: what missing-data assumptions actually mean",
    category: "Medical Statistics",
    categorySlug: "medical-statistics",
    description: "Understand missingness mechanisms as assumptions about why data are missing, not labels you can read directly from a dataset.",
    readTime: "11 min",
    level: "Master's · Research",
    subjectSlugs: ["statistics", "research-methods"],
    keywords: ["MCAR", "MAR", "MNAR", "missing data", "multiple imputation"],
    takeaways: ["MCAR, MAR and MNAR describe relationships between missingness and data values.", "MAR can depend on observed data; it does not mean missingness is random in everyday language.", "The mechanism is generally not identifiable from observed data alone.", "Sensitivity analysis is important when conclusions could depend on unverifiable missingness assumptions."],
    sections: [
      { heading: "MCAR: missingness unrelated to the data", body: ["Missing completely at random means the probability that a value is missing does not depend on observed or unobserved values in the analysis. Under MCAR, the observed cases can behave like a random subset with respect to the variables involved.", "This is a strong assumption and is often implausible when dropout, non-response or measurement failure has a systematic reason."] },
      { heading: "MAR: missingness may depend on observed information", body: ["Missing at random allows the probability of missingness to depend on observed variables, but after conditioning on that observed information it does not depend on the unobserved missing value itself.", "For example, if follow-up outcome data are more often missing among younger participants, and age is observed and included appropriately in the imputation or analysis model, MAR could still be plausible."] },
      { heading: "MNAR: missingness depends on unobserved values", body: ["Missing not at random means missingness can depend on the unobserved value even after conditioning on observed information. A participant with severe unobserved symptoms might be more likely to drop out specifically because of those symptoms.", "The key challenge is that the part of the mechanism involving the missing values cannot usually be verified from the observed dataset alone."] },
      { heading: "What this means for analysis", body: ["Complete-case analysis, multiple imputation, inverse-probability weighting and model-based approaches each rely on assumptions. The best method depends on the estimand, design, missingness pattern and variables available.", "When MNAR is scientifically plausible, sensitivity analyses can show how conclusions would change under alternative assumptions rather than pretending that one untestable model is certain."] },
    ],
    tutoringLinks: [{ label: "Medical statistics tutoring", href: "/tutoring/medical-statistics-tutor" }, { label: "Research methods tutoring", href: "/tutoring/research-methods-tutor" }],
    relatedSlugs: ["research-question-to-analysis", "dissertation-statistical-analysis-plan", "cox-proportional-hazards"],
    publishedAt: "2026-11-19",
    updatedAt: "2026-11-19",
    featured: true,
  },
  {
    slug: "linear-regression-in-r",
    title: "Linear regression in R: fit, diagnose and interpret the model",
    category: "R & Statistical Programming",
    categorySlug: "r-programming",
    description: "A reasoning-first R workflow for fitting a linear model and checking what the output actually means.",
    readTime: "10 min",
    level: "Undergraduate · Master's",
    subjectSlugs: ["statistics", "data-science"],
    keywords: ["linear regression R", "lm R", "R regression", "residual diagnostics"],
    takeaways: ["Use lm() to specify the model clearly, but interpret coefficients in the context of the variables and reference groups.", "Inspect confidence intervals and diagnostics rather than reporting only p-values.", "Keep data preparation and model code reproducible."],
    sections: [
      { heading: "Fit the model with an explicit formula", body: ["A basic model can be fitted with lm(outcome ~ predictor, data = dat). Multiple predictors are added with +, and interactions can be represented with terms such as exposure * sex when that matches the research question.", "Before fitting, confirm that numeric variables are actually numeric and categorical variables have the intended factor levels and reference category."] },
      { heading: "Read coefficients before model summaries", body: ["summary(model) reports estimates, standard errors, t-statistics and p-values. Start with the estimate column. Translate each coefficient into the units of the outcome and predictor, then use uncertainty measures to judge precision.", "confint(model) gives confidence intervals for coefficients. For categorical predictors, interpret each level relative to the reference level unless you have changed the contrast coding."] },
      { heading: "Check diagnostics", body: ["plot(model) produces several standard diagnostic plots, including residual-versus-fitted and Q-Q plots. These can reveal non-linearity, changing variance, unusual residuals and influential observations.", "Do not treat each plot as a pass/fail test. Ask whether any pattern is large enough to affect the inferential or predictive goal of the model."] },
      { heading: "Make the workflow reproducible", body: ["Keep data cleaning, model fitting, diagnostics and output generation in code. Avoid manually editing model-ready data because that makes it harder to reproduce or explain the analysis.", "A short script that another person can rerun from raw input to final table is often a stronger analytical product than a long sequence of undocumented console commands."] },
    ],
    tutoringLinks: [{ label: "R statistics tutoring", href: "/tutoring/r-statistics-tutor" }, { label: "Statistics tutoring", href: "/tutoring/statistics-tutor-online" }],
    relatedSlugs: ["multiple-linear-regression", "regression-assumptions-diagnostics", "logistic-regression-in-r"],
    publishedAt: "2026-11-19",
    updatedAt: "2026-11-19",
    featured: true,
  },
  {
    slug: "logistic-regression-in-r",
    title: "Logistic regression in R: from glm() output to odds ratios",
    category: "R & Statistical Programming",
    categorySlug: "r-programming",
    description: "Fit a binary-outcome model in R and translate coefficients into interpretable odds ratios and predicted probabilities.",
    readTime: "10 min",
    level: "Undergraduate · Master's",
    subjectSlugs: ["statistics", "data-science"],
    keywords: ["logistic regression R", "glm binomial", "odds ratio R", "predicted probability R"],
    takeaways: ["Use glm(..., family = binomial) for standard binary logistic regression.", "Exponentiate coefficients to obtain odds ratios, but keep the underlying predictor scale clear.", "Predicted probabilities can be easier to communicate than odds ratios for some audiences."],
    sections: [
      { heading: "Fit the binary model", body: ["A standard model can be fitted with glm(outcome ~ predictor1 + predictor2, data = dat, family = binomial). The outcome should encode the event and non-event consistently so you know which probability is being modelled.", "The default logit link models the log-odds of the event as a linear predictor."] },
      { heading: "Convert coefficients to odds ratios", body: ["coef(model) returns log-odds coefficients. exp(coef(model)) converts them to odds ratios. An odds ratio above one indicates higher odds for a one-unit predictor increase or relative to a reference category; below one indicates lower odds.", "Use exp(confint(model)) or an appropriate confidence-interval method to express uncertainty on the odds-ratio scale."] },
      { heading: "Predicted probabilities", body: ["predict(model, newdata = ..., type = 'response') returns fitted probabilities for specified predictor values. This can make the model easier to explain because probabilities are on a 0-to-1 scale.", "When comparing predicted probabilities, clearly state which other predictors are being held fixed and whether the chosen covariate pattern is meaningful."] },
      { heading: "Do not stop at the coefficient table", body: ["Check the coding of categorical variables, influential observations, non-linearity of continuous predictors on the logit scale and whether the model has enough information for the number of parameters being estimated.", "Model performance and calibration matter for prediction; confounding and model specification matter for explanatory or causal questions."] },
    ],
    tutoringLinks: [{ label: "R statistics tutoring", href: "/tutoring/r-statistics-tutor" }],
    relatedSlugs: ["logistic-regression-odds-ratios", "linear-regression-in-r", "sensitivity-specificity-ppv-npv"],
    publishedAt: "2026-11-19",
    updatedAt: "2026-11-19",
  },
  {
    slug: "spss-linear-regression",
    title: "Linear regression in SPSS: what to check before interpreting the coefficients",
    category: "SPSS",
    categorySlug: "spss",
    description: "A practical SPSS workflow for model setup, diagnostics and coefficient interpretation.",
    readTime: "9 min",
    level: "Undergraduate · Master's",
    subjectSlugs: ["statistics"],
    keywords: ["SPSS linear regression", "SPSS regression", "SPSS coefficients", "SPSS residual plots"],
    takeaways: ["Define the dependent variable and predictors based on the research question before opening the regression dialog.", "Interpret unstandardized B coefficients in the original outcome units.", "Request residual and influence diagnostics when model assumptions matter."],
    sections: [
      { heading: "Set up the model", body: ["In SPSS, linear regression is usually reached through Analyze → Regression → Linear. Put the continuous outcome in the Dependent box and the predictors in the Independent(s) box.", "Before running the model, check variable coding. A categorical variable stored as numbers such as 1, 2 and 3 should not automatically be treated as a continuous predictor if those numbers are only category labels."] },
      { heading: "Read the coefficients table", body: ["The unstandardized B coefficient is usually the most directly interpretable quantity because it stays in the original outcome units. For a continuous predictor it represents the expected outcome change for a one-unit predictor increase, holding the other predictors constant.", "Standardized Beta coefficients can be useful for some descriptive comparisons but do not replace substantive interpretation of the original units."] },
      { heading: "Request useful diagnostics", body: ["Residual plots can help assess non-linearity and changing variance. Casewise diagnostics and influence measures can help identify observations that disproportionately affect the fitted model.", "The Durbin–Watson statistic is sometimes reported automatically in coursework, but its relevance depends on whether the ordering of observations makes serial correlation a meaningful concern."] },
      { heading: "Report more than significance", body: ["A good write-up includes the model purpose, sample used, coefficients with uncertainty, model-fit summaries and the most relevant diagnostics or limitations. Avoid copying an entire SPSS output window into a report without explaining what each quantity contributes."] },
    ],
    tutoringLinks: [{ label: "SPSS tutoring", href: "/tutoring/spss-tutor" }, { label: "Statistics tutoring", href: "/tutoring/statistics-tutor-online" }],
    relatedSlugs: ["multiple-linear-regression", "regression-assumptions-diagnostics", "pearson-vs-spearman"],
    publishedAt: "2026-11-19",
    updatedAt: "2026-11-19",
    featured: true,
  },
  {
    slug: "econometrics-ols-assumptions",
    title: "OLS assumptions in econometrics: what each assumption buys you",
    category: "Econometrics",
    categorySlug: "econometrics",
    description: "Connect the familiar OLS assumption list to unbiasedness, standard errors and causal interpretation.",
    readTime: "11 min",
    level: "Undergraduate · Master's",
    subjectSlugs: ["statistics"],
    keywords: ["OLS assumptions", "econometrics", "Gauss Markov", "exogeneity", "heteroskedasticity"],
    takeaways: ["Different OLS assumptions support different statistical conclusions; they are not one undifferentiated checklist.", "Zero conditional mean or exogeneity is central to interpreting coefficients without omitted-variable bias under the model.", "Heteroskedasticity mainly affects conventional variance estimates rather than automatically biasing OLS coefficients.", "Causal interpretation needs stronger design and identification assumptions than good regression diagnostics alone."],
    sections: [
      { heading: "Linearity in parameters", body: ["The classical linear model is linear in its parameters, not necessarily in the raw variables. You can include logs, polynomials or transformations while still using OLS as long as the model remains linear in the coefficients.", "The substantive issue is whether the chosen functional form is adequate for the relationship you want to estimate."] },
      { heading: "Zero conditional mean and exogeneity", body: ["A key assumption is that the error has mean zero conditional on the regressors. Informally, after conditioning on the included explanatory variables, the remaining unobserved determinants should not systematically vary with a regressor whose coefficient you want to interpret.", "Omitted confounders, simultaneity and some forms of measurement error can violate this condition and bias coefficient estimates."] },
      { heading: "Homoskedasticity and standard errors", body: ["Under homoskedasticity, the error variance is constant conditional on the regressors. When variance changes across observations, conventional OLS standard errors can be wrong even though the OLS point estimates may remain unbiased under other assumptions.", "Heteroskedasticity-robust standard errors are often used when constant variance is doubtful, but they do not fix omitted-variable bias or a bad functional form."] },
      { heading: "What the Gauss–Markov result does—and does not—say", body: ["Under the classical assumptions, OLS is the best linear unbiased estimator in the sense of having minimum variance among linear unbiased estimators. This does not mean OLS is always the best estimator for every problem, nor does it make a regression causal.", "Identification and research design remain separate questions from estimator efficiency."] },
    ],
    tutoringLinks: [{ label: "Econometrics tutoring", href: "/tutoring/econometrics-tutor" }],
    relatedSlugs: ["multiple-linear-regression", "regression-assumptions-diagnostics", "interpreting-r-squared"],
    publishedAt: "2026-11-19",
    updatedAt: "2026-11-19",
    featured: true,
  },
  {
    slug: "cross-validation-train-test-split",
    title: "Train/test split and cross-validation: what problem each one solves",
    category: "Data Science",
    categorySlug: "data-science",
    description: "Understand why model evaluation needs data the fitting process did not get to optimise against.",
    readTime: "9 min",
    level: "Undergraduate · Master's",
    subjectSlugs: ["data-science", "machine-learning-ai"],
    keywords: ["train test split", "cross validation", "model evaluation", "overfitting"],
    takeaways: ["Training performance is optimistic because the model was fitted to those data.", "A test set should remain untouched until final evaluation when possible.", "Cross-validation reuses training data across folds to estimate performance and tune choices more efficiently."],
    sections: [
      { heading: "Why training performance is not enough", body: ["A model is selected to fit the training data, so evaluating it on the same observations usually gives an optimistic picture of how it will perform on new cases. Flexible models can learn noise as well as signal.", "The purpose of held-out evaluation is to approximate performance on future data generated from a similar process."] },
      { heading: "What a train/test split does", body: ["A simple split reserves one part of the data for model development and another for evaluation. The test set should not be repeatedly inspected during tuning, because each decision based on test performance leaks information back into the modelling process.", "With limited data, one split can also be unstable because results depend on which observations happen to fall into each set."] },
      { heading: "How cross-validation helps", body: ["In k-fold cross-validation, the training portion is divided into k folds. The model is trained on k−1 folds and evaluated on the remaining fold, repeating until every fold has served as validation data.", "Averaging performance across folds uses the available data more efficiently for model comparison and tuning. A separate final test set can then provide a less biased final performance estimate."] },
      { heading: "Avoid leakage", body: ["Preprocessing steps that learn from data—such as scaling by sample means, imputation, feature selection or target encoding—should be fitted inside each training fold rather than on the full dataset before cross-validation.", "Leakage can make validation performance look much better than what a real deployment will achieve."] },
    ],
    tutoringLinks: [{ label: "Data science tutoring", href: "/tutoring/data-science-tutor" }],
    relatedSlugs: ["python-data-analysis-workflow", "multiple-linear-regression"],
    publishedAt: "2026-11-19",
    updatedAt: "2026-11-19",
    featured: true,
  },
  {
    slug: "dissertation-statistical-analysis-plan",
    title: "How to build a statistical analysis plan for a dissertation",
    category: "Research Methods",
    categorySlug: "research-methods",
    description: "Turn a dissertation question into variables, estimands, models, diagnostics and sensitivity analyses before running dozens of tests.",
    readTime: "12 min",
    level: "Undergraduate · Master's",
    subjectSlugs: ["research-methods", "statistics"],
    keywords: ["dissertation statistics", "statistical analysis plan", "research methods", "analysis plan"],
    takeaways: ["Write the research question and primary outcome before choosing a model.", "Define how every variable will be coded and summarised.", "Separate primary analysis, diagnostics and sensitivity analyses.", "Plan how missing data and multiplicity will be handled before seeing the final results where possible."],
    sections: [
      { heading: "1. Write the question in analysable form", body: ["State the population, exposure or grouping variable, outcome and the comparison or association of interest. If the dissertation has several aims, label a primary question and distinguish secondary or exploratory questions.", "A clear question lets you identify the estimand: the mean difference, regression coefficient, odds ratio, hazard ratio, correlation or other quantity that directly answers the aim."] },
      { heading: "2. Define the analysis dataset", body: ["List inclusion and exclusion criteria, repeated measurements, clustering variables and how missing or impossible values will be handled. Define derived variables before modelling and record the reference categories for categorical variables.", "This prevents silent changes to the sample or coding after you have seen which analysis gives the most attractive result."] },
      { heading: "3. Map each aim to a model", body: ["For every research aim, write the outcome type, predictors, adjustment variables, proposed model and the effect measure you will report. Explain why the method matches the design rather than simply naming the test.", "If confounding adjustment is needed, justify covariates using subject-matter reasoning rather than selecting them only from univariable p-values."] },
      { heading: "4. Plan diagnostics and sensitivity analyses", body: ["Specify which assumptions need checking and what you will do if they are materially violated. Pre-plan alternative specifications that answer the same scientific question under different reasonable assumptions.", "Examples include alternative coding of a continuous predictor, robust standard errors, different missing-data assumptions or analyses excluding a pre-specified influential subgroup."] },
      { heading: "5. Plan the reporting", body: ["Decide which descriptive table, effect estimates, confidence intervals and figures will answer each aim. This keeps the results section focused and reduces the temptation to report every software output.", "Your dissertation should show a chain of reasoning from question → data → method → result → interpretation → limitation."] },
    ],
    tutoringLinks: [{ label: "Dissertation statistics support", href: "/tutoring/dissertation-statistics-support" }, { label: "Research methods tutor", href: "/tutoring/research-methods-tutor" }],
    relatedSlugs: ["research-question-to-analysis", "how-to-choose-statistical-test", "missing-data-mcar-mar-mnar"],
    publishedAt: "2026-11-19",
    updatedAt: "2026-11-19",
    featured: true,
  },
  {
    slug: "sample-size-power-basics",
    title: "Sample size and power: the inputs matter more than the calculator",
    category: "Research Methods",
    categorySlug: "research-methods",
    description: "Understand effect size, variability, alpha and power before treating a sample-size calculation as a single objective number.",
    readTime: "9 min",
    level: "Undergraduate · Master's · Research",
    subjectSlugs: ["research-methods", "statistics"],
    keywords: ["sample size", "statistical power", "effect size", "power calculation"],
    takeaways: ["Power depends on the effect size you want to detect, variability, sample size, significance threshold and design.", "A sample-size calculation is conditional on assumptions, not a universal truth.", "The target effect should be scientifically meaningful, not chosen only to make the required sample smaller."],
    sections: [
      { heading: "What power means", body: ["Power is the probability that a statistical procedure will reject the null hypothesis under a specified alternative scenario, assuming the model and calculation assumptions are correct. It is therefore tied to a particular effect size and design.", "Saying that a study has '80% power' is incomplete unless you also say 80% power to detect what effect, under what variability and analysis model."] },
      { heading: "The key ingredients", body: ["For a simple comparison of means, power depends on the target difference, outcome variability, sample size, significance level and allocation between groups. More complex designs add clustering, repeated measurements, event rates, loss to follow-up or other parameters.", "Changing any one input can materially change the required sample size."] },
      { heading: "Choose a meaningful effect", body: ["The effect size should come from scientific or practical relevance, prior evidence and uncertainty—not simply the smallest value that makes recruitment feasible. Detecting a tiny effect with high power may be scientifically unhelpful, while choosing an unrealistically large effect can leave the study underpowered for plausible effects.", "Sensitivity calculations across several plausible values are often more informative than one precise-looking number."] },
    ],
    tutoringLinks: [{ label: "Research methods tutoring", href: "/tutoring/research-methods-tutor" }, { label: "Medical statistics tutoring", href: "/tutoring/medical-statistics-tutor" }],
    relatedSlugs: ["sampling-distribution-mean", "confidence-intervals", "dissertation-statistical-analysis-plan"],
    publishedAt: "2026-11-19",
    updatedAt: "2026-11-19",
  },
  {
    slug: "deseq2-differential-expression",
    title: "DESeq2 differential expression: from design formula to interpretable results",
    category: "Bioinformatics",
    categorySlug: "bioinformatics",
    description: "A reasoning-first overview of DESeq2 design, contrasts, shrinkage, multiple testing and result interpretation.",
    readTime: "12 min",
    level: "Master's · Research",
    subjectSlugs: ["bioinformatics", "data-science"],
    keywords: ["DESeq2", "differential expression", "RNA-seq", "design formula", "log2 fold change"],
    takeaways: ["The design formula encodes the comparison and adjustment structure; it is not a cosmetic line of code.", "Inspect sample-level quality before trusting gene-level tests.", "Use adjusted p-values to control multiplicity and interpret them alongside effect sizes.", "A differential-expression result is conditional on the model, contrast and preprocessing choices."],
    sections: [
      { heading: "Start with the design formula", body: ["In DESeq2, the design formula specifies which sample-level variables explain systematic differences in counts. A design such as ~ batch + condition asks the model to account for batch while estimating condition differences.", "The formula must match the experimental structure. Pairing, repeated samples or confounded designs cannot be repaired by copying a generic formula from a tutorial."] },
      { heading: "Quality control before testing", body: ["Inspect library sizes, sample distances, principal components and metadata consistency before gene-level inference. Unexpected clusters can indicate batch effects, sample swaps, biological heterogeneity or technical problems that need investigation.", "Filtering very low-count features can reduce the multiple-testing burden and remove genes with little information, but filtering rules should be transparent and appropriate for the workflow."] },
      { heading: "Contrasts define the comparison", body: ["A contrast tells DESeq2 which condition difference you want to estimate and in which direction. Check factor reference levels so that a positive log2 fold change means what you think it means.", "For complex designs with interactions, the coefficient or contrast can represent a difference in differences rather than a simple group comparison, so interpretation must follow the model specification."] },
      { heading: "Effect size, uncertainty and multiplicity", body: ["DESeq2 reports log2 fold changes and statistical evidence across many genes. Adjusted p-values account for multiple testing, while shrinkage methods can stabilise noisy fold-change estimates for ranking and visualisation.", "A low adjusted p-value does not guarantee biological importance. Consider effect magnitude, expression level, consistency, pathway context and independent validation where relevant."] },
    ],
    tutoringLinks: [{ label: "Bioinformatics tutoring", href: "/subjects/bioinformatics" }, { label: "R statistics tutoring", href: "/tutoring/r-statistics-tutor" }],
    relatedSlugs: ["rna-seq-workflow", "cross-validation-train-test-split"],
    publishedAt: "2026-11-19",
    updatedAt: "2026-11-19",
    featured: true,
  },
];

export function getResource(slug: string) {
  return resources.find((resource) => resource.slug === slug);
}

export function getResourceCategory(slug: string) {
  return resourceCategories.find((category) => category.slug === slug);
}

export function getResourcesByCategory(categorySlug: string) {
  return resources.filter((resource) => resource.categorySlug === categorySlug);
}

export function getResourcesForSubject(subjectSlug: string, limit = 4) {
  return resources
    .filter((resource) => resource.subjectSlugs.includes(subjectSlug))
    .sort((a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)))
    .slice(0, limit);
}

export function getRelatedResources(resource: Resource, limit = 3) {
  const explicit = (resource.relatedSlugs ?? [])
    .map((slug) => getResource(slug))
    .filter((item): item is Resource => Boolean(item));

  const fallback = resources.filter(
    (item) =>
      item.slug !== resource.slug &&
      item.categorySlug === resource.categorySlug &&
      !explicit.some((explicitItem) => explicitItem.slug === item.slug),
  );

  return [...explicit, ...fallback].slice(0, limit);
}

export function getResourcesForTutoring(tutoringSlug: string, subjectName?: string, limit = 3) {
  const tutoringPath = `/tutoring/${tutoringSlug}`;
  const normalizedSubject = subjectName?.toLowerCase();

  return resources
    .filter((resource) => {
      const direct = resource.tutoringLinks.some((link) => link.href === tutoringPath);
      const subject = normalizedSubject
        ? resource.subjectSlugs.some((slug) => slug.replace(/-/g, " ") === normalizedSubject)
        : false;
      return direct || subject;
    })
    .sort((a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)))
    .slice(0, limit);
}
