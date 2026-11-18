# Resend notifications setup

This build sends two transactional emails after a tutoring lead is safely saved to Supabase:

1. **MAT team notification** — a structured summary of the lead with a direct admin-dashboard link. Its Reply-To address is the student's email.
2. **Student acknowledgement** — confirms receipt, includes the MAT reference, and explains what happens next. Its Reply-To address is MAT.

Email delivery is intentionally **non-blocking**. If Resend is down or misconfigured, the lead still remains in `tutoring_leads`. The success/failure of each email is written to `lead_activity`.

## 1. Install dependencies

```bash
npm install
```

The project pins `resend` in `package.json`.

## 2. Verify your sending domain in Resend

In the Resend dashboard, add and verify `myacademictutor.com` for sending. Complete the DNS records Resend asks for before sending production email to students.

## 3. Add environment variables

Add these to `.env.local` alongside your working Supabase values:

```env
RESEND_API_KEY=re_...
MAT_EMAIL_FROM="My Academic Tutor <notifications@myacademictutor.com>"
MAT_LEADS_TO_EMAIL=Contact@myacademictutor.com
MAT_REPLY_TO_EMAIL=Contact@myacademictutor.com
```

`RESEND_API_KEY` is server-only. Never prefix it with `NEXT_PUBLIC_` and never commit `.env.local`.

If you have not verified the MAT domain yet, keep the code installed but leave the Resend variables unset. Lead storage and the admin CRM continue to work; the activity log will show that email was skipped.

## 4. Restart Next.js

```bash
rm -rf .next
npm run typecheck
npm run build
npm run dev
```

## 5. Test end to end

Submit a new request at:

`http://localhost:3000/find-a-tutor`

Then confirm:

- the lead exists in `/admin`;
- MAT received a `[MAT Lead]` email;
- the student received an acknowledgement;
- the lead's Activity section contains `team notification sent` and `student acknowledgement sent`.

If an email fails, the Activity section will record `*_failed` with Resend's error message, while the lead remains stored.

## Production / Vercel

Add the same four Resend environment variables in Vercel for Production (and Preview if desired), then redeploy.

Use the production site URL for `NEXT_PUBLIC_SITE_URL`, e.g.:

```env
NEXT_PUBLIC_SITE_URL=https://www.myacademictutor.com
```
