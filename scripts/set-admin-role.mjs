import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secret = process.env.SUPABASE_SECRET_KEY;
const email = process.env.ADMIN_EMAIL;

if (!url || !secret || !email) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SECRET_KEY or ADMIN_EMAIL.");
  process.exit(1);
}

const supabase = createClient(url, secret, {
  auth: { autoRefreshToken: false, persistSession: false },
});

let page = 1;
let user;
while (!user && page <= 20) {
  const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 100 });
  if (error) throw error;
  user = data.users.find((candidate) => candidate.email?.toLowerCase() === email.toLowerCase());
  if (data.users.length < 100) break;
  page += 1;
}

if (!user) {
  console.error(`No Supabase Auth user found for ${email}. Create the user in Authentication > Users first.`);
  process.exit(1);
}

const appMetadata = { ...(user.app_metadata || {}), role: "admin" };
const { error } = await supabase.auth.admin.updateUserById(user.id, { app_metadata: appMetadata });
if (error) throw error;

console.log(`Admin role assigned to ${email}.`);
