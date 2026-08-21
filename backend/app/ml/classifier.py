from __future__ import annotations

import joblib
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline

from app.config import MODEL_DIR

MODEL_PATH = MODEL_DIR / "tfidf_logreg.joblib"

SCAM_SAMPLES = [
    "Your bank account will be blocked today. Verify immediately and share OTP.",
    "Congratulations you won lottery prize of 50000 pay processing fee to claim",
    "I am from SBI customer care tell me your OTP now or account permanently blocked",
    "Send 25000 immediately to this new account don't call me I am in emergency",
    "Update KYC on this link or your UPI will be suspended today",
    "Income tax refund pending click here to submit PAN and Aadhaar",
    "Scan this QR and pay 2000 customs duty to release your courier parcel",
    "Invest 10000 get guaranteed 2 lakh returns in 7 days join telegram",
    "Dear customer your ATM pin expired call this number to generate new pin",
    "Paytm reward cashback claim now login at paytm-secure-login.xyz",
    "RBI KYC department your account frozen pay fine to unfreeze",
    "Beta I am in hospital send money to this UPI immediately don't tell papa",
    "Your WhatsApp will be banned verify here with 6 digit code",
    "Transfer bitcoin to this wallet to receive double crypto",
    "Add new beneficiary IFSC HDFC0001234 account 123456789012 send 48000 invoice",
    "आपका खाता ब्लॉक हो जाएगा ओटीपी अभी बताएं",
    "बधाई हो आपने लॉटरी जीती है दावा करने के लिए फीस भेजें",
    "केवाईसी अपडेट करें लिंक पर क्लिक करें वरना यूपीआई बंद",
]

SAFE_SAMPLES = [
    "Your OTP for HDFC netbanking is 482193. Do not share OTP with anyone.",
    "INR 1200 debited from your SBI account XX4521 at grocery store. Avl bal 15400.",
    "Electricity bill of Rs 980 paid successfully via UPI ref 123456789",
    "Your monthly account statement is now available in the official bank app.",
    "Meeting at 5pm. Please bring the project report.",
    "Flipkart order shipped. Track inside the Flipkart app. We never ask for OTP.",
    "Salary of Rs 45000 credited to your account. Have a nice day.",
    "Reminder: credit card bill due on 12th. Pay via official netbanking.",
    "IRCTC booking confirmed train 12138 seat 14. Have a safe journey.",
    "Your Airtel recharge of Rs 299 was successful.",
    "Google Pay: you paid Ramesh 250 for dinner. Split complete.",
    "PF contribution for this month has been credited as per EPFO.",
    "Thank you for shopping at DMart bill amount 2340 paid by card.",
    "Doctor appointment tomorrow 10am please arrive 15 minutes early.",
    "Your passport appointment is scheduled. Bring original documents.",
    "खाते से 500 रुपये डेबिट हुए। ओटीपी किसी से साझा न करें।",
    "बिजली बिल भुगतान सफल रहा संदर्भ संख्या 998877",
]


def _build() -> Pipeline:
    X = SCAM_SAMPLES + SAFE_SAMPLES
    y = [1] * len(SCAM_SAMPLES) + [0] * len(SAFE_SAMPLES)
    pipe = Pipeline(
        [
            ("tfidf", TfidfVectorizer(ngram_range=(1, 2), min_df=1)),
            ("clf", LogisticRegression(max_iter=400, class_weight="balanced")),
        ]
    )
    pipe.fit(X, y)
    return pipe


def load_model() -> Pipeline:
    if MODEL_PATH.exists():
        return joblib.load(MODEL_PATH)
    model = _build()
    joblib.dump(model, MODEL_PATH)
    return model


_MODEL: Pipeline | None = None


def classify_text(text: str) -> dict:
    global _MODEL
    if not text.strip():
        return {"scam_probability": 0.0, "label": "safe"}
    if _MODEL is None:
        _MODEL = load_model()
    proba = float(_MODEL.predict_proba([text])[0][1])
    return {
        "scam_probability": round(proba, 4),
        "label": "scam" if proba >= 0.5 else "safe",
        "model": "tfidf_logreg",
    }
