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


graph = StateGraph(AgentState)


def classify_model(state: AgentState):
    selected = state.get("selected_models", [])
    print(selected)
    if not selected:
        END
    return selected


def OpenAI(state: AgentState) -> AgentState:
    user_query = state["user_query"]
    response_llm_ChatOpenAI = llm_ChatOpenAI.invoke(user_query)
    print(response_llm_ChatOpenAI)
    # return {"responses": ["OpenAI", response_llm_ChatOpenAI]}
    
    return {"openai":response_llm_ChatOpenAI}


# def Anthropic(state: AgentState) -> AgentState:
#     user_query = state["user_query"]
#     response_llm_ChatAnthropic = llm_ChatAnthropic.invoke(user_query)
#     print(response_llm_ChatAnthropic)


def Google(state: AgentState) -> AgentState:
    user_query = state["user_query"]
    response_llm_ChatGoogleGenerativeAI = llm_ChatGoogleGenerativeAI.invoke(user_query)
    print(response_llm_ChatGoogleGenerativeAI)

    # return {"responses": ["Google", response_llm_ChatGoogleGenerativeAI]}
    return {"google":response_llm_ChatGoogleGenerativeAI}

# def Grok(state: AgentState) -> AgentState:
#     user_query = state["user_query"]
#     response_llm_ChatGroq = llm_ChatGroq.invoke(user_query)
#     print(response_llm_ChatGroq)

# def Perplexity(state: AgentState) -> AgentState:
#     user_query = state["user_query"]
#     response_llm_ChatPerplexity = llm_ChatPerplexity.invoke(user_query)
#     print(response_llm_ChatPerplexity)


def Groq(state: AgentState) -> AgentState:
    user_query = state["user_query"]
    response_llm_ChatGroq = llm_ChatGroq.invoke(user_query)
    print(response_llm_ChatGroq)

    # return {"responses": ["Groq", response_llm_ChatGroq]}
    return {"groq":response_llm_ChatGroq}


graph.add_node("classify_model", classify_model)

graph.add_node("OpenAI", OpenAI)
# graph.add_node("Anthropic", Anthropic)
graph.add_node("Google", Google)
# graph.add_node("Grok", Grok)
# graph.add_node("Perplexity", Perplexity)
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
# graph.add_edge("Anthropic",END)
graph.add_edge("Google", END)
# graph.add_edge("Grok",END)
# graph.add_edge("Perplexity",END)
graph.add_edge("Groq", END)

workflow = graph.compile()

initial_state: AgentState = {
    "user_query": "whats your name",
    "responses": {},
    "tokens_used": {},
    "timestamp": None,
    "metadata": {},
    "selected_models": ["OpenAI", "Google", "Groq"],  # UI toggles
}
print("111111111111111111111111111111")
result = workflow.invoke(initial_state)
print("111111111111111111111111111111")
print(result)
