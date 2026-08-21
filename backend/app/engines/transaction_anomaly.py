from __future__ import annotations

import numpy as np
from sklearn.ensemble import IsolationForest

# Isolation Forest is fit on a synthetic "normal Indian UPI user" profile
# and reused to score incoming transactions.


def _vector(tx: dict, avg_amount: float) -> list[float]:
    hour = int(tx.get("hour") or 12)
    amount = float(tx.get("amount") or 0)
    return [
        np.log1p(amount),
        1.0 if tx.get("is_new_beneficiary") else 0.0,
        1.0 if hour < 6 or hour > 23 else 0.0,
        abs(amount - avg_amount) / max(1.0, avg_amount),
        1.0 if tx.get("failed") else 0.0,
        1.0 if (tx.get("channel") or "upi") in ("crypto", "wallet", "international") else 0.0,
    ]


def _train_baseline() -> IsolationForest:
    rng = np.random.default_rng(7)
    n = 400
    amounts = rng.normal(1800, 900, n).clip(50, 12000)
    hours = rng.integers(8, 22, n)
    X = np.column_stack(
        [
            np.log1p(amounts),
            rng.binomial(1, 0.05, n),
            (hours < 6) | (hours > 23),
            np.abs(amounts - 1800) / 1800,
            rng.binomial(1, 0.03, n),
            rng.binomial(1, 0.02, n),
        ]
    )
    clf = IsolationForest(n_estimators=120, contamination=0.06, random_state=7)
    clf.fit(X)
    return clf


_MODEL = _train_baseline()


def analyze_transactions(history: list[dict], current: dict) -> dict:
    hist_amounts = [float(h.get("amount") or 0) for h in history] or [1500.0]
    avg = float(np.mean(hist_amounts))
    recent = history[-8:] if history else []
    burst = sum(1 for h in recent if not h.get("failed"))
    reasons = []
    score = 0
    flags = []

    amount = float(current.get("amount") or 0)
    if amount > avg * 4 and amount >= 8000:
        score += 22
        flags.append("amount_spike")
        reasons.append(
            {
                "code": "amount_spike",
                "title": "Unusually large transaction vs your history",
                "detail": f"₹{amount:,.0f} vs typical ~₹{avg:,.0f}.",
                "weight": 22,
                "category": "transaction",
            }
        )
    if current.get("is_new_beneficiary"):
        score += 16
        flags.append("new_beneficiary")
        reasons.append(
            {
                "code": "tx_new_beneficiary",
                "title": "New beneficiary",
                "detail": str(current.get("beneficiary")),
                "weight": 16,
                "category": "transaction",
            }
        )
    hour = int(current.get("hour") or 12)
    if hour < 5 or hour >= 23:
        score += 10
        flags.append("odd_hour")
        reasons.append(
            {
                "code": "odd_hour",
                "title": "Unusual transaction timing",
                "detail": f"Initiated around {hour:02d}:00.",
                "weight": 10,
                "category": "transaction",
            }
        )
    if burst >= 4:
        score += 12
        flags.append("velocity")
        reasons.append(
            {
                "code": "velocity",
                "title": "Multiple transactions in a short window",
                "detail": f"{burst} recent successful payments.",
                "weight": 12,
                "category": "transaction",
            }
        )
    if current.get("failed") and burst >= 2:
        score += 8
        flags.append("failed_retries")

    vec = np.array(_vector(current, avg), dtype=float).reshape(1, -1)
    pred = int(_MODEL.predict(vec)[0])  # -1 anomaly
    raw = float(-_MODEL.score_samples(vec)[0])
    ml_score = int(min(40, max(0, (raw - 0.4) * 80)))
    if pred == -1:
        score += 12
        flags.append("isolation_forest")
        reasons.append(
            {
                "code": "isolation_forest",
                "title": "ML anomaly detector flagged this payment",
                "detail": "Isolation Forest compared the transaction against a normal UPI spending profile.",
                "weight": 12,
                "category": "transaction",
            }
        )

    return {
        "score": min(100, score + ml_score // 3),
        "reasons": reasons,
        "flags": flags,
        "ml": {"anomaly": pred == -1, "raw": round(raw, 4), "ml_score": ml_score},
        "baseline_avg": round(avg, 2),
    }
