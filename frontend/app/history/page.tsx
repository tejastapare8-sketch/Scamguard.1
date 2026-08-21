"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { VERDICT_META } from "@/lib/verdicts";

type Row = {
  id: number;
  created_at: string | null;
  channel: string;
  preview: string;
  score: number;
  verdict: string;
  label: string;
};

export default function HistoryPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [notes, setNotes] = useState("");
  const [selected, setSelected] = useState<number | null>(null);

  useEffect(() => {
    api<Row[]>("/api/detections").then(setRows).catch(() => setRows([]));
  }, []);

  async function report() {
    if (!selected) return;
    await api(
      "/api/reports?detection_id=" + selected + "&notes=" + encodeURIComponent(notes) + "&confirmed_scam=true",
      { method: "POST" }
    );
    setNotes("");
    alert("Report saved.");
  }

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-2xl font-extrabold text-navy">Detection log</h1>
      <p className="mt-1 text-sm text-slate-500">Every analysis is stored for the dashboard and reporting loop.</p>
      <div className="mt-5 overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-card">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-[11px] uppercase tracking-widest text-slate-400">
            <tr>
              <th className="px-4 py-3 font-normal">ID</th>
              <th className="px-4 py-3 font-normal">Channel</th>
              <th className="px-4 py-3 font-normal">Preview</th>
              <th className="px-4 py-3 font-normal">Score</th>
              <th className="px-4 py-3 font-normal">Verdict</th>
            </tr>
          </thead>
          <tbody>
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
                  <td className="px-4 py-2.5 font-mono text-slate-400">{r.id}</td>
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
      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
        <div className="text-sm font-bold text-navy">Report selected</div>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="mt-3 w-full rounded-xl border border-slate-200 p-3 text-sm"
          placeholder="Optional notes"
        />
        <button type="button" onClick={report} className="mt-3 rounded-xl bg-warn px-4 py-2 text-sm font-bold text-white">
          Report as scam
        </button>
      </div>
    </div>
  );
}
