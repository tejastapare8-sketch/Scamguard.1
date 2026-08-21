from __future__ import annotations

import re
from io import BytesIO

import cv2
import numpy as np
from PIL import Image

from app.engines.url_analyzer import analyze_url, extract_urls
from app.data import patterns as P


def decode_qr_from_bytes(data: bytes) -> dict:
    try:
        img = Image.open(BytesIO(data)).convert("RGB")
        arr = np.array(img)
        bgr = cv2.cvtColor(arr, cv2.COLOR_RGB2BGR)
        detector = cv2.QRCodeDetector()
        payload, points, _ = detector.detectAndDecode(bgr)
        if not payload and points is None:
            # try upscaled
            big = cv2.resize(bgr, None, fx=2, fy=2, interpolation=cv2.INTER_CUBIC)
            payload, points, _ = detector.detectAndDecode(big)
        found = bool(payload)
        return {
            "found": found,
            "payload": payload or None,
            "points": points.tolist() if points is not None else None,
        }
    except Exception as exc:  # noqa: BLE001
        return {"found": False, "payload": None, "error": str(exc)}


def analyze_qr_payload(payload: str) -> dict:
    reasons = []
    flags = []
    score = 0
    parsed = {"raw": payload}

    upi = re.search(r"pa=([^&]+)", payload, re.I)
    pn = re.search(r"pn=([^&]+)", payload, re.I)
    am = re.search(r"am=([^&]+)", payload, re.I)
    tn = re.search(r"tn=([^&]+)", payload, re.I)
    if upi:
        parsed["vpa"] = upi.group(1)
        score += 6
        flags.append("upi_qr")
    if pn:
        parsed["name"] = pn.group(1).replace("%20", " ")
    if am:
        try:
            parsed["amount"] = float(am.group(1))
            if parsed["amount"] >= 5000:
                score += 10
                flags.append("qr_amount")
                reasons.append(
                    {
                        "code": "qr_amount",
                        "title": "QR encodes a sizable payment amount",
                        "detail": f"₹{parsed['amount']:,.0f} is pre-filled. Confirm the recipient before paying.",
                        "weight": 10,
                        "category": "qr",
                    }
                )
        except ValueError:
            pass
    if tn:
        parsed["note"] = tn.group(1).replace("%20", " ")

    urls = extract_urls(payload)
    url_results = [analyze_url(u) for u in urls]
    url_score = max([u["score"] for u in url_results], default=0)
    if url_score:
        score += min(30, url_score // 2)
        flags.append("qr_url")
        reasons.append(
            {
                "code": "qr_url",
                "title": "QR code opens a web link",
                "detail": urls[0] if urls else payload[:80],
                "weight": min(30, url_score // 2),
                "category": "qr",
            }
        )
        reasons.extend(url_results[0]["reasons"] if url_results else [])

    if P.OTP_PIN.search(payload):
        score += 20
        flags.append("qr_otp")

    if "upi://pay" in payload.lower() or payload.lower().startswith("upi://"):
        reasons.append(
            {
                "code": "upi_qr_warn",
                "title": "Potential payment QR",
                "detail": "Verify the recipient name and VPA match the person you intend to pay.",
                "weight": 8,
                "category": "qr",
            }
        )
        score += 8

    return {
        "score": min(100, score),
        "reasons": reasons,
        "flags": flags,
        "parsed": parsed,
        "urls": url_results,
    }
