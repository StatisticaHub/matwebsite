# Student Learning Portal — Layer Notes

## Purpose

The public site remains education-first and the internal CRM remains operational. This layer connects the two by making the actual tutoring service visible to the student after they start learning with My Academic Tutor.

It deliberately does **not** introduce a tutor marketplace, tutor browsing, payments or automated scheduling.

## Flow

`Educational content → tutoring enquiry → admin lead → student/engagement → learning plan → sessions/homework/resources → secure student portal`

## Routes

- `/admin/portals` — create/revoke portal access, review support requests and homework submissions
- `/portal/[token]` — private student learning record
- `/api/admin/student-portals` — authenticated admin link creation/revocation
- `/api/portal/[token]/support` — token-scoped support request
- `/api/portal/[token]/homework/[homeworkId]` — token-scoped homework submission

## Why token access before student accounts

A student account system adds signup, password recovery, identity lifecycle and RLS ownership requirements. The current tutoring operation does not need that complexity yet. A high-entropy, revocable, expiring link gives students a useful service layer now while keeping the upgrade small and compatible with the existing CRM.

A later layer can migrate portal access to Supabase Auth without changing the underlying teaching records.
