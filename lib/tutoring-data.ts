export type Subject = {
  slug: string;
  name: string;
  short: string;
  intro: string;
  topics: string[];
  audiences: string[];
  outcomes: string[];
};

export const subjects: Subject[] = [
  { slug: "mathematics", name: "Mathematics", short: "School mathematics through advanced university problem-solving.", intro: "Build confidence through guided explanation, worked examples and purposeful practice across pure and applied mathematics.", topics: ["Algebra", "Calculus", "Trigonometry", "Probability", "Linear algebra", "Differential equations"], audiences: ["GCSE / IGCSE", "A-Level / IB", "AP", "Undergraduate", "Master's"], outcomes: ["Understand methods rather than memorising steps", "Improve problem-solving confidence", "Prepare effectively for classes, tests and exams"] },
  { slug: "statistics", name: "Statistics", short: "Theory, modelling, software and interpretation from foundations to research.", intro: "Get personalised help with statistical reasoning, methods, software and interpretation—whether you are learning the basics or working on postgraduate research.", topics: ["Probability", "Hypothesis testing", "Regression", "ANOVA", "Survival analysis", "Bayesian statistics", "R", "SPSS", "Stata"], audiences: ["School", "Undergraduate", "Master's", "PhD / Research"], outcomes: ["Choose appropriate statistical methods", "Interpret output with confidence", "Use statistical software more effectively"] },
  { slug: "physics", name: "Physics", short: "Conceptual understanding and structured problem-solving across core physics.", intro: "Work through challenging concepts and calculations with a tutor who can connect equations to physical intuition.", topics: ["Mechanics", "Electricity", "Waves", "Thermodynamics", "Fields", "Modern physics"], audiences: ["GCSE / IGCSE", "A-Level / IB", "AP", "Undergraduate"], outcomes: ["Strengthen conceptual understanding", "Structure multi-step calculations", "Prepare for exams with targeted practice"] },
  { slug: "chemistry", name: "Chemistry", short: "Physical, organic and inorganic chemistry with guided practice.", intro: "Turn difficult chemistry topics into understandable steps, mechanisms and problem-solving strategies.", topics: ["Stoichiometry", "Organic chemistry", "Equilibria", "Kinetics", "Thermochemistry", "Spectroscopy"], audiences: ["GCSE / IGCSE", "A-Level / IB", "AP", "Undergraduate"], outcomes: ["Connect theory with calculations", "Understand reaction mechanisms", "Improve exam-style problem solving"] },
  { slug: "biology", name: "Biology", short: "Clear support from core biology to genetics, molecular biology and research.", intro: "Learn biological ideas through clear explanations, diagrams, application and research-aware discussion.", topics: ["Cell biology", "Genetics", "Molecular biology", "Physiology", "Ecology", "Biostatistics"], audiences: ["GCSE / IGCSE", "A-Level / IB", "AP", "Undergraduate", "Master's"], outcomes: ["Explain biological mechanisms clearly", "Connect concepts across topics", "Develop stronger scientific reasoning"] },
  { slug: "computer-science", name: "Computer Science", short: "Programming, algorithms and computational thinking with live guidance.", intro: "Develop practical coding and problem-solving skills by understanding how and why solutions work.", topics: ["Python", "Java", "Algorithms", "Data structures", "Databases", "Web development"], audiences: ["School", "Undergraduate", "Master's"], outcomes: ["Write and debug code independently", "Understand algorithms and data structures", "Develop structured computational thinking"] },
  { slug: "data-science", name: "Data Science", short: "Data analysis, coding, modelling and communication of results.", intro: "Get hands-on support with data workflows from cleaning and exploration to modelling and communication.", topics: ["Python", "R", "pandas", "Data visualisation", "Regression", "Model evaluation"], audiences: ["Undergraduate", "Master's", "Professional"], outcomes: ["Build reproducible data workflows", "Interpret models sensibly", "Communicate findings clearly"] },
  { slug: "machine-learning-ai", name: "Machine Learning & AI", short: "Models, workflows and implementation without black-box learning.", intro: "Understand the reasoning behind machine-learning methods and how to implement, evaluate and improve them responsibly.", topics: ["Supervised learning", "Unsupervised learning", "Neural networks", "Feature engineering", "Evaluation", "Python"], audiences: ["Undergraduate", "Master's", "Professional"], outcomes: ["Understand model assumptions", "Build and evaluate ML workflows", "Move beyond copy-and-paste code"] },
  { slug: "bioinformatics", name: "Bioinformatics", short: "Computational biology, genomics and omics analysis support.", intro: "Work through bioinformatics concepts, workflows and code with support tailored to your biological and statistical background.", topics: ["RNA-seq", "Genomics", "Sequence analysis", "R / Bioconductor", "Python", "Statistical genetics"], audiences: ["Undergraduate", "Master's", "PhD / Research"], outcomes: ["Understand analysis pipelines", "Interpret biological results", "Use bioinformatics tools more confidently"] },
  { slug: "research-methods", name: "Research Methods", short: "Methodological guidance for dissertations, projects and research training.", intro: "Get guidance on study design, analysis planning, interpretation and reproducible research without outsourcing assessed work.", topics: ["Study design", "Literature review", "Data analysis planning", "Interpretation", "Reproducible research", "Academic methods"], audiences: ["Undergraduate", "Master's", "PhD / Research"], outcomes: ["Clarify research questions", "Plan appropriate methods", "Explain and defend methodological choices"] },
];

export type AcademicLevel = { slug: string; name: string; short: string; focus: string[] };
export const academicLevels: AcademicLevel[] = [
  { slug:"school-secondary", name:"School / Secondary", short:"Build foundations, confidence and study habits with patient 1:1 support.", focus:["Core concepts", "Homework understanding", "Confidence building", "Study routine"] },
  { slug:"gcse-igcse", name:"GCSE / IGCSE", short:"Curriculum-aware support for understanding, practice and exam preparation.", focus:["Topic gaps", "Exam technique", "Past-paper practice", "Revision planning"] },
  { slug:"a-level-ib", name:"A-Level / IB", short:"Deeper subject understanding and structured preparation for demanding assessments.", focus:["Advanced concepts", "Problem solving", "Exam preparation", "Coursework guidance"] },
  { slug:"ap-us-high-school", name:"AP / US High School", short:"Targeted support aligned to high-school and AP-level quantitative and science courses.", focus:["Concept mastery", "AP-style problems", "Test preparation", "Academic confidence"] },
  { slug:"undergraduate", name:"Undergraduate", short:"Module-specific support for lectures, problem sheets, coding and methods.", focus:["Difficult modules", "Problem sheets", "Software support", "Exam preparation"] },
  { slug:"masters", name:"Master's", short:"Advanced methods, coding and research support for taught postgraduate study.", focus:["Advanced statistics", "Research methods", "Programming", "Dissertation preparation"] },
  { slug:"phd-research", name:"PhD / Research", short:"Specialist methodological guidance for researchers who need expert discussion and training.", focus:["Methods training", "Analysis strategy", "Reproducibility", "Interpretation"] },
  { slug:"professional", name:"Professional / Continuing Learning", short:"Flexible tutoring for professionals building technical or analytical skills.", focus:["Upskilling", "Software", "Applied methods", "Project support"] },
];

export const levels = academicLevels.map((x)=>x.name);
export const countries = ["United Kingdom", "United States", "Canada", "Australia", "India", "UAE", "Singapore", "Ireland", "New Zealand", "International / IB", "Other"];
export const supportTypes = ["Regular 1:1 tutoring", "One-off topic session", "Exam preparation", "University module support", "Master’s support", "Statistics & data analysis tutoring", "Research / dissertation support", "Software / coding support", "Not sure yet"];

export const matchingPrinciples = [
  { title:"Subject fit", text:"We look for relevant knowledge in the exact topic, not just a broad subject label." },
  { title:"Academic level", text:"The tutor should be comfortable teaching at your curriculum, university or research level." },
  { title:"Teaching fit", text:"We consider how you want to learn: explanation, guided practice, exam preparation, coding, methods or research discussion." },
  { title:"Availability", text:"We take your timezone, preferred days and urgency into account so the match is practical as well as academic." },
];
