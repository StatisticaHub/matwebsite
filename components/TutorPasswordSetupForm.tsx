"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function TutorPasswordSetupForm() {
  const router = useRouter();
  const [state, setState] = useState({ loading: false, error: "" });
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState({ loading: true, error: "" });
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") || "");
    const confirm = String(form.get("confirmPassword") || "");
    if (password.length < 10) return setState({ loading: false, error: "Use at least 10 characters." });
    if (password !== confirm) return setState({ loading: false, error: "Passwords do not match." });
    try {
      const supabase = createClient();
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) throw new Error("This access link is invalid or has expired. Ask the MAT team to send a new portal link.");
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      router.push("/tutor");
      router.refresh();
    } catch (error) {
      setState({ loading: false, error: error instanceof Error ? error.message : "Could not set password." });
    }
  }
  return <form className="tutor-login-form" onSubmit={submit}>
    <label><span>New password</span><input name="password" type="password" minLength={10} autoComplete="new-password" required /></label>
    <label><span>Confirm password</span><input name="confirmPassword" type="password" minLength={10} autoComplete="new-password" required /></label>
    <button className="tutor-primary-button" type="submit" disabled={state.loading}>{state.loading ? "Saving…" : "Set password and open portal"}</button>
    {state.error && <p className="form-error" role="alert">{state.error}</p>}
  </form>;
}
