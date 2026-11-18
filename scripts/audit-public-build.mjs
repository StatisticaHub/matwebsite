import fs from "node:fs";

const required = [
  "app/page.tsx","app/find-a-tutor/page.tsx","app/subjects/page.tsx","app/subjects/[slug]/page.tsx",
  "app/levels/page.tsx","app/levels/[slug]/page.tsx","app/tutoring/page.tsx","app/how-it-works/page.tsx",
  "app/ai-tutor/page.tsx","app/tutors/page.tsx","app/become-a-tutor/page.tsx","app/resources/page.tsx",
  "app/resources/[slug]/page.tsx","app/about/page.tsx","app/faq/page.tsx","app/contact/page.tsx",
  "app/academic-integrity/page.tsx","app/safeguarding/page.tsx","app/privacy/page.tsx","app/terms/page.tsx",
  "components/TutoringLeadForm.tsx","lib/tutoring-data.ts","app/api/tutoring-lead/route.ts","app/robots.ts"
];
const missing = required.filter((file) => !fs.existsSync(file));
if (missing.length) { console.error("Missing required public files:", missing); process.exit(1); }

const route = fs.readFileSync("app/api/tutoring-lead/route.ts", "utf8");
if (!route.includes("createAdminClient") || !route.includes("sendStudentAcknowledgement")) {
  console.error("Live lead route is missing CRM/email integration."); process.exit(1);
}

const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
for (const dep of ["next", "@supabase/supabase-js", "@supabase/ssr", "resend"]) {
  if (!pkg.dependencies?.[dep]) { console.error(`Missing required dependency: ${dep}`); process.exit(1); }
}

const robots = fs.readFileSync("app/robots.ts", "utf8");
for (const path of ["/admin/", "/api/", "/portal/", "/intake/"]) {
  if (!robots.includes(`\"${path}\"`)) { console.error(`robots.ts does not disallow ${path}`); process.exit(1); }
}

const clientFiles = ["components/TutoringLeadForm.tsx","components/PortalAccessManager.tsx","components/IntakeAccessManager.tsx","components/StudentIntakeForm.tsx"];
for (const file of clientFiles) {
  const source = fs.readFileSync(file, "utf8");
  if (source.includes("SUPABASE_SECRET_KEY") || source.includes("RESEND_API_KEY")) {
    console.error(`Server secret referenced from client component: ${file}`); process.exit(1);
  }
}

console.log(`Public/live build audit passed: ${required.length} core files present, integrations attached, private routes excluded from indexing, no server secrets in client components.`);
