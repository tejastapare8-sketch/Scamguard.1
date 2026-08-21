"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { deleteAnalysis, listAnalyses, reportAnalysis } from "@/services/historyService";
import { toListItem } from "@/lib/map";
import { VERDICT_META } from "@/lib/verdicts";

export default function HistoryPage() {
  const [rows, setRows] = useState<ReturnType<typeof toListItem>[]>([]);
  const [count, setCount] = useState(0);
  const [search, setSearch] = useState("");
  const [classification, setClassification] = useState("all");
  const [risk, setRisk] = useState("all");
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const pageSize = 20;

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const from = page * pageSize;
      const { rows: data, count: total } = await listAnalyses({
        search,
        classification,
        risk: risk === "all" ? undefined : risk,
        from,
        to: from + pageSize - 1,
      });
      setRows(data.map(toListItem));
      setCount(total);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not load history.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, classification, risk]);

  async function report() {
    if (!selected) return;
    setInfo(null);
    try {
      await reportAnalysis(selected, notes);
      setNotes("");
      setInfo("Report saved.");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not save the report.");
    }
  }

  async function remove() {
    if (!selected) return;
    try {
      await deleteAnalysis(selected);
      setSelected(null);
      await load();
      setInfo("Analysis deleted.");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not delete this analysis.");
    }
  }

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-2xl font-extrabold text-navy">Detection log</h1>
      <p className="mt-1 text-sm text-slate-500">Your saved analyses. Search, filter, open details, or delete.</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search preview"
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
        />
        <select
          value={classification}
          onChange={(e) => {
            setPage(0);
            setClassification(e.target.value);
          }}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
        >
          <option value="all">All types</option>
          <option value="safe">Safe</option>
          <option value="suspicious">Suspicious</option>
          <option value="likely_scam">Likely scam</option>
          <option value="phishing">Phishing</option>
          <option value="payment_fraud">Payment fraud</option>
          <option value="urgent_threat">Urgent threat</option>
        </select>
        <select
          value={risk}
          onChange={(e) => {
            setPage(0);
            setRisk(e.target.value);
          }}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
        >
          <option value="all">All risk bands</option>
          <option value="low">Low 0–20</option>
          <option value="moderate">Moderate 21–50</option>
          <option value="high">High 51–75</option>
          <option value="critical">Critical 76–100</option>
        </select>
        <button type="button" onClick={() => { setPage(0); void load(); }} className="rounded-xl bg-brand text-sm font-bold text-white">
          Search
        </button>
      </div>
      {err && <p className="mt-3 text-sm text-danger">{err}</p>}
      {info && <p className="mt-3 text-sm text-safe">{info}</p>}
      <div className="mt-5 overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-card">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-[11px] uppercase tracking-widest text-slate-400">
            <tr>
              <th className="px-4 py-3 font-normal">Channel</th>
              <th className="px-4 py-3 font-normal">Preview</th>
              <th className="px-4 py-3 font-normal">Score</th>
              <th className="px-4 py-3 font-normal">Verdict</th>
            </tr>
          </thead>
          <tbody>
            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-slate-400">
                  No analyses yet.
                </td>
              </tr>
            )}
            {loading && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-slate-400">
                  Loading history…
                </td>
              </tr>
            )}
            {rows.map((r) => {
              const m = VERDICT_META[r.verdict] || VERDICT_META.suspicious;
              return (
                <tr
                  key={r.id}
                  onClick={() => setSelected(r.id)}
                  className={`cursor-pointer border-t border-slate-100 ${
                    selected === r.id ? "bg-brand/5" : "hover:bg-slate-50"
                  }`}
                >
                  <td className="px-4 py-2.5 text-slate-500">{r.channel}</td>
                  <td className="px-4 py-2.5 text-navy">
                    <Link href={`/alerts/${r.id}`} className="hover:underline">
                      {r.preview.slice(0, 90)}
                    </Link>
                  </td>
                  <td className={`px-4 py-2.5 font-bold ${m.color}`}>{r.score}</td>
                  <td className={`px-4 py-2.5 font-semibold ${m.color}`}>{m.label}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="mt-3 flex items-center justify-between text-sm text-slate-500">
        <span>
          {count} record{count === 1 ? "" : "s"}
        </span>
        <div className="flex gap-2">
          <button type="button" disabled={page === 0} onClick={() => setPage((p) => Math.max(0, p - 1))} className="rounded-lg border px-3 py-1 disabled:opacity-40">
            Previous
          </button>
          <button
            type="button"
            disabled={(page + 1) * pageSize >= count}
            onClick={() => setPage((p) => p + 1)}
            className="rounded-lg border px-3 py-1 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>
      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
        <div className="text-sm font-bold text-navy">Selected record</div>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="mt-3 w-full rounded-xl border border-slate-200 p-3 text-sm"
          placeholder="Optional report notes"
        />
        <div className="mt-3 flex gap-2">
          <button type="button" onClick={report} className="rounded-xl bg-warn px-4 py-2 text-sm font-bold text-white">
            Report as scam
          </button>
          <button type="button" onClick={remove} className="rounded-xl border border-danger px-4 py-2 text-sm font-bold text-danger">
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
