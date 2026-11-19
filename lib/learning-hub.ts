import { resourceCategories, resources } from "@/lib/resources";

export const learningHubStats = {
  guides: resources.length,
  categories: resourceCategories.length,
};

export function getFeaturedResources(limit = 6) {
  return resources.filter((resource) => resource.featured).slice(0, limit);
}

export function getCategoryCounts() {
  return resourceCategories.map((category) => ({
    ...category,
    count: resources.filter((resource) => resource.categorySlug === category.slug).length,
  }));
}
