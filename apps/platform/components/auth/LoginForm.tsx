"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";

export type LoginLabels = {
  email: string;
  password: string;
  submit: string;
  submitting: string;
  errorInvalid: string;
  errorUnconfirmed: string;
  errorGeneric: string;
};

const inputCls =
  "w-full rounded-md border border-navy/20 bg-white px-3.5 py-2.5 text-sm text-navy focus:border-navy";

export function LoginForm({ labels }: { labels: LoginLabels }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    setError(null);

    const fields = new FormData(event.currentTarget);
    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: String(fields.get("email") ?? ""),
      password: String(fields.get("password") ?? ""),
    });

    if (authError) {
      setPending(false);
      if (authError.code === "invalid_credentials") {
        setError(labels.errorInvalid);
      } else if (authError.code === "email_not_confirmed") {
        setError(labels.errorUnconfirmed);
      } else {
        setError(labels.errorGeneric);
      }
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <div>
        <label htmlFor="login-email" className="mb-1.5 block text-sm font-semibold text-navy">
          {labels.email}
        </label>
        <input
          id="login-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className={inputCls}
        />
      </div>
      <div>
        <label htmlFor="login-password" className="mb-1.5 block text-sm font-semibold text-navy">
          {labels.password}
        </label>
        <input
          id="login-password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className={inputCls}
        />
      </div>

      {error ? (
        <p role="alert" className="rounded-md bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-800">
          {error}
        </p>
      ) : null}

      <Button type="submit" size="lg" disabled={pending}>
        {pending ? labels.submitting : labels.submit}
      </Button>
    </form>
  );
}
