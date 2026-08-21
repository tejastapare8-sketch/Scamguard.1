export type User = {
  id: string;
  email?: string;
  emailVerified?: boolean;
  profile?: { name?: string; avatar_url?: string | null };
};

export type Profile = {
  id: string;
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
};

export type AnalysisReason = {
  id?: string;
  analysis_id?: string;
  reason: string;
  category?: string | null;
  severity?: string | null;
  created_at?: string;
};

export type DetectedSignal = {
  id?: string;
  analysis_id?: string;
  signal_type: string;
  signal_name: string;
  confidence?: number | null;
  metadata?: Record<string, unknown>;
  created_at?: string;
};

export type URLAnalysis = {
  id?: string;
  analysis_id?: string;
  url: string;
  domain?: string | null;
  risk_score?: number | null;
  risk_level?: string | null;
  is_suspicious: boolean;
  is_shortened: boolean;
  brand_match?: string | null;
  reputation?: string | null;
  created_at?: string;
};

export type Screenshot = {
  id: string;
  user_id: string;
  analysis_id?: string | null;
  storage_path: string;
  storage_url?: string | null;
  file_name?: string | null;
  mime_type?: string | null;
  file_size?: number | null;
  ocr_text?: string | null;
  created_at: string;
};

export type Conversation = {
  id: string;
  user_id: string;
  analysis_id?: string | null;
  title?: string | null;
  risk_score: number;
  risk_level: string;
  classification: string;
  summary?: string | null;
  created_at: string;
  updated_at: string;
};

export type ConversationMessage = {
  id?: string;
  conversation_id?: string;
  sender?: string | null;
  message: string;
  timestamp?: string | null;
  sequence_number: number;
};

export type Transaction = {
  id: string;
  user_id: string;
  analysis_id?: string | null;
  amount?: number | null;
  currency?: string;
  transaction_type?: string | null;
  recipient?: string | null;
  timestamp?: string | null;
  device_information?: string | null;
  location_information?: string | null;
  is_anomaly: boolean;
  anomaly_score?: number | null;
  created_at: string;
};

export type TransactionAnomaly = {
  id: string;
  transaction_id: string;
  anomaly_score?: number | null;
  risk_level?: string | null;
  reason?: string | null;
  detected_signals?: unknown;
};

export type AnalysisRow = {
  id: string;
  user_id: string;
  input_type: string;
  original_text?: string | null;
  preview?: string | null;
  risk_score: number;
  risk_level: string;
  classification: string;
  label?: string | null;
  summary?: string | null;
  result_json?: Record<string, unknown> | null;
  created_at: string;
  updated_at?: string;
};

export type DashboardStats = {
  messages_analyzed: number;
  safe: number;
  suspicious: number;
  phishing: number;
  payment_scams: number;
  critical: number;
  verdicts: Record<string, number>;
  recent: AnalysisRow[];
};

export type AppSettings = {
  automaticDetection: boolean;
  scamAlerts: boolean;
  blockHighRiskLinks: boolean;
  alertSound: boolean;
  language: "English" | "Hindi" | "Marathi";
  blockedIds: string[];
};
