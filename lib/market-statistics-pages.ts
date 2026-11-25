import type { Metadata } from "next";

import {
  marketPages,
  type MarketSlug,
} from "@/lib/market-pages";

export type StatisticsMarketPage = {
  slug: MarketSlug;
  title: string;
  description: string;
  headline: string;
  lead: string;
  contexts: string[];
  topics: string[];
  software: string[];
  examples: string[];
};

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  "https://www.myacademictutor.com";

export const statisticsMarketPages: Record<
  MarketSlug,
  StatisticsMarketPage
> = {
  uk: {
    slug: "uk",
    title:
      "Online Statistics Tutor for UK University Students",
    description:
      "One-to-one online statistics tutoring for UK undergraduate, Master's and postgraduate students. Get help understanding probability, inference, regression, R, SPSS, Stata and research methods.",
    headline:
      "Online statistics tutoring for UK university and postgraduate students.",
    lead:
      "Work one-to-one on the statistics you are actually studying—from probability and hypothesis testing to regression, statistical software and research methods.",
    contexts: [
      "Undergraduate statistics modules",
      "Master's and postgraduate statistics",
      "Medical and health statistics",
      "Econometrics and quantitative methods",
      "Dissertation and research methodology",
      "Exam and assessment preparation",
    ],
    topics: [
      "Probability and random variables",
      "Sampling distributions",
      "Estimation and confidence intervals",
      "Hypothesis testing",
      "Correlation and regression",
      "ANOVA and statistical modelling",
      "Logistic regression",
      "Survival analysis",
      "Study design and interpretation",
    ],
    software: [
      "R",
      "SPSS",
      "Stata",
      "Python",
    ],
    examples: [
      "Understand why a method is being used",
      "Work through statistical calculations step by step",
      "Interpret model output correctly",
      "Practise similar problems with guidance",
      "Learn how to use statistical software",
      "Prepare for a statistics exam or module",
    ],
  },

  us: {
    slug: "us",
    title:
      "Online Statistics Tutor for US College & Graduate Students",
    description:
      "One-to-one online statistics tutoring for US college, university and graduate students. Support with probability, regression, biostatistics, R, SPSS, Stata and quantitative research methods.",
    headline:
      "Online statistics tutoring for US college and graduate students.",
    lead:
      "Get focused one-to-one help with statistics, biostatistics, quantitative methods and statistical software, adapted to your course and current level.",
    contexts: [
      "College statistics courses",
      "Undergraduate quantitative courses",
      "Graduate statistics and research methods",
      "Biostatistics",
      "Business statistics and econometrics",
      "Midterm and final exam preparation",
    ],
    topics: [
      "Probability and distributions",
      "Sampling and estimation",
      "Confidence intervals",
      "Hypothesis testing",
      "Correlation and regression",
      "ANOVA",
      "Multiple regression",
      "Logistic regression",
      "Biostatistical interpretation",
    ],
    software: [
      "R",
      "SPSS",
      "Stata",
      "Python",
    ],
    examples: [
      "Break down a difficult statistics lecture",
      "Understand formulas rather than memorising them",
      "Interpret regression and model output",
      "Practise exam-style problems",
      "Develop confidence using statistical software",
      "Connect statistical methods to research questions",
    ],
  },

  ca: {
    slug: "ca",
    title:
      "Online Statistics Tutor for Canadian University Students",
    description:
      "One-to-one online statistics tutoring for Canadian university, college and postgraduate students. Get support with probability, regression, biostatistics, R, SPSS, Stata and research methods.",
    headline:
      "Online statistics tutoring for Canadian university and college students.",
    lead:
      "Get structured one-to-one support with statistics, quantitative methods, data analysis and statistical software at the level your course requires.",
    contexts: [
      "University statistics modules",
      "College quantitative courses",
      "Master's and postgraduate statistics",
      "Biostatistics and health research",
      "Econometrics and research methods",
      "Exam and assessment preparation",
    ],
    topics: [
      "Probability and distributions",
      "Sampling distributions",
      "Estimation",
      "Confidence intervals",
      "Hypothesis testing",
      "Correlation and regression",
      "ANOVA",
      "Logistic regression",
      "Statistical interpretation",
    ],
    software: [
      "R",
      "SPSS",
      "Stata",
      "Python",
    ],
    examples: [
      "Clarify difficult statistical concepts",
      "Work through calculations and derivations",
      "Interpret statistical output",
      "Practise course and exam-style problems",
      "Learn statistical software more confidently",
      "Understand methods used in research",
    ],
  },
};

export function buildStatisticsMarketMetadata(
  slug: MarketSlug,
): Metadata {
  const page = statisticsMarketPages[slug];

  return {
    title: page.title,
    description: page.description,

    alternates: {
      canonical: `${siteUrl}/${slug}/statistics`,
      languages: {
        "en-GB": `${siteUrl}/uk/statistics`,
        "en-US": `${siteUrl}/us/statistics`,
        "en-CA": `${siteUrl}/ca/statistics`,
        "x-default": `${siteUrl}/subjects/statistics`,
      },
    },

    openGraph: {
      type: "website",
      siteName: "My Academic Tutor",
      url: `${siteUrl}/${slug}/statistics`,
      title: `${page.title} | My Academic Tutor`,
      description: page.description,
    },

    robots: {
      index: true,
      follow: true,
    },
  };
}

export function statisticsLeadSource(
  slug: MarketSlug,
) {
  return `market_${slug}_statistics`;
}

export function statisticsMarketCurrency(
  slug: MarketSlug,
) {
  return marketPages[slug].currency;
}
