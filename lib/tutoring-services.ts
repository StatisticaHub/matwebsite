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
    short: "Ongoing personalised teaching that follows your course, questions and progress.",
    hero: "Build understanding over time with one-to-one lessons shaped around what you are studying now and what you need to master next.",
    bestFor: ["Students who want weekly or regular support", "Learners with recurring topic gaps", "Students who benefit from guided practice and accountability", "Anyone who wants teaching that can adapt lesson by lesson"],
    includes: ["Concept explanation in your own course context", "Worked examples and guided problem-solving", "Practice questions with feedback", "Review of mistakes and misconceptions", "Planning for the next topic or assessment", "Support that adjusts as your confidence develops"],
    sessionFlow: ["Identify the current difficulty", "Teach or rebuild the underlying concept", "Work through examples together", "Let you practise with guidance", "Review what is secure and what needs more work"],
    outcomes: ["Stronger conceptual understanding", "More independent problem-solving", "Better continuity across a module or term", "A clearer study plan between sessions"],
    defaultSupportType: "Regular 1:1 tutoring",
  },
  {
    slug: "exam-preparation",
    title: "Exam Preparation",
    short: "Targeted revision, question practice and exam technique without replacing subject understanding.",
    hero: "Prepare for exams by combining topic review, timed practice, feedback and a focused plan for the areas that can still improve.",
    bestFor: ["GCSE, IGCSE, A-Level, IB and AP students", "University students preparing for written or quantitative exams", "Students who know the content but struggle under exam conditions", "Learners who need a structured revision plan"],
    includes: ["Prioritising weak and high-value topics", "Past-paper or exam-style practice", "Timing and question selection strategy", "Step-by-step feedback on working", "Common error analysis", "Revision planning between sessions"],
    sessionFlow: ["Review the syllabus or assessment format", "Identify priority topics", "Attempt representative questions", "Diagnose errors and gaps", "Practise improved methods under realistic conditions"],
    outcomes: ["More confident exam technique", "Fewer avoidable errors", "Better use of revision time", "Improved ability to explain and show working"],
    defaultSupportType: "Exam preparation",
  },
  {
    slug: "university-tutoring",
    title: "University Module Support",
    short: "One-to-one help alongside lectures, problem sheets, labs, coding and assessments.",
    hero: "Turn difficult university material into manageable learning by working directly with the methods, notation and expectations used in your module.",
    bestFor: ["Undergraduate students following demanding quantitative or scientific modules", "Students who need help connecting lectures to problem sheets", "Learners who want regular support during term", "Students returning to mathematics, statistics or coding after a gap"],
    includes: ["Lecture and topic clarification", "Problem-sheet guidance", "Mathematical derivations and reasoning", "Software and coding support", "Assessment preparation", "Study planning around your university timetable"],
    sessionFlow: ["Start from your module material", "Clarify the theory and notation", "Work through representative problems", "Connect methods to your assessment", "Set focused independent practice"],
    outcomes: ["Better understanding of lectures", "More confidence with problem sheets", "Stronger technical foundations", "Less last-minute assessment pressure"],
    defaultSupportType: "University module support",
  },
  {
    slug: "masters-support",
    title: "Master’s Academic Support",
    short: "Advanced tutoring for taught postgraduate modules, methods, coding and research preparation.",
    hero: "Get specialist support when a Master’s programme moves quickly from theory to advanced methods, software and independent analysis.",
    bestFor: ["Students on statistics, data science, finance, economics, health, science or computing programmes", "Students transitioning from a different undergraduate background", "Learners facing advanced methods or coding for the first time", "Students preparing for a dissertation or research project"],
    includes: ["Advanced statistical and quantitative methods", "R, Python, SPSS, Stata or related software support", "Research methods and study design", "Critical interpretation of results", "Module and exam preparation", "Dissertation-readiness support"],
    sessionFlow: ["Map the topic to your programme", "Rebuild any missing prerequisite", "Teach the advanced method", "Apply it to examples or software", "Check interpretation and independent understanding"],
    outcomes: ["A stronger bridge between theory and application", "More confidence with advanced methods", "Improved interpretation of technical output", "Better preparation for independent research"],
    defaultSupportType: "Master’s support",
  },
  {
    slug: "statistics-data-analysis",
    title: "Statistics & Data Analysis Tutoring",
    short: "Learn statistical reasoning, modelling, software and interpretation with specialist one-to-one support.",
    hero: "Understand why a method is used, how to apply it correctly, what the output means and how to communicate the result responsibly.",
    bestFor: ["Students learning statistics for the first time", "University and postgraduate statistics modules", "Researchers who need methods training", "Students using R, Python, SPSS, Stata or SAS"],
    includes: ["Probability and statistical inference", "Regression and generalised linear models", "ANOVA and experimental analysis", "Survival and longitudinal methods", "Software workflows and diagnostics", "Interpretation, assumptions and reporting"],
    sessionFlow: ["Clarify the research or statistical question", "Choose and explain the method", "Work through assumptions and calculations", "Implement or interpret the analysis", "Check that conclusions match the evidence"],
    outcomes: ["Better method selection", "More confident software use", "Stronger interpretation of output", "Clearer statistical reasoning"],
    defaultSupportType: "Statistics & data analysis tutoring",
  },
  {
    slug: "dissertation-research",
    title: "Dissertation & Research Support",
    short: "Methodological guidance for research questions, study design, analysis and interpretation.",
    hero: "Develop a defensible research approach with guidance that strengthens your own reasoning rather than completing assessed work for you.",
    bestFor: ["Undergraduate and Master’s dissertations", "PhD and research-methods training", "Students planning quantitative or mixed-methods projects", "Researchers who need help understanding an analysis strategy"],
    includes: ["Research-question refinement", "Study design and analysis planning", "Method selection and assumptions", "Reproducible workflow guidance", "Interpretation of results", "Preparation to explain and defend methodological choices"],
    sessionFlow: ["Define the question you are trying to answer", "Clarify the data and design", "Compare appropriate methodological options", "Plan or review the analysis", "Strengthen interpretation and methodological justification"],
    outcomes: ["A clearer research plan", "More defensible methodological choices", "Better understanding of your own analysis", "Greater confidence discussing methods with a supervisor"],
    defaultSupportType: "Research / dissertation support",
  },
  {
    slug: "coding-software",
    title: "Coding & Statistical Software Support",
    short: "Learn to use R, Python and statistical software by understanding the workflow, not copying commands.",
    hero: "Build practical confidence with code, data handling and analysis software through guided debugging, explanation and repeatable workflows.",
    bestFor: ["Students learning R or Python", "Statistics students using SPSS, Stata or SAS", "Data-science learners working with real datasets", "Researchers who want more reproducible analysis habits"],
    includes: ["R and Python foundations", "Data cleaning and transformation", "Visualisation and exploratory analysis", "Statistical modelling workflows", "Debugging and error interpretation", "Reproducible scripts and project organisation"],
    sessionFlow: ["Understand the task before the code", "Break the workflow into steps", "Write or inspect code together", "Debug and explain errors", "Refactor the solution into something you can reproduce independently"],
    outcomes: ["More independent coding", "Better debugging habits", "Cleaner data-analysis workflows", "Greater confidence moving from method to implementation"],
    defaultSupportType: "Software / coding support",
  },
];
