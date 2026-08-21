from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import router
from app.database import init_db
from app.seed import seed_if_empty

app = FastAPI(
    title="ScamGuard",
    description="AI-powered financial scam, phishing and fraud detection system",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)


@app.on_event("startup")
def startup() -> None:
    init_db()
    seed_if_empty()


@app.get("/api/health")
def health():
    return {"status": "ok", "service": "scamguard"}
