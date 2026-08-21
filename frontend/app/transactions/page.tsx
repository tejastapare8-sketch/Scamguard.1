"use client";

import { useState } from "react";
import { analyzeTransaction } from "@/services/analysisService";
import { AnalysisResult } from "@/lib/api";
import { ResultPanel } from "@/components/ResultPanel";

export default function TxPage() {
  const [amount, setAmount] = useState(48000);
  const [beneficiary, setBeneficiary] = useState("unknown-merchant");
  const [hour, setHour] = useState(2);
  const [neu, setNeu] = useState(true);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [busy, setBusy] = useState(false);

  async function run() {
    setBusy(true);
    try {
      const history = Array.from({ length: 8 }).map((_, i) => ({
        amount: 400 + i * 80,
        beneficiary: "grocery",
        is_new_beneficiary: false,
        hour: 18,
        channel: "upi",
      }));
      setResult(
        await analyzeTransaction({
          history,
          current: { amount, beneficiary, is_new_beneficiary: neu, hour, channel: "upi" },
        })
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-extrabold text-navy">Transaction anomaly detection</h1>
      <p className="mt-1 text-sm text-slate-500">
        Isolation Forest plus rules for new beneficiaries, night transfers and amount spikes.
      </p>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <label className="text-sm text-slate-500">
          Amount (₹)
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-navy"
          />
        </label>
        <label className="text-sm text-slate-500">
          Beneficiary
          <input
            value={beneficiary}
            onChange={(e) => setBeneficiary(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-navy"
          />
        </label>
        <label className="text-sm text-slate-500">
          Hour (0–23)
          <input
            type="number"
            value={hour}
            onChange={(e) => setHour(Number(e.target.value))}
            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-navy"
          />
        </label>
        <label className="mt-7 flex items-center gap-2 text-sm font-semibold text-navy">
          <input type="checkbox" checked={neu} onChange={(e) => setNeu(e.target.checked)} />
          New beneficiary
        </label>
      </div>
      <button
        type="button"
        onClick={run}
        disabled={busy}
        className="mt-5 rounded-xl bg-brand px-5 py-3 text-sm font-bold text-white"
      >
        {busy ? "Scoring…" : "Score transaction"}
      </button>
      {result && (
        <div className="mt-6">
          <ResultPanel result={result} preview={`₹${amount} → ${beneficiary}`} />
        </div>
      )}
    </div>
  );
}
