"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";

export type SignupLabels = {
  name: string;
  email: string;
  password: string;
  passwordHint: string;
  submit: string;
  submitting: string;
  errorInUse: string;
  errorWeak: string;
  errorGeneric: string;
};

const inputCls =
  "w-full rounded-md border border-navy/20 bg-white px-3.5 py-2.5 text-sm text-navy focus:border-navy";

export function SignupForm({ labels }: { labels: SignupLabels }) {
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
    const { data, error: authError } = await supabase.auth.signUp({
      email: String(fields.get("email") ?? ""),
      password: String(fields.get("password") ?? ""),
      options: {
        data: { full_name: String(fields.get("name") ?? "") },
        emailRedirectTo: `${window.location.origin}/auth/confirm`,
      },
    });

    if (authError) {
      setPending(false);
      if (authError.code === "user_already_exists") {
        setError(labels.errorInUse);
      } else if (authError.code === "weak_password") {
        setError(labels.errorWeak);
      } else {
        setError(labels.errorGeneric);
      }
      return;
    }

    // Supabase returns an obfuscated user with no identities when the email
    // is already registered — treat it like "already in use".
    if (data.user && data.user.identities?.length === 0) {
      setPending(false);
      setError(labels.errorInUse);
      return;
    }

    router.push("/verify-email");
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <div>
        <label htmlFor="signup-name" className="mb-1.5 block text-sm font-semibold text-navy">
          {labels.name}
        </label>
        <input
          id="signup-name"
          name="name"
          type="text"
          required
          minLength={2}
          maxLength={100}
          autoComplete="name"
          className={inputCls}
        />
      </div>
      <div>
        <label htmlFor="signup-email" className="mb-1.5 block text-sm font-semibold text-navy">
          {labels.email}
        </label>
        <input
          id="signup-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className={inputCls}
        />
      </div>
      <div>
        <label htmlFor="signup-password" className="mb-1.5 block text-sm font-semibold text-navy">
          {labels.password}
        </label>
        <input
          id="signup-password"
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className={inputCls}
        />
        <p className="mt-1.5 text-xs text-steel">{labels.passwordHint}</p>
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
