import TrackedLink from "@/components/TrackedLink";

export default function StickyTutoringCta({
  label = "Request tutoring",
  trackingId = "sticky_request_tutoring",
  href = "/find-a-tutor",
}: {
  label?: string;
  trackingId?: string;
  href?: string;
}) {
  return (
    <div className="sticky-tutoring-cta" aria-label="Tutoring enquiry shortcut">
      <div>
        <strong>Need personalised help?</strong>
        <span>Tell us the subject, level and topic.</span>
      </div>
      <TrackedLink href={href} className="button button-primary" trackingId={trackingId}>
        {label}
      </TrackedLink>
    </div>
  );
}
