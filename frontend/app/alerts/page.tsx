"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, ShieldAlert } from "lucide-react";
import { api } from "@/lib/api";
import { bucket, relativeTime } from "@/lib/verdicts";

type Row = {
  id: number;
  created_at: string | null;
  preview: string;
  score: number;
  verdict: string;
  label: string;
};

export default function AlertsPage() {
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    api<Row[]>("/api/detections?limit=80")
      .then((all) => setRows(all.filter((r) => bucket(r.verdict) !== "safe")))
      .catch(() => setRows([]));
  }, []);

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-extrabold text-navy">Alerts</h1>
      <p className="mt-1 text-sm text-slate-500">Suspicious and scam detections that need your attention.</p>

      <div className="mt-5 space-y-3">
        {rows.length === 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-10 text-center text-sm text-slate-400 shadow-card">
            No alerts yet.{" "}
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
