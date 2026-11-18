import type { MetadataRoute } from "next";
import { subjects, academicLevels } from "@/lib/tutoring-data";
import { tutoringServices } from "@/lib/tutoring-services";
import { resources } from "@/lib/resources";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://www.myacademictutor.com";
  const fixed = [
    "",
    "/find-a-tutor",
    "/subjects",
    "/levels",
    "/tutoring",
    "/learn",
    "/ai-tutor",
    "/how-it-works",
    "/tutors",
    "/become-a-tutor",
    "/about",
    "/faq",
    "/contact",
    "/academic-integrity",
    "/safeguarding",
    "/privacy",
    "/terms",
  ];

  return [
    ...fixed.map((url) => ({ url: base + url, changeFrequency: "monthly" as const, priority: url === "" ? 1 : 0.7 })),
    ...subjects.map((subject) => ({ url: `${base}/subjects/${subject.slug}`, changeFrequency: "monthly" as const, priority: 0.85 })),
    ...academicLevels.map((level) => ({ url: `${base}/levels/${level.slug}`, changeFrequency: "monthly" as const, priority: 0.75 })),
    ...tutoringServices.map((service) => ({ url: `${base}/tutoring/${service.slug}`, changeFrequency: "monthly" as const, priority: 0.85 })),
    ...resources.map((resource) => ({ url: `${base}/learn/${resource.slug}`, changeFrequency: "monthly" as const, priority: 0.75 })),
  ];
}
