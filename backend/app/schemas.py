from __future__ import annotations

from typing import Literal, Optional

from pydantic import BaseModel, Field

Verdict = Literal[
    "safe",
    "suspicious",
    "likely_scam",
    "phishing",
    "payment_fraud",
    "urgent_threat",
]

RiskBand = Literal["low", "moderate", "high", "critical"]


class Reason(BaseModel):
    code: str
    title: str
    detail: str
    weight: int
    category: str


class ChannelInput(BaseModel):
    channel: Literal["sms", "email", "whatsapp", "chat", "payment", "other"] = "sms"
    sender: Optional[str] = None
    subject: Optional[str] = None
    text: str = ""
    urls: list[str] = Field(default_factory=list)


class MessageAnalyzeRequest(ChannelInput):
    pass


class ConversationTurn(BaseModel):
    speaker: Literal["unknown", "contact", "user", "scammer"] = "unknown"
    text: str


class ConversationAnalyzeRequest(BaseModel):
    channel: str = "whatsapp"
    sender: Optional[str] = None
    turns: list[ConversationTurn]


class TransactionRecord(BaseModel):
    amount: float
    beneficiary: str
    is_new_beneficiary: bool = False
    hour: int = 12
    channel: str = "upi"
    location: Optional[str] = None
    device: Optional[str] = None
    failed: bool = False


class TransactionAnalyzeRequest(BaseModel):
    user_id: str = "demo-user"
    history: list[TransactionRecord] = Field(default_factory=list)
    current: TransactionRecord


class UrlAnalyzeRequest(BaseModel):
    url: str
    claimed_brand: Optional[str] = None


class AnalysisResult(BaseModel):
    score: int
    band: RiskBand
    verdict: Verdict
    label: str
    summary: str
    reasons: list[Reason]
    signals: dict
    components: dict
    extracted: dict
    social_engineering: list[str]
    impersonation: list[str]
    urls: list[dict] = Field(default_factory=list)
    qr: Optional[dict] = None
    conversation: Optional[dict] = None
    transaction: Optional[dict] = None
    ml: dict = Field(default_factory=dict)


class DetectionOut(BaseModel):
    id: int
    created_at: str
    channel: str
    preview: str
    score: int
    verdict: str
    label: str
