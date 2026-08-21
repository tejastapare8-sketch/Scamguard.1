from __future__ import annotations

from app.data.brands import TRUSTED_BRANDS


def analyze_impersonation(text: str, sender: str | None, url_results: list[dict]) -> dict:
    t = (text or "").lower()
    claimed = []
    mismatches = []
    score = 0
    reasons = []

    for key, meta in TRUSTED_BRANDS.items():
        if any(name in t for name in meta["names"]):
            claimed.append(meta["names"][0])
            official_ok = False
            if sender:
                s = sender.lower()
                if any(d in s for d in meta["domains"]):
                    official_ok = True
            for u in url_results:
                if u.get("matched_brand") == key:
                    official_ok = True
            if not official_ok and (sender or url_results):
                mismatches.append(meta["names"][0])

    if claimed and mismatches:
        score += 18
        reasons.append(
            {
                "code": "entity_mismatch",
                "title": "Claims a trusted organization without a matching sender/domain",
                "detail": "Mentions: " + ", ".join(sorted(set(claimed))) + ". Unverified against sender/URLs.",
                "weight": 18,
                "category": "impersonation",
            }
        )
    elif claimed and not sender:
        score += 8
        reasons.append(
            {
                "code": "unverified_entity",
                "title": "Mentions a financial or government entity",
                "detail": ", ".join(sorted(set(claimed))),
                "weight": 8,
                "category": "impersonation",
            }
        )

    return {
        "score": min(100, score),
        "claimed": sorted(set(claimed)),
        "mismatches": mismatches,
        "reasons": reasons,
    }
