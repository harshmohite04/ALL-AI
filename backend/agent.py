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
from langchain_core.prompts import ChatPromptTemplate 

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
    print(openai_model_name)
    if openai_model_name in ['openai/gpt-oss-120b','openai/gpt-oss-20b']:
        response = llm_ChatGroq(openai_model_name).invoke(openai_messages)
    else:
        response = llm_ChatOpenAI(openai_model_name).invoke(openai_messages)
    return {"openai_messages": response}


def Google(state: AgentState) -> AgentState:
    print("Google called ...")
    system_prompt=""""""
    prompt = ChatPromptTemplate.from_messages([
        ("system", system_prompt),
        ("user", "{input}")
    ])
    
    google_messages = state["google_messages"]
    google_model_name = state["selected_models"]["Google"]
    print(google_model_name)
    chain = prompt | llm_ChatGoogleGenerativeAI(google_model_name)
    response = chain.invoke(google_messages)
    return {"google_messages": response}

def Groq(state: AgentState) -> AgentState:
    print("Groq called..")
    system_prompt="""Make sure you answer user in small answer and not big"""
    prompt = ChatPromptTemplate.from_messages([
        ("system", system_prompt),
        ("user", "{input}")
    ])
    groq_messages = state["groq_messages"]
    groq_model_name = state["selected_models"]["Groq"]
    print(groq_model_name)
    chain = prompt | llm_ChatGroq(groq_model_name)
    response = chain.invoke(groq_messages)
    return {"groq_messages": response}

def Meta(state:AgentState)->AgentState:
    print("Meta called...")
    meta_messages = state["meta_messages"]
    meta_model_name = state["selected_models"]["Meta"]
    print(meta_model_name)
    response = llm_ChatGroq(meta_model_name).invoke(meta_messages)
    return {"meta_messages":response}

def Deepseek(state:AgentState)->AgentState:
    print("DeepSeek called...")
    deepseek_messages = state["deepseek_messages"]
    deepseek_model_name = state["selected_models"]["Deepseek"]
    print(deepseek_model_name)
    response = llm_ChatGroq(deepseek_model_name).invoke(deepseek_messages)
    return {"deepseek_messages":response}



def Alibaba(state:AgentState)->AgentState:
    print("Alibaba called...")
    alibaba_messages = state["alibaba_messages"]
    alibaba_model_name = state["selected_models"]["Alibaba"]
    print(alibaba_model_name)
    response = llm_ChatGroq(alibaba_model_name).invoke(alibaba_messages)
    return{"alibaba_messages":response}

graph.add_node("classify_model", classify_model)

graph.add_node("OpenAI", OpenAI)
graph.add_node("Google", Google)
graph.add_node("Groq", Groq)
graph.add_node("Meta", Meta)
graph.add_node("Deepseek", Deepseek)
graph.add_node("Alibaba", Alibaba)



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
        END: END,
    },
)

graph.add_edge("OpenAI", END)
graph.add_edge("Google", END)
graph.add_edge("Meta", END)
graph.add_edge("Groq", END)
graph.add_edge("Deepseek", END)
graph.add_edge("Alibaba", END)

checkpointer = MongoDBSaver(collection)
workflow = graph.compile(checkpointer=checkpointer)

# config1 = {"configurable": {"thread_id": "11112111111"}}

# result = workflow.invoke(
#     {
#         # "openai_messages": [HumanMessage(content="what is my name")],
#         "google_messages": [HumanMessage(content="hello my is harsh what is your name and model name")],
#         "groq_messages": [HumanMessage(content="hello my is harsh what is your name and model name")],
#         "meta_messages": [HumanMessage(content="hello my is harsh what is your name and model name")],
#         "selected_models": {
#             # 'OpenAI': 'gpt-4o',
#             'Google': 'gemini-2.0-flash',
#             'Groq': 'openai/gpt-oss-20b',
#             'Meta': 'llama-3.3-70b-versatile',
#         },
#     },
#     config=config1,
# )

# for i in result["meta_messages"]:
#     print(i.content)
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

