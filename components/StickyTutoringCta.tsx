import TrackedLink from "@/components/TrackedLink";

export default function StickyTutoringCta({ label = "Request tutoring", trackingId = "sticky_request_tutoring" }: { label?: string; trackingId?: string }) {
  return (
    <div className="sticky-tutoring-cta" aria-label="Tutoring enquiry shortcut">
      <div>
        <strong>Need personalised help?</strong>
        <span>Tell us the subject, level and topic.</span>
      </div>
      <TrackedLink href="/find-a-tutor" className="button button-primary" trackingId={trackingId}>
        {label}
      </TrackedLink>
    </div>
  );
}
