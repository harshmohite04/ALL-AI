from fastapi import FastAPI, HTTPException, Body, UploadFile, File
from pydantic import BaseModel, Field
from agent import workflow
from langchain_core.messages import HumanMessage, SystemMessage
from typing import Dict, Optional, List
import os
from langchain_openai import ChatOpenAI
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_groq import ChatGroq

from datetime import datetime
from uuid import uuid4
from pymongo import MongoClient
import os
import re

from fastapi.middleware.cors import CORSMiddleware


app = FastAPI()
origins = [
    # Local dev
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:4173",
    "http://127.0.0.1:4173",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
    # Deployed frontend (IP)
    "http://35.238.224.160:5173",

]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,       # switch to ["*"] if you need to quickly test any origin
    allow_credentials=True,
    allow_methods=["*"],         # ensures OPTIONS, POST, DELETE, etc. are allowed
    allow_headers=["*"],         # ensures Content-Type, Accept headers are allowed
)


# Use a safe default for local development if MONGO_URI is not set
MONGO_URI = os.getenv("MONGO_URI") or "mongodb://127.0.0.1:27017"
client = MongoClient(MONGO_URI)
db = client["LangGraphDB"]
session_collection = db["sessionManagement"]

class APIInput(BaseModel):
    user_query: str = Field(description="User query for the chat")
    selected_models: Dict[str, str] = Field(
        default={"OpenAI": "gpt-4o", "Google": "gemini-2.0-flash", "Groq": "openai/gpt-oss-20b"},
        description="Dictionary mapping model name → model string"
    )
    session_id:str=Field(description="session_id")

# ----------------------
# Preprocess: PDF text and Image vision description
# ----------------------
from fastapi.responses import JSONResponse
import mimetypes
import tempfile
import base64

import fitz  # PyMuPDF
from openai import OpenAI

OPENAI_KEY = os.getenv("OPENAI_API_KEY", "")
openai_client = OpenAI(api_key=OPENAI_KEY) if OPENAI_KEY else None

def extract_text_from_pdf(file_path: str) -> str:
    text = ""
    doc = fitz.open(file_path)
    for page in doc:
        text += page.get_text()
    return text.strip()

def gpt_vision_extract(file_path: str) -> str:
    # Return "" if no OPENAI key or on any OpenAI failure (graceful degrade)
    if not OPENAI_KEY or not openai_client:
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
        return ""

@app.post("/preprocess")
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
            extracted_text = extract_text_from_pdf(file_path)
        elif mime_type.startswith("image/"):
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

@app.get("/")
def read_root():
    return {"message": "Multi-Model Chat API is running 🚀"}

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/chat")
def chat(input: APIInput):
    config = {"configurable": {"thread_id": input.session_id}}

    # Prepare state only for selected models
    state = {"selected_models": input.selected_models}
    for model_name in input.selected_models.keys():
        key = f"{model_name.lower()}_messages"
        state[key] = [HumanMessage(content=input.user_query)]

    # Run workflow
    result = workflow.invoke(state, config=config)

    # Extract only the last message content for each selected model
    output = {}
    for model_name in input.selected_models.keys():
        key = f"{model_name.lower()}_messages"
        if key in result:
            output[model_name] = result[key][-1].content

    return {"responses": output}


@app.get("/history/{session_id}")
def get_history(session_id: str):
    config = {"configurable": {"thread_id": session_id}}
    history = list(workflow.get_state_history(config=config))
    
    output = []
    for step in history:
        state = step.values
        step_messages = {}
        # Dynamically include any keys that end with "_messages"
        for key, msgs in state.items():
            if isinstance(key, str) and key.endswith("_messages") and isinstance(msgs, list):
                step_messages[key] = [
                    {"role": "User" if getattr(msg, "type", "") == "human" else "AI", "content": getattr(msg, "content", "")}
                    for msg in msgs
                ]
        output.append(step_messages)
    
    return {"history": output}


# Image and Video generation stubs
class MediaGenInput(BaseModel):
    prompt: str = Field(description="Prompt for generation")
    provider: str = Field(description="Provider name, e.g., Midjourney, DALL·E 3, Stable Diffusion, Runway Gen-2, Nano Banana, Google Veo")
    session_id: str = Field(description="Session ID for tracking")
    client_time: Optional[datetime] = Field(default_factory=datetime.utcnow)


@app.post("/image")
def generate_image(input: MediaGenInput):
    # Stub implementation: in real integration, call the respective provider API here.
    # Return a placeholder image URL.
    placeholder_url = "https://via.placeholder.com/1024x576.png?text=Generated+Image"
    return {"url": placeholder_url, "provider": input.provider}


@app.post("/video")
def generate_video(input: MediaGenInput):
    # Stub implementation: in real integration, call the respective provider API here.
    # Return a placeholder video URL.
    placeholder_url = "https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4"
    return {"url": placeholder_url, "provider": input.provider}








class SessionCreate(BaseModel):
    account_id: str = Field(description="Email address of the user (used as account_id)")
    session_name: str = Field(description="A friendly name for the session")
    time_stamp: Optional[datetime] = Field(default_factory=datetime.utcnow, description="Client-side timestamp")
    last_activity: Optional[datetime] = Field(default_factory=datetime.utcnow, description="Client-side last activity timestamp")

def is_valid_email(email: str) -> bool:
    if not isinstance(email, str):
        return False
    email = email.strip()
    # Simple RFC 5322-like email pattern (not exhaustive, but good enough for validation here)
    pattern = r"^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$"
    return re.match(pattern, email) is not None


@app.post("/session/create")
def create_session(data: SessionCreate):
    # Minimal logging to verify requests in server logs
    try:
        print(f"[session/create] account_id={data.account_id} name={data.session_name} time={data.time_stamp}")
    except Exception:
        pass
    # Validate and normalize email
    if not is_valid_email(data.account_id):
        raise HTTPException(status_code=400, detail="account_id must be a valid email address")
    
    normalized_email = data.account_id.strip().lower()
    session_id = str(uuid4())
    new_session = {
        "session_id": session_id,
        "session_name": data.session_name,
        "time_stamp": data.time_stamp,       # use frontend-provided timestamp
        "last_activity": data.last_activity, # use frontend-provided timestamp
        "status": "active"
    }

    existing_account = session_collection.find_one({"account_id": normalized_email})
    if existing_account:
        session_collection.update_one(
            {"account_id": normalized_email},
            {"$push": {"sessions": new_session}}
        )
    else:
        session_collection.insert_one({
            "account_id": normalized_email,
            "sessions": [new_session]
        })

    return {"message": "Session created", "session_id": session_id}


@app.get("/session/{account_id}")
def get_sessions(account_id: str):
    # Validate and normalize email
    if not is_valid_email(account_id):
        raise HTTPException(status_code=400, detail="account_id must be a valid email address")
    normalized_email = account_id.strip().lower()
    account = session_collection.find_one({"account_id": normalized_email}, {"_id": 0})
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    return account

class TitleGenerationRequest(BaseModel):
    messages: List[Dict[str, str]]
    model: str = "gpt-3.5-turbo"

@app.post("/generate-title")
async def generate_title(request: TitleGenerationRequest = Body(...)):
    try:
        # Initialize the appropriate LLM based on the model
        if request.model.startswith("gpt"):
            llm = ChatOpenAI(model=request.model, temperature=0.3)
        elif request.model.startswith("gemini"):
            llm = ChatGoogleGenerativeAI(model=request.model, temperature=0.3)
        elif "groq" in request.model.lower():
            llm = ChatGroq(model=request.model, temperature=0.3)
        else:
            raise HTTPException(status_code=400, detail="Unsupported model for title generation")

        # Create a system message for title generation
        system_message = SystemMessage(content="""
        You are a helpful assistant that generates concise, descriptive titles for chat conversations.
        Create a short, clear title (max 5-7 words) that summarizes the main topic of the conversation.
        The title should be title-cased and should not include any special characters or emojis.
        Focus on the main subject or question being discussed. This description is passed to the llm as image or pdf, so if user asks the llm what is in the pdf or image, do not say, i cannot see the image, as this description is an image ,so instead say something that makes user believe that the model can see the image. The model should pretend like it can actually see the image or pdf and the users should not know that models cannot see it.
        """)

        # Extract message content for context
        conversation_context = "\n".join([f"{m.get('role', 'user').capitalize()}: {m.get('content', '')}" 
                                    for m in request.messages[-3:]])  # Use last 3 messages for context

        # Generate the title
        response = await llm.ainvoke([
            system_message,
            HumanMessage(content=f"Generate a title for this conversation:\n\n{conversation_context}")
        ])

        # Clean up the response
        title = response.content.strip().strip('"\'')
        if len(title) > 60:  # Ensure title isn't too long
            title = title[:57] + "..."
            
        return {"title": title}

    except Exception as e:
        print(f"Error generating title: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error generating title: {str(e)}")

@app.put("/session/update/{account_id}/{session_id}")
def update_session(account_id: str, session_id: str, session_name: Optional[str] = None):
    if not is_valid_email(account_id):
        raise HTTPException(status_code=400, detail="account_id must be a valid email address")
    normalized_email = account_id.strip().lower()
    update_fields = {"last_activity": datetime.utcnow()}
    if session_name:
        update_fields["sessions.$.session_name"] = session_name

    result = session_collection.update_one(
        {"account_id": normalized_email, "sessions.session_id": session_id},
        {"$set": update_fields}
    )

    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Session not found")

    return {"message": "Session updated"}



@app.delete("/session/{account_id}/{session_id}")
def delete_session(account_id: str, session_id: str):
    if not is_valid_email(account_id):
        raise HTTPException(status_code=400, detail="account_id must be a valid email address")
    normalized_email = account_id.strip().lower()
    result = session_collection.update_one(
        {"account_id": normalized_email},
        {"$pull": {"sessions": {"session_id": session_id}}}
    )

    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Session not found")

    return {"message": "Session deleted"}






if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
