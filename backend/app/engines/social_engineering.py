from __future__ import annotations

from app.data import patterns as P
from app.engines.text_analyzer import OTP_ADVISORY

TECHNIQUES = [
    ("fear", P.FEAR, "Fear / threats"),
    ("urgency", P.URGENCY, "Urgency"),
    ("authority", P.AUTHORITY, "Authority impersonation"),
    ("reward", P.REWARD, "Rewards / prizes"),
    ("emotion", P.EMOTION, "Emotional manipulation"),
    ("secrecy", P.SECRECY, "Secrecy requests"),
    ("kyc", P.KYC, "Fake KYC pressure"),
    ("otp", P.OTP_PIN, "OTP / PIN request"),
]


def analyze_social_engineering(text: str) -> dict:
    found = []
    labels = []
    score = 0
    for code, regex, label in TECHNIQUES:
        if code == "otp" and OTP_ADVISORY.search(text or ""):
            continue
        if regex.search(text or ""):
            found.append(code)
            labels.append(label)
            score += 10
    combo_bonus = 0
    if "authority" in found and "fear" in found:
        combo_bonus += 12
    if "otp" in found and ("authority" in found or "fear" in found):
        combo_bonus += 15
    if "urgency" in found and "payment" in (text or "").lower():
        combo_bonus += 6
    if len(found) >= 3:
        combo_bonus += 8
    score = min(100, score + combo_bonus)
    narrative = " + ".join(labels) if labels else "None detected"
    reasons = []
    if labels:
        reasons.append(
            {
                "code": "social_combo",
                "title": f"Social engineering: {narrative}",
                "detail": "Multiple manipulation techniques stacked in one message.",
                "weight": min(30, 8 * len(labels) + combo_bonus),
                "category": "social",
            }
        )
    return {
        "score": score,
        "techniques": found,
        "labels": labels,
        "narrative": narrative,
        "reasons": reasons,
    }
