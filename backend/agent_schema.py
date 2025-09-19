
from typing import TypedDict, List, Optional,Annotated
from langchain_core.messages import BaseMessage
from langgraph.graph.message import add_messages

class AgentState(TypedDict, total=False):
    openai_messages: Annotated[list[BaseMessage],add_messages]
    google_messages: Annotated[list[BaseMessage],add_messages]
    groq_messages: Annotated[list[BaseMessage],add_messages]
    selected_models: List[str]
