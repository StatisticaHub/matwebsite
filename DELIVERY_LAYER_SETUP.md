# MAT Tutoring Delivery Layer

This upgrade adds the operational layer that begins after a tutoring lead is booked.

## What it adds

- Students
- Tutoring engagements
- Academic intake / initial assessment
- Learning plans and topic progress
- Planned and completed sessions
- Homework and tutor feedback
- Materials / resource links
- Internal student/tutor rates and per-session margin visibility
- Lead → student conversion without re-entering lead details
- Delivery metrics on the admin dashboard

The public education-first website, existing CRM, Resend integration and `.env.local` are not replaced.

## Install order

### 1. Run the database upgrade first

In the MAT Supabase project open **SQL Editor → New query**.

Open the local file:

```text
supabase/delivery-layer.sql
```

Copy all of it into Supabase and click **Run**. A normal successful result is `Success. No rows returned`.

The SQL creates:

```text
students
tutoring_engagements
learning_plan_items
tutoring_sessions
homework
learning_resources
```

All six tables have RLS enabled. `anon` and `authenticated` receive no direct table access; the existing server-only secret-key client performs internal operations after MAT admin authorization.

### 2. Apply the website/admin upgrade

From the existing working project root:

```bash
bash ~/Downloads/mat-delivery-upgrade/apply-delivery-upgrade.sh
```

The installer makes a timestamped backup under `.mat-backups/` and does not modify `.env.local`.

### 3. Start the site

```bash
npm run dev
```

Open:

```text
http://localhost:3000/admin
```

The admin sidebar now includes **Students** and **Sessions**.

## First end-to-end test

1. Open an existing booked/test lead.
2. In **Tutoring delivery**, choose **Create student record**.
3. Add academic intake details and create the engagement.
4. The lead is moved to `Ongoing` and you are redirected to the new student record.
5. Add one learning-plan topic.
6. Add one planned or completed session.
7. Assign one homework item.
8. Add one resource link.
9. Change topic progress from `Needs work` to `Developing`.
10. Open **Admin → Sessions** and confirm the lesson appears there.

## Operating model

```text
Lead
  ↓
Tutor assigned / tutoring agreed
  ↓
Student + engagement
  ↓
Academic intake
  ↓
Learning plan
  ↓
Sessions
  ↓
Homework + resources
  ↓
Progress updates
  ↓
Ongoing tutoring
```

This is deliberately admin-first. Student accounts, automated scheduling, Stripe and file uploads are not introduced yet.

## Next layer: student learning portal

After the delivery layer is working, run `supabase/student-portal-layer.sql` and follow `STUDENT_PORTAL_SETUP.md`. This exposes a controlled, student-facing view of the delivery record using revocable passwordless links while keeping internal finance and CRM notes private.
