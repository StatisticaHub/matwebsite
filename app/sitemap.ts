import type { MetadataRoute } from "next";

import { subjects, academicLevels } from "@/lib/tutoring-data";
import { tutoringServices } from "@/lib/tutoring-services";
import { highIntentTutoringPages } from "@/lib/high-intent-tutoring";
import { resourceCategories, resources } from "@/lib/resources";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  "https://www.myacademictutor.com";

function url(path: string) {
  return `${siteUrl}${path}`;
}

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages: MetadataRoute.Sitemap = [
    { url: url("/"), changeFrequency: "weekly", priority: 1 },
    { url: url("/find-a-tutor"), changeFrequency: "weekly", priority: 0.95 },
    { url: url("/pricing"), changeFrequency: "monthly", priority: 0.8 },
    { url: url("/subjects"), changeFrequency: "weekly", priority: 0.9 },
    { url: url("/tutoring"), changeFrequency: "weekly", priority: 0.9 },
    { url: url("/learn"), changeFrequency: "weekly", priority: 0.85 },
    { url: url("/learn/editorial-policy"), changeFrequency: "yearly", priority: 0.4 },
    { url: url("/levels"), changeFrequency: "monthly", priority: 0.8 },
    { url: url("/how-it-works"), changeFrequency: "monthly", priority: 0.7 },
    { url: url("/tutors"), changeFrequency: "monthly", priority: 0.65 },
    { url: url("/become-a-tutor"), changeFrequency: "monthly", priority: 0.6 },
    { url: url("/testimonials"), changeFrequency: "monthly", priority: 0.65 },
    { url: url("/faq"), changeFrequency: "monthly", priority: 0.6 },
    { url: url("/about"), changeFrequency: "monthly", priority: 0.55 },
    { url: url("/contact"), changeFrequency: "monthly", priority: 0.55 },
    { url: url("/uk"), changeFrequency: "monthly", priority: 0.85 },
    { url: url("/us"), changeFrequency: "monthly", priority: 0.85 },
    { url: url("/ca"), changeFrequency: "monthly", priority: 0.85 },
    { url: url("/academic-integrity"), changeFrequency: "monthly", priority: 0.5 },
    { url: url("/safeguarding"), changeFrequency: "monthly", priority: 0.45 },
    { url: url("/privacy"), changeFrequency: "yearly", priority: 0.3 },
    { url: url("/terms"), changeFrequency: "yearly", priority: 0.3 },
  ];

  const subjectPages = subjects.map((subject) => ({
    url: url(`/subjects/${subject.slug}`),
    changeFrequency: "monthly" as const,
    priority: 0.9,
  }));

  const levelPages = academicLevels.map((level) => ({
    url: url(`/levels/${level.slug}`),
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  const servicePages = tutoringServices.map((service) => ({
    url: url(`/tutoring/${service.slug}`),
    changeFrequency: "monthly" as const,
    priority: 0.85,
  }));

  const specialistPages = highIntentTutoringPages.map((page) => ({
    url: url(`/tutoring/${page.slug}`),
    changeFrequency: "monthly" as const,
    priority: 0.9,
  }));

  const resourceCategoryPages = resourceCategories.map((category) => {
    const latestDate = resources
      .filter((resource) => resource.categorySlug === category.slug)
      .map((resource) => resource.updatedAt || resource.publishedAt)
      .filter(Boolean)
      .sort()
      .at(-1);

    return {
      url: url(`/learn/${category.slug}`),
      changeFrequency: "weekly" as const,
      priority: 0.8,
      ...(latestDate ? { lastModified: new Date(`${latestDate}T12:00:00Z`) } : {}),
    };
  });

  const resourcePages = resources.map((resource) => {
    const lastModified = resource.updatedAt || resource.publishedAt;
    return {
      url: url(`/learn/${resource.slug}`),
      changeFrequency: "monthly" as const,
      priority: 0.75,
      ...(lastModified ? { lastModified: new Date(`${lastModified}T12:00:00Z`) } : {}),
    };
  });

  return [
    ...staticPages,
    ...subjectPages,
    ...levelPages,
    ...servicePages,
    ...specialistPages,
    ...resourceCategoryPages,
    ...resourcePages,
  ];
}
