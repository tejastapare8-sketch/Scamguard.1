import { getAccessToken, refreshAccessToken } from "@/lib/insforge";

export type Reason = {
  code: string;
  title: string;
  detail: string;
  weight: number;
  category: string;
};

export type AnalysisResult = {
  id?: string | number;
  score: number;
  band: string;
  verdict: string;
  label: string;
  summary: string;
  reasons: Reason[];
  signals: { flags?: string[]; techniques?: string[] };
  components: Record<string, number>;
  extracted: Record<string, unknown>;
  social_engineering: string[];
  impersonation: string[];
  urls: Record<string, unknown>[];
  qr?: Record<string, unknown> | null;
  conversation?: Record<string, unknown> | null;
  transaction?: Record<string, unknown> | null;
  ml: Record<string, unknown>;
};

function userMessage(status: number, body: string) {
  if (status === 401 || status === 403) return "Your session expired. Please sign in again.";
  if (status === 413) return "That file is too large. Use an image under 8 MB.";
  if (status === 415) return "Unsupported file type. Use PNG, JPG, or WEBP.";
  if (status === 422) return "Please check your input and try again.";
  if (status >= 500) return "Analysis service is unavailable. Please try again.";
  if (!body) return "Request failed. Please try again.";
  try {
    const parsed = JSON.parse(body) as { detail?: unknown; error?: string; message?: string };
    if (typeof parsed.detail === "string") return parsed.detail;
    if (parsed.message) return parsed.message;
    if (parsed.error) return parsed.error;
  } catch {
    /* plain text */
  }
  if (body.length < 180 && !body.includes("Traceback")) return body;
  return "Request failed. Please try again.";
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  let token = getAccessToken();
  if (!token) token = await refreshAccessToken();
  const isForm = init?.body instanceof FormData;
  const headers = new Headers(init?.headers);
  if (!isForm && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  let res: Response;
  try {
    res = await fetch(path, { ...init, headers });
  } catch {
    throw new Error("Network unavailable. Check your connection and try again.");
  }
  if (!res.ok) {
    const text = await res.text();
    throw new Error(userMessage(res.status, text));
  }
  return res.json() as Promise<T>;
}
