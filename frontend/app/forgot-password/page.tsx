"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { AuthFrame, Field } from "@/app/login/page";
import { confirmReset, sendResetEmail } from "@/services/authService";

export default function ForgotPage() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [step, setStep] = useState<1 | 2>(1);
  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function sendCode(e: FormEvent) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      await sendResetEmail(email.trim());
      setInfo("If that email is registered, a reset code was sent.");
      setStep(2);
    } catch (error) {
      setErr(error instanceof Error ? error.message : "Could not send the reset email.");
    } finally {
      setBusy(false);
    }
  }

  async function reset(e: FormEvent) {
    e.preventDefault();
    setErr(null);
    if (password.length < 6) {
      setErr("Password must be at least 6 characters.");
      return;
    }
    setBusy(true);
    try {
      await confirmReset(email.trim(), code.trim(), password);
      setInfo("Password updated. You can sign in now.");
    } catch (error) {
      setErr(error instanceof Error ? error.message : "Could not reset the password.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthFrame title="Reset password" subtitle="We'll email a 6-digit code to confirm it's you.">
      {step === 1 ? (
        <form onSubmit={sendCode} className="space-y-3">
          <Field label="Email" type="email" value={email} onChange={setEmail} />
          {err && <p className="text-sm text-danger">{err}</p>}
          {info && <p className="text-sm text-safe">{info}</p>}
          <button type="submit" disabled={busy} className="w-full rounded-xl bg-brand py-3 text-sm font-bold text-white">
            {busy ? "Sending…" : "Send reset code"}
          </button>
        </form>
      ) : (
        <form onSubmit={reset} className="space-y-3">
          <Field label="Email" type="email" value={email} onChange={setEmail} />
          <Field label="Reset code" type="text" value={code} onChange={setCode} />
          <Field label="New password" type="password" value={password} onChange={setPassword} />
          {err && <p className="text-sm text-danger">{err}</p>}
          {info && <p className="text-sm text-safe">{info}</p>}
          <button type="submit" disabled={busy} className="w-full rounded-xl bg-brand py-3 text-sm font-bold text-white">
            {busy ? "Saving…" : "Update password"}
          </button>
        </form>
      )}
      <p className="mt-4 text-sm">
        <Link href="/login" className="font-semibold text-brand">
          Back to sign in
        </Link>
      </p>
    </AuthFrame>
  );
}
