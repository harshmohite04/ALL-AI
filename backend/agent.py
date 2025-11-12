from langgraph.graph import START, END, StateGraph
from constants import (
    llm_ChatOpenAI,
    llm_ChatAnthropic,
    llm_ChatGoogleGenerativeAI,
    llm_ChatGroq,
    llm_ChatDeepseek,
    # llm_ChatPerplexity,
    # llm_ChatXAI,
)
from langgraph.checkpoint.memory import InMemorySaver
from langchain_core.messages import HumanMessage, SystemMessage
from agent_schema import AgentState
from langgraph.checkpoint.mongodb import MongoDBSaver
from pymongo import MongoClient
import os
from langchain_core.prompts import ChatPromptTemplate
from role_prompts import get_role_prompt 

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
    print("OpenAI called ...")
    openai_messages = state["openai_messages"]
    openai_model_name = state["selected_models"]["OpenAI"]
    role = state.get("role", "General")
    print(f"OpenAI model: {openai_model_name}, Role: {role}")
    
    # Add role-based system prompt
    system_prompt = get_role_prompt(role)
    messages_with_system = [SystemMessage(content=system_prompt)] + openai_messages
    
    if openai_model_name in ['openai/gpt-oss-120b','openai/gpt-oss-20b']:
        response = llm_ChatGroq(openai_model_name).invoke(messages_with_system)
    else:
        response = llm_ChatOpenAI(openai_model_name).invoke(messages_with_system)
    return {"openai_messages": response}


def Google(state: AgentState) -> AgentState:
    print("Google called ...")
    role = state.get("role", "General")
    system_prompt = get_role_prompt(role)
    print(f"Google Role: {role}")
    
    google_messages = state["google_messages"]
    google_model_name = state["selected_models"]["Google"]
    print(google_model_name)
    
    # Add role-based system prompt
    messages_with_system = [SystemMessage(content=system_prompt)] + google_messages
    response = llm_ChatGoogleGenerativeAI(google_model_name).invoke(messages_with_system)
    print("Gemini")
    print(response)
    return {"google_messages": response}

def Groq(state: AgentState) -> AgentState:
    print("Groq called..")
    role = state.get("role", "General")
    system_prompt = get_role_prompt(role)
    print(f"Groq Role: {role}")
    
    groq_messages = state["groq_messages"]
    groq_model_name = state["selected_models"]["Groq"]
    print(groq_model_name)
    
    # Add role-based system prompt
    messages_with_system = [SystemMessage(content=system_prompt)] + groq_messages
    response = llm_ChatGroq(groq_model_name).invoke(messages_with_system)
    # print(response)
    return {"groq_messages": response}

def Meta(state:AgentState)->AgentState:
    print("Meta called...")
    role = state.get("role", "General")
    system_prompt = get_role_prompt(role)
    print(f"Meta Role: {role}")
    
    meta_messages = state["meta_messages"]
    meta_model_name = state["selected_models"]["Meta"]
    print(meta_model_name)
    
    # Add role-based system prompt
    messages_with_system = [SystemMessage(content=system_prompt)] + meta_messages
    response = llm_ChatGroq(meta_model_name).invoke(messages_with_system)
    return {"meta_messages":response}

def Deepseek(state:AgentState)->AgentState:
    print("DeepSeek called...")
    role = state.get("role", "General")
    system_prompt = get_role_prompt(role)
    print(f"DeepSeek Role: {role}")
    
    deepseek_messages = state["deepseek_messages"]
    deepseek_model_name = state["selected_models"]["Deepseek"]
    print(deepseek_model_name)
    
    # Add role-based system prompt
    messages_with_system = [SystemMessage(content=system_prompt)] + deepseek_messages
    
    if deepseek_model_name in ['deepseek-r1-distill-llama-70b']:
        response = llm_ChatGroq(deepseek_model_name).invoke(messages_with_system)
    else:
        response = llm_ChatDeepseek(deepseek_model_name).invoke(messages_with_system)
    return {"deepseek_messages":response}

def Anthropic(state: AgentState) -> AgentState:
    print("Anthropic called...")
    role = state.get("role", "General")
    system_prompt = get_role_prompt(role)
    print(f"Anthropic Role: {role}")
    
    anthropic_messages = state["anthropic_messages"]
    anthropic_model_name = state["selected_models"]["Anthropic"]
    print(anthropic_model_name)
    
    # Add role-based system prompt
    messages_with_system = [SystemMessage(content=system_prompt)] + anthropic_messages
    response = llm_ChatAnthropic(anthropic_model_name).invoke(messages_with_system)
    print(response)
    return {"anthropic_messages": response}


def Alibaba(state:AgentState)->AgentState:
    print("Alibaba called...")
    role = state.get("role", "General")
    system_prompt = get_role_prompt(role)
    print(f"Alibaba Role: {role}")
    
    alibaba_messages = state["alibaba_messages"]
    alibaba_model_name = state["selected_models"]["Alibaba"]
    print(alibaba_model_name)
    
    # Add role-based system prompt
    messages_with_system = [SystemMessage(content=system_prompt)] + alibaba_messages
    response = llm_ChatGroq(alibaba_model_name).invoke(messages_with_system)
    return{"alibaba_messages":response}

graph.add_node("classify_model", classify_model)

graph.add_node("OpenAI", OpenAI)
graph.add_node("Google", Google)
graph.add_node("Groq", Groq)
graph.add_node("Meta", Meta)
graph.add_node("Deepseek", Deepseek)
graph.add_node("Alibaba", Alibaba)
graph.add_node("Anthropic", Anthropic)



graph.add_conditional_edges(
    START,
    classify_model,
    {
        "OpenAI": "OpenAI",
        "Google": "Google",
        "Groq": "Groq",
        "Meta": "Meta",
        "Deepseek": "Deepseek",
        "Alibaba": "Alibaba",
        "Anthropic": "Anthropic",
        END: END,
    },
)

graph.add_edge("OpenAI", END)
graph.add_edge("Google", END)
graph.add_edge("Meta", END)
graph.add_edge("Groq", END)
graph.add_edge("Deepseek", END)
graph.add_edge("Anthropic", END)
graph.add_edge("Alibaba", END)

checkpointer = MongoDBSaver(collection)
workflow = graph.compile(checkpointer=checkpointer)

# config1 = {"configurable": {"thread_id": "111121a11111"}}

# result = workflow.invoke(
#     {
#         # "openai_messages": [HumanMessage(content="what is my name")],
#         "google_messages": [HumanMessage(content="hello my is harsh what is your name and model name")],
#         "groq_messages": [HumanMessage(content="hello my is harsh what is your name and model name")],
#         "meta_messages": [HumanMessage(content="hello my is harsh what is your name and model name")],
#         "anthropic_messages": [HumanMessage(content="hello my is harsh what is your name and model name")],
#         "selected_models": {
#             # 'OpenAI': 'gpt-4o',
#             'Google': 'gemini-2.0-flash',
#             'Groq': 'openai/gpt-oss-20b',
#             'Meta': 'llama-3.3-70b-versatile',
#             'Anthropic': 'claude-3-haiku-20240307',
#         },
#     },
#     config=config1,
# )

# for i in result["anthropic_messages"]:
#     print(i)
        
    
    
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

