# Tutoring Delivery Layer — design notes

The delivery layer is intentionally separate from lead acquisition.

A **student** is the long-term learner record. A **tutoring engagement** represents one period or subject of tutoring for that student. This lets the same learner later have another engagement without duplicating the student record.

The academic intake stores the information needed to teach well: programme/institution, module, goal, target, weak topics, confidence, upcoming deadline, learning preference and an internal assessment summary.

Learning-plan topics use four progress states:

- Needs work
- Developing
- Comfortable
- Mastered

Sessions can be Planned, Completed, Cancelled or No show. Completed sessions can record lesson notes, understanding (1–5), the next topic and a homework summary.

Homework and learning resources remain lightweight in this first version. Resources are links/notes/worksheet references rather than Supabase Storage uploads. This avoids adding storage permissions and student-facing accounts before they are operationally needed.
