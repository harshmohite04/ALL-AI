from typing import TypedDict, Optional, Dict,List

class AgentState(TypedDict):
    user_query: str
    responses: Dict[str, str]  # {"OpenAI": "...", "Google": "..."}
    tokens_used: Dict[str, int]  # {"OpenAI": 123, "Google": 456}
    timestamp: Optional[str]
    metadata: Optional[Dict]
    selected_models: List[str]
