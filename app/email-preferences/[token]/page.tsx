import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { unsubscribeLeadEmails } from "./actions";

export const metadata: Metadata = { title: "Email preferences", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function EmailPreferencesPage({ params, searchParams }: { params: Promise<{ token: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { token } = await params;
  const query = await searchParams;
  if (!/^[0-9a-f-]{36}$/i.test(token)) notFound();

  const supabase = createAdminClient();
  const { data: lead } = await supabase.from("tutoring_leads").select("name,subject,marketing_email_consent,marketing_email_unsubscribed_at,nurture_paused").eq("email_preference_token", token).maybeSingle();
  if (!lead) notFound();

  const unsubscribed = Boolean(query.unsubscribed || lead.marketing_email_unsubscribed_at);

  return (
    <main className="preference-page">
      <section className="preference-card">
        <span className="eyebrow">My Academic Tutor</span>
        <h1>Email preferences</h1>
        {unsubscribed ? (
          <>
            <p>Educational and automated follow-up emails have been stopped for this tutoring enquiry.</p>
            <p>If you contact us again about tutoring, the team can still reply directly to the request you make.</p>
            <Link className="button button-secondary" href="/">Return to My Academic Tutor</Link>
          </>
        ) : (
          <>
            <p>Hi {lead.name?.trim().split(/\s+/)[0] || "there"}. This preference applies to the automated follow-up connected with your {lead.subject} enquiry.</p>
            <p>You can stop educational and automated follow-up emails below. This does not prevent us from replying when you directly ask us to handle a tutoring request.</p>
            {query.error ? <p className="form-error">We could not update your preference. Please try again.</p> : null}
            <form action={unsubscribeLeadEmails}>
              <input type="hidden" name="token" value={token}/>
              <button className="button button-primary" type="submit">Stop automated emails</button>
            </form>
          </>
        )}
      </section>
    </main>
  );
}
