from __future__ import annotations

import os
import re
from typing import Any, Optional

import httpx
from dotenv import load_dotenv
from fastapi import Depends, Header, HTTPException

load_dotenv()

INSFORGE_URL = os.getenv("INSFORGE_URL", "https://9nixd2hy.us-east.insforge.app").rstrip("/")
INSFORGE_ANON_KEY = os.getenv("INSFORGE_ANON_KEY", "")

OTP_SECRET = re.compile(
    r"(?i)(\b(?:otp|pin|cvv|password|passcode|seed phrase|private key)\b[:\s]*)([A-Za-z0-9]{3,64})"
)


def redact_secrets(text: str) -> str:
    if not text:
        return text
    return OTP_SECRET.sub(r"\1[REDACTED]", text[:20000])


def _headers(token: str) -> dict[str, str]:
    return {
        "Authorization": f"Bearer {token}",
        "apikey": INSFORGE_ANON_KEY or token,
        "Content-Type": "application/json",
        "Prefer": "return=representation",
    }


def extract_bearer(authorization: Optional[str]) -> str:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Please sign in to analyze messages.")
    token = authorization.split(" ", 1)[1].strip()
    if not token:
        raise HTTPException(status_code=401, detail="Please sign in to analyze messages.")
    return token


def current_user(authorization: Optional[str] = Header(default=None)) -> dict:
    token = extract_bearer(authorization)
    try:
        with httpx.Client(timeout=20.0) as client:
            res = client.get(f"{INSFORGE_URL}/api/auth/sessions/current", headers=_headers(token))
    except httpx.HTTPError:
        raise HTTPException(status_code=503, detail="Authentication service is unavailable.")
    if res.status_code in (401, 403):
        raise HTTPException(status_code=401, detail="Your session expired. Please sign in again.")
    if res.status_code >= 400:
        raise HTTPException(status_code=401, detail="Could not verify your session.")
    payload = res.json()
    user = payload.get("user") or payload
    user_id = user.get("id") if isinstance(user, dict) else None
    if not user_id:
        raise HTTPException(status_code=401, detail="Could not verify your session.")
    return {"id": user_id, "token": token, "email": user.get("email")}


def require_user(user: dict = Depends(current_user)) -> dict:
    return user


def _insert(token: str, table: str, rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
    if not rows:
        return []
    url = f"{INSFORGE_URL}/api/database/records/{table}"
    try:
        with httpx.Client(timeout=30.0) as client:
            res = client.post(url, headers=_headers(token), json=rows)
    except httpx.HTTPError:
        raise HTTPException(status_code=503, detail="Database operation failed.")
    if res.status_code in (401, 403):
        raise HTTPException(status_code=403, detail="You do not have permission to save this record.")
    if res.status_code >= 400:
        raise HTTPException(status_code=502, detail="Database operation failed.")
    data = res.json()
    if isinstance(data, list):
        return data
    if isinstance(data, dict):
        return [data]
    return []


def persist_analysis(
    user: dict,
    *,
    input_type: str,
    original_text: str,
    result: dict[str, Any],
    extra: Optional[dict[str, Any]] = None,
) -> str:
    extra = extra or {}
    token = user["token"]
    user_id = user["id"]
    safe_text = redact_secrets(original_text or "")
    preview = extra.get("preview") or safe_text[:220]
    row = {
        "user_id": user_id,
        "input_type": input_type,
        "original_text": safe_text,
        "preview": preview,
        "risk_score": int(result.get("score") or 0),
        "risk_level": result.get("band") or "low",
        "classification": result.get("verdict") or "safe",
        "label": result.get("label"),
        "summary": result.get("summary"),
        "result_json": result,
    }
    inserted = _insert(token, "analyses", [row])
    if not inserted or not inserted[0].get("id"):
        raise HTTPException(status_code=502, detail="Database operation failed.")
    analysis_id = inserted[0]["id"]

    reasons = []
    for item in result.get("reasons") or []:
        weight = int(item.get("weight") or 0)
        severity = "critical" if weight >= 20 else "high" if weight >= 12 else "medium"
        reasons.append(
            {
                "analysis_id": analysis_id,
                "reason": item.get("title") or item.get("code") or "Flagged pattern",
                "category": item.get("category"),
                "severity": severity,
            }
        )
    _insert(token, "analysis_reasons", reasons)

    signals = []
    flags = (result.get("signals") or {}).get("flags") or []
    for flag in flags:
        signals.append(
            {
                "analysis_id": analysis_id,
                "signal_type": "rule",
                "signal_name": flag,
                "confidence": None,
                "metadata": {},
            }
        )
    for tech in result.get("social_engineering") or []:
        signals.append(
            {
                "analysis_id": analysis_id,
                "signal_type": "social_engineering",
                "signal_name": tech,
                "metadata": {},
            }
        )
    _insert(token, "detected_signals", signals)

    url_rows = []
    for u in result.get("urls") or []:
        flags_u = u.get("flags") or []
        url_rows.append(
            {
                "analysis_id": analysis_id,
                "url": u.get("url") or "",
                "domain": u.get("host"),
                "risk_score": u.get("score"),
                "risk_level": "high" if int(u.get("score") or 0) >= 51 else "moderate" if int(u.get("score") or 0) >= 21 else "low",
                "is_suspicious": int(u.get("score") or 0) >= 40,
                "is_shortened": "shortener" in flags_u,
                "brand_match": u.get("matched_brand") or u.get("lookalike"),
                "reputation": ",".join(flags_u) if flags_u else None,
            }
        )
    _insert(token, "urls", url_rows)

    if extra.get("screenshot"):
        shot = extra["screenshot"]
        _insert(
            token,
            "screenshots",
            [
                {
                    "user_id": user_id,
                    "analysis_id": analysis_id,
                    "storage_path": shot.get("storage_path") or "",
                    "storage_url": shot.get("storage_url"),
                    "file_name": shot.get("file_name"),
                    "mime_type": shot.get("mime_type"),
                    "file_size": shot.get("file_size"),
                    "ocr_text": redact_secrets(shot.get("ocr_text") or safe_text),
                }
            ],
        )

    if extra.get("conversation_turns"):
        conv = _insert(
            token,
            "conversations",
            [
                {
                    "user_id": user_id,
                    "analysis_id": analysis_id,
                    "title": extra.get("preview") or "Conversation",
                    "risk_score": int(result.get("score") or 0),
                    "risk_level": result.get("band") or "low",
                    "classification": result.get("verdict") or "safe",
                    "summary": result.get("summary"),
                }
            ],
        )
        if conv:
            cid = conv[0]["id"]
            msgs = []
            for i, turn in enumerate(extra["conversation_turns"]):
                msgs.append(
                    {
                        "conversation_id": cid,
                        "sender": turn.get("speaker"),
                        "message": redact_secrets(turn.get("text") or ""),
                        "sequence_number": i,
                    }
                )
            _insert(token, "conversation_messages", msgs)

    if extra.get("transaction"):
        tx = extra["transaction"]
        tx_rows = _insert(
            token,
            "transactions",
            [
                {
                    "user_id": user_id,
                    "analysis_id": analysis_id,
                    "amount": tx.get("amount"),
                    "currency": "INR",
                    "transaction_type": tx.get("channel") or "upi",
                    "recipient": tx.get("beneficiary"),
                    "device_information": tx.get("device"),
                    "location_information": tx.get("location"),
                    "is_anomaly": int(result.get("score") or 0) >= 51,
                    "anomaly_score": int(result.get("score") or 0),
                }
            ],
        )
        if tx_rows:
            _insert(
                token,
                "transaction_anomalies",
                [
                    {
                        "transaction_id": tx_rows[0]["id"],
                        "anomaly_score": int(result.get("score") or 0),
                        "risk_level": result.get("band"),
                        "reason": result.get("summary"),
                        "detected_signals": (result.get("signals") or {}).get("flags") or [],
                    }
                ],
            )

    return str(analysis_id)
