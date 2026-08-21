from __future__ import annotations

from sqlalchemy.orm import Session

from app.database import Detection, SessionLocal
from app.engines.risk_engine import analyze_message, analyze_tx


SEED = [
    {
        "channel": "sms",
        "text": "Your SBI account will be blocked today. Verify immediately: http://bank-secure-login.xyz/kyc",
        "sender": "VM-SBIUPI",
    },
    {
        "channel": "whatsapp",
        "text": "Congratulations! You won ₹50,000 lottery. Pay ₹2,000 processing fee to claim. Send OTP after payment.",
        "sender": "+919876543210",
    },
    {
        "channel": "chat",
        "text": "Send ₹25,000 immediately to this new account 501234567890. Don't call me, I'm in an emergency.",
        "sender": "+918888777666",
    },
    {
        "channel": "email",
        "text": "Your electricity bill of Rs 980 was paid successfully. Ref 889912. Thank you.",
        "sender": "noreply@tnebnet.org",
    },
    {
        "channel": "sms",
        "text": "I am from the bank. Tell me your OTP now or your account will be permanently blocked.",
        "sender": "+911234567890",
    },
    {
        "channel": "email",
        "text": "Invoice attached for office supplies. Please pay to our usual vendor account.",
        "sender": "accounts@example.com",
    },
    {
        "channel": "whatsapp",
        "text": "Limited time investment: double your money in 7 days. Transfer to UPI profit@okaxis",
        "sender": "InvestGuru",
    },
]


def seed_if_empty() -> None:
    db: Session = SessionLocal()
    try:
        if db.query(Detection).count() > 0:
            return
        for item in SEED:
            result = analyze_message(item["text"], sender=item.get("sender"), channel=item["channel"])
            db.add(
                Detection(
                    channel=item["channel"],
                    preview=item["text"][:220],
                    score=result.score,
                    verdict=result.verdict,
                    label=result.label,
                    result_json=result.model_dump_json(),
                )
            )
        # sample transaction flag
        tx = analyze_tx(
            history=[{"amount": 400, "beneficiary": "grocery", "hour": 19}] * 6,
            current={"amount": 48000, "beneficiary": "unknown-llc", "is_new_beneficiary": True, "hour": 2, "channel": "upi"},
        )
        db.add(
            Detection(
                channel="transaction",
                preview="₹48,000 to unknown-llc (new beneficiary, 02:00)",
                score=tx.score,
                verdict=tx.verdict,
                label=tx.label,
                result_json=tx.model_dump_json(),
            )
        )
        db.commit()
    finally:
        db.close()
