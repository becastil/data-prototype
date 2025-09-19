"use client";

import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

export default function SignInPage() {
  const params = useSearchParams();
  const callbackUrl = params.get("callbackUrl") ?? "/";
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");

    setIsSubmitting(true);
    setError(null);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl
    });

    if (result?.error) {
      setError("Invalid credentials");
      setIsSubmitting(false);
      return;
    }

    if (result?.ok) {
      window.location.href = result.url ?? callbackUrl;
    } else {
      setError("Sign-in failed");
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-50 py-12 px-4">
      <div className="w-full max-w-md space-y-6">
        <h1 className="text-2xl font-semibold text-center">Healthcare Analytics Dashboard</h1>
        <form onSubmit={handleSubmit} className="space-y-4 bg-slate-900/60 border border-slate-800 rounded-xl p-6 shadow-xl">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-300">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="mt-1 block w-full rounded-md bg-slate-950/80 border border-slate-800 px-3 py-2 text-slate-50 focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-300">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="mt-1 block w-full rounded-md bg-slate-950/80 border border-slate-800 px-3 py-2 text-slate-50 focus:border-blue-500 focus:outline-none"
            />
          </div>
          {error ? <p className="text-sm text-red-400" role="alert">{error}</p> : null}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-md bg-blue-500 py-2 font-medium text-white transition hover:bg-blue-400 disabled:opacity-60"
          >
            {isSubmitting ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
