from langgraph.graph import START, END, StateGraph
from constants import (
    llm_ChatOpenAI,
    llm_ChatAnthropic,
    llm_ChatGoogleGenerativeAI,
    llm_ChatGroq,
    llm_ChatDeepSeek,
    llm_ChatPerplexity,
    llm_ChatXAI,
)


from agent_schema import AgentState


graph = StateGraph(AgentState)


def classify_model(state: AgentState):
    selected = state.get("selected_models", [])
    print(selected)
    if not selected:
        END
    return selected  # string or list of strings is valid


def OpenAI(state: AgentState) -> AgentState:
    user_query = state["user_query"]
    response_llm_ChatOpenAI = llm_ChatOpenAI.invoke(user_query)
    print(response_llm_ChatOpenAI)

    


def Anthropic(state: AgentState) -> AgentState:
    user_query = state["user_query"]
    response_llm_ChatAnthropic = llm_ChatAnthropic.invoke(user_query)
    print(response_llm_ChatAnthropic)


def Google(state: AgentState) -> AgentState:
    user_query = state["user_query"]
    response_llm_ChatGoogleGenerativeAI = llm_ChatGoogleGenerativeAI.invoke(
        user_query
    )
    print(response_llm_ChatGoogleGenerativeAI)


def Grok(state: AgentState) -> AgentState:
    user_query = state["user_query"]
    response_llm_ChatGroq = llm_ChatGroq.invoke(user_query)
    print(response_llm_ChatGroq)


def DeepSeek(state: AgentState) -> AgentState:
    user_query = state["user_query"]
    response_llm_ChatDeepSeek = llm_ChatDeepSeek.invoke(user_query)
    print(response_llm_ChatDeepSeek)


def Perplexity(state: AgentState) -> AgentState:
    user_query = state["user_query"]
    response_llm_ChatPerplexity = llm_ChatPerplexity.invoke(user_query)
    print(response_llm_ChatPerplexity)


def Groq(state: AgentState) -> AgentState:
    user_query = state["user_query"]
    response_llm_ChatXAI = llm_ChatXAI.invoke(user_query)
    print(response_llm_ChatXAI)


graph.add_node("classify_model", classify_model)
graph.add_node("OpenAI", OpenAI)
graph.add_node("Anthropic", Anthropic)
graph.add_node("Google", Google)
graph.add_node("Grok", Grok)
graph.add_node("DeepSeek", DeepSeek)
graph.add_node("Perplexity", Perplexity)
graph.add_node("Groq", Groq)


graph.add_conditional_edges(
    START,
    classify_model,
    {
        "OpenAI": "OpenAI",
        END: END,
    },
)

graph.add_edge("OpenAI", END)
graph.add_edge("Anthropic",END)
graph.add_edge("Google",END)
graph.add_edge("Grok",END)
graph.add_edge("DeepSeek",END)
graph.add_edge("Perplexity",END)
graph.add_edge("Groq",END)

workflow = graph.compile()

initial_state: AgentState = {
    "user_query": "Hello",
    "responses": {},
    "tokens_used": {},
    "timestamp": None,
    "metadata": {},
    "selected_models": ["OpenAI"],  # UI toggles
}
result = workflow.invoke(initial_state)
print(result)
