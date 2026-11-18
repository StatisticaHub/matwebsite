# Onboarding + transactional student email setup

Run this after the Student Portal layer is already installed.

## 1. Database

In Supabase SQL Editor, run:

```text
supabase/onboarding-layer.sql
```

It creates the learning-intake tables and a server-only `student_communications` delivery log. Existing students are backfilled with onboarding rows.

## 2. Resend environment

The domain `myacademictutor.com` must be verified in Resend. Add these variables locally in `.env.local` and in Vercel Production:

```env
RESEND_API_KEY=re_...
MAT_EMAIL_FROM="My Academic Tutor <notifications@myacademictutor.com>"
MAT_LEADS_TO_EMAIL=Contact@myacademictutor.com
MAT_REPLY_TO_EMAIL=Contact@myacademictutor.com
NEXT_PUBLIC_SITE_URL=https://www.myacademictutor.com
```

Keep `RESEND_API_KEY` and `SUPABASE_SECRET_KEY` server-only. Never prefix them with `NEXT_PUBLIC_`.

## 3. Verify the build

```bash
npm install
npm run typecheck
npm run build
npm run dev
```

## 4. Test safely

Use a test student/email address first:

1. Open `/admin/onboarding`.
2. Click **Create & email** for a test student.
3. Confirm the email arrives and the secure intake link opens.
4. Submit the intake and review it in the admin dashboard.
5. Open `/admin/portals` and use **Create & email**.
6. On the student record, add a session or homework item with **Email student** ticked.
7. Confirm the Student communications section shows `sent` and the messages arrive.

If an email fails, the tutoring/onboarding record remains saved and the delivery log records the failure.
