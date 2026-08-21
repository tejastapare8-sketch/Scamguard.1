"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, MessageCircle, ShieldAlert, ShieldCheck, XCircle } from "lucide-react";
import { useSettings } from "@/components/SettingsProvider";
import { fetchDashboardStats } from "@/services/dashboardService";
import { DashboardStats } from "@/lib/types";
import { bucket, relativeTime } from "@/lib/verdicts";
import { toListItem } from "@/lib/map";

export default function HomePage() {
  const { settings, set } = useSettings();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats()
      .then(setStats)
      .catch((e) => setErr(e.message))
      .finally(() => setLoading(false));
  }, []);

  const scamCount =
    (stats?.verdicts?.likely_scam || 0) +
    (stats?.verdicts?.phishing || 0) +
    (stats?.verdicts?.payment_fraud || 0) +
    (stats?.verdicts?.urgent_threat || 0);

  const threatsBlocked = stats?.critical || 0;
  const recentItems = (stats?.recent || []).map(toListItem);
  const alerts = recentItems.filter((r) => bucket(r.verdict) !== "safe").slice(0, 4);

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      {err && (
        <div className="rounded-2xl border border-danger/30 bg-red-50 px-4 py-3 text-sm text-danger">{err}</div>
      )}
      {loading && <p className="text-sm text-slate-400">Loading dashboard…</p>}

      <section className="flex items-center gap-4 rounded-2xl border-2 border-safe/40 bg-emerald-50 px-5 py-4 shadow-card">
        <div className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-safe text-white shadow">
          <ShieldCheck size={28} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-lg font-extrabold uppercase tracking-wide text-safe">You are protected</div>
          <div className="text-sm text-emerald-800/80">
            Automatic scam detection {settings.automaticDetection ? "ON" : "OFF"}
          </div>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={settings.automaticDetection}
          onClick={() => set({ automaticDetection: !settings.automaticDetection })}
          className={`relative h-8 w-14 shrink-0 rounded-full transition ${
            settings.automaticDetection ? "bg-safe" : "bg-slate-300"
          }`}
        >
          <span
            className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition ${
              settings.automaticDetection ? "left-7" : "left-1"
            }`}
          />
        </button>
      </section>

      <section className="rounded-2xl border border-sky-200 bg-white p-5 shadow-card">
        <div className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Live summary</div>
        <div className="space-y-3">
          <SummaryRow
            icon={<MessageCircle className="text-brand" size={20} />}
            label="Messages checked:"
            value={stats?.messages_analyzed ?? 0}
            valueClass="text-brand"
          />
          <SummaryRow
            icon={<ShieldAlert className="text-danger" size={20} />}
            label="Scams detected:"
            value={scamCount}
            valueClass="text-danger"
          />
          <SummaryRow
            icon={<XCircle className="text-warn" size={20} />}
            label="Threats blocked:"
            value={threatsBlocked}
            valueClass="text-warn"
          />
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Recent alerts</h2>
          <Link href="/alerts" className="text-xs font-semibold text-brand">
            View all
          </Link>
        </div>
        <div className="space-y-3">
          {!loading && alerts.length === 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-400">
              No suspicious messages detected yet.{" "}
              <Link href="/analyze" className="font-semibold text-brand">
                Scan a message
              </Link>
            </div>
          )}
          {alerts.map((r) => {
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
                    {critical ? "Scam detected" : "Suspicious message"}
                  </div>
                  <div className="truncate text-sm text-slate-600">{r.preview || r.label}</div>
                </div>
                <div className="shrink-0 text-xs text-slate-400">{relativeTime(r.created_at)}</div>
              </Link>
            );
          })}
        </div>
      </section>

      <div className="pt-2">
        <Link
          href="/analyze"
          className="inline-flex items-center gap-2 rounded-xl bg-brand px-5 py-3 text-sm font-bold text-white shadow-card hover:bg-blue-600"
        >
          <CheckCircle2 size={16} />
          Scan a message
        </Link>
      </div>
    </div>
  );
}

function SummaryRow({
  icon,
  label,
  value,
  valueClass,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  valueClass: string;
}) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <div className="grid h-9 w-9 place-items-center rounded-full bg-slate-50">{icon}</div>
      <div className="flex-1 font-medium text-slate-600">{label}</div>
      <div className={`text-xl font-extrabold ${valueClass}`}>{value}</div>
    </div>
  );
}
