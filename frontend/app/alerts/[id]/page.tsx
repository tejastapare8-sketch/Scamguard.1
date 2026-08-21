"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ResultPanel } from "@/components/ResultPanel";
import { getAnalysis } from "@/services/historyService";
import { resultFromRow } from "@/lib/map";
import { AnalysisResult } from "@/lib/api";

export default function AlertDetailPage() {
  const params = useParams<{ id: string }>();
  const [data, setData] = useState<AnalysisResult | null>(null);
  const [preview, setPreview] = useState("");
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!params?.id) return;
    getAnalysis(params.id)
      .then((row) => {
        setData(resultFromRow(row));
        setPreview(row.preview || row.original_text || "");
      })
      .catch((e) => setErr(e.message));
  }, [params?.id]);

  return (
    <div className="mx-auto max-w-lg">
      <Link href="/alerts" className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-brand">
        <ArrowLeft size={14} /> Back to alerts
      </Link>
      {err && <p className="text-sm text-danger">{err}</p>}
      {!data && !err && <p className="text-sm text-slate-400">Loading…</p>}
      {data && <ResultPanel result={data} preview={preview} />}
    </div>
  );
}
