from fastapi import FastAPI, HTTPException, Body
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
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    # Deployed frontend (IP)
    "http://35.238.224.160",
    "https://35.238.224.160",
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
    
    print("history")
    
    output = []
    for step in history:
        state = step.values
        step_messages = {}
        for model_key in ["openai_messages", "google_messages", "groq_messages"]:
            if model_key in state:
                step_messages[model_key] = [
                    {"role": "User" if msg.type == "human" else "AI", "content": msg.content}
                    for msg in state[model_key]
                ]
        output.append(step_messages)
        
   
    # print(history[0].values["google_messages"])
    # print(history[0].values["groq_messages"])
    return {"history": output}








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
        Focus on the main subject or question being discussed.
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
