import type { Metadata } from "next";

export type MarketSlug = "uk" | "us" | "ca";

export type MarketPage = {
  slug: MarketSlug;
  country: string;
  currency: "GBP" | "USD" | "CAD";
  flag: string;
  eyebrow: string;
  metaTitle: string;
  metaDescription: string;
  headline: string;
  lead: string;
  audienceLabel: string;
  priceTitle: string;
  priceCopy: string;
  timingTitle: string;
  timingCopy: string;
  studyContexts: string[];
  specialistAreas: string[];
  preferredTestimonials: string[];
};

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  "https://www.myacademictutor.com";

export const marketPages: Record<MarketSlug, MarketPage> = {
  uk: {
    slug: "uk",
    country: "United Kingdom",
    currency: "GBP",
    flag: "🇬🇧",
    eyebrow: "UK ONLINE TUTORING",
    metaTitle: "Online Tutoring for UK University Students",
    metaDescription:
      "One-to-one online tutoring for UK university, postgraduate and adult learners across statistics, mathematics, data analysis, econometrics, research methods and quantitative subjects.",
    headline:
      "One-to-one online tutoring for UK university and postgraduate study.",
    lead:
      "Get focused help with difficult quantitative modules, statistics, software, research methods, exam preparation and dissertation methodology.",
    audienceLabel:
      "For adult learners aged 18+ studying at undergraduate, postgraduate or research level.",
    priceTitle: "Tutoring from £20 an hour",
    priceCopy:
      "Your exact rate depends on the subject, academic level and specialist support required. We confirm the price before you decide whether to book.",
    timingTitle: "Built around UK study schedules",
    timingCopy:
      "Online sessions can be arranged around university timetables, work commitments, assessment periods and regular weekly study.",
    studyContexts: [
      "Undergraduate university modules",
      "Master's and postgraduate study",
      "Dissertation and research methodology",
      "Exam and assessment preparation",
    ],
    specialistAreas: [
      "Statistics & probability",
      "Medical statistics & biostatistics",
      "Econometrics",
      "R, SPSS, Stata & Python",
      "Data analysis",
      "Research methods",
    ],
    preferredTestimonials: [],
  },

  us: {
    slug: "us",
    country: "United States",
    currency: "USD",
    flag: "🇺🇸",
    eyebrow: "US ONLINE TUTORING",
    metaTitle: "Online Statistics & University Tutoring for US Students",
    metaDescription:
      "One-to-one online tutoring for US college, university and graduate students in statistics, data analysis, econometrics, research methods, R, SPSS, Stata and quantitative subjects.",
    headline:
      "Specialist online tutoring for US college, university and graduate students.",
    lead:
      "Work one-to-one on statistics, quantitative courses, data analysis, research methods and technical software with teaching adapted to your course and current level.",
    audienceLabel:
      "For adult learners aged 18+ in college, university, graduate or research-level study.",
    priceTitle: "Tutoring quoted in US dollars",
    priceCopy:
      "Tell us your course, level and topic. We review the academic requirement and confirm the exact tutoring rate in USD before you decide whether to proceed.",
    timingTitle: "Sessions that work across US time zones",
    timingCopy:
      "Online sessions can be arranged for students across Eastern, Central, Mountain and Pacific time zones, subject to tutor availability.",
    studyContexts: [
      "College and undergraduate courses",
      "Graduate and Master's study",
      "Statistics and quantitative coursework",
      "Exam, midterm and final preparation",
    ],
    specialistAreas: [
      "Statistics & probability",
      "Biostatistics",
      "Business statistics & econometrics",
      "R, SPSS, Stata & Python",
      "Data analysis",
      "Research methods",
    ],
    preferredTestimonials: ["Darshan Patil"],
  },

  ca: {
    slug: "ca",
    country: "Canada",
    currency: "CAD",
    flag: "🇨🇦",
    eyebrow: "CANADA ONLINE TUTORING",
    metaTitle: "Online Statistics & University Tutoring for Canadian Students",
    metaDescription:
      "One-to-one online tutoring for Canadian university, college and postgraduate students in statistics, data analysis, econometrics, research methods and quantitative subjects.",
    headline:
      "One-to-one online tutoring for Canadian university and college students.",
    lead:
      "Get structured support for statistics, quantitative modules, data analysis, research methods and technical software without relying on generic one-size-fits-all lessons.",
    audienceLabel:
      "For adult learners aged 18+ in university, college, postgraduate or research-level study.",
    priceTitle: "Tutoring quoted in Canadian dollars",
    priceCopy:
      "Send us the course and academic context first. We confirm the proposed support and exact rate in CAD before you make any booking commitment.",
    timingTitle: "Online support across Canadian time zones",
    timingCopy:
      "Sessions can be arranged across Canadian time zones, including Atlantic, Eastern, Central, Mountain and Pacific schedules, subject to availability.",
    studyContexts: [
      "University and college modules",
      "Master's and postgraduate study",
      "Research and dissertation methodology",
      "Exam and assessment preparation",
    ],
    specialistAreas: [
      "Statistics & probability",
      "Biostatistics",
      "Econometrics",
      "R, SPSS, Stata & Python",
      "Data analysis",
      "Research methods",
    ],
    preferredTestimonials: ["Rajvi Shah"],
  },
};

export const marketSlugs: MarketSlug[] = [
  "uk",
  "us",
  "ca",
];

export function buildMarketMetadata(
  slug: MarketSlug,
): Metadata {
  const market = marketPages[slug];

  return {
    title: market.metaTitle,
    description: market.metaDescription,

    alternates: {
      canonical: `${siteUrl}/${slug}`,
      languages: {
        "en-GB": `${siteUrl}/uk`,
        "en-US": `${siteUrl}/us`,
        "en-CA": `${siteUrl}/ca`,
        "x-default": siteUrl,
      },
    },

    openGraph: {
      type: "website",
      siteName: "My Academic Tutor",
      url: `${siteUrl}/${slug}`,
      title: `${market.metaTitle} | My Academic Tutor`,
      description: market.metaDescription,
    },

    robots: {
      index: true,
      follow: true,
    },
  };
}
