# My Academic Tutor — Education-First Tutoring Build

This is the current My Academic Tutor website build: a professional tutoring service with an education-first public experience and a private Supabase-backed lead CRM.

## Public positioning

My Academic Tutor is presented as an education and tutoring service, not a tutor marketplace. Students begin with a subject, academic problem or learning goal. Tutor selection remains an internal delivery process.

## Public experience

- Education-first homepage
- Subjects and academic-level pages
- Dedicated tutoring services catalogue
- Regular 1:1 tutoring
- Exam preparation
- University module support
- Master's academic support
- Statistics & data analysis tutoring
- Dissertation & research support
- Coding & statistical software support
- Learning Hub with educational articles
- MAT AI Tutor preview
- Academic integrity, safeguarding, privacy and terms pages
- Responsive navigation, metadata, sitemap and robots

## Operations

The existing backend is preserved:

- Supabase lead storage
- Private `/admin` CRM
- Tutor records and assignment
- Lead status workflow
- Acquisition/UTM capture
- Resend new-lead notification and student acknowledgement

The public website uses learning-focused language while the internal CRM can still use matching/assignment terminology for operations.

## Not connected yet

- Live AI model
- Payments
- Automated booking
- Student accounts
- Tutor accounts
- Automatic tutor matching

See `EDUCATION_FIRST_REDESIGN.md`, `ADMIN_SETUP.md` and `RESEND_SETUP.md` for details.

## Tutoring delivery layer

The admin now supports the post-booking tutoring workflow: students, engagements, academic intake, learning plans, sessions, homework, resources and progress. Existing projects must run `supabase/delivery-layer.sql` before using the new admin routes. See `DELIVERY_LAYER_SETUP.md`.

## Student learning portal

A secure student-facing delivery layer is now included without turning the site into a marketplace or requiring full student accounts. Admins can create expiring/revocable portal links from `/admin/portals`; students can see their learning plan, sessions, homework, feedback and resources, submit homework, and send support requests. Existing projects must run `supabase/student-portal-layer.sql`. See `STUDENT_PORTAL_SETUP.md`.
