export type Resource = {
  slug: string;
  title: string;
  category: string;
  description: string;
  readTime: string;
  sections: { heading: string; body: string[] }[];
};

export const resources: Resource[] = [
  {
    slug: "understanding-p-values",
    title: "Understanding p-values without the common myths",
    category: "Statistics",
    description: "A clear explanation of what a p-value does—and does not—tell you.",
    readTime: "6 min",
    sections: [
      { heading: "What a p-value represents", body: ["A p-value describes how compatible the observed data are with a statistical model in which the null hypothesis is assumed to be true.", "It is not the probability that the null hypothesis is true, and it does not measure the size or importance of an effect."] },
      { heading: "Why context matters", body: ["A small p-value can occur with a very small effect in a large sample. A larger p-value can occur when an important effect is estimated imprecisely in a small sample.", "Good statistical interpretation combines the p-value with effect estimates, uncertainty, study design and subject-matter context."] },
      { heading: "A better question to ask", body: ["Instead of asking only whether a result is 'significant', ask: what is the estimated effect, how uncertain is it, and is that effect meaningful in context?"] },
    ],
  },
  {
    slug: "confidence-intervals",
    title: "Confidence intervals: estimate, uncertainty and interpretation",
    category: "Statistics",
    description: "How to read a confidence interval without treating it as a simple significance label.",
    readTime: "6 min",
    sections: [
      { heading: "Start with the estimate", body: ["A confidence interval is built around an estimated quantity such as a mean difference, regression coefficient or risk ratio. The estimate tells you the central value supported by the sample, while the interval communicates uncertainty around it."] },
      { heading: "Width matters", body: ["Narrower intervals indicate more precise estimation; wider intervals indicate greater uncertainty. Sample size, variability and study design all affect precision."] },
      { heading: "Do not stop at whether zero is inside", body: ["For differences and regression coefficients, whether an interval contains zero can relate to a conventional hypothesis test, but interpretation should still consider the magnitude and practical meaning of the values in the interval."] },
    ],
  },
  {
    slug: "sampling-distribution-mean",
    title: "Sampling distributions of the mean: the idea behind standard errors",
    category: "Statistics",
    description: "Understand why sample means vary and how that leads to standard errors and inference.",
    readTime: "7 min",
    sections: [
      { heading: "Imagine repeated samples", body: ["Take many random samples of the same size from the same population and calculate the mean of each sample. Those sample means will not all be identical. Their distribution is the sampling distribution of the mean."] },
      { heading: "The standard error", body: ["The standard deviation of the sampling distribution is the standard error. When observations are independent and the population standard deviation is σ, the standard error of the sample mean is σ divided by the square root of n."] },
      { heading: "Why larger samples help", body: ["As n increases, the standard error decreases. That means the sample mean tends to vary less from sample to sample, giving more precise estimation of the population mean."] },
    ],
  },
  {
    slug: "logistic-regression-odds-ratios",
    title: "Logistic regression odds ratios explained",
    category: "Statistics",
    description: "How coefficients become odds ratios and how to interpret them carefully.",
    readTime: "7 min",
    sections: [
      { heading: "From log-odds to odds ratios", body: ["Logistic regression models the log-odds of a binary outcome as a linear combination of predictors.", "Exponentiating a coefficient converts it to an odds ratio, which is often easier to interpret."] },
      { heading: "A simple example", body: ["If exp(β)=1.50 for a predictor, the model says that a one-unit increase in that predictor is associated with 50% higher odds of the outcome, holding the other variables in the model constant."] },
      { heading: "Avoid a common mistake", body: ["An odds ratio is not automatically the same as a risk ratio. When outcomes are common, the numerical difference can be substantial."] },
    ],
  },
  {
    slug: "linear-regression-slope",
    title: "Linear regression: what the slope actually means",
    category: "Statistics",
    description: "Move beyond the formula and interpret a regression coefficient in context.",
    readTime: "6 min",
    sections: [
      { heading: "The basic model", body: ["In simple linear regression, the expected outcome is represented as an intercept plus a slope multiplied by the predictor. The slope describes the expected change in the outcome for a one-unit increase in the predictor."] },
      { heading: "Interpret with units", body: ["A coefficient becomes much clearer when you state the units. For example, a slope of 2.4 could mean an expected 2.4-point increase in an outcome for every additional hour of study, depending on how the variables were measured."] },
      { heading: "Association is not automatically causation", body: ["Regression can describe adjusted or unadjusted associations, but a causal interpretation requires stronger assumptions about design, confounding and the data-generating process."] },
    ],
  },
  {
    slug: "cox-proportional-hazards",
    title: "Cox proportional hazards: what the assumption really means",
    category: "Statistics",
    description: "An intuitive introduction to hazards, hazard ratios and proportionality.",
    readTime: "8 min",
    sections: [
      { heading: "What the model compares", body: ["The Cox model compares instantaneous event rates between individuals or groups while allowing the baseline hazard to remain unspecified."] },
      { heading: "The proportional hazards assumption", body: ["The model assumes that covariate effects act multiplicatively on the hazard and remain proportional over follow-up unless time-varying effects are included."] },
      { heading: "Checking the assumption", body: ["Schoenfeld-residual-based diagnostics are commonly used to investigate whether covariate effects appear to vary systematically with time."] },
    ],
  },
  {
    slug: "chain-rule-calculus",
    title: "The chain rule: a practical way to recognise it",
    category: "Mathematics",
    description: "Learn how to spot nested functions and differentiate them step by step.",
    readTime: "5 min",
    sections: [
      { heading: "The core idea", body: ["Use the chain rule when one function is applied inside another function. Think 'differentiate the outside, keep the inside, then multiply by the derivative of the inside.'"] },
      { heading: "Worked example", body: ["For y=(3x²+1)^5, differentiate the outside first: 5(3x²+1)^4. Then multiply by the derivative of the inside, 6x. The derivative is 30x(3x²+1)^4."] },
      { heading: "How to practise", body: ["Start by circling the inner expression. Then identify the outer operation. This makes the chain structure much easier to see."] },
    ],
  },
  {
    slug: "normal-distribution-z-scores",
    title: "Normal distributions and z-scores: from raw values to relative position",
    category: "Mathematics",
    description: "Understand standardisation and how a z-score locates a value relative to a mean.",
    readTime: "6 min",
    sections: [
      { heading: "Why standardise?", body: ["Raw scores from different scales are hard to compare directly. A z-score expresses a value in standard-deviation units relative to the mean."] },
      { heading: "The calculation", body: ["For a value x, mean μ and standard deviation σ, the z-score is (x−μ)/σ. A positive z-score lies above the mean and a negative z-score lies below it."] },
      { heading: "Interpreting the number", body: ["A z-score of 1.5 means the observation is 1.5 standard deviations above the mean. The score does not by itself tell you a probability until it is connected to a distributional assumption or reference table."] },
    ],
  },
  {
    slug: "python-data-analysis-workflow",
    title: "A sensible Python data-analysis workflow",
    category: "Data Science",
    description: "A practical sequence from understanding the data to modelling and communication.",
    readTime: "7 min",
    sections: [
      { heading: "Understand before transforming", body: ["Start by identifying what each row and column represents, the unit of analysis, variable types, missingness and any obvious data-quality issues. Code should follow the data-generating context, not replace it."] },
      { heading: "Separate stages of the workflow", body: ["A reproducible workflow usually separates import, cleaning, exploration, modelling, diagnostics and output. This makes errors easier to find and the analysis easier to explain."] },
      { heading: "Keep interpretation close to the model", body: ["A fitted model is only useful if you understand its assumptions, variables and output. Avoid treating a successful code run as proof that the analysis is appropriate."] },
    ],
  },
  {
    slug: "rna-seq-workflow",
    title: "RNA-seq analysis: the workflow before differential expression",
    category: "Bioinformatics",
    description: "Why quality control, filtering and experimental design come before a volcano plot.",
    readTime: "8 min",
    sections: [
      { heading: "Begin with the design", body: ["Before modelling expression, understand samples, groups, replicates, covariates, pairing and batch structure. A statistical model cannot rescue a misunderstood experiment."] },
      { heading: "Quality control first", body: ["Inspect library sizes, sample relationships, outliers and major sources of variation before differential-expression testing."] },
      { heading: "Interpretation is the final stage", body: ["Differential expression is not simply a list of low p-values. Effect sizes, uncertainty, biological plausibility and downstream validation all matter."] },
    ],
  },
  {
    slug: "research-question-to-analysis",
    title: "From research question to analysis plan",
    category: "Research Methods",
    description: "A practical framework for moving from a broad question to variables, design and method.",
    readTime: "7 min",
    sections: [
      { heading: "Define the question first", body: ["An analysis plan should begin with a clear research question, not with a favourite statistical test. Specify the population, variables or exposures, outcome and the comparison or relationship of interest."] },
      { heading: "Let the design constrain the method", body: ["Cross-sectional, longitudinal, experimental and time-to-event data create different analytical structures. Repeated observations, clustering and censoring are examples of features that change what methods are appropriate."] },
      { heading: "Plan interpretation as well as estimation", body: ["Decide in advance what quantities you want to estimate and how they answer the research question. This helps avoid producing a large collection of outputs with no clear inferential purpose."] },
    ],
  },
  {
    slug: "choosing-statistics-tutor",
    title: "How to get more from statistics tutoring",
    category: "Study Support",
    description: "What to bring to a session and how to turn one explanation into lasting understanding.",
    readTime: "5 min",
    sections: [
      { heading: "Bring the real academic context", body: ["Share the module outline, notation, software and type of questions you are being asked. Statistics is easier to teach well when the tutor understands how the method appears in your course."] },
      { heading: "Ask about the why, not only the how", body: ["Do not stop once the software produces output. Ask why the method is suitable, what assumptions matter, what each quantity means and what would make the conclusion change."] },
      { heading: "Leave with something to practise", body: ["A strong session should end with a small independent task or fresh example that tests whether you can reproduce the reasoning without prompts."] },
    ],
  },
];
