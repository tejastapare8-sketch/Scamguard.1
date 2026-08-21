import { insforge, friendlyError } from "@/lib/insforge";
import type { DashboardStats, AnalysisRow } from "@/lib/types";

export async function fetchDashboardStats(): Promise<DashboardStats> {
  const { data, error } = await insforge.database.rpc("dashboard_stats");
  if (error) throw new Error(friendlyError(error, "Could not load dashboard statistics."));

  const { data: recent, error: recentErr } = await insforge.database
    .from("analyses")
    .select("id,user_id,input_type,preview,risk_score,risk_level,classification,label,summary,created_at")
    .order("created_at", { ascending: false })
    .limit(8);
  if (recentErr) throw new Error(friendlyError(recentErr, "Could not load recent detections."));

  const stats = (Array.isArray(data) ? data[0] : data) as Partial<DashboardStats> | null;
  return {
    messages_analyzed: Number(stats.messages_analyzed || 0),
    safe: Number(stats.safe || 0),
    suspicious: Number(stats.suspicious || 0),
    phishing: Number(stats.phishing || 0),
    payment_scams: Number(stats.payment_scams || 0),
    critical: Number(stats.critical || 0),
    verdicts: stats.verdicts || {},
    recent: (recent || []) as AnalysisRow[],
  };
}
