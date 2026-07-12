"use client";

import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";

export type ChangePasswordLabels = {
  current: string;
  new: string;
  confirm: string;
  hint: string;
  submit: string;
  submitting: string;
  success: string;
  errorWrongCurrent: string;
  errorWeak: string;
  errorMismatch: string;
  errorSame: string;
  errorGeneric: string;
};

const inputCls =
  "w-full rounded-md border border-navy/20 bg-white px-3.5 py-2.5 text-sm text-navy focus:border-navy";

export function ChangePasswordForm({
  email,
  labels,
}: {
  email: string;
  labels: ChangePasswordLabels;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    setError(null);
    setDone(false);

    const form = event.currentTarget;
    const fields = new FormData(form);
    const currentPassword = String(fields.get("currentPassword") ?? "");
    const newPassword = String(fields.get("newPassword") ?? "");
    const confirmPassword = String(fields.get("confirmPassword") ?? "");

    if (newPassword !== confirmPassword) {
      setPending(false);
      setError(labels.errorMismatch);
      return;
    }
    if (newPassword === currentPassword) {
      setPending(false);
      setError(labels.errorSame);
      return;
    }

    const supabase = createClient();

    // Re-authenticate before changing the password — Supabase's updateUser
    // only requires a valid session, so verify the current password first.
    const { error: reauthError } = await supabase.auth.signInWithPassword({
      email,
      password: currentPassword,
    });
    if (reauthError) {
      setPending(false);
      setError(
        reauthError.code === "invalid_credentials"
          ? labels.errorWrongCurrent
          : labels.errorGeneric,
      );
      return;
    }

    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });
    setPending(false);
    if (updateError) {
      if (updateError.code === "weak_password") {
        setError(labels.errorWeak);
      } else if (updateError.code === "same_password") {
        setError(labels.errorSame);
      } else {
        setError(labels.errorGeneric);
      }
      return;
    }

    form.reset();
    setDone(true);
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <div>
        <label
          htmlFor="current-password"
          className="mb-1.5 block text-sm font-semibold text-navy"
        >
          {labels.current}
        </label>
        <input
          id="current-password"
          name="currentPassword"
          type="password"
          required
          autoComplete="current-password"
          className={inputCls}
        />
      </div>
      <div>
        <label
          htmlFor="new-password"
          className="mb-1.5 block text-sm font-semibold text-navy"
        >
          {labels.new}
        </label>
        <input
          id="new-password"
          name="newPassword"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className={inputCls}
        />
        <p className="mt-1.5 text-xs text-steel">{labels.hint}</p>
      </div>
      <div>
        <label
          htmlFor="confirm-password"
          className="mb-1.5 block text-sm font-semibold text-navy"
        >
          {labels.confirm}
        </label>
        <input
          id="confirm-password"
          name="confirmPassword"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className={inputCls}
        />
      </div>

      {error ? (
        <p
          role="alert"
          className="rounded-md bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-800"
        >
          {error}
        </p>
      ) : null}
      {done ? (
        <p
          role="status"
          className="rounded-md bg-emerald-50 px-3.5 py-2.5 text-sm font-medium text-emerald-800"
        >
          {labels.success}
        </p>
      ) : null}

      <Button type="submit" size="lg" disabled={pending}>
        {pending ? labels.submitting : labels.submit}
      </Button>
    </form>
  );
}
