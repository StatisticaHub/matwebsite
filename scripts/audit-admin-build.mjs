import fs from "node:fs";

const required = [
  "app/admin/login/page.tsx",
  "app/admin/(protected)/page.tsx",
  "app/admin/(protected)/students/page.tsx",
  "app/admin/(protected)/students/[id]/page.tsx",
  "app/admin/(protected)/sessions/page.tsx",
  "app/admin/(protected)/portals/page.tsx",
  "app/admin/(protected)/onboarding/page.tsx",
  "app/admin/delivery-actions.ts",
  "app/admin/portal-actions.ts",
  "app/admin/onboarding-actions.ts",
  "app/api/admin/student-portals/route.ts",
  "app/api/admin/student-intake-links/route.ts",
  "app/api/intake/[token]/route.ts",
  "app/portal/[token]/page.tsx",
  "app/intake/[token]/page.tsx",
  "lib/student-portal.ts",
  "lib/student-onboarding.ts",
  "lib/supabase/admin.ts",
  "proxy.ts",
  "supabase/setup.sql",
  "supabase/delivery-layer.sql",
  "supabase/student-portal-layer.sql",
  "supabase/onboarding-layer.sql",
];

const missing = required.filter((file) => !fs.existsSync(file));
if (missing.length) { console.error("Missing admin/delivery files:\n" + missing.map((file) => `- ${file}`).join("\n")); process.exit(1); }

const proxy = fs.readFileSync("proxy.ts", "utf8");
if (!proxy.includes('matcher: ["/admin/:path*", "/api/admin/:path*"]')) {
  console.error("Admin auth proxy must cover /admin and /api/admin."); process.exit(1);
}

const layers = [
  ["supabase/setup.sql", ["tutoring_leads","tutors","lead_activity"]],
  ["supabase/delivery-layer.sql", ["students","tutoring_engagements","learning_plan_items","tutoring_sessions","homework","learning_resources"]],
  ["supabase/student-portal-layer.sql", ["student_portal_links","student_support_requests","homework_submissions"]],
  ["supabase/onboarding-layer.sql", ["student_onboarding","student_intake_links"]],
];
for (const [file, tables] of layers) {
  const sql = fs.readFileSync(file, "utf8");
  for (const table of tables) {
    if (!sql.includes(`alter table public.${table} enable row level security`)) {
      console.error(`RLS enable statement missing for ${table} in ${file}.`); process.exit(1);
    }
    if (!sql.includes(`revoke all on table public.${table} from anon, authenticated`)) {
      console.error(`Browser-role revoke missing for ${table} in ${file}.`); process.exit(1);
    }
  }
}

for (const file of ["lib/student-portal.ts","lib/student-onboarding.ts"]) {
  const source = fs.readFileSync(file, "utf8");
  if (!source.includes('createHash("sha256")') || !source.includes("randomBytes(32)")) {
    console.error(`Token hashing/randomness check failed for ${file}.`); process.exit(1);
  }
}

console.log("MAT admin + CRM + delivery + portal + onboarding audit passed.");
