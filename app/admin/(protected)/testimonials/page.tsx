import { createAdminClient } from "@/lib/supabase/admin";
import { moderateTestimonial, requestStudentTestimonial } from "@/app/admin/testimonial-actions";
import { createManualTestimonial } from "@/app/admin/manual-testimonial-actions";

export const dynamic = "force-dynamic";

type Search = Promise<Record<string, string | string[] | undefined>>;

function one(value: any) { return Array.isArray(value) ? value[0] : value; }
function dateTime(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/London" }).format(new Date(value));
}

export default async function TestimonialsAdminPage({ searchParams }: { searchParams: Search }) {
  const params = await searchParams;
  const supabase = createAdminClient();
  const [{ data: testimonials, error }, { data: engagements }] = await Promise.all([
    supabase.from("testimonials").select("*,students(name,email,academic_level),tutors(name),tutoring_engagements(subject,title)").order("created_at", { ascending: false }).limit(200),
    supabase.from("tutoring_engagements").select("id,subject,title,status,students(name,email,academic_level),tutors(name)").in("status", ["active","completed"]).order("created_at", { ascending: false }).limit(250),
  ]);

  if (error) return <div className="admin-page"><h1>Testimonials</h1><div className="admin-alert error">Testimonials table is not ready: {error.message}</div></div>;

  const rows = testimonials || [];
  const submitted = rows.filter((x) => x.status === "submitted").length;
  const approved = rows.filter((x) => x.status === "approved").length;
  const requested = rows.filter((x) => x.status === "requested").length;
  const featured = rows.filter((x) => x.status === "approved" && x.featured).length;

  return (
    <div className="admin-page testimonial-admin-page">
      <header className="admin-page-head"><div><span className="admin-eyebrow">Social proof</span><h1>Testimonials & reviews</h1><p>Request honest student feedback, moderate submissions and control exactly what appears publicly.</p></div></header>
      {params.sent ? <div className="admin-alert success">Feedback request sent.</div> : null}
      {params.existing ? <div className="admin-alert">That engagement already has an active feedback request.</div> : null}
      {params.saved ? <div className="admin-alert success">Testimonial moderation saved.</div> : null}
      {params.manual ? <div className="admin-alert success">Manual testimonial added to the moderation queue.</div> : null}
      {params.error ? <div className="admin-alert error">{String(params.error)}</div> : null}

      <section className="admin-metrics admin-metrics-4 testimonial-metrics">
        <div><span>Awaiting response</span><strong>{requested}</strong></div>
        <div><span>Needs review</span><strong>{submitted}</strong></div>
        <div><span>Published</span><strong>{approved}</strong></div>
        <div><span>Featured</span><strong>{featured}</strong></div>
      </section>

      <section className="admin-panel admin-detail-card testimonial-request-panel">
        <div className="admin-card-head"><div><span className="admin-eyebrow">Request feedback</span><h2>Send a secure student feedback link</h2></div></div>
        <p className="admin-muted">Students can submit private feedback without publication consent. Nothing becomes public until they consent and an admin approves it.</p>
        <form action={requestStudentTestimonial} className="testimonial-request-form">
          <label><span>Student engagement</span><select name="engagementId" required defaultValue=""><option value="" disabled>Select a student…</option>{(engagements || []).map((item: any) => {
            const student = one(item.students); const tutor = one(item.tutors);
            return <option key={item.id} value={item.id}>{student?.name || "Student"} · {item.subject}{tutor?.name ? ` · ${tutor.name}` : ""}</option>;
          })}</select></label>
          <button className="admin-primary-button" type="submit">Send feedback request</button>
        </form>
      </section>

      <section className="admin-panel admin-detail-card testimonial-manual-panel">

        <div className="admin-card-head">

          <div>

            <span className="admin-eyebrow">
              Existing feedback
            </span>

            <h2>
              Add a testimonial manually
            </h2>

          </div>

        </div>


        <p className="admin-muted">
          Use this for genuine feedback already received through WhatsApp,
          email or another message. The original source and consent evidence
          stay internal. The testimonial still goes through the normal
          moderation process before anything is published.
        </p>


        <form
          action={createManualTestimonial}
          className="testimonial-manual-form"
        >

          <div className="admin-form-grid-2">

            <label>

              <span>
                Student engagement
              </span>

              <select
                name="engagementId"
                required
                defaultValue=""
              >

                <option
                  value=""
                  disabled
                >
                  Select a student…
                </option>

                {(engagements || []).map(
                  (item: any) => {

                    const student =
                      one(
                        item.students,
                      );

                    const tutor =
                      one(
                        item.tutors,
                      );


                    return (
                      <option
                        key={item.id}
                        value={item.id}
                      >
                        {student?.name || "Student"} · {item.subject}
                        {tutor?.name ? ` · ${tutor.name}` : ""}
                      </option>
                    );
                  },
                )}

              </select>

            </label>


            <label>

              <span>
                Source
              </span>

              <select
                name="source"
                required
                defaultValue="whatsapp"
              >

                <option value="whatsapp">
                  WhatsApp
                </option>

                <option value="email">
                  Email
                </option>

                <option value="dm">
                  Direct message
                </option>

                <option value="other">
                  Other
                </option>

              </select>

            </label>

          </div>


          <div className="admin-form-grid-2">

            <label>

              <span>
                Rating
              </span>

              <select
                name="rating"
                defaultValue="5"
                required
              >

                <option value="5">
                  5 stars
                </option>

                <option value="4">
                  4 stars
                </option>

                <option value="3">
                  3 stars
                </option>

                <option value="2">
                  2 stars
                </option>

                <option value="1">
                  1 star
                </option>

              </select>

            </label>


            <label>

              <span>
                Public attribution
              </span>

              <input
                name="displayName"
                maxLength={120}
                placeholder="e.g. Postgraduate student"
                required
              />

              <small>
                Avoid the student's full name unless they specifically agreed
                to public identification.
              </small>

            </label>

          </div>


          <label>

            <span>
              Public context
            </span>

            <input
              name="displayContext"
              maxLength={180}
              placeholder="e.g. MSc Finance · Econometrics"
            />

            <small>
              Optional. If blank, the student's recorded academic level and
              subject are used.
            </small>

          </label>


          <label>

            <span>
              Testimonial
            </span>

            <textarea
              name="reviewText"
              maxLength={5000}
              rows={6}
              placeholder="Paste the genuine student feedback here."
              required
            />

          </label>


          <label className="notification-toggle">

            <input
              type="checkbox"
              name="consentToPublish"
            />

            <span>

              <strong>
                Student has given permission for this feedback to be published
              </strong>

              <small>
                Leave this unchecked if you have the feedback but have not yet
                received clear publication permission.
              </small>

            </span>

          </label>


          <label>

            <span>
              Consent evidence
            </span>

            <textarea
              name="consentEvidence"
              maxLength={1500}
              rows={3}
              placeholder='e.g. Student replied on WhatsApp: "Yes, you can use this as a testimonial."'
            />

            <small>
              Internal only. Required if publication consent is checked.
            </small>

          </label>


          <label>

            <span>
              Internal source note
            </span>

            <input
              name="sourceNote"
              maxLength={1500}
              placeholder="e.g. Original WhatsApp message received 18 Nov 2026"
            />

          </label>


          <div className="testimonial-action-row">

            <button
              className="admin-primary-button"
              type="submit"
            >
              Add to moderation queue
            </button>

          </div>

        </form>

      </section>


      <section className="admin-panel admin-detail-card">
        <div className="admin-card-head"><div><span className="admin-eyebrow">Moderation queue</span><h2>Feedback history</h2></div><span>{rows.length} records</span></div>
        <div className="testimonial-admin-list">
          {rows.map((item: any) => {
            const student = one(item.students); const tutor = one(item.tutors); const engagement = one(item.tutoring_engagements);
            return (
              <article key={item.id} className={`testimonial-admin-item testimonial-status-${item.status}`}>
                <div className="testimonial-admin-meta"><div><strong>{student?.name || item.display_name || "Student"}</strong><span>{engagement?.subject || item.subject || "Tutoring"}{tutor?.name ? ` · ${tutor.name}` : ""}</span></div><span className={`admin-status testimonial-${item.status}`}>{item.status}</span></div>
                <div className="testimonial-admin-dates"><span>Requested {dateTime(item.requested_at)}</span>{item.submitted_at ? <span>Submitted {dateTime(item.submitted_at)}</span> : null}{item.approved_at ? <span>Published {dateTime(item.approved_at)}</span> : null}</div>
                {item.review_text ? <><div className="testimonial-admin-rating">{"★".repeat(Number(item.rating || 0))}{"☆".repeat(Math.max(0, 5 - Number(item.rating || 0)))}</div><blockquote>“{item.review_text}”</blockquote><p className="testimonial-public-preview"><strong>Public attribution:</strong> {item.display_name || "—"}{item.display_context ? ` · ${item.display_context}` : ""}</p><p className="testimonial-consent-state">Publication consent: <strong>{item.consent_to_publish ? "Yes" : "No"}</strong></p></> : <p className="admin-muted">Waiting for the student to submit feedback.</p>}
                {item.status !== "requested" ? <form action={moderateTestimonial} className="testimonial-moderation-form"><input type="hidden" name="testimonialId" value={item.id} /><label className="notification-toggle compact"><input type="checkbox" name="featured" defaultChecked={Boolean(item.featured)} disabled={!item.consent_to_publish} /><span><strong>Feature publicly</strong><small>Featured testimonials are prioritised on the homepage.</small></span></label><label><span>Internal moderation note</span><input name="adminNote" defaultValue={item.admin_note || ""} placeholder="Optional internal note" /></label><div className="testimonial-action-row">{item.status !== "approved" ? <button className="admin-primary-button" name="decision" value="approve" type="submit" disabled={!item.consent_to_publish}>Approve & publish</button> : <button className="admin-secondary-button" name="decision" value="unpublish" type="submit">Unpublish</button>}<button className="admin-danger-button" name="decision" value="reject" type="submit">Reject</button></div></form> : null}
              </article>
            );
          })}
          {!rows.length ? <div className="admin-empty">No feedback requests yet. Send the first request above.</div> : null}
        </div>
      </section>
    </div>
  );
}
