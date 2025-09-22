from fastapi import FastAPI,HTTPException
from pydantic import BaseModel, Field
from agent import workflow
from langchain_core.messages import HumanMessage
from typing import Dict,Optional

from datetime import datetime
from uuid import uuid4
from pymongo import MongoClient
import os

from fastapi.middleware.cors import CORSMiddleware


app = FastAPI()
origins = [
    "http://localhost:5173",  # Vite dev
    "http://127.0.0.1:5173",
    "http://localhost:3000",  # if using CRA/Next.js
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,       # or ["*"] for quick local testing
    allow_credentials=True,
    allow_methods=["*"],         # ensures OPTIONS, POST, DELETE, etc. are allowed
    allow_headers=["*"],         # ensures Content-Type, Accept headers are allowed
)


MONGO_URI=os.getenv("MONGO_URI",)
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
    account_id: str = Field(description="Unique account ID of the user")
    session_name: str = Field(description="A friendly name for the session")
    time_stamp: Optional[datetime] = Field(default_factory=datetime.utcnow, description="Client-side timestamp")
    last_activity: Optional[datetime] = Field(default_factory=datetime.utcnow, description="Client-side last activity timestamp")


@app.post("/session/create")
def create_session(data: SessionCreate):
    session_id = str(uuid4())
    new_session = {
        "session_id": session_id,
        "session_name": data.session_name,
        "time_stamp": data.time_stamp,       # use frontend-provided timestamp
        "last_activity": data.last_activity, # use frontend-provided timestamp
        "status": "active"
    }

    existing_account = session_collection.find_one({"account_id": data.account_id})
    if existing_account:
        session_collection.update_one(
            {"account_id": data.account_id},
            {"$push": {"sessions": new_session}}
        )
    else:
        session_collection.insert_one({
            "account_id": data.account_id,
            "sessions": [new_session]
        })

    return {"message": "Session created", "session_id": session_id}


@app.get("/session/{account_id}")
def get_sessions(account_id: str):
    account = session_collection.find_one({"account_id": account_id}, {"_id": 0})
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    return account

@app.put("/session/update/{account_id}/{session_id}")
def update_session(account_id: str, session_id: str, session_name: Optional[str] = None):
    update_fields = {"last_activity": datetime.utcnow()}
    if session_name:
        update_fields["sessions.$.session_name"] = session_name

    result = session_collection.update_one(
        {"account_id": account_id, "sessions.session_id": session_id},
        {"$set": update_fields}
    )

    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Session not found")

    return {"message": "Session updated"}



@app.delete("/session/{account_id}/{session_id}")
def delete_session(account_id: str, session_id: str):
    result = session_collection.update_one(
        {"account_id": account_id},
        {"$pull": {"sessions": {"session_id": session_id}}}
    )

    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Session not found")

    return {"message": "Session deleted"}






if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
