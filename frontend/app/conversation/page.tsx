"use client";

import { useState } from "react";
import { analyzeConversation } from "@/services/analysisService";
import { AnalysisResult } from "@/lib/api";
import { ResultPanel } from "@/components/ResultPanel";

const DEMO = `Scammer: Congratulations! You won ₹50,000.
User: How can I claim it?
Scammer: Pay ₹2,000 processing fee.
User: Why?
Scammer: Pay within 10 minutes or your reward will expire. Send OTP after payment.`;

function parseTranscript(raw: string) {
  return raw
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line) => {
      const m = line.match(/^(scammer|user|contact|unknown)\s*:\s*(.*)$/i);
      if (m) {
        const sp = m[1].toLowerCase();
        const speaker = sp === "user" ? "user" : sp === "scammer" ? "scammer" : "contact";
        return { speaker, text: m[2] };
      }
      return { speaker: "unknown", text: line };
    });
}

export default function ConversationPage() {
  const [raw, setRaw] = useState(DEMO);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function run() {
    setBusy(true);
    setErr(null);
    try {
      const r = await analyzeConversation(parseTranscript(raw));
      setResult(r);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  const stages = (result?.conversation as { stages?: { label: string }[] } | undefined)?.stages;

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-extrabold text-navy">Conversation analyzer</h1>
      <p className="mt-1 text-sm text-slate-500">
        Analyze the full chat. Prefix lines with <code className="font-mono">Scammer:</code> or{" "}
        <code className="font-mono">User:</code>.
      </p>
      <textarea
        value={raw}
        onChange={(e) => setRaw(e.target.value)}
        rows={12}
        className="mt-5 w-full rounded-2xl border border-slate-200 bg-white p-4 font-mono text-sm"
      />
      <button
        type="button"
        onClick={run}
        disabled={busy}
        className="mt-4 rounded-xl bg-brand px-5 py-3 text-sm font-bold text-white"
      >
        {busy ? "Analyzing…" : "Analyze conversation"}
      </button>
      {err && <p className="mt-3 text-sm text-danger">{err}</p>}
      {stages && stages.length > 0 && (
        <div className="mt-5 flex flex-wrap gap-2">
          {stages.map((s) => (
            <span key={s.label} className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-danger">
              {s.label}
            </span>
          ))}
        </div>
      )}
      {result && (
        <div className="mt-6">
          <ResultPanel result={result} preview={raw.split("\n")[0]} />
        </div>
      )}
    </div>
  );
}
