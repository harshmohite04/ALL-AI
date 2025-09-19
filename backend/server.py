from fastapi import FastAPI
from pydantic import BaseModel, Field
from agent import workflow
from langchain_core.messages import HumanMessage
from typing import Dict

app = FastAPI()


class APIInput(BaseModel):
    user_query: str = Field(description="User query for the chat")
    selected_models: Dict[str, str] = Field(
        default={"OpenAI": "gpt-4o", "Google": "gemini-2.0-flash", "Groq": "openai/gpt-oss-20b"},
        description="Dictionary mapping model name → model string"
    )


@app.get("/")
def read_root():
    return {"message": "Multi-Model Chat API is running 🚀"}
@app.post("/chat")
def chat(input: APIInput):
    config1 = {"configurable": {"thread_id": "10"}}

    # Prepare state with dynamic models
    state = {
        "openai_messages": [HumanMessage(content=input.user_query)],
        "google_messages": [HumanMessage(content=input.user_query)],
        "groq_messages": [HumanMessage(content=input.user_query)],
        "selected_models": input.selected_models,  # directly use frontend input
    }

    # Run workflow
    result = workflow.invoke(state, config=config1)

    # Extract only the last message content for each selected model
    output = {}
    for model_name in input.selected_models.keys():
        key = f"{model_name.lower()}_messages"
        if key in result:
            output[model_name] = result[key][-1].content

    return {"responses": output}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
