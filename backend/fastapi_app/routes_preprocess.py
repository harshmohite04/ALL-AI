from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
import mimetypes
import tempfile
import base64
import os

import fitz  # PyMuPDF
from openai import OpenAI

OPENAI_KEY = os.getenv("OPENAI_API_KEY", "")
router = APIRouter()
openai_client = OpenAI(api_key=OPENAI_KEY) if OPENAI_KEY else None

def extract_text_from_pdf(file_path: str) -> str:
    text = ""
    doc = fitz.open(file_path)
    for page in doc:
        text += page.get_text()
    return text.strip()

def gpt_vision_extract(file_path: str) -> str:
    if not OPENAI_KEY or not openai_client:
        # No key configured; return empty so caller can proceed without failing
        return ""
    with open(file_path, "rb") as f:
        b64 = base64.b64encode(f.read()).decode("utf-8")
    try:
        resp = openai_client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{
                "role": "user",
                "content": [
                    {"type": "text", "text": "Describe this image clearly under 120 words."},
                    {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{b64}"}}
                ]
            }],
        )
        return (resp.choices[0].message.content or "").strip()
    except Exception:
        # On OpenAI failure, degrade gracefully with empty extraction
        return ""

@router.post("/preprocess")
async def preprocess(file: UploadFile = File(...)):
    try:
        suffix = os.path.splitext(file.filename or "")[1]
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            tmp.write(await file.read())
            file_path = tmp.name

        mime_type, _ = mimetypes.guess_type(file_path)
        if not mime_type:
            mime_type = file.content_type or "application/octet-stream"

        note = None
        if "pdf" in (mime_type or ""):
            # PDFs must extract; if PyMuPDF fails, return 500 as this is critical
            extracted_text = extract_text_from_pdf(file_path)
        elif mime_type.startswith("image/"):
            # Images: try OpenAI Vision; if unavailable or fails, return empty extraction with 200
            extracted_text = gpt_vision_extract(file_path)
            if not extracted_text:
                note = "vision_unavailable_or_failed"
        else:
            raise HTTPException(status_code=400, detail=f"Unsupported file type: {mime_type}")

        try:
            os.remove(file_path)
        except Exception:
            pass

        payload = {"extracted_text": extracted_text}
        if note:
            payload["note"] = note
        return JSONResponse(payload)
    except HTTPException:
        raise
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)
