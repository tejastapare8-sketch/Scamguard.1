export const VERDICT_META: Record<
  string,
  { label: string; color: string; bg: string; bar: string; pill: string }
> = {
  safe: {
    label: "Safe",
    color: "text-safe",
    bg: "bg-emerald-50",
    bar: "bg-safe",
    pill: "bg-emerald-100 text-safe",
  },
  suspicious: {
    label: "Suspicious",
    color: "text-warn",
    bg: "bg-amber-50",
    bar: "bg-warn",
    pill: "bg-amber-100 text-amber-700",
  },
  likely_scam: {
    label: "Scam",
    color: "text-danger",
    bg: "bg-red-50",
    bar: "bg-danger",
    pill: "bg-red-100 text-danger",
  },
  phishing: {
    label: "Scam",
    color: "text-danger",
    bg: "bg-red-50",
    bar: "bg-danger",
    pill: "bg-red-100 text-danger",
  },
  payment_fraud: {
    label: "Scam",
    color: "text-danger",
    bg: "bg-red-50",
    bar: "bg-danger",
    pill: "bg-red-100 text-danger",
  },
  urgent_threat: {
    label: "Scam",
    color: "text-danger",
    bg: "bg-red-50",
    bar: "bg-danger",
    pill: "bg-red-100 text-danger",
  },
};

export function isScamVerdict(verdict: string) {
  return ["likely_scam", "phishing", "payment_fraud", "urgent_threat"].includes(verdict);
}

export function bucket(verdict: string): "safe" | "suspicious" | "scam" {
  if (verdict === "safe") return "safe";
  if (verdict === "suspicious") return "suspicious";
  return "scam";
}

export function bandLabel(band: string) {
  return { low: "Low", moderate: "Moderate", high: "High", critical: "Critical" }[band] || band;
}

export function relativeTime(iso?: string | null) {
  if (!iso) return "";
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "";
  const mins = Math.max(0, Math.round((Date.now() - t) / 60000));
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} minute${mins === 1 ? "" : "s"} ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs === 1 ? "" : "s"} ago`;
  return new Date(iso).toLocaleString();
}

export function clockTime(iso?: string | null) {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}
