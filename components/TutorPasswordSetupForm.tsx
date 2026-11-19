"use client";

import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { completeTutorPortalSetup } from "@/app/tutor/setup-actions";

export default function TutorPasswordSetupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [state, setState] = useState({ loading: false, error: "" });

  const tokenHash = searchParams.get("token_hash") || "";
  const type = searchParams.get("type") || "";
  const linkReady = Boolean(tokenHash && ["invite", "recovery"].includes(type));

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState({ loading: true, error: "" });

    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") || "");
    const confirm = String(form.get("confirmPassword") || "");

    if (!linkReady) {
      return setState({
        loading: false,
        error: "This portal link is incomplete. Ask the MAT team to send a new access link.",
      });
    }

    if (password.length < 10) {
      return setState({ loading: false, error: "Use at least 10 characters." });
    }

    if (password !== confirm) {
      return setState({ loading: false, error: "Passwords do not match." });
    }

    try {
      const payload = new FormData();
      payload.set("tokenHash", tokenHash);
      payload.set("type", type);
      payload.set("password", password);

      const result = await completeTutorPortalSetup(payload);
      if (!result.ok) {
        return setState({ loading: false, error: result.error });
      }

      router.replace("/tutor");
      router.refresh();
    } catch (error) {
      setState({
        loading: false,
        error: error instanceof Error ? error.message : "Could not set password.",
      });
    }
  }

  return (
    <form className="tutor-login-form" onSubmit={submit}>
      <label>
        <span>New password</span>
        <input
          name="password"
          type="password"
          minLength={10}
          autoComplete="new-password"
          required
          disabled={!linkReady}
        />
      </label>
      <label>
        <span>Confirm password</span>
        <input
          name="confirmPassword"
          type="password"
          minLength={10}
          autoComplete="new-password"
          required
          disabled={!linkReady}
        />
      </label>
      <button
        className="tutor-primary-button"
        type="submit"
        disabled={state.loading || !linkReady}
      >
        {state.loading ? "Saving…" : "Set password and open portal"}
      </button>
      {!linkReady && !state.error ? (
        <p className="form-error" role="alert">
          This portal link is incomplete. Ask the MAT team to send a new access link.
        </p>
      ) : null}
      {state.error ? (
        <p className="form-error" role="alert">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
