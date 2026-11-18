# Clean repo setup — exact steps

## 1. Put this folder somewhere permanent
Example:

```bash
mkdir -p "$HOME/Documents/website"
cp -R myacademictutor-next "$HOME/Documents/website/"
cd "$HOME/Documents/website/myacademictutor-next"
```

## 2. Install packages

```bash
npm install
```

## 3. Create local environment

```bash
cp .env.example .env.local
```

For the first visual test, no secret is required. The tutoring form operates in local demo mode.

To test real lead email, edit `.env.local` and set `RESEND_API_KEY`.

## 4. Test locally

```bash
npm run typecheck
npm run build
npm run dev
```

Visit:
- http://localhost:3000
- http://localhost:3000/find-a-tutor
- http://localhost:3000/subjects

Submit a test tutoring request.

## 5. Create the new GitHub repository
Create a new empty repository on GitHub, for example `myacademictutor-next`.
Do not add a README or .gitignore on GitHub because this folder already contains them.

Then:

```bash
git init
git add .
git commit -m "Initial tutoring-first rebuild"
git branch -M main
git remote add origin https://github.com/StatisticaHub/myacademictutor-next.git
git push -u origin main
```

Change the repo name in the remote URL if you choose another name.

## 6. New Vercel project
Import the NEW repo as a new Vercel project first. Do not point the existing production domain at it yet.

Environment variables:

```text
NEXT_PUBLIC_SITE_URL=https://your-new-preview-domain.vercel.app
RESEND_API_KEY=...
MAT_LEADS_TO_EMAIL=Contact@myacademictutor.com
MAT_EMAIL_FROM="My Academic Tutor <notifications@myacademictutor.com>"
```

For production email delivery, verify the MAT domain in Resend and use a verified sender address.

## 7. QA before switching the real domain
Test desktop + mobile and check:
- navigation
- every subject page
- Find a Tutor form
- team lead email
- student acknowledgement
- spam/honeypot behaviour
- 404 page
- sitemap.xml
- robots.txt

## 8. Only then move `myacademictutor.com`
Once the preview deployment is approved, attach the production domain to the new Vercel project. Keep the old project available temporarily for rollback.
