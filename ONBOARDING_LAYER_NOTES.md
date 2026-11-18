# Student Onboarding + Communication Layer

This layer completes the operational path from tutoring lead to prepared learner without turning My Academic Tutor into a tutor marketplace.

## What it adds

- Admin onboarding dashboard at `/admin/onboarding`.
- Secure, expiring, revocable learning-intake links.
- Student intake covering course context, goals, confidence, strengths, weak topics, learning preferences, availability and optional adjustments.
- Readiness indicators for intake, tutor assignment, portal access and first-session planning.
- Admin review status and internal notes.
- One-click transfer of reviewed intake details into the active tutoring engagement.
- **Create & email** controls for intake and student-portal links through Resend.
- Optional student email when a session is created/updated or homework is assigned/updated.
- Per-student communication log showing `sent`, `failed` or `skipped` delivery outcomes.
- Copy-ready email drafts remain available as a manual fallback.

## Security model

- Intake and portal tokens are random; the database stores only SHA-256 hashes plus short previews.
- Public visitors receive no direct database grants for onboarding or communication tables.
- Intake reads/writes are mediated by Next.js server routes using the server-only Supabase secret key.
- Resend API keys remain server-only and must never use a `NEXT_PUBLIC_` prefix.
- Creating a new intake or portal link revokes the previous active link for that student.
- Communication logs never store raw intake or portal tokens.
- A small honeypot and request-size limit reduce low-effort automated intake abuse.

## Communication behavior

Email is always explicit for student delivery actions:

- Intake / portal: choose **Create link** or **Create & email**.
- Session / homework: tick **Email student** before saving.

If Resend is unavailable, the underlying tutoring record is still saved. The communication log records the failure or skipped state.

## Deliberately not added yet

- Payments or invoices.
- Public tutor profiles or tutor browsing.
- Student password accounts.
- Calendar booking integration.
- Automated marketing/bulk email.

These can be layered on later without changing the core onboarding data model.
