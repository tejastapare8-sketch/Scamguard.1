"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, BarChart3, CheckCircle2, ChevronRight, ShieldAlert } from "lucide-react";
import { listAnalyses } from "@/services/historyService";
import { toListItem } from "@/lib/map";
import { bucket, clockTime, VERDICT_META } from "@/lib/verdicts";

type Row = {
  id: string;
  created_at: string | null;
  channel: string;
  preview: string;
  score: number;
  verdict: string;
  label: string;
};

export default function ActivityPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listAnalyses({ from: 0, to: 99 })
      .then(({ rows: data }) => setRows(data.map(toListItem)))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, []);

  const today = useMemo(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    return rows.filter((r) => r.created_at && new Date(r.created_at) >= start);
  }, [rows]);

  const counts = useMemo(() => {
    const c = { safe: 0, suspicious: 0, scam: 0 };
    for (const r of today.length ? today : rows) {
      c[bucket(r.verdict)] += 1;
    }
    return c;
  }, [today, rows]);

  const total = Math.max(1, counts.safe + counts.suspicious + counts.scam);
  const recent = (today.length ? today : rows).slice(0, 8);

  return (
    <div className="mx-auto max-w-4xl">
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
        <div className="flex items-center gap-2 bg-brand px-5 py-3.5 text-white">
          <BarChart3 size={18} />
          <span className="text-sm font-extrabold uppercase tracking-wider">Activity</span>
        </div>

        <div className="space-y-5 p-5">
          <div>
            <div className="mb-3 text-sm font-bold text-navy">Today</div>
            <StatBar
              icon={<CheckCircle2 size={16} />}
              label="Safe"
              count={counts.safe}
              pct={(counts.safe / total) * 100}
              color="bg-safe"
              text="text-safe"
              iconBg="bg-emerald-100 text-safe"
            />
            <StatBar
              icon={<AlertTriangle size={16} />}
              label="Suspicious"
              count={counts.suspicious}
              pct={(counts.suspicious / total) * 100}
              color="bg-warn"
              text="text-warn"
              iconBg="bg-amber-100 text-amber-700"
            />
            <StatBar
              icon={<ShieldAlert size={16} />}
              label="Scam"
              count={counts.scam}
              pct={(counts.scam / total) * 100}
              color="bg-danger"
              text="text-danger"
              iconBg="bg-red-100 text-danger"
            />
          </div>

          <div>
            <div className="mb-2 text-sm font-bold text-navy">Recent messages</div>
            <div className="divide-y divide-slate-100 rounded-xl border border-slate-100">
              {recent.length === 0 && (
                <div className="px-4 py-8 text-center text-sm text-slate-400">
                  {loading ? "Loading history…" : "No analyses yet."}
                </div>
              )}
              {recent.map((r) => {
                const b = bucket(r.verdict);
                const meta = VERDICT_META[r.verdict] || VERDICT_META.suspicious;
                const Icon = b === "safe" ? CheckCircle2 : b === "suspicious" ? AlertTriangle : ShieldAlert;
                return (
                  <Link
                    key={r.id}
                    href={`/alerts/${r.id}`}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50"
                  >
                    <div className={`grid h-8 w-8 place-items-center rounded-full ${meta.pill}`}>
                      <Icon size={14} />
                    </div>
                    <div className={`w-24 text-sm font-bold ${meta.color}`}>{meta.label}</div>
                    <span className={`rounded-md px-2 py-0.5 text-xs font-bold ${meta.pill}`}>{r.score}%</span>
                    <div className="ml-auto text-xs text-slate-400">{clockTime(r.created_at)}</div>
                    <ChevronRight size={16} className="text-slate-300" />
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatBar({
  icon,
  label,
  count,
  pct,
  color,
  text,
  iconBg,
}: {
  icon: React.ReactNode;
  label: string;
  count: number;
  pct: number;
  color: string;
  text: string;
  iconBg: string;
}) {
  return (
    <div className="mb-3 flex items-center gap-3">
      <div className={`grid h-8 w-8 place-items-center rounded-full ${iconBg}`}>{icon}</div>
      <div className={`w-24 text-sm font-semibold ${text}`}>{label}</div>
      <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.max(4, pct)}%` }} />
      </div>
      <div className={`w-10 text-right text-sm font-extrabold ${text}`}>{count}</div>
    </div>
  );
}
