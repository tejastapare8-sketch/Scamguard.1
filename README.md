# ScamGuard

**AI-Powered Financial Scam, Phishing and Fraud Detection System Using NLP, Threat Intelligence and Anomaly Detection**

ScamGuard scores SMS, email, chat, payment requests, URLs, screenshots/QR codes, multi-turn conversations and transactions. Every result is **explainable**: a 0–100 risk score plus the reasons the message was flagged (OTP request, urgency, brand impersonation, suspicious domain, and so on).

Verdicts:

- Safe
- Suspicious
- Likely Scam/Fraud
- Phishing
- Payment Fraud
- Urgent Financial Threat

## Architecture

```
User → Next.js dashboard → FastAPI
                         ├ text NLP (patterns + TF-IDF Logistic Regression)
                         ├ URL / domain intelligence
                         ├ payment + social-engineering rules
                         ├ sender / brand impersonation
                         ├ conversation progression
                         ├ Isolation Forest (transactions)
                         └ OpenCV QR decode  (+ browser OCR)
```

Risk score ≈ text + URL + payment + sender + behavioral (+ ML nudge).

## Prerequisites

- Python 3.11+ (`py` launcher on Windows)
- Node.js 18+

## Run the backend

```bash
cd backend
py -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
py -m uvicorn app.main:app --reload --port 8000
```

API docs: http://127.0.0.1:8000/docs

## Run the dashboard

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:3000 — the Next.js app proxies `/api` to the FastAPI server.

## Modules

| Module | What it does |
| --- | --- |
| Message scan | SMS/email/WhatsApp/UPI language, India-specific OTP/KYC/UPI patterns (English + Hindi) |
| Phishing URLs | Shorteners, lookalike brands, suspicious TLDs, HTTPS, login keywords |
| Payment fraud | New beneficiary, large amounts, OTP+transfer combos |
| Social engineering | Fear, urgency, authority, rewards, secrecy, fake emergencies |
| Sender analysis | Homoglyphs (`paypa1`), spoofed support addresses |
| Conversation analyzer | Multi-turn bait → fee → payment → OTP progression |
| Screenshot / QR | Tesseract.js OCR in the browser; OpenCV QR decode on the server |
| Transactions | Isolation Forest + velocity / odd-hour / amount-spike rules |
| Dashboard | Counts, verdict mix, detection log, user reports |

## Disclaimer

This is an academic / defensive screening tool. It does not replace a bank’s fraud systems and can produce false positives or miss novel scams. Never share OTP, PIN, CVV or seed phrases with anyone.
