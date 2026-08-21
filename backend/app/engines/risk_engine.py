from __future__ import annotations

from app.engines.conversation_analyzer import analyze_conversation
from app.engines.impersonation import analyze_impersonation
from app.engines.payment_analyzer import analyze_payment
from app.engines.qr_analyzer import analyze_qr_payload, decode_qr_from_bytes
from app.engines.sender_analyzer import analyze_sender
from app.engines.social_engineering import analyze_social_engineering
from app.engines.text_analyzer import analyze_text
from app.engines.transaction_anomaly import analyze_transactions
from app.engines.url_analyzer import analyze_url, extract_urls
from app.ml.classifier import classify_text
from app.schemas import AnalysisResult


VERDICT_LABELS = {
    "safe": "Safe",
    "suspicious": "Suspicious",
    "likely_scam": "Likely Scam / Fraud",
    "phishing": "Phishing",
    "payment_fraud": "Payment Fraud",
    "urgent_threat": "Urgent Financial Threat",
}


def _band(score: int) -> str:
    if score <= 20:
        return "low"
    if score <= 50:
        return "moderate"
    if score <= 75:
        return "high"
    return "critical"


def _verdict(score: int, flags: set[str], url_max: int) -> str:
    if score <= 20:
        return "safe"
    phishingish = url_max >= 35 or "phishing_cta" in flags or "brand_lookalike" in flags or "kyc" in flags
    paymentish = "otp_plus_payment" in flags or "advance_fee" in flags or "upi_id" in flags or "new_beneficiary" in flags
    urgent = "fear" in flags and ("urgency" in flags or "otp_request" in flags)
    if score >= 70 and urgent:
        return "urgent_threat"
    if score >= 51 and phishingish and not (paymentish and url_max < 25):
        return "phishing"
    if score >= 51 and paymentish:
        return "payment_fraud"
    if score >= 51:
        return "likely_scam"
    return "suspicious"


def _merge_reasons(*groups: list[dict]) -> list[dict]:
    seen = set()
    out = []
    for group in groups:
        for r in group or []:
            key = r.get("code")
            if key in seen:
                continue
            seen.add(key)
            out.append(r)
    out.sort(key=lambda x: -int(x.get("weight") or 0))
    return out[:12]


def analyze_message(
    text: str,
    sender: str | None = None,
    channel: str = "sms",
    extra_urls: list[str] | None = None,
    subject: str | None = None,
) -> AnalysisResult:
    blob = " ".join(x for x in [subject or "", text or ""] if x)
    text_res = analyze_text(blob)
    se = analyze_social_engineering(blob)
    pay = analyze_payment(blob, text_res["extracted"])
    urls = extract_urls(blob, extra_urls)
    url_results = [analyze_url(u) for u in urls]
    url_score = max((u["score"] for u in url_results), default=0)
    url_reasons = [r for u in url_results for r in u["reasons"]]
    url_flags = {f for u in url_results for f in u.get("flags", [])}
    sender_res = analyze_sender(sender, blob)
    imp = analyze_impersonation(blob, sender, url_results)
    ml = classify_text(blob)

    flags = set(text_res["flags"]) | set(pay["flags"]) | url_flags | set(sender_res["flags"])
    components = {
        "text": int(text_res["score"]),
        "url": int(url_score),
        "payment": int(pay["score"]),
        "sender": int(sender_res["score"]),
        "behavioral": int(se["score"]),
        "ml": int(ml["scam_probability"] * 100),
        "impersonation": int(imp["score"]),
    }
    combo = 0
    combo_reasons = []
    if {"otp_request", "authority", "fear"} <= flags:
        combo += 12
        combo_reasons.append(
            {
                "code": "stack_otp_authority",
                "title": "Authority + fear + OTP request",
                "detail": "This combination is a hallmark of fake bank / cyber-cell calls and SMS.",
                "weight": 12,
                "category": "social",
            }
        )
    if url_score >= 40 and ("phishing_cta" in flags or "kyc" in flags or "brand_lookalike" in url_flags or "login_keywords" in url_flags):
        combo += 8
    if "advance_fee" in flags and ("reward" in flags or "urgency" in flags):
        combo += 10
        combo_reasons.append(
            {
                "code": "advance_fee_scam",
                "title": "Advance-fee scam pattern",
                "detail": "A prize or refund is used as bait, then a fee is demanded under time pressure.",
                "weight": 10,
                "category": "payment",
            }
        )
    primary = max(components["text"], components["url"], components["payment"], int(components["behavioral"] * 0.7))
    support = components["text"] + components["url"] + components["payment"] + components["sender"] - primary
    ml_nudge = int(ml["scam_probability"] * 8)
    score = int(min(100, round(primary + 0.2 * max(0, support) + combo + 0.15 * components["impersonation"] + ml_nudge)))
    if "otp_advisory" in flags and "otp_request" not in flags:
        score = min(score, 18)

    verdict = _verdict(score, flags, url_score)
    reasons = _merge_reasons(
        combo_reasons,
        text_res["reasons"],
        se["reasons"],
        pay["reasons"],
        url_reasons,
        sender_res["reasons"],
        imp["reasons"],
    )
    if ml["scam_probability"] >= 0.6:
        reasons.append(
            {
                "code": "ml_nlp",
                "title": "NLP classifier indicates scam-like language",
                "detail": f"TF-IDF + Logistic Regression scam probability {ml['scam_probability']:.0%}.",
                "weight": int(ml["scam_probability"] * 20),
                "category": "ml",
            }
        )

    summary = _summary(score, verdict, reasons, se["labels"])
    label = VERDICT_LABELS[verdict]
    if url_score >= 50 and verdict == "phishing":
        label = "High Risk - Possible Banking Phishing"

    return AnalysisResult(
        score=score,
        band=_band(score),
        verdict=verdict,
        label=label,
        summary=summary,
        reasons=reasons,
        signals={"flags": sorted(flags), "techniques": se["labels"]},
        components=components,
        extracted=text_res["extracted"],
        social_engineering=se["labels"],
        impersonation=imp["claimed"],
        urls=url_results,
        ml=ml,
    )


def analyze_conversation_full(turns: list[dict], sender: str | None = None, channel: str = "whatsapp") -> AnalysisResult:
    convo = analyze_conversation(turns)
    other = "\n".join(t.get("text") or "" for t in turns if t.get("speaker") != "user")
    base = analyze_message(other, sender=sender, channel=channel)
    score = min(100, int(0.45 * base.score + 0.55 * convo["score"]))
    reasons = _merge_reasons([r.model_dump() for r in base.reasons], convo["reasons"])
    verdict = _verdict(score, set(base.signals.get("flags") or []), max((u.get("score") or 0) for u in base.urls) if base.urls else 0)
    if score >= 85:
        verdict = "likely_scam" if verdict == "suspicious" else verdict
    return AnalysisResult(
        score=score,
        band=_band(score),
        verdict=verdict,
        label=VERDICT_LABELS[verdict],
        summary=_summary(score, verdict, reasons, convo["social_engineering"]),
        reasons=reasons,
        signals=base.signals,
        components={**base.components, "conversation": convo["score"]},
        extracted=base.extracted,
        social_engineering=convo["social_engineering"],
        impersonation=base.impersonation,
        urls=base.urls,
        conversation=convo,
        ml=base.ml,
    )


def analyze_screenshot(ocr_text: str, image_bytes: bytes | None, sender: str | None = None) -> AnalysisResult:
    qr_raw = decode_qr_from_bytes(image_bytes) if image_bytes else {"found": False}
    qr_intel = None
    extra_urls = []
    qr_reasons = []
    qr_score = 0
    if qr_raw.get("found") and qr_raw.get("payload"):
        qr_intel = analyze_qr_payload(qr_raw["payload"])
        extra_urls = [u["url"] for u in qr_intel.get("urls") or []]
        qr_reasons = qr_intel.get("reasons") or []
        qr_score = qr_intel.get("score") or 0
        ocr_text = (ocr_text or "") + "\n" + (qr_raw["payload"] or "")

    result = analyze_message(ocr_text or "", sender=sender, channel="screenshot", extra_urls=extra_urls)
    if qr_score:
        score = min(100, int(0.75 * result.score + 0.25 * qr_score + 8))
        reasons = _merge_reasons([r.model_dump() for r in result.reasons], qr_reasons)
        verdict = result.verdict
        if qr_intel and qr_intel.get("parsed", {}).get("vpa") and score >= 40:
            verdict = "payment_fraud" if result.verdict in ("safe", "suspicious", "payment_fraud") else result.verdict
        result = result.model_copy(
            update={
                "score": score,
                "band": _band(score),
                "verdict": verdict,
                "label": VERDICT_LABELS[verdict],
                "reasons": reasons,
                "qr": {**qr_raw, **(qr_intel or {})},
                "summary": _summary(score, verdict, reasons, result.social_engineering),
            }
        )
    else:
        result = result.model_copy(update={"qr": qr_raw})
    return result


def analyze_url_only(url: str, claimed_brand: str | None = None) -> AnalysisResult:
    u = analyze_url(url, claimed_brand)
    score = u["score"]
    flags = set(u.get("flags") or [])
    verdict = _verdict(score, flags, score)
    if score >= 45:
        verdict = "phishing"
    return AnalysisResult(
        score=score,
        band=_band(score),
        verdict=verdict,
        label="High Risk - Possible Banking Phishing" if score >= 50 else VERDICT_LABELS[verdict],
        summary=_summary(score, verdict, u["reasons"], []),
        reasons=u["reasons"],
        signals={"flags": sorted(flags)},
        components={"url": score},
        extracted={"urls": [url]},
        social_engineering=[],
        impersonation=[u["lookalike"]] if u.get("lookalike") else [],
        urls=[u],
        ml={},
    )


def analyze_tx(history: list[dict], current: dict) -> AnalysisResult:
    tx = analyze_transactions(history, current)
    score = tx["score"]
    verdict = _verdict(score, set(tx["flags"]), 0)
    if score >= 51:
        verdict = "payment_fraud"
    return AnalysisResult(
        score=score,
        band=_band(score),
        verdict=verdict,
        label=VERDICT_LABELS[verdict],
        summary=_summary(score, verdict, tx["reasons"], []),
        reasons=tx["reasons"],
        signals={"flags": tx["flags"]},
        components={"transaction": score},
        extracted={"amount": current.get("amount"), "beneficiary": current.get("beneficiary")},
        social_engineering=[],
        impersonation=[],
        transaction=tx,
        ml=tx.get("ml") or {},
    )


def _summary(score: int, verdict: str, reasons: list[dict], se: list[str]) -> str:
    if not reasons:
        return "No strong fraud indicators were found. Stay cautious with unexpected payment requests."
    top = reasons[0]["title"]
    extra = f" Social engineering: {' + '.join(se)}." if se else ""
    return f"{VERDICT_LABELS[verdict]} ({score}/100). Primary signal: {top}.{extra}"
