import { insforge, friendlyError } from "@/lib/insforge";
import type { AnalysisRow } from "@/lib/types";

export async function listAnalyses(opts: {
  search?: string;
  classification?: string;
  risk?: string;
  from?: number;
  to?: number;
}) {
  const from = opts.from ?? 0;
  const to = opts.to ?? 49;
  let q = insforge.database
    .from("analyses")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);
  if (opts.classification && opts.classification !== "all") {
    q = q.eq("classification", opts.classification);
  }
  if (opts.risk === "critical") q = q.gte("risk_score", 76);
  if (opts.risk === "high") q = q.gte("risk_score", 51).lte("risk_score", 75);
  if (opts.risk === "moderate") q = q.gte("risk_score", 21).lte("risk_score", 50);
  if (opts.risk === "low") q = q.lte("risk_score", 20);
  if (opts.search?.trim()) q = q.ilike("preview", `%${opts.search.trim()}%`);
  const { data, error, count } = await q;
  if (error) throw new Error(friendlyError(error, "Could not load history."));
  return { rows: (data || []) as AnalysisRow[], count: count ?? 0 };
}

export async function getAnalysis(id: string): Promise<AnalysisRow> {
  const { data, error } = await insforge.database.from("analyses").select("*").eq("id", id).single();
  if (error || !data) throw new Error(friendlyError(error, "Analysis not found."));
  return data as AnalysisRow;
}

export async function deleteAnalysis(id: string) {
  const { error } = await insforge.database.from("analyses").delete().eq("id", id);
  if (error) throw new Error(friendlyError(error, "Could not delete this analysis."));
}

export async function reportAnalysis(analysisId: string, notes: string) {
  const { data: userData } = await insforge.auth.getCurrentUser();
  const userId = userData?.user?.id;
  if (!userId) throw new Error("Please sign in again.");
  const { error } = await insforge.database.from("reports").insert([
    { user_id: userId, analysis_id: analysisId, notes, confirmed_scam: true },
  ]);
  if (error) throw new Error(friendlyError(error, "Could not save the report."));
}
