import Link from "next/link";
import { redirect } from "next/navigation";
import AdminLoginForm from "@/components/AdminLoginForm";
import { getAdminSession } from "@/lib/admin-auth";
import { hasPublicSupabaseConfig } from "@/lib/supabase/config";

export const metadata = { title: "Admin sign in", robots: { index: false, follow: false } };

export default async function AdminLoginPage() {
  const session = await getAdminSession();
  if (session) redirect("/admin");

  const configured = hasPublicSupabaseConfig();

  return (
    <div className="admin-login-shell">
      <div className="admin-login-card">
        <Link href="/" className="admin-wordmark">My Academic Tutor</Link>
        <span className="admin-kicker">Private team area</span>
        <h1>Admin sign in</h1>
        <p>Manage tutoring enquiries, matching progress and tutor records.</p>
        {configured ? (
          <AdminLoginForm />
        ) : (
          <div className="admin-setup-notice">
            <strong>Supabase is not connected yet.</strong>
            <p>Add the three Supabase environment variables described in <code>ADMIN_SETUP.md</code>, then restart the app.</p>
          </div>
        )}
        <Link href="/" className="admin-back-link">← Return to website</Link>
      </div>
    </div>
  );
}
