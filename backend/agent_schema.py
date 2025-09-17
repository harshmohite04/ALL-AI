from typing import TypedDict, Optional, Dict, List
from datetime import datetime


class AgentState(TypedDict, total=False):
    user_query: str
    responses: Dict[str, str]
    openai:List[str]
    google:List[str]
    groq:List[str]
    errors: Dict[str, str]
    timestamp: str
    metadata: Dict
    selected_models: List[str]
