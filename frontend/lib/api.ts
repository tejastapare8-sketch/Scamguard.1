export type Reason = {
  code: string;
  title: string;
  detail: string;
  weight: number;
  category: string;
};

export type AnalysisResult = {
  id?: number;
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

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: { ...(init?.body instanceof FormData ? {} : { "Content-Type": "application/json" }), ...init?.headers },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || res.statusText);
  }
  return res.json() as Promise<T>;
}
