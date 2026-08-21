"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { AuthFrame, Field } from "@/app/login/page";

export default function SignupPage() {
  const { signup } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErr(null);
    if (!email.includes("@") || !email.includes(".")) {
      setErr("Enter a valid email address.");
      return;
    }
    if (password.length < 6) {
      setErr("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setErr("Passwords do not match.");
      return;
    }
    setBusy(true);
    try {
      await signup(email.trim(), password, name.trim() || undefined);
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Could not create the account.";
      if (/already|exists|duplicate/i.test(msg)) setErr("An account with this email already exists.");
      else if (/invalid email/i.test(msg)) setErr("Enter a valid email address.");
      else if (/password|weak/i.test(msg)) setErr("Please choose a stronger password.");
      else setErr(msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthFrame title="Create account" subtitle="Your scam analyses are stored privately under this login.">
      <form onSubmit={onSubmit} className="space-y-3">
        <Field label="Full name" type="text" value={name} onChange={setName} autoComplete="name" />
        <Field label="Email" type="email" value={email} onChange={setEmail} autoComplete="email" />
        <Field label="Password" type="password" value={password} onChange={setPassword} autoComplete="new-password" />
        <Field label="Confirm password" type="password" value={confirm} onChange={setConfirm} autoComplete="new-password" />
        {err && <p className="text-sm text-danger">{err}</p>}
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-xl bg-brand py-3 text-sm font-bold text-white disabled:opacity-50"
        >
          {busy ? "Creating account…" : "Create account"}
        </button>
      </form>
      <p className="mt-4 text-sm text-slate-500">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-brand">
          Sign in
        </Link>
      </p>
    </AuthFrame>
  );
}
