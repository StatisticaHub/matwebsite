# MAT Lead CRM & Admin Dashboard Setup

This build keeps the approved public website unchanged and adds a private operations layer:

Student tutoring request → Supabase lead record → private `/admin` inbox → status management → tutor assignment → booking/ongoing workflow.

## Architecture

- Public visitors submit only to `POST /api/tutoring-lead`.
- The browser never receives the Supabase secret key.
- The route validates and sanitises the request, then inserts with `SUPABASE_SECRET_KEY`.
- `tutoring_leads`, `tutors` and `lead_activity` have RLS enabled and no `anon`/`authenticated` table grants.
- The admin interface uses Supabase Auth only for identity/session management.
- Admin authorization checks `user.app_metadata.role === "admin"` on the server.
- Only `/admin/*` is covered by the auth-refresh proxy. Public pages never make an auth request.

## 1. Install the pinned Supabase packages

```bash
npm install --save-exact @supabase/supabase-js@2.119.0 @supabase/ssr@0.12.7
```

Commit the generated `package-lock.json` with the project.

## 2. Create a NEW Supabase project

Use a fresh project for this new website rather than the legacy course-platform database.

From the new project's **Connect** / **API Keys** screens copy:

- Project URL
- Publishable key (`sb_publishable_...`)
- Secret key (`sb_secret_...`)

Do not use a secret key in any `NEXT_PUBLIC_` variable.

## 3. Create `.env.local`

```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
SUPABASE_SECRET_KEY=sb_secret_...
ADMIN_EMAIL=your-admin-email@example.com
```

Never commit `.env.local`.

## 4. Create the database tables

In Supabase → SQL Editor, run the contents of:

```text
supabase/setup.sql
```

The SQL enables RLS and explicitly removes direct browser-role access.

## 5. Create the first MAT admin account

In Supabase → Authentication → Users, create the user you want to use for the private dashboard. Use a strong unique password.

Then, from the project folder with the environment variables loaded:

```bash
set -a
source .env.local
set +a
node scripts/set-admin-role.mjs
```

This sets the authorization flag in **app metadata**, not user-editable metadata.

## 6. Test locally

```bash
npm run typecheck
npm run build
npm run dev
```

Test the student flow:

```text
http://localhost:3000/find-a-tutor
```

Submit a real test enquiry. You should receive a `MAT-YYYYMMDD-XXXXXX` reference.

Then visit:

```text
http://localhost:3000/admin/login
```

Sign in with the admin Auth user. Confirm the lead appears in the inbox.

Test:

1. Open the lead.
2. Change New → Contacted → Matching.
3. Add a private note.
4. Add a tutor in `/admin/tutors`.
5. Assign that tutor to the lead.
6. Set a quoted rate.
7. Move the lead to Booked / Ongoing.

## 7. Production environment

Add these environment variables to Vercel:

- `NEXT_PUBLIC_SITE_URL=https://www.myacademictutor.com`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SECRET_KEY`

`ADMIN_EMAIL` is only needed to run the local admin-role script and does not need to be in Vercel.

## What is deliberately NOT connected yet

- Resend email notifications
- AI Tutor model
- Stripe payments
- Calendars / booking
- automated tutor matching

The CRM is intentionally manual first so MAT can learn how leads actually behave before automating matching.
