"""Trusted brands, official domains, and lookalike detection seeds (India-focused)."""

TRUSTED_BRANDS = {
    "sbi": {"names": ["sbi", "state bank of india", "state bank"], "domains": ["sbi.co.in", "onlinesbi.sbi", "sbi.bank.in"]},
    "hdfc": {"names": ["hdfc", "hdfc bank"], "domains": ["hdfcbank.com", "hdfcbank.co.in"]},
    "icici": {"names": ["icici", "icici bank"], "domains": ["icicibank.com"]},
    "axis": {"names": ["axis bank", "axis"], "domains": ["axisbank.com"]},
    "kotak": {"names": ["kotak", "kotak mahindra"], "domains": ["kotak.com", "kotakbank.com"]},
    "pnb": {"names": ["pnb", "punjab national bank"], "domains": ["pnbindia.in"]},
    "bob": {"names": ["bank of baroda", "bob"], "domains": ["bankofbaroda.in"]},
    "paytm": {"names": ["paytm"], "domains": ["paytm.com", "paytmbank.com"]},
    "phonepe": {"names": ["phonepe", "phone pe"], "domains": ["phonepe.com"]},
    "gpay": {"names": ["google pay", "gpay", "g pay"], "domains": ["pay.google.com", "google.com"]},
    "bhim": {"names": ["bhim", "bhim upi"], "domains": ["bhimupi.org.in", "npci.org.in"]},
    "npci": {"names": ["npci", "upi"], "domains": ["npci.org.in"]},
    "paypal": {"names": ["paypal"], "domains": ["paypal.com", "paypal.in"]},
    "razorpay": {"names": ["razorpay"], "domains": ["razorpay.com"]},
    "amazon": {"names": ["amazon", "amazon pay"], "domains": ["amazon.in", "amazon.com"]},
    "flipkart": {"names": ["flipkart"], "domains": ["flipkart.com"]},
    "incometax": {"names": ["income tax", "incometax", "it department", "e-filing"], "domains": ["incometax.gov.in", "incometaxindia.gov.in"]},
    "gst": {"names": ["gst", "gstn"], "domains": ["gst.gov.in"]},
    "uidai": {"names": ["uidai", "aadhaar", "aadhar"], "domains": ["uidai.gov.in", "resident.uidai.gov.in"]},
    "rbi": {"names": ["rbi", "reserve bank"], "domains": ["rbi.org.in"]},
    "epfo": {"names": ["epfo", "pf", "provident fund"], "domains": ["epfindia.gov.in"]},
    "irctc": {"names": ["irctc"], "domains": ["irctc.co.in"]},
    "indiapost": {"names": ["india post", "indiapost"], "domains": ["indiapost.gov.in"]},
    "delhivery": {"names": ["delhivery"], "domains": ["delhivery.com"]},
    "bluedart": {"names": ["bluedart", "blue dart"], "domains": ["bluedart.com"]},
    "airtel": {"names": ["airtel"], "domains": ["airtel.in", "airtel.com"]},
    "jio": {"names": ["jio", "reliance jio"], "domains": ["jio.com"]},
    "binance": {"names": ["binance"], "domains": ["binance.com"]},
    "wazirx": {"names": ["wazirx"], "domains": ["wazirx.com"]},
    "coindcx": {"names": ["coindcx"], "domains": ["coindcx.com"]},
    "microsoft": {"names": ["microsoft"], "domains": ["microsoft.com", "login.microsoftonline.com"]},
    "google": {"names": ["google"], "domains": ["google.com", "accounts.google.com"]},
    "whatsapp": {"names": ["whatsapp"], "domains": ["whatsapp.com", "faq.whatsapp.com"]},
}

SUSPICIOUS_TLDS = {
    "xyz", "top", "click", "loan", "win", "vip", "gq", "tk", "ml", "cf", "ga",
    "rest", "zip", "mov", "country", "stream", "gdn", "work", "fit", "review",
    "support", "account", "security", "secure", "bank", "pay",
}

URL_SHORTENERS = {
    "bit.ly", "tinyurl.com", "t.co", "goo.gl", "ow.ly", "is.gd", "cutt.ly",
    "rebrand.ly", "shorturl.at", "rb.gy", "tiny.cc", "bl.ink", "lnkd.in",
}

HOMOGLYPHS = {
    "0": "o",
    "1": "l",
    "3": "e",
    "4": "a",
    "5": "s",
    "7": "t",
    "8": "b",
    "@": "a",
}
