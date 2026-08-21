"use client";

import { useState } from "react";
import { AnalysisResult } from "@/lib/api";
import { ResultPanel } from "@/components/ResultPanel";

export default function ScreenshotPage() {
  const [file, setFile] = useState<File | null>(null);
  const [ocr, setOcr] = useState("");
  const [progress, setProgress] = useState("");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function run() {
    setBusy(true);
    setErr(null);
    try {
      let text = ocr;
      if (file && !text.trim()) {
        setProgress("Running on-device OCR…");
        const Tesseract = (await import("tesseract.js")).default;
        const { data } = await Tesseract.recognize(file, "eng");
        text = data.text || "";
        setOcr(text);
      }
      setProgress("Scoring + QR decode…");
      const fd = new FormData();
      fd.set("text", text);
      if (file) fd.set("file", file);
      const res = await fetch("/api/analyze/screenshot", { method: "POST", body: fd });
      if (!res.ok) throw new Error(await res.text());
      setResult(await res.json());
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
      setProgress("");
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-extrabold text-navy">Screenshot & QR analysis</h1>
      <p className="mt-1 text-sm text-slate-500">
        Upload an SMS / WhatsApp / UPI screenshot. OCR runs in the browser; the backend decodes QR codes.
      </p>
      <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} className="mt-5 block text-sm" />
      <textarea
        value={ocr}
        onChange={(e) => setOcr(e.target.value)}
        rows={6}
        placeholder="OCR text appears here — you can also paste manually."
        className="mt-4 w-full rounded-2xl border border-slate-200 bg-white p-4 text-sm"
      />
      <button
        type="button"
        onClick={run}
        disabled={busy || (!file && !ocr.trim())}
        className="mt-4 rounded-xl bg-brand px-5 py-3 text-sm font-bold text-white disabled:opacity-50"
      >
        {busy ? progress || "Working…" : "Analyze screenshot"}
      </button>
      {err && <p className="mt-3 text-sm text-danger">{err}</p>}
      {result && (
        <div className="mt-6">
          <ResultPanel result={result} preview={ocr} />
        </div>
      )}
    </div>
  );
}
