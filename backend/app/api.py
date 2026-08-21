from __future__ import annotations

import json
from typing import Optional

from fastapi import APIRouter, Depends, File, Form, UploadFile
from sqlalchemy.orm import Session

from app.database import Detection, Report, SessionLocal
from app.engines.risk_engine import (
    analyze_conversation_full,
    analyze_message,
    analyze_screenshot,
    analyze_tx,
    analyze_url_only,
)
from app.schemas import (
    AnalysisResult,
    ConversationAnalyzeRequest,
    MessageAnalyzeRequest,
    TransactionAnalyzeRequest,
    UrlAnalyzeRequest,
)

router = APIRouter(prefix="/api")


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def persist(db: Session, channel: str, preview: str, result: AnalysisResult) -> AnalysisResult:
    row = Detection(
        channel=channel,
        preview=(preview or "")[:220],
        score=result.score,
        verdict=result.verdict,
        label=result.label,
        result_json=result.model_dump_json(),
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    payload = result.model_dump()
    payload["id"] = row.id
    payload["created_at"] = row.created_at.isoformat() if row.created_at else None
    return payload


@router.post("/analyze/message")
def analyze_msg(body: MessageAnalyzeRequest, db: Session = Depends(get_db)):
    result = analyze_message(body.text, sender=body.sender, channel=body.channel, extra_urls=body.urls, subject=body.subject)
    return persist(db, body.channel, body.text, result)


@router.post("/analyze/conversation")
def analyze_convo(body: ConversationAnalyzeRequest, db: Session = Depends(get_db)):
    turns = [t.model_dump() for t in body.turns]
    result = analyze_conversation_full(turns, sender=body.sender, channel=body.channel)
    preview = " | ".join((t.text[:60] for t in body.turns[:4]))
    return persist(db, "conversation", preview, result)


@router.post("/analyze/url")
def analyze_url_ep(body: UrlAnalyzeRequest, db: Session = Depends(get_db)):
    result = analyze_url_only(body.url, claimed_brand=body.claimed_brand)
    return persist(db, "url", body.url, result)


@router.post("/analyze/transaction")
def analyze_transaction(body: TransactionAnalyzeRequest, db: Session = Depends(get_db)):
    result = analyze_tx([h.model_dump() for h in body.history], body.current.model_dump())
    preview = f"₹{body.current.amount} → {body.current.beneficiary}"
    return persist(db, "transaction", preview, result)


@router.post("/analyze/screenshot")
async def analyze_shot(
    text: Optional[str] = Form(None),
    sender: Optional[str] = Form(None),
    file: UploadFile | None = File(None),
    db: Session = Depends(get_db),
):
    image_bytes = await file.read() if file is not None else None
    result = analyze_screenshot(text or "", image_bytes, sender=sender)
    preview = (text or "")[:220] or (file.filename if file else "screenshot")
    return persist(db, "screenshot", preview, result)


@router.post("/reports")
def add_report(detection_id: int | None = None, notes: str = "", confirmed_scam: bool = True, db: Session = Depends(get_db)):
    row = Report(detection_id=detection_id, notes=notes, confirmed_scam=1 if confirmed_scam else 0)
    db.add(row)
    db.commit()
    return {"ok": True, "id": row.id}


@router.get("/detections")
def list_detections(limit: int = 50, db: Session = Depends(get_db)):
    rows = db.query(Detection).order_by(Detection.id.desc()).limit(limit).all()
    return [
        {
            "id": r.id,
            "created_at": r.created_at.isoformat() if r.created_at else None,
            "channel": r.channel,
            "preview": r.preview,
            "score": r.score,
            "verdict": r.verdict,
            "label": r.label,
        }
        for r in rows
    ]


@router.get("/detections/{detection_id}")
def get_detection(detection_id: int, db: Session = Depends(get_db)):
    row = db.get(Detection, detection_id)
    if not row:
        return {"error": "not found"}
    data = json.loads(row.result_json)
    data.update(
        {
            "id": row.id,
            "created_at": row.created_at.isoformat() if row.created_at else None,
            "channel": row.channel,
            "preview": row.preview,
        }
    )
    return data


@router.get("/dashboard/stats")
def stats(db: Session = Depends(get_db)):
    rows = db.query(Detection).all()
    verdicts = {}
    channels = {}
    critical = 0
    phishing = 0
    payment = 0
    suspicious = 0
    for r in rows:
        verdicts[r.verdict] = verdicts.get(r.verdict, 0) + 1
        channels[r.channel] = channels.get(r.channel, 0) + 1
        if r.score >= 76:
            critical += 1
        if r.verdict == "phishing":
            phishing += 1
        if r.verdict == "payment_fraud":
            payment += 1
        if r.verdict in ("suspicious", "likely_scam"):
            suspicious += 1
    recent = (
        db.query(Detection).order_by(Detection.id.desc()).limit(8).all()
    )
    return {
        "messages_analyzed": len(rows),
        "suspicious": suspicious,
        "phishing": phishing,
        "payment_scams": payment,
        "critical": critical,
        "verdicts": verdicts,
        "channels": channels,
        "recent": [
            {
                "id": r.id,
                "preview": r.preview,
                "score": r.score,
                "verdict": r.verdict,
                "label": r.label,
                "channel": r.channel,
                "created_at": r.created_at.isoformat() if r.created_at else None,
            }
            for r in recent
        ],
    }
