
from typing import TypedDict, List, Optional,Annotated,Dict
from langchain_core.messages import BaseMessage
from langgraph.graph.message import add_messages

class AgentState(TypedDict, total=False):
    openai_messages: Annotated[list[BaseMessage],add_messages]
    google_messages: Annotated[list[BaseMessage],add_messages]
    groq_messages: Annotated[list[BaseMessage],add_messages]
    meta_messages: Annotated[list[BaseMessage],add_messages]
    mistral_messages:Annotated[list[BaseMessage],add_messages]
    alibaba_messages:Annotated[list[BaseMessage],add_messages]
    deepseek_messages:Annotated[list[BaseMessage],add_messages]
    perplexity_messages:Annotated[list[BaseMessage],add_messages]
    anthropic_messages:Annotated[list[BaseMessage],add_messages]
    selected_models: Dict[str,str]
