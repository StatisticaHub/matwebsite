# Professional refinement — November 2026

This version is a front-end refinement of the no-integrations public build.

## What changed

- Reframed the homepage around a clearer premium proposition: the right tutor for the way the student learns.
- Removed the prominent build/preview banner from the customer journey.
- Replaced overly rounded/pill-heavy UI with a more restrained editorial design.
- Tightened the primary palette to deep navy, cobalt blue, cool white and soft neutral surfaces.
- Increased text contrast and simplified muted text colours.
- Reworked hero layout into an example tutor-matching brief rather than a generic four-step card.
- Rewrote homepage, tutoring, Find a Tutor, subjects, levels, About, FAQ, Contact and tutor-standard copy.
- Improved form labels and changed the main form action to a clearer `Request a tutor match` / `Submit tutoring request`.
- Reduced internal/product language from public-facing copy.
- Updated footer language and navigation hierarchy.
- Kept live integrations disabled.

## Visual system

Primary navy: #0B1F3A
Primary blue: #1F5BD8
Primary text: #10233F
Muted text: #5D6B7E
Surface: #F7F9FC
Soft blue: #EDF4FF
Border: #DCE4EE

Typography uses a high-quality dependency-free system stack for body text and a classic editorial serif stack for display headings.

## Validation

The changed TSX files were syntax-parsed with TypeScript in the build environment. Full Next.js build validation should be run locally after `npm install` because dependencies are intentionally not included in the ZIP.

Run:

```bash
npm install
npm run typecheck
npm run build
npm run dev
```
