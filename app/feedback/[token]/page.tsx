import type { Metadata } from "next";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { compactPublicName } from "@/lib/testimonials";
import { submitStudentFeedback } from "./actions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Share tutoring feedback", robots: { index: false, follow: false } };

type Params = Promise<{ token: string }>;
type Search = Promise<Record<string, string | string[] | undefined>>;

function relationOne(value: any) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function FeedbackPage({ params, searchParams }: { params: Params; searchParams: Search }) {
  const { token } = await params;
  const query = await searchParams;
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("testimonials")
    .select("id,status,request_expires_at,subject,academic_level,display_context,students(name),tutors(name)")
    .eq("request_token", token)
    .single();

  if (error || !data || query.invalid) {
    return <FeedbackState title="This feedback link is not valid." body="Please use the most recent feedback email from My Academic Tutor, or contact us if you need a new link." />;
  }

  const student = relationOne((data as any).students);
  const tutor = relationOne((data as any).tutors);
  const expired = new Date(data.request_expires_at).getTime() < Date.now();
  if (expired || query.expired) {
    return <FeedbackState title="This feedback link has expired." body="For privacy and security, feedback links expire. Contact us if you would still like to share your experience." />;
  }
  if (data.status !== "requested" || query.submitted) {
    return <FeedbackState title="Thank you for your feedback." body="Your comments have been received. If you gave publication permission, the MAT team will review them before anything appears publicly." success />;
  }

  const defaultName = compactPublicName(student?.name || "Student");
  const context = data.display_context || [data.academic_level, data.subject].filter(Boolean).join(" · ");
  const message = Array.isArray(query.error) ? query.error[0] : query.error;

  return (
    <main className="feedback-page">
      <section className="feedback-shell">
        <Link href="/" className="feedback-brand">My Academic Tutor</Link>
        <div className="feedback-card">
          <div className="eyebrow">STUDENT FEEDBACK</div>
          <h1>How was your tutoring experience?</h1>
          <p>We welcome honest feedback about your {data.subject || "tutoring"} support{tutor?.name ? ` with ${tutor.name}` : ""}. Your response helps us improve the quality of teaching and student support.</p>
          {message ? <div className="feedback-alert">{String(message)}</div> : null}
          <form action={submitStudentFeedback} className="feedback-form">
            <input type="hidden" name="token" value={token} />
            <fieldset>
              <legend>Overall experience</legend>
              <div className="rating-options">
                {[5,4,3,2,1].map((rating) => (
                  <label key={rating}><input type="radio" name="rating" value={rating} required /><span>{rating} ★</span></label>
                ))}
              </div>
            </fieldset>
            <label><span>Your feedback</span><textarea name="reviewText" minLength={20} maxLength={4000} required placeholder="What was helpful? What changed in your understanding, confidence or study approach?" /></label>
            <div className="feedback-grid">
              <label><span>Public display name</span><input name="displayName" defaultValue={defaultName} maxLength={120} required /></label>
              <label><span>Study context</span><input name="displayContext" defaultValue={context} maxLength={180} placeholder="MSc student · Statistics" /></label>
            </div>
            <label className="feedback-consent"><input type="checkbox" name="consentToPublish" /><span><strong>I give permission for My Academic Tutor to publish this feedback.</strong><small>This is optional. Without permission, your feedback remains internal. If you consent, it is still reviewed by MAT before publication.</small></span></label>
            <button className="button button-primary button-large" type="submit">Submit feedback</button>
          </form>
        </div>
        <p className="feedback-privacy">We do not publish your email address, phone number, university records or private tutoring notes with a testimonial.</p>
      </section>
    </main>
  );
}

function FeedbackState({ title, body, success = false }: { title: string; body: string; success?: boolean }) {
  return (
    <main className="feedback-page"><section className="feedback-shell"><Link href="/" className="feedback-brand">My Academic Tutor</Link><div className="feedback-card feedback-state"><div className="eyebrow">{success ? "FEEDBACK RECEIVED" : "FEEDBACK LINK"}</div><h1>{title}</h1><p>{body}</p><Link href="/" className="button button-primary">Return to My Academic Tutor</Link></div></section></main>
  );
}
