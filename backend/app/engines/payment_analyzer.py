from __future__ import annotations

from app.data import patterns as P


def analyze_payment(text: str, extracted: dict | None = None) -> dict:
    t = text or ""
    extracted = extracted or {}
    reasons = []
    flags = []
    score = 0

    if P.PAYMENT_ASK.search(t):
        score += 10
        flags.append("payment_instruction")

    if extracted.get("upi_ids"):
        score += 8
        flags.append("upi_id")
        reasons.append(
            {
                "code": "upi_id",
                "title": "Contains a UPI VPA",
                "detail": ", ".join(extracted["upi_ids"][:3]),
                "weight": 8,
                "category": "payment",
            }
        )

    if extracted.get("account_like") and P.PAYMENT_ASK.search(t):
        score += 12
        flags.append("new_account")
        reasons.append(
            {
                "code": "new_account",
                "title": "Asks to transfer to an account number",
                "detail": "Verify the beneficiary in your bank app before adding a new payee.",
                "weight": 12,
                "category": "payment",
            }
        )

    if P.OTP_PIN.search(t) and P.PAYMENT_ASK.search(t):
        score += 22
        flags.append("otp_plus_payment")
        reasons.append(
            {
                "code": "otp_plus_payment",
                "title": "Combines a payment request with OTP/PIN solicitation",
                "detail": "This pairing is strongly associated with authorized-push-payment fraud.",
                "weight": 22,
                "category": "payment",
            }
        )

    if P.SECRECY.search(t) and P.PAYMENT_ASK.search(t):
        score += 10
        flags.append("secret_payment")

    lower = t.lower()
    if any(w in lower for w in ["new account", "different account", "this account instead", "changed account"]):
        score += 14
        flags.append("new_beneficiary")
        reasons.append(
            {
                "code": "new_beneficiary",
                "title": "Requests payment to a new or changed account",
                "detail": "Invoice-redirect and 'new account' stories are a common BEC/payment scam.",
                "weight": 14,
                "category": "payment",
            }
        )

    return {"score": min(100, score), "reasons": reasons, "flags": flags}
