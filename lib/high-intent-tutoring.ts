export type HighIntentTutoringPage = {
  slug: string;
  title: string;
  eyebrow: string;
  metaTitle: string;
  metaDescription: string;
  hero: string;
  intro: string;
  subject: string;
  supportType: string;
  bestFor: string[];
  topics: string[];
  sessionFlow: string[];
  outcomes: string[];
  relatedLinks: { label: string; href: string }[];
};

export const highIntentTutoringPages: HighIntentTutoringPage[] = [
  {
    slug: "statistics-tutor-online",
    title: "Online Statistics Tutor",
    eyebrow: "STATISTICS TUTORING",
    metaTitle: "Online Statistics Tutor | 1:1 Statistics Tutoring",
    metaDescription: "Personalised online statistics tutoring for undergraduate, Master's and research students. Get help with regression, hypothesis testing, ANOVA, R, SPSS, Stata and interpretation.",
    hero: "One-to-one online statistics tutoring that helps you understand the method, not just the output.",
    intro: "Work through statistical concepts, calculations, modelling, software and interpretation with teaching matched to your course and level.",
    subject: "Statistics",
    supportType: "Statistics & data analysis tutoring",
    bestFor: ["Undergraduate statistics modules", "Master’s quantitative courses", "Researchers learning statistical methods", "Students using R, SPSS, Stata or Python"],
    topics: ["Probability", "Hypothesis testing", "Regression", "ANOVA", "Generalised linear models", "Survival analysis", "R", "SPSS", "Stata", "Interpretation and reporting"],
    sessionFlow: ["Clarify the statistical question", "Explain the method and assumptions", "Work through an example or software output", "Practise interpretation independently", "Review what to apply next"],
    outcomes: ["Choose methods more confidently", "Understand assumptions and diagnostics", "Interpret statistical output", "Use software more independently"],
    relatedLinks: [
      { label: "Statistics subject support", href: "/subjects/statistics" },
      { label: "Statistics & data analysis tutoring", href: "/tutoring/statistics-data-analysis" },
      { label: "Master’s tutoring", href: "/levels/masters" },
    ],
  },
  {
    slug: "medical-statistics-tutor",
    title: "Medical Statistics Tutor",
    eyebrow: "MEDICAL STATISTICS",
    metaTitle: "Medical Statistics Tutor | Biostatistics & Health Data Support",
    metaDescription: "One-to-one medical statistics and biostatistics tutoring for health, medicine and research students. Learn regression, survival analysis, study design, epidemiology and interpretation.",
    hero: "Specialist tutoring for medical statistics, biostatistics and quantitative health research.",
    intro: "Understand the statistical reasoning behind health and medical research, from study design and regression to survival analysis and interpretation.",
    subject: "Statistics",
    supportType: "Statistics & data analysis tutoring",
    bestFor: ["Medical and health-science students", "Master’s students in public health or health data", "Researchers learning biostatistics", "Students interpreting clinical or epidemiological analyses"],
    topics: ["Biostatistics", "Epidemiology", "Regression", "Logistic regression", "Survival analysis", "Study design", "Confidence intervals", "Hypothesis testing", "R", "Interpretation of health data"],
    sessionFlow: ["Define the health or research question", "Connect the study design to the statistical method", "Explain assumptions and interpretation", "Work through examples or output", "Practise communicating the result clearly"],
    outcomes: ["Stronger biostatistical reasoning", "Better method selection", "Clearer interpretation of health-data analyses", "More confidence reading research papers"],
    relatedLinks: [
      { label: "Statistics tutoring", href: "/subjects/statistics" },
      { label: "Research methods tutoring", href: "/subjects/research-methods" },
      { label: "PhD & research support", href: "/levels/phd-research" },
    ],
  },
  {
    slug: "r-statistics-tutor",
    title: "R Statistics Tutor",
    eyebrow: "R & STATISTICS",
    metaTitle: "R Statistics Tutor | Learn R for Data Analysis",
    metaDescription: "Learn R for statistics and data analysis with personalised one-to-one tutoring. Get help with data cleaning, visualisation, regression, modelling, debugging and interpretation.",
    hero: "Learn R by understanding the statistical workflow behind the code.",
    intro: "Build confidence with R through guided coding, debugging and statistical analysis rather than copying scripts you cannot explain.",
    subject: "Statistics",
    supportType: "Software / coding support",
    bestFor: ["Students new to R", "Statistics and data-science students", "Researchers moving from point-and-click software", "Students debugging analysis workflows"],
    topics: ["R basics", "Data frames", "tidyverse", "Data cleaning", "ggplot2", "Regression", "Statistical tests", "Model diagnostics", "Debugging", "Reproducible analysis"],
    sessionFlow: ["Clarify what the analysis needs to do", "Break the workflow into manageable steps", "Write and explain the code together", "Debug errors and inspect output", "Refactor into a reproducible workflow"],
    outcomes: ["Write R code more independently", "Understand why each analysis step is used", "Debug errors more effectively", "Build cleaner reproducible workflows"],
    relatedLinks: [
      { label: "Statistics tutoring", href: "/subjects/statistics" },
      { label: "Data Science tutoring", href: "/subjects/data-science" },
      { label: "Coding & software support", href: "/tutoring/coding-software" },
    ],
  },
  {
    slug: "spss-tutor",
    title: "SPSS Tutor",
    eyebrow: "SPSS TUTORING",
    metaTitle: "SPSS Tutor Online | Statistics & Data Analysis Support",
    metaDescription: "Personalised online SPSS tutoring for university and postgraduate students. Learn data setup, statistical tests, regression, output interpretation and reporting.",
    hero: "Learn SPSS alongside the statistics so the output actually makes sense.",
    intro: "Use SPSS more confidently by understanding data setup, test selection, assumptions, output and interpretation rather than following menu clicks mechanically.",
    subject: "Statistics",
    supportType: "Software / coding support",
    bestFor: ["Students using SPSS for a statistics module", "Psychology, health and social-science students", "Master’s dissertation students", "Learners who struggle to interpret SPSS output"],
    topics: ["Data setup", "Descriptive statistics", "t-tests", "ANOVA", "Correlation", "Regression", "Non-parametric tests", "Assumption checks", "Output interpretation", "Reporting results"],
    sessionFlow: ["Identify the research question", "Choose the appropriate statistical procedure", "Set up the analysis correctly in SPSS", "Interpret the output", "Connect the result back to the question"],
    outcomes: ["Choose SPSS procedures more confidently", "Understand statistical output", "Recognise assumptions and limitations", "Report results more clearly"],
    relatedLinks: [
      { label: "Statistics tutoring", href: "/subjects/statistics" },
      { label: "Dissertation support", href: "/tutoring/dissertation-research" },
      { label: "Coding & software support", href: "/tutoring/coding-software" },
    ],
  },
  {
    slug: "econometrics-tutor",
    title: "Econometrics Tutor",
    eyebrow: "ECONOMETRICS TUTORING",
    metaTitle: "Econometrics Tutor Online | Regression & Statistical Methods",
    metaDescription: "One-to-one online econometrics tutoring for university and Master's students. Get help with regression, inference, time series, model interpretation and quantitative methods.",
    hero: "Understand econometrics as a reasoning process, not a collection of formulas.",
    intro: "Work through regression, inference and quantitative economic methods with explanations that connect assumptions, mathematics and interpretation.",
    subject: "Statistics",
    supportType: "University module support",
    bestFor: ["Economics and finance students", "Undergraduate econometrics modules", "Master’s programmes with quantitative economics", "Students struggling with regression interpretation"],
    topics: ["OLS regression", "Hypothesis testing", "Model specification", "Dummy variables", "Heteroskedasticity", "Endogeneity concepts", "Time series foundations", "Panel-data foundations", "Interpretation", "Quantitative problem solving"],
    sessionFlow: ["Clarify the model and economic question", "Explain the assumptions and mathematics", "Work through estimation or interpretation", "Practise a new problem", "Review common exam or coursework mistakes"],
    outcomes: ["Understand regression more deeply", "Interpret coefficients and tests correctly", "Connect assumptions to model validity", "Approach quantitative questions systematically"],
    relatedLinks: [
      { label: "Statistics tutoring", href: "/subjects/statistics" },
      { label: "University tutoring", href: "/levels/undergraduate" },
      { label: "Master’s tutoring", href: "/levels/masters" },
    ],
  },
  {
    slug: "dissertation-statistics-support",
    title: "Dissertation Statistics Support",
    eyebrow: "DISSERTATION STATISTICS",
    metaTitle: "Dissertation Statistics Support | Methods & Analysis Tutoring",
    metaDescription: "Ethical one-to-one statistics support for undergraduate and Master's dissertations. Understand method selection, analysis planning, software, assumptions and interpretation without outsourcing assessed work.",
    hero: "Understand and defend the statistics in your dissertation yourself.",
    intro: "Get methodological tutoring around your research question, data and analysis plan while keeping the assessed work, decisions and writing your own.",
    subject: "Research Methods",
    supportType: "Research / dissertation support",
    bestFor: ["Undergraduate dissertations", "Master’s dissertations", "Students planning quantitative research", "Students who need to understand an analysis recommended by a supervisor"],
    topics: ["Research questions", "Study design", "Variable types", "Method selection", "Analysis planning", "Assumptions", "R / SPSS / Stata workflows", "Interpretation", "Sensitivity thinking", "Methodological justification"],
    sessionFlow: ["Clarify the research question and data", "Compare suitable methodological options", "Explain assumptions and limitations", "Plan or review the analysis workflow", "Check that you can interpret and defend the approach"],
    outcomes: ["A clearer analysis plan", "More defensible method choices", "Better understanding of your own results", "Greater confidence discussing methods with a supervisor"],
    relatedLinks: [
      { label: "Research Methods", href: "/subjects/research-methods" },
      { label: "Statistics tutoring", href: "/subjects/statistics" },
      { label: "Academic integrity", href: "/academic-integrity" },
    ],
  },
  {
    slug: "research-methods-tutor",
    title: "Research Methods Tutor",
    eyebrow: "RESEARCH METHODS",
    metaTitle: "Research Methods Tutor | Study Design & Analysis Support",
    metaDescription: "Personalised research-methods tutoring for undergraduate, Master's and PhD learners. Get help with research questions, study design, methodology, analysis planning and interpretation.",
    hero: "Build a research approach you understand well enough to justify and defend.",
    intro: "Work through research questions, study design, methodology and analysis planning with guidance focused on your own understanding and decision-making.",
    subject: "Research Methods",
    supportType: "Research / dissertation support",
    bestFor: ["Undergraduate research projects", "Master’s dissertations", "PhD methods training", "Students preparing a proposal or analysis plan"],
    topics: ["Research questions", "Study design", "Sampling", "Bias and confounding", "Quantitative methods", "Mixed-methods reasoning", "Analysis planning", "Reproducibility", "Interpretation", "Methodological justification"],
    sessionFlow: ["Define what the study is trying to answer", "Map the design and data to the question", "Compare methodological options", "Discuss assumptions, bias and limitations", "Strengthen the rationale for the chosen approach"],
    outcomes: ["Clearer research questions", "Better study-design reasoning", "Stronger methodological justification", "More confidence discussing research decisions"],
    relatedLinks: [
      { label: "Research Methods subject", href: "/subjects/research-methods" },
      { label: "Dissertation & research support", href: "/tutoring/dissertation-research" },
      { label: "PhD & research tutoring", href: "/levels/phd-research" },
    ],
  },
  {
    slug: "data-science-tutor",
    title: "Data Science Tutor",
    eyebrow: "DATA SCIENCE TUTORING",
    metaTitle: "Data Science Tutor Online | Python, R & Modelling Support",
    metaDescription: "Personalised online data-science tutoring for university and Master's students. Learn Python, R, data cleaning, visualisation, regression, modelling and evaluation.",
    hero: "Build data-science skills by understanding the workflow from raw data to defensible conclusions.",
    intro: "Get one-to-one support with coding, analysis and modelling while learning how each step fits into a complete data-science workflow.",
    subject: "Data Science",
    supportType: "Software / coding support",
    bestFor: ["Undergraduate data-science students", "Master’s data-science programmes", "Students transitioning from another academic background", "Learners working with Python or R"],
    topics: ["Python", "R", "pandas", "Data cleaning", "Visualisation", "Regression", "Feature engineering", "Model evaluation", "Cross-validation", "Reproducible workflows"],
    sessionFlow: ["Define the analytical task", "Inspect and prepare the data", "Explain and implement the method", "Evaluate the model or result", "Interpret and communicate the findings"],
    outcomes: ["Stronger coding confidence", "Cleaner data workflows", "Better model evaluation", "More thoughtful interpretation of results"],
    relatedLinks: [
      { label: "Data Science subject", href: "/subjects/data-science" },
      { label: "Coding & software support", href: "/tutoring/coding-software" },
      { label: "Master’s tutoring", href: "/levels/masters" },
    ],
  },
];

export function getHighIntentTutoringPage(slug: string) {
  return highIntentTutoringPages.find((page) => page.slug === slug);
}
