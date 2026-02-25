"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { normalizeNextPath } from "@/lib/navigation";

type Mode = "sign-in" | "create";

function validatePassword(password: string) {
  return {
    minLength: password.length >= 8,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    symbol: /[^A-Za-z0-9]/.test(password),
  };
}

export function EmailPasswordAuthForm() {
  const [mode, setMode] = useState<Mode>("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const params = useSearchParams();
  const router = useRouter();

  const requirements = useMemo(() => validatePassword(password), [password]);
  const allRequirementsMet = Object.values(requirements).every(Boolean);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);

    const supabase = createSupabaseBrowserClient();
    const next = normalizeNextPath(params.get("next"));

    if (mode === "sign-in") {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError) {
        setError(signInError.message);
        setLoading(false);
        return;
      }

      router.push(next);
      router.refresh();
      return;
    }

    if (!allRequirementsMet) {
      setError("Password does not meet all requirements.");
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    if (data.session) {
      router.push(next);
      router.refresh();
      return;
    }

    setMessage("Account created. Check email to confirm your account, then sign in with password.");
    setLoading(false);
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => {
            setMode("sign-in");
            setError(null);
            setMessage(null);
          }}
          className={`rounded-lg border px-3 py-2 text-sm font-semibold ${
            mode === "sign-in" ? "border-[#0e7490] bg-[#e2f3f6]" : "border-[#e2e8f0] bg-white"
          }`}
        >
          Sign In
        </button>
        <button
          type="button"
          onClick={() => {
            setMode("create");
            setError(null);
            setMessage(null);
          }}
          className={`rounded-lg border px-3 py-2 text-sm font-semibold ${
            mode === "create" ? "border-[#0e7490] bg-[#e2f3f6]" : "border-[#e2e8f0] bg-white"
          }`}
        >
          Create Account
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <label className="block space-y-1">
          <span className="text-sm font-semibold">Email</span>
          <input
            className="chip-input"
            type="email"
            name="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
          />
        </label>

        <label className="block space-y-1">
          <span className="text-sm font-semibold">Password</span>
          <input
            className="chip-input"
            type="password"
            name="password"
            autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Enter password"
          />
        </label>

        {mode === "create" ? (
          <>
            <label className="block space-y-1">
              <span className="text-sm font-semibold">Confirm Password</span>
              <input
                className="chip-input"
                type="password"
                name="confirmPassword"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Confirm password"
              />
            </label>
            <ul className="space-y-1 text-xs text-[#475569]">
              <li className={requirements.minLength ? "text-[#166534]" : ""}>At least 8 characters</li>
              <li className={requirements.upper ? "text-[#166534]" : ""}>At least 1 uppercase letter</li>
              <li className={requirements.lower ? "text-[#166534]" : ""}>At least 1 lowercase letter</li>
              <li className={requirements.number ? "text-[#166534]" : ""}>At least 1 number</li>
              <li className={requirements.symbol ? "text-[#166534]" : ""}>At least 1 symbol</li>
            </ul>
          </>
        ) : null}

        <button type="submit" className="chip-button chip-button-secondary" disabled={loading}>
          {loading ? "Processing..." : mode === "sign-in" ? "Sign In with Email" : "Create Account"}
        </button>
        {message ? <p className="text-sm text-[#155e75]">{message}</p> : null}
        {error ? <p className="text-sm text-[#991b1b]">{error}</p> : null}
      </form>
    </div>
  );
}
