from langgraph.graph import START, END, StateGraph
from constants import (
    llm_ChatOpenAI,
    # llm_ChatAnthropic,
    llm_ChatGoogleGenerativeAI,
    llm_ChatGroq,
    # llm_ChatPerplexity,
    # llm_ChatXAI,
)
from langgraph.checkpoint.memory import InMemorySaver
from langchain_core.messages import HumanMessage
from agent_schema import AgentState
from langgraph.checkpoint.mongodb import MongoDBSaver
from pymongo import MongoClient
import os

MONGO_URI=os.getenv("MONGO_URI",)
client = MongoClient(MONGO_URI)
# db and collection for checkpoints
db = client["LangGraphDB"]
collection = db["Checkpoints"]

graph = StateGraph(AgentState)


def classify_model(state: AgentState):
    selected = list(state["selected_models"].keys())
    if not selected:
        END
    return selected


def OpenAI(state: AgentState) -> AgentState:
    openai_messages = state["openai_messages"]
    
    openai_model_name = state["selected_models"]["OpenAI"]
    response = llm_ChatOpenAI(openai_model_name).invoke(openai_messages)
    return {"openai_messages": response}


def Google(state: AgentState) -> AgentState:
    google_messages = state["google_messages"]
    google_model_name = state["selected_models"]["Google"]
    response = llm_ChatGoogleGenerativeAI(google_model_name).invoke(google_messages)
    return {"google_messages": response}

def Groq(state: AgentState) -> AgentState:
    print("Groq called..")
    groq_messages = state["groq_messages"]
    groq_model_name = state["selected_models"]["Groq"]
    response = llm_ChatGroq(groq_model_name).invoke(groq_messages)
    return {"groq_messages": response}


# def Anthropic(state: AgentState) -> AgentState:
#     user_query = state["user_query"]
#     response_llm_ChatAnthropic = llm_ChatAnthropic.invoke(user_query)
#     print(response_llm_ChatAnthropic)

# def Grok(state: AgentState) -> AgentState:
#     user_query = state["user_query"]
#     response_llm_ChatGroq = llm_ChatGroq.invoke(user_query)
#     print(response_llm_ChatGroq)

# def Perplexity(state: AgentState) -> AgentState:
#     user_query = state["user_query"]
#     response_llm_ChatPerplexity = llm_ChatPerplexity.invoke(user_query)
#     print(response_llm_ChatPerplexity)


graph.add_node("classify_model", classify_model)

graph.add_node("OpenAI", OpenAI)
graph.add_node("Google", Google)
graph.add_node("Groq", Groq)
# graph.add_node("Anthropic", Anthropic)
# graph.add_node("Grok", Grok)
# graph.add_node("Perplexity", Perplexity)


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

checkpointer = MongoDBSaver(collection)
workflow = graph.compile(checkpointer=checkpointer)

# config1 = {"configurable": {"thread_id": "11112111111"}}

# result = workflow.invoke(
#     {
#         "openai_messages": [HumanMessage(content="what is my name")],
#         "google_messages": [HumanMessage(content="what is my name")],
#         "groq_messages": [HumanMessage(content="what is my name")],
#         "selected_models": {
#             'OpenAI': 'gpt-4o',
#             'Google': 'gemini-2.0-flash',
#             'Groq': 'openai/gpt-oss-20b',
#         },
#     },
#     config=config1,
# )


# result = workflow.invoke(
#     {
#         "openai_messages": [HumanMessage(content="My name is Harsh Mohite")],
#         "google_messages": [HumanMessage(content="My name is Harsh Mohite")],
#         "groq_messages": [HumanMessage(content="My name is Harsh Mohite")],
#         "selected_models": ["OpenAI","Google","Groq"],
#     },
#     config=config1,
# )


# result = workflow.invoke(
#     {
#         "openai_messages": [HumanMessage(content="What is my name")],
#         "google_messages": [HumanMessage(content="What is my name")],
#         "selected_models": ["OpenAI","Google","Groq"],
#         "groq_messages": [HumanMessage(content="What is my name")],
#     },
#     config=config1,
# )

# print(result["openai_messages"][-1].content)
# print(result["google_messages"][-1].content)
# print(result["groq_messages"][-1].content)

# history = list(workflow.get_state_history(config=config1))

# for i, step in enumerate(history, start=1):
#     if i==1:
#         print(f"\n=== Step {i} ===")

#         state = step.values

#         if "openai_messages" in state:
#             print("OpenAI Messages:")
#             for msg in state["openai_messages"]:
#                 role = "User" if msg.type == "human" else "AI"
#                 print(f"  [{role}] {msg.content}")

#         if "google_messages" in state:
#             print("Google Messages:")
#             for msg in state["google_messages"]:
#                 role = "User" if msg.type == "human" else "AI"
#                 print(f"  [{role}] {msg.content}")

#         if "groq_messages" in state:
#             print("Groq Messages:")
#             for msg in state["groq_messages"]:
#                 role = "User" if msg.type == "human" else "AI"
#                 print(f"  [{role}] {msg.content}")


# Initialize conversation state
# state = {
#     "openai_messages": [],
#     "google_messages": [],
#     "groq_messages": [],
#     "selected_models": ["OpenAI", "Google", "Groq"],
# }

# print("🤖 Multi-Model Chat CLI (type 'exit' to quit)")
# while True:
#     user_input = input("You: ")
#     if user_input.lower() == "exit":
#         break

#     # Append user input as HumanMessage for each model
#     state["openai_messages"].append(HumanMessage(content=user_input))
#     state["google_messages"].append(HumanMessage(content=user_input))
#     state["groq_messages"].append(HumanMessage(content=user_input))

#     # Run workflow
#     result = workflow.invoke(state, config=config1)

#     # Print model responses
#     if "openai_messages" in result:
#         print(f"[OpenAI]: {result['openai_messages'][-1].content}")
#     if "google_messages" in result:
#         print(f"[Google]: {result['google_messages'][-1].content}")
#     if "groq_messages" in result:
#         print(f"[Groq]: {result['groq_messages'][-1].content}")

#     # Update state with latest responses
#     state = result

