"""Regex and keyword libraries for English, Hindi, and Marathi financial scams."""

from __future__ import annotations

import re

OTP_PIN = re.compile(
    r"\b(otp|cvv|pin|atm\s*pin|upi\s*pin|internet\s*pin|password|passwd|passcode|"
    r"ओटीपी|पिन|पासवर्ड)\b",
    re.I,
)

URGENCY = re.compile(
    r"\b(immediately|urgent|right now|tell me.{0,12}now|otp now|within\s+\d+\s*(min|minute|hour|hours|hrs)|"
    r"today only|limited time|expire[sd]?|last chance|act now|asap|now or your|"
    r"तुरंत|अभी|जल्दी|आज ही|समय समाप्त)\b",
    re.I,
)

FEAR = re.compile(
    r"\b(blocked|suspend(ed)?|permanent(ly)?|legal action|arrest|police|"
    r"frozen|deactivated|penalty|fine|fir|warrant|account will be|"
    r"ब्लॉक|खाता बंद| गिरफ्तार|जुर्माना|कानूनी)\b",
    re.I,
)

AUTHORITY = re.compile(
    r"\b(i am from (the )?bank|we are from|customer care|rbi|income tax|"
    r"cyber cell|kyc department|compliance team|bank official|manager|"
    r"बैंक से|कस्टमर केयर|इनकम टैक्स|साइबर सेल)\b",
    re.I,
)

REWARD = re.compile(
    r"\b(congratulations|you (have )?won|lottery|jackpot|prize|reward|"
    r"cashback of|free (gift|iphone|laptop)|lucky winner|"
    r"बधाई|इनाम|लॉटरी|जीत)\b",
    re.I,
)

EMOTION = re.compile(
    r"\b(emergency|accident|hospital|stuck|help me|don't tell|don't call|"
    r"keep this secret|i need money|please beta|"
    r"आपात|अस्पताल|मदद|गुप्त|माँ|पापा)\b",
    re.I,
)

SECRECY = re.compile(
    r"\b(don't tell|do not tell|keep (this )?secret|don't call|do not call|"
    r"delete this|don't inform|between us|ना बताना|गुप्त रख)\b",
    re.I,
)

PAYMENT_ASK = re.compile(
    r"\b(send (rs|inr|₹)|transfer|pay now|upi|gpay|phonepe|paytm|neft|imps|"
    r"rtgs|add beneficiary|new account|scan qr|processing fee|"
    r"भेजो|भेजिए|पैसे|यूपीआई)\b",
    re.I,
)

ADVANCE_FEE = re.compile(
    r"\b(processing fee|registration fee|gst fee|unlock fee|claim fee|"
    r"courier charges|customs duty|release amount)\b",
    re.I,
)

KYC = re.compile(
    r"\b(kyc|re-?kyc|update kyc|aadhaar|pan card|video kyc|केवाईसी|आधार)\b",
    re.I,
)

CRYPTO = re.compile(
    r"\b(bitcoin|btc|eth|usdt|wallet address|seed phrase|private key|"
    r"crypto|binance|wazirx|metamask)\b",
    re.I,
)

INVESTMENT = re.compile(
    r"\b(guaranteed returns?|double your money|invest now|trading tip|"
    r"stock tip|forex|daily profit|risk[- ]free)\b",
    re.I,
)

PHISHING_CTA = re.compile(
    r"\b(verify (now|immediately|account)|click (here|the link)|login (here|now)|"
    r"confirm (kyc|identity|details)|update (account|pan|aadhaar))\b",
    re.I,
)

AMOUNT = re.compile(
    r"(?:₹|rs\.?|inr)\s*([0-9][0-9,]*(?:\.\d{1,2})?)|"
    r"\b([0-9][0-9,]*)\s*(?:rupees|rs)\b",
    re.I,
)

UPI_ID = re.compile(r"\b[\w.\-]{2,256}@[a-z]{2,20}\b", re.I)
URL = re.compile(r"https?://[^\s<>\"']+|www\.[^\s<>\"']+", re.I)
EMAIL = re.compile(r"\b[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}\b", re.I)
PHONE = re.compile(r"(?:\+91[\-\s]?)?[6-9]\d{9}")
ACCOUNT_NO = re.compile(r"\b\d{9,18}\b")
IFSC = re.compile(r"\b[A-Z]{4}0[A-Z0-9]{6}\b", re.I)

SUSPICIOUS_KEYWORDS = [
    "otp", "pin", "cvv", "blocked", "kyc", "verify immediately", "processing fee",
    "won", "lottery", "upi pin", "beneficiary", "seed phrase", "customs",
    "cyber cell", "income tax refund", "account suspended", "click here",
]

SAFE_HINTS = [
    "this is an official statement of account",
    "no otp requested",
    "do not share otp",
    "never share your pin",
]
