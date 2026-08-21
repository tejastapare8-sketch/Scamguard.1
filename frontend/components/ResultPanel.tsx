"use client";

import { AnalysisResult } from "@/lib/api";
import { useSettings } from "@/components/SettingsProvider";
import { bandLabel, isScamVerdict, VERDICT_META } from "@/lib/verdicts";
import { AlertTriangle, Ban, CheckCircle2, Flag, Quote, ShieldAlert, ShieldBan } from "lucide-react";

export function ResultPanel({
  result,
  preview,
}: {
  result: AnalysisResult;
  preview?: string;
}) {
  const { block, blocked } = useSettings();
  const scam = isScamVerdict(result.verdict) || result.score >= 51;
  const meta = VERDICT_META[result.verdict] || VERDICT_META.suspicious;
  const quote = (preview || "").trim() || result.summary;
  const alreadyBlocked = result.id != null && blocked.includes(result.id);

  async function report() {
    if (!result.id) return;
    await fetch(
      `/api/reports?detection_id=${result.id}&notes=${encodeURIComponent("Reported from alert card")}&confirmed_scam=true`,
      { method: "POST" }
    );
    alert("Report saved. Thank you.");
  }

  if (!scam && result.verdict === "safe") {
    return (
      <div className="rounded-2xl border-2 border-safe/40 bg-white p-6 shadow-card">
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-full bg-safe text-white">
            <CheckCircle2 size={22} />
          </div>
          <div>
            <div className="text-xl font-extrabold uppercase text-safe">Safe</div>
            <div className="text-sm text-slate-500">Low risk — {result.score}/100</div>
          </div>
        </div>
        <p className="mt-4 text-sm text-slate-600">{result.summary}</p>
        {result.reasons.length > 0 && (
          <ul className="mt-4 space-y-2">
            {result.reasons.slice(0, 4).map((r) => (
              <li key={r.code} className="text-sm text-slate-600">
                • {r.title}
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  const riskLabel =
    result.band === "critical" || result.score >= 76
      ? "HIGH RISK"
      : result.band === "high" || result.score >= 51
        ? "HIGH RISK"
        : "MODERATE RISK";

  return (
    <div className="overflow-hidden rounded-2xl border-2 border-danger bg-white shadow-card">
      <div className="flex items-center gap-2 border-b border-red-100 px-5 py-4">
        <AlertTriangle className="text-danger" size={22} />
        <h2 className="text-xl font-black uppercase tracking-wide text-danger">
          {scam ? "Scam detected" : "Suspicious message"}
        </h2>
      </div>

      <div className="space-y-5 p-5">
        <div className="flex items-start gap-4">
          <div className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-danger text-white shadow">
            <ShieldAlert size={28} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-lg font-extrabold text-danger">
              {riskLabel} — {result.score}%
            </div>
            <div className="mt-2">
              <div className="h-3 overflow-hidden rounded-full bg-slate-200">
                <div className="h-full rounded-full bg-danger" style={{ width: `${result.score}%` }} />
              </div>
              <div className="mt-1 flex justify-between text-[10px] font-semibold text-slate-400">
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
            </div>
            <div className="mt-1 text-xs text-slate-400">
              {bandLabel(result.band)} · {meta.label}
            </div>
          </div>
        </div>

        {quote && (
          <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3">
            <Quote className="mb-1 text-danger" size={16} />
            <p className="text-sm italic leading-relaxed text-slate-700">
              “{quote.length > 160 ? quote.slice(0, 160) + "…" : quote}”
            </p>
          </div>
        )}

        <div>
          <div className="mb-2 border-b-2 border-danger pb-1 text-sm font-black uppercase tracking-wide text-danger">
            Why?
          </div>
          <ul className="space-y-2">
            {(result.reasons.length ? result.reasons : [{ code: "x", title: result.label, detail: "", weight: 0, category: "" }])
              .slice(0, 6)
              .map((r) => (
                <li key={r.code} className="flex items-start gap-2 text-sm font-semibold text-navy">
                  <AlertTriangle className="mt-0.5 shrink-0 text-danger" size={14} />
                  <span>
                    {r.title}
                    {r.detail ? <span className="block text-xs font-normal text-slate-500">{r.detail}</span> : null}
                  </span>
                </li>
              ))}
          </ul>
        </div>

        <div className="space-y-2 rounded-xl border border-red-100 bg-red-50 px-4 py-3">
          <div className="flex items-center gap-2 text-sm font-extrabold uppercase text-danger">
            <Ban size={16} /> Do not click
          </div>
          <div className="flex items-center gap-2 text-sm font-extrabold uppercase text-danger">
            <Ban size={16} /> Do not send money
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            disabled={!result.id || alreadyBlocked}
            onClick={() => result.id && block(result.id)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-danger px-4 py-3 text-sm font-extrabold uppercase tracking-wide text-white disabled:opacity-60"
          >
            <ShieldBan size={16} />
            {alreadyBlocked ? "Blocked" : "Block"}
          </button>
          <button
            type="button"
            disabled={!result.id}
            onClick={report}
            className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-navy bg-white px-4 py-3 text-sm font-extrabold uppercase tracking-wide text-navy disabled:opacity-60"
          >
            <Flag size={16} />
            Report
          </button>
        </div>

        {result.social_engineering?.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {result.social_engineering.map((t) => (
              <span key={t} className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                {t}
              </span>
            ))}
          </div>
        )}

        {result.qr && (result.qr as { found?: boolean }).found && (
          <div className="rounded-xl border border-orange-200 bg-orange-50 p-3 text-sm text-orange-900">
            QR payload detected. Verify the recipient before paying.
          </div>
        )}
      </div>
    </div>
  );
}
