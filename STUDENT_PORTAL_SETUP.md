# Student Learning Portal — Setup

This layer sits on top of the existing tutoring-delivery schema. It gives each active student a secure, passwordless learning-record link while keeping the database private.

## 1. Prerequisites

The existing CRM and tutoring-delivery migrations must already be installed:

1. `supabase/setup.sql`
2. `supabase/delivery-layer.sql`
3. `supabase/student-portal-layer.sql` (this layer)

Do not run the portal migration before the delivery layer because it references `students`, `tutoring_engagements` and `homework`.

## 2. Run the portal SQL

Open Supabase → SQL Editor, paste `supabase/student-portal-layer.sql`, and run it once.

It creates:

- `student_portal_links` — hashed, expiring and revocable portal access
- `student_support_requests` — questions sent by students from the portal
- `homework_submissions` — notes/links submitted against assigned homework

All three tables have RLS enabled and direct `anon` / `authenticated` table access revoked. Portal reads/writes are mediated by Next.js server routes using the server-only Supabase secret key after a portal token is validated.

## 3. Environment

Keep the existing Supabase variables and add the public site origin:

```text
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
SUPABASE_SECRET_KEY=...
NEXT_PUBLIC_SITE_URL=https://www.myacademictutor.com
```

Never expose `SUPABASE_SECRET_KEY` with a `NEXT_PUBLIC_` prefix.

## 4. Start locally

```bash
npm install
npm run typecheck
npm run build
npm run dev
```

Open:

- Admin: `http://localhost:3000/admin`
- Portal management: `http://localhost:3000/admin/portals`

## 5. Create a student portal

1. Open `/admin/portals` or use **Portal access** from a student record.
2. Choose the expiry period.
3. Select **Create portal link**.
4. Copy the generated link and send it to the student.

Only the newly generated raw link can be copied. The database stores only its SHA-256 hash and a short preview. Generating a replacement automatically revokes the old active link.

## 6. Student experience

The portal shows only delivery information intended for the learner:

- subject, current focus and deadline
- learning-plan progress
- upcoming and completed sessions
- homework and tutor feedback
- shared learning resources
- assigned tutor name
- support-request form

Internal rates, tutor pay, margin and internal CRM notes are not displayed.

Students can submit a homework note and an optional HTTP/HTTPS link. When submitted, an `assigned` homework item is moved to `submitted` and the admin can review it from `/admin/portals` or the student delivery record.

## 7. Security behaviour

- portal tokens use 32 random bytes and are stored as hashes only
- links can be revoked and expire automatically
- portal pages are `noindex`, `/portal/` is disallowed in `robots.txt`, and portal responses use `no-store` + `no-referrer` headers
- the browser receives no Supabase secret key
- direct browser roles cannot query the portal tables
- portal API writes use same-origin checks and bounded input lengths
- student support submissions are rate-limited to 5 requests per portal link within 10 minutes
- resource/submission links shown in the UI allow only `http` and `https`

Treat a portal URL like a private document link. If a student forwards or loses it, revoke it from `/admin/portals` and generate a replacement.

## 8. Production test

Before sharing a real portal link, test one dummy student end-to-end:

1. create a student and active tutoring engagement
2. add two learning-plan topics
3. add one planned and one completed session
4. assign homework
5. add a resource
6. generate a portal link
7. open the link in a private/incognito browser
8. submit homework from the portal
9. send a support request
10. verify both appear in `/admin/portals`
11. revoke the link and verify it stops working
