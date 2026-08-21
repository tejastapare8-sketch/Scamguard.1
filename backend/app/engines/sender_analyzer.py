from __future__ import annotations

import re

from app.data.brands import HOMOGLYPHS, TRUSTED_BRANDS
from app.data import patterns as P


def _fold(s: str) -> str:
    s = s.lower()
    return "".join(HOMOGLYPHS.get(c, c) for c in s)


def analyze_sender(sender: str | None, text: str = "") -> dict:
    if not sender:
        return {"score": 0, "reasons": [], "flags": [], "display": None}

    s = sender.strip()
    reasons = []
    flags = []
    score = 0
    folded = _fold(s)

    email_match = P.EMAIL.search(s)
    domain = email_match.group(0).split("@")[-1].lower() if email_match else None

    if email_match:
        local = email_match.group(0).split("@")[0].lower()
        if re.search(r"(support|secure|verify|kyc|alert|security)", local):
            score += 6
            flags.append("role_localpart")
        for key, meta in TRUSTED_BRANDS.items():
            names = [n.replace(" ", "") for n in meta["names"]]
            if any(n in folded.replace("@", "") for n in names):
                official = meta["domains"]
                if domain and not any(domain == d or domain.endswith("." + d) for d in official):
                    score += 24
                    flags.append("brand_spoof_email")
                    reasons.append(
                        {
                            "code": "brand_spoof_email",
                            "title": "Brand impersonation in sender address",
                            "detail": f"{s} is not an official {meta['names'][0]} address. Expected domains: {', '.join(official[:2])}.",
                            "weight": 24,
                            "category": "sender",
                        }
                    )
                if any(ch.isdigit() for ch in domain or "") and any(n in _fold(domain or "") for n in names):
                    score += 10
                    flags.append("homoglyph_domain")
                    reasons.append(
                        {
                            "code": "homoglyph_domain",
                            "title": "Character substitution in domain",
                            "detail": f"Digits or lookalike characters in {domain} (e.g. 1 instead of l).",
                            "weight": 10,
                            "category": "sender",
                        }
                    )
                break

    # SMS sender IDs that look official but are not 6-char headers
    if re.fullmatch(r"\+?\d{10,15}", s.replace(" ", "")):
        # numeric SMS claiming to be a bank in body
        if P.AUTHORITY.search(text or ""):
            score += 14
            flags.append("numeric_authority")
            reasons.append(
                {
                    "code": "numeric_authority",
                    "title": "Unknown number claiming to be an official",
                    "detail": "Banks send from registered header IDs, not random mobile numbers.",
                    "weight": 14,
                    "category": "sender",
                }
            )

    return {"score": min(100, score), "reasons": reasons, "flags": flags, "display": s, "domain": domain}
