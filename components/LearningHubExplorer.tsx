"use client";

import { useMemo, useState } from "react";
import LearningResourceCard from "@/components/LearningResourceCard";
import type { Resource, ResourceCategory } from "@/lib/resources";

type Props = {
  resources: Resource[];
  categories: ResourceCategory[];
};

export default function LearningHubExplorer({ resources, categories }: Props) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    return resources.filter((resource) => {
      const categoryMatch = category === "all" || resource.categorySlug === category;
      if (!categoryMatch) return false;
      if (!normalized) return true;

      return [
        resource.title,
        resource.description,
        resource.category,
        resource.level,
        ...resource.keywords,
        ...resource.takeaways,
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalized);
    });
  }, [category, query, resources]);

  return (
    <div className="learning-explorer">
      <div className="learning-explorer-controls">
        <label className="learning-search">
          <span>Search the Learning Hub</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Try regression, p-values, R, survival analysis…"
          />
        </label>

        <div className="learning-filter-row" aria-label="Filter learning resources by category">
          <button
            type="button"
            className={category === "all" ? "active" : ""}
            onClick={() => setCategory("all")}
          >
            All
          </button>
          {categories.map((item) => (
            <button
              type="button"
              key={item.slug}
              className={category === item.slug ? "active" : ""}
              onClick={() => setCategory(item.slug)}
            >
              {item.name}
            </button>
          ))}
        </div>
      </div>

      <div className="learning-results-head">
        <strong>{filtered.length} guide{filtered.length === 1 ? "" : "s"}</strong>
        {(query || category !== "all") && (
          <button
            type="button"
            className="text-button"
            onClick={() => {
              setQuery("");
              setCategory("all");
            }}
          >
            Clear filters
          </button>
        )}
      </div>

      {filtered.length ? (
        <div className="resource-grid resource-grid-page">
          {filtered.map((resource) => (
            <LearningResourceCard key={resource.slug} resource={resource} />
          ))}
        </div>
      ) : (
        <div className="card learning-empty-state">
          <h3>No guide matched that search.</h3>
          <p>Try a broader topic or clear the filters. You can also send us the topic you want help with.</p>
        </div>
      )}
    </div>
  );
}
