const required = ["RESEND_API_KEY", "MAT_EMAIL_FROM", "MAT_LEADS_TO_EMAIL", "MAT_REPLY_TO_EMAIL"];
let ok = true;
for (const key of required) {
  const present = Boolean(process.env[key]?.trim());
  console.log(`${key}: ${present ? "✓" : "MISSING"}`);
  if (!present) ok = false;
}
if (!ok) process.exitCode = 1;
