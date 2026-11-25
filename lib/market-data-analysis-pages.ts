import type { Metadata } from "next";

import type { MarketSlug } from "@/lib/market-pages";

export type DataAnalysisMarketPage = {
  slug: MarketSlug;
  title: string;
  description: string;
  headline: string;
  lead: string;
  studyContexts: string[];
  methods: string[];
  software: {
    name: string;
    copy: string;
  }[];
};

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  "https://www.myacademictutor.com";

export const dataAnalysisMarketPages: Record<
  MarketSlug,
  DataAnalysisMarketPage
> = {
  uk: {
    slug: "uk",
    title:
      "R, SPSS, Stata & Data Analysis Tutor for UK Students",
    description:
      "One-to-one online tutoring for UK university and postgraduate students using R, SPSS, Stata, Python and statistical data analysis. Learn methods, software and interpretation together.",
    headline:
      "One-to-one R, SPSS, Stata and data analysis tutoring for UK students.",
    lead:
      "Learn how to choose the right statistical method, run the analysis correctly and interpret the output—not just which buttons or commands to use.",
    studyContexts: [
      "Undergraduate quantitative modules",
      "Master's and postgraduate study",
      "Medical and health data analysis",
      "Econometrics and social-science research",
      "Dissertation methodology",
      "Research methods and statistical computing",
    ],
    methods: [
      "Descriptive statistics",
      "Hypothesis testing",
      "Correlation",
      "Linear regression",
      "Multiple regression",
      "Logistic regression",
      "ANOVA",
      "Survival analysis",
      "Data cleaning and interpretation",
    ],
    software: [
      {
        name: "R",
        copy:
          "Learn R syntax, data manipulation, modelling, output interpretation and reproducible statistical workflows.",
      },
      {
        name: "SPSS",
        copy:
          "Understand how to structure analyses, choose procedures and interpret SPSS tables and model output.",
      },
      {
        name: "Stata",
        copy:
          "Work through statistical commands, regression workflows and interpretation for quantitative research.",
      },
      {
        name: "Python",
        copy:
          "Use Python for data handling, statistical analysis and quantitative workflows where appropriate.",
      },
    ],
  },

  us: {
    slug: "us",
    title:
      "R, SPSS, Stata & Data Analysis Tutor for US Students",
    description:
      "Online one-to-one tutoring for US college and graduate students using R, SPSS, Stata, Python and statistical data analysis. Get help understanding methods, code and interpretation.",
    headline:
      "Online R, SPSS, Stata and data analysis tutoring for US college and graduate students.",
    lead:
      "Work through statistical software and quantitative analysis with a tutor who connects the commands and output to the underlying statistical reasoning.",
    studyContexts: [
      "College statistics courses",
      "Graduate quantitative methods",
      "Biostatistics and health research",
      "Business statistics",
      "Econometrics",
      "Graduate research methods",
    ],
    methods: [
      "Descriptive statistics",
      "Probability-based inference",
      "Hypothesis testing",
      "Correlation",
      "Linear regression",
      "Multiple regression",
      "Logistic regression",
      "ANOVA",
      "Data analysis and interpretation",
    ],
    software: [
      {
        name: "R",
        copy:
          "Build confidence writing R code, handling data, fitting models and interpreting statistical output.",
      },
      {
        name: "SPSS",
        copy:
          "Learn which SPSS procedures fit the research question and how to interpret the resulting tables.",
      },
      {
        name: "Stata",
        copy:
          "Develop practical Stata skills for statistical modelling, econometrics and quantitative research.",
      },
      {
        name: "Python",
        copy:
          "Use Python for data preparation, statistical modelling and quantitative analysis when your course requires it.",
      },
    ],
  },

  ca: {
    slug: "ca",
    title:
      "R, SPSS, Stata & Data Analysis Tutor for Canadian Students",
    description:
      "One-to-one online tutoring for Canadian university and postgraduate students using R, SPSS, Stata, Python and statistical data analysis.",
    headline:
      "R, SPSS, Stata and data analysis tutoring for Canadian university students.",
    lead:
      "Get structured help connecting statistical theory, software implementation and interpretation for university and postgraduate quantitative work.",
    studyContexts: [
      "University statistics modules",
      "College quantitative courses",
      "Master's and postgraduate study",
      "Biostatistics and health research",
      "Econometrics",
      "Research and dissertation methodology",
    ],
    methods: [
      "Descriptive statistics",
      "Hypothesis testing",
      "Correlation",
      "Linear regression",
      "Multiple regression",
      "Logistic regression",
      "ANOVA",
      "Statistical modelling",
      "Data analysis and interpretation",
    ],
    software: [
      {
        name: "R",
        copy:
          "Learn data manipulation, statistical modelling, coding and interpretation using R.",
      },
      {
        name: "SPSS",
        copy:
          "Understand how to select analyses and interpret SPSS results rather than following menus mechanically.",
      },
      {
        name: "Stata",
        copy:
          "Work through quantitative analysis, regression and research workflows using Stata.",
      },
      {
        name: "Python",
        copy:
          "Develop practical Python skills for quantitative and statistical analysis where relevant to your course.",
      },
    ],
  },
};

export function buildDataAnalysisMarketMetadata(
  slug: MarketSlug,
): Metadata {
  const page = dataAnalysisMarketPages[slug];

  return {
    title: page.title,
    description: page.description,

    alternates: {
      canonical:
        `${siteUrl}/${slug}/r-spss-data-analysis`,
      languages: {
        "en-GB":
          `${siteUrl}/uk/r-spss-data-analysis`,
        "en-US":
          `${siteUrl}/us/r-spss-data-analysis`,
        "en-CA":
          `${siteUrl}/ca/r-spss-data-analysis`,
        "x-default":
          `${siteUrl}/subjects/statistics`,
      },
    },

    openGraph: {
      type: "website",
      siteName: "My Academic Tutor",
      url:
        `${siteUrl}/${slug}/r-spss-data-analysis`,
      title:
        `${page.title} | My Academic Tutor`,
      description: page.description,
    },

    robots: {
      index: true,
      follow: true,
    },
  };
}

export function dataAnalysisLeadSource(
  slug: MarketSlug,
) {
  return `market_${slug}_data_analysis`;
}
