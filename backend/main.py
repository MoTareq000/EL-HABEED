import base64
import json
import os
import sys
import traceback
import types

# When deployed as a standalone service with root="backend",
# the current directory contains models/, services/, etc. directly.
# Aliasing this directory as the 'backend' package in sys.modules allows
# all internal 'from backend.xxx import yyy' statements to resolve seamlessly!
_this_dir = os.path.dirname(os.path.abspath(__file__))
if "backend" not in sys.modules:
    backend_pkg = types.ModuleType("backend")
    backend_pkg.__path__ = [_this_dir]
    backend_pkg.__file__ = os.path.join(_this_dir, "__init__.py")
    sys.modules["backend"] = backend_pkg

for _p in (_this_dir, os.path.dirname(_this_dir)):
    if _p not in sys.path:
        sys.path.insert(0, _p)

from fastapi import APIRouter, FastAPI, File, Form, HTTPException, Request, UploadFile
from fastapi.exceptions import RequestValidationError, ResponseValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from backend.models.exam import (
    ExamAuditRequest,
    ExamAuditResponse,
    ExamParseResponse,
    ExamTextRequest,
)
from backend.models.question import AnalyzeRequest, AnalyzeResponse
from backend.services.analyzer import analyze_question
from backend.services.exam_service import (
    audit_exam_from_pdf,
    audit_exam_from_text,
    audit_reviewed_questions,
    parse_exam_from_pdf_bytes,
    parse_exam_from_raw_text,
)

app = FastAPI(title="EL-HABBED — Exam Heuristics Engine & Blind-Guessing Simulator")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(RequestValidationError)
async def request_validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = exc.errors()
    first_error = errors[0]["msg"] if errors else "Invalid request payload"
    error_msg = f"Request validation error: {first_error}"
    return JSONResponse(
        status_code=422,
        content={"detail": error_msg, "errors": errors},
    )


@app.exception_handler(ResponseValidationError)
async def response_validation_exception_handler(request: Request, exc: ResponseValidationError):
    error_msg = f"Response schema validation error: {str(exc)}"
    print(f"[ERROR] {error_msg}")
    return JSONResponse(
        status_code=500,
        content={"detail": error_msg, "errors": exc.errors()},
    )


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    tb = traceback.format_exc()
    error_msg = f"Internal server error ({type(exc).__name__}): {str(exc)}"
    print(f"[UNHANDLED EXCEPTION]\n{tb}")
    return JSONResponse(
        status_code=500,
        content={"detail": error_msg, "traceback": tb},
    )


class TextParseRequest(BaseModel):
    raw_text: str
    filename: str = "Pasted Exam"


class PdfBase64Request(BaseModel):
    filename: str = "exam.pdf"
    file_base64: str


router = APIRouter()


@router.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@router.post("/analyze", response_model=AnalyzeResponse)
def analyze(payload: AnalyzeRequest) -> AnalyzeResponse:
    """Analyze a single question (MCQ or True/False) with deterministic rule scoring and seeded tie-breaker."""
    return analyze_question(payload)


@router.post("/exam/parse-pdf", response_model=ExamParseResponse)
def parse_exam_pdf_json(payload: PdfBase64Request) -> ExamParseResponse:
    """Stage A (Serverless Preferred): Ingests base64-encoded PDF without multipart form spooling issues."""
    try:
        raw_b64 = payload.file_base64.strip()
        if "," in raw_b64:
            raw_b64 = raw_b64.split(",", 1)[1].strip()
        if not raw_b64:
            raise HTTPException(status_code=422, detail="Empty PDF base64 payload provided.")
        pdf_bytes = base64.b64decode(raw_b64)
        if not pdf_bytes:
            raise HTTPException(status_code=422, detail="Decoded PDF file is empty (0 bytes).")
        return parse_exam_from_pdf_bytes(pdf_bytes, filename=payload.filename or "exam.pdf")
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=422,
            detail=f"Unable to parse exam PDF: {str(exc)}",
        ) from exc


@router.post("/exam/parse", response_model=ExamParseResponse)
async def parse_exam_upload(file: UploadFile = File(...)) -> ExamParseResponse:
    """Stage A: Ingests uploaded PDF, extracts text per page, checks for scanned documents,
    and extracts editable question cards without predicting answers yet.
    """
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")

    try:
        content = await file.read()
        return parse_exam_from_pdf_bytes(content, filename=file.filename)
    except Exception as exc:
        raise HTTPException(
            status_code=422,
            detail=f"Unable to parse exam PDF: {str(exc)}",
        ) from exc


@router.post("/exam/parse-text", response_model=ExamParseResponse)
def parse_exam_text(payload: TextParseRequest) -> ExamParseResponse:
    """Stage A: Ingests raw exam text and extracts editable question cards."""
    if not payload.raw_text.strip():
        raise HTTPException(status_code=422, detail="Exam text cannot be empty.")
    return parse_exam_from_raw_text(payload.raw_text, filename=payload.filename)


@router.post("/exam/audit-reviewed", response_model=ExamAuditResponse)
def audit_reviewed(payload: ExamAuditRequest) -> ExamAuditResponse:
    """Stage B through G:
    Runs the structural audit and blind-guessing simulation on reviewed questions
    (with official answer keys strictly isolated), then independently evaluates accuracy
    against official keys and calculates the exact random guessing baseline.
    """
    if not payload.questions:
        raise HTTPException(status_code=422, detail="No questions provided for analysis.")

    return audit_reviewed_questions(
        payload.questions,
        filename=payload.filename,
        official_keys=payload.official_keys,
        seed=payload.seed,
    )


# Preserved legacy endpoints for compatibility
@router.post("/exam/upload", response_model=ExamAuditResponse)
async def upload_exam(
    file: UploadFile = File(...),
    answer_keys: str | None = Form(None),
) -> ExamAuditResponse:
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")

    keys_dict = None
    if answer_keys:
        try:
            keys_dict = json.loads(answer_keys)
        except Exception:
            keys_dict = None

    try:
        content = await file.read()
        return audit_exam_from_pdf(content, filename=file.filename, provided_keys=keys_dict)
    except Exception as exc:
        raise HTTPException(
            status_code=422,
            detail=f"Unable to extract questions from PDF: {str(exc)}",
        ) from exc


@router.post("/exam/analyze-text", response_model=ExamAuditResponse)
def analyze_exam_text_legacy(payload: ExamTextRequest) -> ExamAuditResponse:
    if not payload.raw_text.strip():
        raise HTTPException(status_code=422, detail="Exam text cannot be empty.")
    return audit_exam_from_text(
        payload.raw_text,
        filename="Pasted Exam",
        provided_keys=payload.answer_keys,
        seed=payload.seed,
    )


# Register routes at both '/api/*' and '/*' so routing succeeds whether Vercel retains or strips '/api'
app.include_router(router, prefix="/api")
app.include_router(router, prefix="")
