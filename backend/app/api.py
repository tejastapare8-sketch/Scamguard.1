from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile

from app.engines.risk_engine import (
    analyze_conversation_full,
    analyze_message,
    analyze_screenshot,
    analyze_tx,
    analyze_url_only,
)
from app.insforge_client import persist_analysis, require_user
from app.schemas import (
    ConversationAnalyzeRequest,
    MessageAnalyzeRequest,
    TransactionAnalyzeRequest,
    UrlAnalyzeRequest,
)

router = APIRouter(prefix="/api")

ALLOWED_TYPES = {"image/png", "image/jpeg", "image/jpg", "image/webp"}
MAX_BYTES = 8 * 1024 * 1024


def _payload(result, analysis_id: str) -> dict:
    data = result.model_dump()
    data["id"] = analysis_id
    return data


@router.post("/analyze/message")
def analyze_msg(body: MessageAnalyzeRequest, user: dict = Depends(require_user)):
    text = (body.text or "").strip()
    if not text:
        raise HTTPException(status_code=422, detail="Message text is required.")
    if len(text) > 20000:
        raise HTTPException(status_code=422, detail="Message is too long.")
    result = analyze_message(text, sender=body.sender, channel=body.channel, extra_urls=body.urls, subject=body.subject)
    analysis_id = persist_analysis(user, input_type=body.channel, original_text=text, result=result.model_dump())
    return _payload(result, analysis_id)


@router.post("/analyze/conversation")
def analyze_convo(body: ConversationAnalyzeRequest, user: dict = Depends(require_user)):
    if not body.turns:
        raise HTTPException(status_code=422, detail="Add at least one conversation turn.")
    turns = [t.model_dump() for t in body.turns]
    result = analyze_conversation_full(turns, sender=body.sender, channel=body.channel)
    preview = " | ".join((t.text[:60] for t in body.turns[:4]))
    analysis_id = persist_analysis(
        user,
        input_type="conversation",
        original_text="\n".join(t.text for t in body.turns),
        result=result.model_dump(),
        extra={"preview": preview, "conversation_turns": turns},
    )
    return _payload(result, analysis_id)


@router.post("/analyze/url")
def analyze_url_ep(body: UrlAnalyzeRequest, user: dict = Depends(require_user)):
    url = (body.url or "").strip()
    if not url:
        raise HTTPException(status_code=422, detail="A URL is required.")
    result = analyze_url_only(url, claimed_brand=body.claimed_brand)
    analysis_id = persist_analysis(user, input_type="url", original_text=url, result=result.model_dump())
    return _payload(result, analysis_id)


@router.post("/analyze/transaction")
def analyze_transaction(body: TransactionAnalyzeRequest, user: dict = Depends(require_user)):
    result = analyze_tx([h.model_dump() for h in body.history], body.current.model_dump())
    preview = f"₹{body.current.amount} → {body.current.beneficiary}"
    analysis_id = persist_analysis(
        user,
        input_type="transaction",
        original_text=preview,
        result=result.model_dump(),
        extra={"preview": preview, "transaction": body.current.model_dump()},
    )
    return _payload(result, analysis_id)


@router.post("/analyze/screenshot")
async def analyze_shot(
    text: Optional[str] = Form(None),
    sender: Optional[str] = Form(None),
    storage_path: Optional[str] = Form(None),
    storage_url: Optional[str] = Form(None),
    file_name: Optional[str] = Form(None),
    mime_type: Optional[str] = Form(None),
    file_size: Optional[int] = Form(None),
    file: UploadFile | None = File(None),
    user: dict = Depends(require_user),
):
    image_bytes = None
    if file is not None:
        if file.content_type and file.content_type not in ALLOWED_TYPES:
            raise HTTPException(status_code=415, detail="Unsupported file type. Use PNG, JPG, or WEBP.")
        image_bytes = await file.read()
        if not image_bytes:
            raise HTTPException(status_code=422, detail="That file is empty or unreadable.")
        if len(image_bytes) > MAX_BYTES:
            raise HTTPException(status_code=413, detail="File is too large. Use an image under 8 MB.")
    ocr_text = text or ""
    if not ocr_text and not image_bytes:
        raise HTTPException(status_code=422, detail="Upload an image or paste extracted text.")
    result = analyze_screenshot(ocr_text, image_bytes, sender=sender)
    preview = (ocr_text or "")[:220] or file_name or (file.filename if file else "screenshot")
    analysis_id = persist_analysis(
        user,
        input_type="screenshot",
        original_text=ocr_text,
        result=result.model_dump(),
        extra={
            "preview": preview,
            "screenshot": {
                "storage_path": storage_path or "",
                "storage_url": storage_url,
                "file_name": file_name or (file.filename if file else None),
                "mime_type": mime_type or (file.content_type if file else None),
                "file_size": file_size or (len(image_bytes) if image_bytes else None),
                "ocr_text": ocr_text,
            },
        },
    )
    return _payload(result, analysis_id)
