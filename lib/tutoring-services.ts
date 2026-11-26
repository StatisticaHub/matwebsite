export type TutoringService = {
  slug: string;
  title: string;
  short: string;
  hero: string;
  bestFor: string[];
  includes: string[];
  sessionFlow: string[];
  outcomes: string[];
  defaultSupportType: string;
};

export const tutoringServices: TutoringService[] = [
  {
    slug: "one-to-one-tutoring",
    title: "Regular 1:1 Tutoring",
    short: "Regular one-to-one sessions that follow your course and deal with problems before they pile up.",
    hero: "Keep up with your course by working through difficult topics as they appear. Regular sessions give you time to ask questions, practise properly and revisit anything that still feels uncertain.",
    bestFor: [
      "Students who want weekly or regular sessions",
      "Courses where new topics build quickly on earlier ones",
      "Students who learn better when they can ask questions as they go",
      "Anyone who wants continuity with the same tutor",
    ],
    includes: [
      "Explaining the topics covered in your current course",
      "Worked examples followed by your own practice",
      "Reviewing mistakes and recurring misconceptions",
      "Problem sheets, homework concepts and revision questions",
      "Planning what to practise before the next session",
      "Adjusting the pace as your understanding develops",
    ],
    sessionFlow: [
      "Start with what has happened since the last session",
      "Choose the most important topic or problem",
      "Explain or rebuild the underlying idea",
      "Work through an example together",
      "Let you practise and decide what comes next",
    ],
    outcomes: [
      "Fewer gaps building up across the course",
      "More confidence asking and answering questions",
      "Stronger problem-solving habits",
      "A clearer plan between sessions",
    ],
    defaultSupportType: "Regular 1:1 tutoring",
  },

  {
    slug: "exam-preparation",
    title: "Exam Preparation",
    short: "Target the topics and question types that are still costing you marks.",
    hero: "Bring the topics, past papers and question types you find hardest. We can combine subject teaching with exam-style practice so revision is focused on what still needs work.",
    bestFor: [
      "GCSE, IGCSE, A-Level, IB and AP students",
      "University students preparing for quantitative or written exams",
      "Students who understand the course but struggle to apply it under exam conditions",
      "Learners who need a clearer revision plan",
    ],
    includes: [
      "Finding weak and high-priority topics",
      "Past-paper and exam-style questions",
      "Timing and question-selection strategy",
      "Checking method, working and written reasoning",
      "Spotting recurring errors",
      "Planning revision between sessions",
    ],
    sessionFlow: [
      "Look at the exam format and what you have already revised",
      "Choose a priority topic or question type",
      "Attempt realistic questions",
      "Work out exactly where marks are being lost",
      "Practise the improved method and plan the next revision step",
    ],
    outcomes: [
      "Better use of revision time",
      "Fewer avoidable mistakes",
      "More confidence with unfamiliar questions",
      "Clearer working and exam technique",
    ],
    defaultSupportType: "Exam preparation",
  },

  {
    slug: "university-tutoring",
    title: "University Module Support",
    short: "Bring your lecture notes, problem sheets, labs or coding tasks and work through the parts that are not clicking.",
    hero: "University modules can move quickly from theory to notation, calculations and software. Use one-to-one sessions to slow down difficult material and connect lectures to the problems you are expected to solve.",
    bestFor: [
      "Undergraduates taking quantitative, scientific or technical modules",
      "Students who understand lectures but struggle with problem sheets",
      "Students who need help with notation, calculations or software",
      "Anyone returning to mathematics, statistics or coding after a gap",
    ],
    includes: [
      "Lecture topics and difficult concepts",
      "Problem sheets and technical exercises",
      "Mathematical derivations and reasoning",
      "Coding, software and data-analysis concepts",
      "Exam and assessment preparation",
      "Connecting methods to the way your module teaches them",
    ],
    sessionFlow: [
      "Start with your module material",
      "Identify the exact step that is unclear",
      "Explain the theory or notation",
      "Work through a representative problem",
      "Try a similar problem yourself",
    ],
    outcomes: [
      "Lectures and notes that make more sense",
      "More confidence starting problem sheets",
      "Stronger technical foundations",
      "Less need for last-minute catch-up",
    ],
    defaultSupportType: "University module support",
  },

  {
    slug: "masters-support",
    title: "Master's Academic Support",
    short: "Ongoing one-to-one support for Master's modules, advanced methods, coding, quantitative work and research preparation.",
    hero: "Master's courses often assume several earlier ideas at once and move quickly into advanced methods. We can slow down the difficult part, reconnect it to the foundations and help you use it correctly in calculations, software or analysis.",
    bestFor: [
      "Students on statistics, data science, finance, economics, health, science or computing programmes",
      "Students entering a quantitative Master's from a different undergraduate background",
      "Learners meeting advanced statistics or coding for the first time",
      "Students preparing for dissertation or research work",
    ],
    includes: [
      "Advanced statistical and quantitative methods",
      "R, Python, SPSS, Stata and related analytical software",
      "Research methods and study design",
      "Understanding assumptions and interpreting output",
      "Technical module and exam preparation",
      "Dissertation methodology and analysis preparation",
    ],
    sessionFlow: [
      "Start with the method or module you are studying",
      "Check which prerequisite idea is causing the difficulty",
      "Explain the advanced method step by step",
      "Apply it to an example, calculation or software workflow",
      "Check that you can interpret and explain what you have done",
    ],
    outcomes: [
      "A clearer link between theory and application",
      "More confidence with advanced methods",
      "Better interpretation of analytical output",
      "Stronger preparation for independent research",
    ],
    defaultSupportType: "Master's support",
  },

  {
    slug: "statistics-data-analysis",
    title: "Statistics & Data Analysis Tutoring",
    short: "Understand why a statistical method is appropriate, how to use it and what the result actually means.",
    hero: "Statistics is easier when the method, assumptions, calculation and interpretation are connected. Bring the topic or analysis you are working on and we can work through the reasoning as well as the software.",
    bestFor: [
      "Students learning statistics for the first time",
      "University and postgraduate statistics modules",
      "Researchers who want methods training",
      "Students using R, Python, SPSS, Stata or SAS",
    ],
    includes: [
      "Probability, inference and hypothesis testing",
      "Regression and generalised linear models",
      "ANOVA and experimental analysis",
      "Survival, longitudinal and other advanced methods",
      "Software workflows, diagnostics and assumptions",
      "Interpretation and responsible reporting",
    ],
    sessionFlow: [
      "Clarify the statistical question",
      "Explain why a method may or may not be appropriate",
      "Work through the assumptions and mechanics",
      "Run or interpret the analysis",
      "Check that the conclusion matches the evidence",
    ],
    outcomes: [
      "Better understanding of method choice",
      "More confident use of statistical software",
      "Clearer interpretation of output",
      "Stronger statistical reasoning",
    ],
    defaultSupportType: "Statistics & data analysis tutoring",
  },

  {
    slug: "dissertation-research",
    title: "Dissertation & Research Project Support",
    short: "Structured one-to-one support for planning, methodology, analysis choices and interpretation across a dissertation or research project.",
    hero: "Bring the stage of your dissertation or research project that is causing difficulty. Sessions can help you clarify the question, plan the methodology, think through the analysis and interpret the results while the research and assessed work remain your own.",
    bestFor: [
      "Undergraduate and Master's dissertations",
      "PhD students learning research or analytical methods",
      "Students planning quantitative or mixed-methods projects",
      "Researchers who want to understand an analysis strategy more deeply",
    ],
    includes: [
      "Turning a broad idea into a workable research question",
      "Study design and analysis planning",
      "Comparing methodological options",
      "Assumptions and limitations",
      "Reproducible analytical workflows",
      "Interpreting and explaining results",
    ],
    sessionFlow: [
      "Start with the question you are trying to answer",
      "Clarify the data, design and constraints",
      "Compare appropriate methodological options",
      "Plan or review the analysis",
      "Make sure you understand and can justify the decisions",
    ],
    outcomes: [
      "A clearer research plan",
      "More defensible methodological decisions",
      "Better understanding of your own analysis",
      "More confidence discussing methods with a supervisor",
    ],
    defaultSupportType: "Research / dissertation support",
  },

  {
    slug: "coding-software",
    title: "Coding & Statistical Software",
    short: "Bring the error, concept or workflow you are trying to understand and learn how to solve it yourself.",
    hero: "Learn R, Python or statistical software by understanding what the code is doing. Sessions can focus on a programming concept, a confusing error, data handling or an analytical workflow.",
    bestFor: [
      "Students learning R or Python",
      "Statistics students using SPSS, Stata or SAS",
      "Data-science learners working with real datasets",
      "Researchers who want cleaner and more reproducible workflows",
    ],
    includes: [
      "R and Python foundations",
      "Data cleaning and transformation",
      "Visualisation and exploratory analysis",
      "Statistical modelling workflows",
      "Debugging and understanding error messages",
      "Reproducible scripts and project organisation",
    ],
    sessionFlow: [
      "Define what the code needs to do",
      "Break the workflow into smaller steps",
      "Write or inspect the code together",
      "Understand and fix errors rather than just removing them",
      "Rebuild the solution in a form you can reproduce later",
    ],
    outcomes: [
      "More confidence writing code yourself",
      "Better debugging habits",
      "Cleaner analytical workflows",
      "A stronger link between the method and its implementation",
    ],
    defaultSupportType: "Software / coding support",
  },
];
