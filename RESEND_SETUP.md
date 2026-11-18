# Resend transactional email setup

`myacademictutor.com` is the sending domain for transactional My Academic Tutor email.

This build uses Resend for:

- internal new-lead notifications;
- student enquiry acknowledgements;
- learning-intake invitations;
- student-portal invitations;
- optional tutoring-session updates;
- optional homework assignment / feedback updates.

Email delivery is designed not to destroy the underlying tutoring record when an email provider call fails. Lead email outcomes are written to `lead_activity`; student delivery outcomes are written to `student_communications`.

## Environment variables

```env
RESEND_API_KEY=re_...
MAT_EMAIL_FROM="My Academic Tutor <notifications@myacademictutor.com>"
MAT_LEADS_TO_EMAIL=Contact@myacademictutor.com
MAT_REPLY_TO_EMAIL=Contact@myacademictutor.com
NEXT_PUBLIC_SITE_URL=https://www.myacademictutor.com
```

`RESEND_API_KEY` is server-only. Never prefix it with `NEXT_PUBLIC_` and never commit `.env.local`.

The From address does not need to be a Google Workspace inbox as long as the sending domain is verified in Resend. Replies are directed to `MAT_REPLY_TO_EMAIL`.

## Local validation

```bash
node scripts/check-email-env.mjs
npm run email:test
npm run typecheck
npm run build
npm run dev
```

Submit a test enquiry and use a test student from the admin dashboard before sending to real students.

## Vercel

Add the same variables under Vercel → Project → Settings → Environment Variables for Production, then redeploy. Environment changes do not affect an already-built deployment until it is redeployed.
