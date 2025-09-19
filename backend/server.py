from fastapi import FastAPI
from pydantic import BaseModel, Field
from agent import workflow
from langchain_core.messages import HumanMessage

app = FastAPI()

class APIInput(BaseModel):
    user_query: str = Field(description="User query for the chat")
    models: list[str] = Field(default=["OpenAI", "Google", "Groq"], description="Which models to use")

@app.get("/")
def read_root():
    return {"message": "Multi-Model Chat API is running 🚀"}

@app.post("/chat")
def chat(input: APIInput):
    config1 = {"configurable": {"thread_id": "1"}}

    # Prepare state
    state = {
        "openai_messages": [HumanMessage(content=input.user_query)],
        "google_messages": [HumanMessage(content=input.user_query)],
        "groq_messages": [HumanMessage(content=input.user_query)],
        "selected_models": input.models,
    }

    # Run workflow
    result = workflow.invoke(state, config=config1)

    # Extract only the last message content for each selected model
    output = {}
    if "OpenAI" in input.models and "openai_messages" in result:
        output["OpenAI"] = result["openai_messages"][-1].content
    if "Google" in input.models and "google_messages" in result:
        output["Google"] = result["google_messages"][-1].content
    if "Groq" in input.models and "groq_messages" in result:
        output["Groq"] = result["groq_messages"][-1].content

    return {"responses": output}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
