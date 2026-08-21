from __future__ import annotations

from app.data import patterns as P
from app.engines.text_analyzer import analyze_text
from app.engines.social_engineering import analyze_social_engineering


STAGES = [
    ("bait", ("reward", "investment"), "Bait / fake reward or investment hook"),
    ("rapport", ("emotion", "authority"), "Trust building / authority"),
    ("advance_fee", ("advance_fee",), "Advance-fee request"),
    ("payment", ("payment", "large_amount", "upi_id"), "Payment request"),
    ("otp", ("otp_request",), "OTP solicitation"),
    ("urgency_close", ("urgency", "secrecy"), "Artificial urgency / secrecy close"),
]


def analyze_conversation(turns: list[dict]) -> dict:
    joined_flags = []
    per_turn = []
    other_text = []
    for turn in turns:
        text = turn.get("text") or ""
        speaker = turn.get("speaker") or "unknown"
        ta = analyze_text(text)
        se = analyze_social_engineering(text)
        per_turn.append(
            {
                "speaker": speaker,
                "preview": text[:160],
                "score": ta["score"],
                "flags": ta["flags"],
                "se": se["labels"],
            }
        )
        if speaker != "user":
            joined_flags.extend(ta["flags"])
            other_text.append(text)

    full = "\n".join(other_text)
    se_all = analyze_social_engineering(full)
    detected_stages = []
    for code, flags, label in STAGES:
        if any(f in joined_flags for f in flags) or (code == "advance_fee" and P.ADVANCE_FEE.search(full)):
            detected_stages.append({"code": code, "label": label})

    progression = 0
    order = [s["code"] for s in detected_stages]
    expected = ["bait", "advance_fee", "payment", "otp"]
    hits = sum(1 for e in expected if e in order)
    if hits >= 3:
        progression = 25
    elif hits == 2:
        progression = 14
    elif "otp" in order and "payment" in order:
        progression = 18

    base = 0
    if per_turn:
        other_scores = [t["score"] for t in per_turn if t["speaker"] != "user"] or [t["score"] for t in per_turn]
        base = int(sum(other_scores) / max(1, len(other_scores)))

    score = min(100, base + progression + min(20, 4 * len(detected_stages)))
    reasons = [
        {
            "code": "convo_pattern",
            "title": "Conversation-level scam progression",
            "detail": " → ".join(s["label"] for s in detected_stages) or "No multi-turn pattern yet.",
            "weight": max(progression, 6 if detected_stages else 0),
            "category": "conversation",
        }
    ]

    return {
        "score": score,
        "turns": per_turn,
        "stages": detected_stages,
        "social_engineering": se_all["labels"],
        "reasons": reasons,
        "probability": score,
    }
