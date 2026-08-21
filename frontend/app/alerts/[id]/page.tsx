"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { api, AnalysisResult } from "@/lib/api";
import { ResultPanel } from "@/components/ResultPanel";

type Detail = AnalysisResult & {
  preview?: string;
  channel?: string;
  created_at?: string | null;
};

export default function AlertDetailPage() {
  const params = useParams<{ id: string }>();
  const [data, setData] = useState<Detail | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!params?.id) return;
    api<Detail>(`/api/detections/${params.id}`)
      .then(setData)
      .catch((e) => setErr(e.message));
  }, [params?.id]);

  return (
    <div className="mx-auto max-w-lg">
      <Link href="/alerts" className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-brand">
        <ArrowLeft size={14} /> Back to alerts
      </Link>
      {err && <p className="text-sm text-danger">{err}</p>}
      {!data && !err && <p className="text-sm text-slate-400">Loading…</p>}
      {data && data.score != null && <ResultPanel result={data} preview={data.preview} />}
    </div>
  );
}
