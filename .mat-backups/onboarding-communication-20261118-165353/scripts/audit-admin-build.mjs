import fs from "node:fs";

const required = [
  "app/api/tutoring-lead/route.ts",
  "app/admin/login/page.tsx",
  "app/admin/(protected)/page.tsx",
  "app/admin/(protected)/leads/[id]/page.tsx",
  "app/admin/(protected)/tutors/page.tsx",
  "app/admin/(protected)/students/page.tsx",
  "app/admin/(protected)/students/[id]/page.tsx",
  "app/admin/(protected)/sessions/page.tsx",
  "app/admin/actions.ts",
  "app/admin/delivery-actions.ts",
  "components/AdminLoginForm.tsx",
  "components/AdminSignOutButton.tsx",
  "lib/admin-auth.ts",
  "lib/admin-data.ts",
  "lib/delivery-data.ts",
  "lib/supabase/admin.ts",
  "lib/supabase/client.ts",
  "lib/supabase/server.ts",
  "proxy.ts",
  "supabase/setup.sql",
  "supabase/delivery-layer.sql",
  "ADMIN_SETUP.md",
];

const missing = required.filter((file) => !fs.existsSync(file));
if (missing.length) {
  console.error("Missing admin-build files:\n" + missing.map((file) => `- ${file}`).join("\n"));
  process.exit(1);
}

const proxy = fs.readFileSync("proxy.ts", "utf8");
if (!proxy.includes('matcher: ["/admin/:path*"]')) {
  console.error("Admin auth proxy is not scoped to /admin only.");
  process.exit(1);
}

const sql = fs.readFileSync("supabase/setup.sql", "utf8");
for (const table of ["tutoring_leads", "tutors", "lead_activity", "students", "tutoring_engagements", "learning_plan_items", "tutoring_sessions", "homework", "learning_resources"]) {
  if (!sql.includes(`alter table public.${table} enable row level security`)) {
    console.error(`RLS enable statement missing for ${table}.`);
    process.exit(1);
  }
}

console.log("MAT admin/CRM + tutoring delivery audit passed.");
