"use client";

import { FormEvent, Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthFrame, Field } from "@/app/login/page";
import { resendVerification, verifyEmailCode } from "@/services/authService";
import { useAuth } from "@/components/AuthProvider";

function VerifyForm() {
  const params = useSearchParams();
  const router = useRouter();
  const { login } = useAuth();
  const email = params.get("email") || "";
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      await verifyEmailCode(email, code.trim());
      if (password) await login(email, password);
      else router.replace("/");
    } catch (error) {
      setErr(error instanceof Error ? error.message : "Verification failed.");
    } finally {
      setBusy(false);
    }
  }

  async function resend() {
    setErr(null);
    setBusy(true);
    try {
      await resendVerification(email);
      setInfo("A new code was sent if this email is registered.");
    } catch (error) {
      setErr(error instanceof Error ? error.message : "Could not resend the code.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthFrame title="Verify email" subtitle="Enter the 6-digit code sent to your email.">
      <form onSubmit={onSubmit} className="space-y-3">
        <Field label="Email" type="email" value={email} onChange={() => undefined} />
        <Field label="Verification code" type="text" value={code} onChange={setCode} />
        <Field label="Password (to sign in)" type="password" value={password} onChange={setPassword} />
        {err && <p className="text-sm text-danger">{err}</p>}
        {info && <p className="text-sm text-safe">{info}</p>}
        <button type="submit" disabled={busy || !email} className="w-full rounded-xl bg-brand py-3 text-sm font-bold text-white disabled:opacity-50">
          {busy ? "Verifying…" : "Verify and continue"}
        </button>
        <button type="button" onClick={resend} disabled={busy || !email} className="w-full text-sm font-semibold text-brand">
          Resend code
        </button>
      </form>
    </AuthFrame>
  );
}

export default function VerifyPage() {
  return (
    <Suspense>
      <VerifyForm />
    </Suspense>
  );
}
