"use client";

import { useState } from "react";
import { analyzeUrl } from "@/services/analysisService";
import { AnalysisResult } from "@/lib/api";
import { ResultPanel } from "@/components/ResultPanel";

export default function UrlPage() {
  const [url, setUrl] = useState("http://bank-secure-login.xyz/verify");
  const [brand, setBrand] = useState("SBI");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [busy, setBusy] = useState(false);

  async function run() {
    setBusy(true);
    try {
      setResult(await analyzeUrl(url, brand));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-extrabold text-navy">URL & domain intelligence</h1>
      <p className="mt-1 text-sm text-slate-500">Flags fake banking domains, shorteners, lookalikes and login bait.</p>
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="sm:col-span-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"
        />
        <input
          value={brand}
          onChange={(e) => setBrand(e.target.value)}
          placeholder="Claimed brand"
          className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"
        />
      </div>
      <button
        type="button"
        onClick={run}
        disabled={busy}
        className="mt-4 rounded-xl bg-brand px-5 py-3 text-sm font-bold text-white"
      >
        {busy ? "Checking…" : "Check URL"}
      </button>
      {result && (
        <div className="mt-6">
          <ResultPanel result={result} preview={url} />
        </div>
      )}
    </div>
  );
}
