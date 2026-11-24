import type { Metadata } from "next";
import Link from "next/link";
import TestimonialCard from "@/components/TestimonialCard";
import { getApprovedTestimonials } from "@/lib/testimonials";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Student Testimonials",
  description: "Read approved student feedback about personalised online tutoring with My Academic Tutor.",
};

export default async function TestimonialsPage() {
  const testimonials = await getApprovedTestimonials({ featuredFirst: true, limit: 30 });
  return (
    <>
      <section className="page-hero compact-hero"><div className="shell narrow"><div className="eyebrow">STUDENT EXPERIENCES</div><h1>What students say about learning with MAT.</h1><p className="page-lead">Every testimonial shown here is genuine student feedback provided to My Academic Tutor and approved for public display. We do not publish student feedback without permission.</p></div></section>
      <section className="section"><div className="shell">
        {testimonials.length ? <div className="testimonial-grid">{testimonials.map((item) => <TestimonialCard key={item.id} testimonial={item} />)}</div> : <div className="empty-public-state"><h2>Student feedback will appear here.</h2><p>We are building this section from verified tutoring feedback rather than adding placeholder reviews.</p></div>}
      </div></section>
      <section className="cta-band"><div className="shell cta-band-inner"><div><div className="eyebrow eyebrow-light">YOUR LEARNING GOALS</div><h2>Looking for personalised one-to-one support?</h2><p>Tell us the subject, level and topic you want to improve.</p></div><Link href="/find-a-tutor" className="button button-light button-large">Get personalised tutoring</Link></div></section>
    </>
  );
}
