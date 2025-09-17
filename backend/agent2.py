import logging
from langgraph.graph import START, END, StateGraph
from constants import (
    llm_ChatOpenAI,
    # llm_ChatAnthropic,
    llm_ChatGoogleGenerativeAI,
    llm_ChatGroq,
    # llm_ChatPerplexity,
    # llm_ChatXAI,
)
from agent_schema import AgentState

# Setup structured logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")

graph = StateGraph(AgentState)

# --- Safe wrapper for LLM calls ---
def safe_invoke(llm, query: str, model_name: str):
    try:
        response = llm.invoke(query)
        tokens = response.usage_metadata.get("total_tokens", 0) if hasattr(response, "usage_metadata") else 0
        content = getattr(response, "content", str(response))
        logging.info(f"{model_name} response: {content[:100]}...")  # log first 100 chars
        return content, tokens
    except Exception as e:
        logging.error(f"{model_name} failed: {e}")
        return f"Error: {str(e)}", 0


# --- Router Node ---
def classify_model(state: AgentState):
    selected = state.get("selected_models", [])
    if not selected:
        logging.warning("No models selected, ending workflow.")
        return "END"  # ✅ return the label, not the END object
    return {model: model for model in selected}



# --- Model Nodes ---
def OpenAI(state: AgentState) -> AgentState:
    query = state["user_query"]
    response, tokens = safe_invoke(llm_ChatOpenAI, query, "OpenAI")
    state["responses"]["OpenAI"] = response
    state["tokens_used"]["OpenAI"] = tokens
    return state


def Google(state: AgentState) -> AgentState:
    query = state["user_query"]
    response, tokens = safe_invoke(llm_ChatGoogleGenerativeAI, query, "Google")
    state["responses"]["Google"] = response
    state["tokens_used"]["Google"] = tokens
    return state


def Groq(state: AgentState) -> AgentState:
    query = state["user_query"]
    response, tokens = safe_invoke(llm_ChatGroq, query, "Groq")
    state["responses"]["Groq"] = response
    state["tokens_used"]["Groq"] = tokens
    return state


# --- Build Graph ---
graph.add_node("classify_model", classify_model)
graph.add_node("OpenAI", OpenAI)
graph.add_node("Google", Google)
graph.add_node("Groq", Groq)

graph.add_conditional_edges(
    START,
    classify_model,
    {
        "OpenAI": "OpenAI",
        "Google": "Google",
        "Groq": "Groq",
        END: END,
    },
)

graph.add_edge("OpenAI", END)
graph.add_edge("Google", END)
graph.add_edge("Groq", END)

workflow = graph.compile()

# --- Example Run ---
if __name__ == "__main__":
    initial_state: AgentState = {
        "user_query": "What's your name?",
        "responses": {},
        "tokens_used": {},
        "timestamp": None,
        "metadata": {},
        "selected_models": ["OpenAI", "Google", "Groq"],  # UI toggles
    }
    result = workflow.invoke(initial_state)
    logging.info(f"Final Result: {result}")
