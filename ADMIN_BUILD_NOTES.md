# Admin build — what was added

## Lead capture
- Real Supabase persistence when configured.
- Demo fallback when Supabase is absent.
- Lead reference IDs.
- UTM source / medium / campaign / term / content capture.
- Landing URL and referrer capture.
- Honeypot protection and server-side validation.

## Private admin
- `/admin/login`
- `/admin` lead inbox and status filters.
- `/admin/leads/[id]` lead detail view.
- private notes / activity history.
- lead status workflow.
- tutor assignment and quoted rate.
- mailto / WhatsApp contact shortcuts.
- acquisition-source view.

## Tutor operations
- `/admin/tutors`
- lightweight tutor records.
- subjects, levels, timezone, internal rate and availability.
- verified flag.
- active/inactive status.

## Security model
Public pages do not depend on Supabase Auth. The proxy is scoped to `/admin/:path*` only. Database tables are not directly granted to browser roles; the server checks the admin session before privileged access.

## Transactional email notifications

Version 2.2 adds Resend after lead persistence. Email failure does not roll back a lead.

Activity events include:
- `team_notification_sent` / `team_notification_failed` / `team_notification_skipped`
- `student_acknowledgement_sent` / `student_acknowledgement_failed` / `student_acknowledgement_skipped`

See `RESEND_SETUP.md`.
