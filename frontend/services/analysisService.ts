import { api, AnalysisResult } from "@/lib/api";

export function analyzeMessage(body: {
  channel: string;
  sender?: string;
  text: string;
  subject?: string;
  urls?: string[];
}) {
  return api<AnalysisResult>("/api/analyze/message", { method: "POST", body: JSON.stringify(body) });
}

export function analyzeConversation(turns: { speaker: string; text: string }[], sender?: string) {
  return api<AnalysisResult>("/api/analyze/conversation", {
    method: "POST",
    body: JSON.stringify({ channel: "whatsapp", sender, turns }),
  });
}

export function analyzeUrl(url: string, claimed_brand?: string) {
  return api<AnalysisResult>("/api/analyze/url", {
    method: "POST",
    body: JSON.stringify({ url, claimed_brand }),
  });
}

export function analyzeTransaction(payload: unknown) {
  return api<AnalysisResult>("/api/analyze/transaction", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
