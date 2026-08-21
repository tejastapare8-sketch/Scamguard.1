"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, ShieldAlert } from "lucide-react";
import { listAnalyses } from "@/services/historyService";
import { toListItem } from "@/lib/map";
import { bucket, relativeTime } from "@/lib/verdicts";

export default function AlertsPage() {
  const [rows, setRows] = useState<ReturnType<typeof toListItem>[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    listAnalyses({ from: 0, to: 99 })
      .then(({ rows: data }) =>
        setRows(data.map(toListItem).filter((r) => bucket(r.verdict) !== "safe"))
      )
      .catch((e) => setErr(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-extrabold text-navy">Alerts</h1>
      <p className="mt-1 text-sm text-slate-500">Suspicious and scam detections that need your attention.</p>
      {err && <p className="mt-3 text-sm text-danger">{err}</p>}
      {loading && <p className="mt-4 text-sm text-slate-400">Loading history…</p>}
      <div className="mt-5 space-y-3">
        {!loading && rows.length === 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-10 text-center text-sm text-slate-400 shadow-card">
            No suspicious messages detected.{" "}
            <Link href="/analyze" className="font-semibold text-brand">
              Scan a message
            </Link>
          </div>
        )}
        {rows.map((r) => {
          const critical = bucket(r.verdict) === "scam";
          return (
            <Link
              key={r.id}
              href={`/alerts/${r.id}`}
              className={`flex items-start gap-3 rounded-2xl border px-4 py-3 shadow-sm transition hover:shadow-card ${
                critical ? "border-red-200 bg-red-50" : "border-amber-200 bg-amber-50"
              }`}
            >
              <div
                className={`mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full ${
                  critical ? "bg-danger text-white" : "bg-warn text-white"
                }`}
              >
                {critical ? <ShieldAlert size={18} /> : <AlertTriangle size={18} />}
              </div>
              <div className="min-w-0 flex-1">
                <div className={`font-bold ${critical ? "text-danger" : "text-amber-700"}`}>
                  {critical ? "Scam detected" : "Suspicious message"} · {r.score}%
                </div>
                <div className="truncate text-sm text-slate-600">{r.preview || r.label}</div>
              </div>
              <div className="shrink-0 text-xs text-slate-400">{relativeTime(r.created_at)}</div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
