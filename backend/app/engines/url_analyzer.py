from __future__ import annotations

import re
from urllib.parse import urlparse

from app.data.brands import HOMOGLYPHS, SUSPICIOUS_TLDS, TRUSTED_BRANDS, URL_SHORTENERS
from app.data import patterns as P


def extract_urls(text: str, extra: list[str] | None = None) -> list[str]:
    found = P.URL.findall(text or "")
    urls = list(found)
    if extra:
        urls.extend(extra)
    normalized = []
    for u in urls:
        u = u.strip().rstrip(").,;")
        if u.lower().startswith("www."):
            u = "http://" + u
        normalized.append(u)
    # unique preserve order
    seen = set()
    out = []
    for u in normalized:
        key = u.lower()
        if key not in seen:
            seen.add(key)
            out.append(u)
    return out


def extract_entities(text: str) -> dict:
    amounts = []
    for m in P.AMOUNT.finditer(text or ""):
        raw = m.group(1) or m.group(2) or "0"
        try:
            amounts.append(float(raw.replace(",", "")))
        except ValueError:
            pass
    return {
        "amounts": amounts,
        "upi_ids": P.UPI_ID.findall(text or ""),
        "emails": P.EMAIL.findall(text or ""),
        "phones": P.PHONE.findall(text or ""),
        "ifsc": P.IFSC.findall(text or ""),
        "account_like": [n for n in P.ACCOUNT_NO.findall(text or "") if len(n) >= 11],
        "urls": extract_urls(text),
    }


def _normalize_homoglyph(s: str) -> str:
    s = s.lower()
    return "".join(HOMOGLYPHS.get(ch, ch) for ch in s)


def domain_similarity(a: str, b: str) -> float:
    a, b = a.lower(), b.lower()
    if a == b:
        return 1.0
    # Dice-like character bigram
    def bigrams(x: str) -> set[str]:
        return {x[i : i + 2] for i in range(len(x) - 1)} or {x}

    ba, bb = bigrams(a), bigrams(b)
    return 2 * len(ba & bb) / max(1, len(ba) + len(bb))


def analyze_url(url: str, claimed_brand: str | None = None) -> dict:
    reasons = []
    score = 0
    parsed = urlparse(url if "://" in url else "http://" + url)
    host = (parsed.hostname or "").lower()
    path = parsed.path or ""
    scheme = parsed.scheme or "http"

    if not host:
        return {
            "url": url,
            "host": "",
            "score": 40,
            "reasons": [{"code": "bad_url", "title": "Malformed URL", "detail": url, "weight": 40, "category": "url"}],
            "flags": ["malformed"],
        }

    flags = []
    parts = host.split(".")
    tld = parts[-1] if parts else ""
    registrable = ".".join(parts[-2:]) if len(parts) >= 2 else host

    if scheme != "https":
        score += 8
        flags.append("no_https")
        reasons.append(
            {
                "code": "no_https",
                "title": "Connection is not HTTPS",
                "detail": f"{host} does not use HTTPS.",
                "weight": 8,
                "category": "url",
            }
        )

    if registrable in URL_SHORTENERS or host in URL_SHORTENERS:
        score += 18
        flags.append("shortener")
        reasons.append(
            {
                "code": "shortener",
                "title": "URL shortener hides the real destination",
                "detail": f"{host} is a known shortener and can mask phishing redirects.",
                "weight": 18,
                "category": "url",
            }
        )

    if tld in SUSPICIOUS_TLDS:
        score += 12
        flags.append("suspicious_tld")
        reasons.append(
            {
                "code": "suspicious_tld",
                "title": "Suspicious top-level domain",
                "detail": f".{tld} is frequently abused in phishing campaigns.",
                "weight": 12,
                "category": "url",
            }
        )

    if host.count(".") >= 3:
        score += 8
        flags.append("many_subdomains")
        reasons.append(
            {
                "code": "many_subdomains",
                "title": "Unusually nested subdomains",
                "detail": host,
                "weight": 8,
                "category": "url",
            }
        )

    suspicious_tokens = ["secure", "login", "verify", "update", "kyc", "unlock", "support", "account", "bank"]
    token_hits = [t for t in suspicious_tokens if t in host.replace("-", "") or t in path.lower()]
    if token_hits:
        add = min(16, 6 * len(token_hits))
        score += add
        flags.append("login_keywords")
        reasons.append(
            {
                "code": "login_keywords",
                "title": "Login/verification keywords in URL",
                "detail": ", ".join(token_hits),
                "weight": add,
                "category": "url",
            }
        )

    if re.search(r"[0-9]", host) and any(b in _normalize_homoglyph(host) for b in ("paypal", "paytm", "phonepe", "hdfc", "icici", "sbi")):
        score += 18
        flags.append("digit_in_brand")
        reasons.append(
            {
                "code": "digit_in_brand",
                "title": "Digits used to impersonate a brand",
                "detail": host,
                "weight": 18,
                "category": "url",
            }
        )

    matched_brand = None
    lookalike = None
    host_norm = _normalize_homoglyph(host)
    for key, meta in TRUSTED_BRANDS.items():
        official = [d.lower() for d in meta["domains"]]
        if host in official or any(host.endswith("." + d) for d in official):
            matched_brand = key
            break
        for name in meta["names"]:
            n = name.replace(" ", "")
            if n and n in host_norm.replace(".", "").replace("-", ""):
                if not any(host.endswith(d) or host == d for d in official):
                    lookalike = key
                    sim = max(domain_similarity(host, d) for d in official)
                    add = 22 if sim > 0.45 else 16
                    score += add
                    flags.append("brand_lookalike")
                    reasons.append(
                        {
                            "code": "brand_lookalike",
                            "title": f"Possible {name.title()} impersonation",
                            "detail": f"{host} is not an official {name} domain ({', '.join(official[:2])}).",
                            "weight": add,
                            "category": "impersonation",
                        }
                    )
                break

    if claimed_brand:
        cb = claimed_brand.lower()
        for key, meta in TRUSTED_BRANDS.items():
            if cb in meta["names"] or cb == key:
                if not any(host == d or host.endswith("." + d) for d in meta["domains"]):
                    score += 20
                    flags.append("claimed_brand_mismatch")
                    reasons.append(
                        {
                            "code": "claimed_brand_mismatch",
                            "title": "Sender brand does not match the domain",
                            "detail": f"Claims {claimed_brand} but domain is {host}.",
                            "weight": 20,
                            "category": "impersonation",
                        }
                    )

    score = min(100, score)
    return {
        "url": url,
        "host": host,
        "score": score,
        "https": scheme == "https",
        "tld": tld,
        "matched_brand": matched_brand,
        "lookalike": lookalike,
        "flags": flags,
        "reasons": reasons,
    }
