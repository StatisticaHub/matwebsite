"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import {
  completeStudentPortalSetup,
} from "@/app/portal/setup-actions";

export default function StudentPasswordSetupForm({
  tokenHash,
  type,
}: {
  tokenHash: string;
  type: string;
}) {
  const router = useRouter();

  const [state, setState] = useState({
    loading: false,
    error: "",
  });

  async function submit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setState({
      loading: true,
      error: "",
    });

    const form = new FormData(event.currentTarget);

    const password = String(
      form.get("password") || "",
    );

    const confirmation = String(
      form.get("confirmation") || "",
    );

    if (password !== confirmation) {
      setState({
        loading: false,
        error: "The passwords do not match.",
      });

      return;
    }

    const result =
      await completeStudentPortalSetup(form);

    if (!result.ok) {
      setState({
        loading: false,
        error: result.error,
      });

      return;
    }

    router.push("/portal/me");
    router.refresh();
  }

  return (
    <form
      className="tutor-login-form"
      onSubmit={submit}
    >
      <input
        type="hidden"
        name="tokenHash"
        value={tokenHash}
      />

      <input
        type="hidden"
        name="type"
        value={type}
      />

      <label>
        <span>Choose password</span>

        <input
          name="password"
          type="password"
          minLength={10}
          autoComplete="new-password"
          required
        />
      </label>

      <label>
        <span>Confirm password</span>

        <input
          name="confirmation"
          type="password"
          minLength={10}
          autoComplete="new-password"
          required
        />
      </label>

      <button
        className="tutor-primary-button"
        type="submit"
        disabled={state.loading}
      >
        {state.loading
          ? "Activating…"
          : "Activate my portal"}
      </button>

      {state.error && (
        <p className="form-error" role="alert">
          {state.error}
        </p>
      )}
    </form>
  );
}
