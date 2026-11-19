"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function TutorLoginForm() {
  const router = useRouter();
  const [state, setState] = useState({ loading: false, error: "" });

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState({ loading: true, error: "" });
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") || "").trim();
    const password = String(form.get("password") || "");
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      router.push("/tutor");
      router.refresh();
    } catch (error) {
      setState({ loading: false, error: error instanceof Error ? error.message : "Could not sign in." });
    }
  }

  return <form className="tutor-login-form" onSubmit={submit}>
    <label><span>Email</span><input name="email" type="email" autoComplete="email" required /></label>
    <label><span>Password</span><input name="password" type="password" autoComplete="current-password" required /></label>
    <button className="tutor-primary-button" type="submit" disabled={state.loading}>{state.loading ? "Signing in…" : "Sign in"}</button>
    {state.error && <p className="form-error" role="alert">{state.error}</p>}
  </form>;
}
