import type { PublicTestimonial } from "@/lib/testimonials";

export default function TestimonialCard({ testimonial }: { testimonial: PublicTestimonial }) {
  const context = testimonial.display_context || [testimonial.academic_level, testimonial.subject].filter(Boolean).join(" · ");
  return (
    <article className="testimonial-card">
      <div className="testimonial-stars" aria-label={`${testimonial.rating} out of 5 stars`}>
        {Array.from({ length: 5 }, (_, index) => <span key={index} aria-hidden="true">{index < testimonial.rating ? "★" : "☆"}</span>)}
      </div>
      <blockquote>“{testimonial.review_text}”</blockquote>
      <footer>
        <strong>{testimonial.display_name}</strong>
        {context ? <span>{context}</span> : null}
      </footer>
    </article>
  );
}
