import { AnalysisResult, Reason } from "@/lib/api";
import { AnalysisRow } from "@/lib/types";

export function toListItem(row: AnalysisRow) {
  return {
    id: row.id,
    created_at: row.created_at,
    channel: row.input_type,
    preview: row.preview || row.summary || "",
    score: row.risk_score,
    verdict: row.classification,
    label: row.label || row.classification,
  };
}

export function resultFromRow(row: AnalysisRow): AnalysisResult {
  const stored = (row.result_json || {}) as Partial<AnalysisResult>;
  return {
    id: row.id,
    score: stored.score ?? row.risk_score,
    band: stored.band ?? (row.risk_level as AnalysisResult["band"]),
    verdict: (stored.verdict || row.classification) as AnalysisResult["verdict"],
    label: stored.label || row.label || row.classification,
    summary: stored.summary || row.summary || "",
    reasons: (stored.reasons || []) as Reason[],
    signals: stored.signals || {},
    components: stored.components || {},
    extracted: stored.extracted || {},
    social_engineering: stored.social_engineering || [],
    impersonation: stored.impersonation || [],
    urls: stored.urls || [],
    qr: stored.qr,
    conversation: stored.conversation,
    transaction: stored.transaction,
    ml: stored.ml || {},
  };
}
