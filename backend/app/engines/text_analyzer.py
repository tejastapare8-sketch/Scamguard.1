from __future__ import annotations

import re

from app.data import patterns as P
from app.engines.url_analyzer import extract_entities

OTP_ADVISORY = re.compile(
    r"(do not|don't|never|not)\s+(share|give|tell|send).{0,24}(otp|pin|cvv|password)",
    re.I,
)


def analyze_text(text: str) -> dict:
    t = text or ""
    reasons = []
    score = 0
    flags = []

    def hit(regex, code, title, detail, weight, category="text"):
        nonlocal score
        if regex.search(t):
            score += weight
            flags.append(code)
            reasons.append(
                {"code": code, "title": title, "detail": detail, "weight": weight, "category": category}
            )
            return True
        return False

    otp_asked = bool(P.OTP_PIN.search(t)) and not OTP_ADVISORY.search(t)
    if otp_asked:
        score += 32
        flags.append("otp_request")
        reasons.append(
            {
                "code": "otp_request",
                "title": "Requests an OTP, PIN, CVV or password",
                "detail": "Legitimate banks never ask for OTP or PIN over SMS, email or chat.",
                "weight": 32,
                "category": "sensitive",
            }
        )
    hit(P.URGENCY, "urgency", "Creates immediate urgency",
        "Pressure to act within minutes is a classic social-engineering tactic.", 12, "social")
    hit(P.FEAR, "fear", "Uses fear or account-suspension threats",
        "Threats of blocking, arrest or legal action are used to short-circuit judgment.", 14, "social")
    hit(P.AUTHORITY, "authority", "Claims to represent a bank or authority",
        "Impersonating customer care, RBI, tax or cyber cell is common in India.", 16, "impersonation")
    hit(P.REWARD, "reward", "Promises a prize, lottery or unexpected reward",
        "Unsolicited winnings almost always require a fee or OTP — an advance-fee scam.", 18, "text")
    hit(P.EMOTION, "emotion", "Emotional or fake-emergency manipulation",
        "Family emergency and hospital stories are used to rush payments.", 14, "social")
    hit(P.SECRECY, "secrecy", "Asks you to keep the conversation secret",
        "Scammers isolate victims from family, bank staff or police.", 12, "social")
    hit(P.PAYMENT_ASK, "payment", "Contains a payment or transfer instruction",
        "Requests to send money, scan QR or add a new beneficiary raise payment-fraud risk.", 10, "payment")
    hit(P.ADVANCE_FEE, "advance_fee", "Asks for a processing / claim / courier fee",
        "Paying a fee to release a prize or parcel is a known fraud pattern.", 20, "payment")
    hit(P.KYC, "kyc", "Pushes KYC / Aadhaar / PAN update via chat",
        "Official KYC is done on bank apps or branches, not via random links.", 12, "phishing")
    hit(P.CRYPTO, "crypto", "Cryptocurrency wallet or seed-phrase request",
        "Seed phrases and wallet transfers are irreversible.", 18, "payment")
    hit(P.INVESTMENT, "investment", "Guaranteed-return or high-profit investment pitch",
        "Guaranteed profits and 'risk-free' trading are typical investment scams.", 14, "text")
    hit(P.PHISHING_CTA, "phishing_cta", "Urges you to click, verify or log in",
        "Credential-harvesting pages hide behind 'verify now' calls to action.", 12, "phishing")

    extracted = extract_entities(t)
    if extracted["amounts"]:
        max_amt = max(extracted["amounts"])
        if max_amt >= 10000:
            add = 8 if max_amt < 50000 else 14
            score += add
            flags.append("large_amount")
            reasons.append(
                {
                    "code": "large_amount",
                    "title": "Unusually large payment amount",
                    "detail": f"Requested amount around ₹{max_amt:,.0f}.",
                    "weight": add,
                    "category": "payment",
                }
            )

    lower = t.lower()
    if "don't call" in lower or "do not call" in lower or "don't tell anyone" in lower:
        if "payment" in flags or P.PAYMENT_ASK.search(t):
            score += 10
            flags.append("bypass_verification")
            reasons.append(
                {
                    "code": "bypass_verification",
                    "title": "Pressure to skip normal verification",
                    "detail": "The sender discourages calling back on a known number.",
                    "weight": 10,
                    "category": "social",
                }
            )

    if OTP_ADVISORY.search(t) or "official statement" in lower:
        score = max(0, score - 18)
        flags.append("otp_advisory")

    return {
        "score": min(100, score),
        "reasons": reasons,
        "flags": flags,
        "extracted": extracted,
    }
