import Link from "next/link";
import type { Resource } from "@/lib/resources";

export default function LearningResourceCard({ resource }: { resource: Resource }) {
  return (
    <Link href={`/learn/${resource.slug}`} className="card resource-card learning-resource-card">
      <div className="learning-resource-meta">
        <span>{resource.category}</span>
        <small>{resource.readTime} read</small>
      </div>
      <h3>{resource.title}</h3>
      <p>{resource.description}</p>
      <div className="learning-resource-footer">
        <span>{resource.level}</span>
        <strong className="text-link">Read guide</strong>
      </div>
    </Link>
  );
}
