"""
Role-based system prompts for enhanced AI performance.
Each role has a specialized system prompt to optimize responses for specific use cases.
Now organized in separate files for better maintainability.
"""

from prompts import (
    GENERAL_PROMPT,
    FINANCE_PROMPT,
    CODING_PROMPT,
    CODER_PROMPT,
    LEGAL_PROMPT,
    DOCTOR_PROMPT,
    LEARNING_PROMPT,
    MARKETING_PROMPT,
    IMAGE_GENERATION_PROMPT,
    VIDEO_GENERATION_PROMPT
)

ROLE_PROMPTS = {
    "General": GENERAL_PROMPT,
    "Finance": FINANCE_PROMPT,
    "Coding": CODING_PROMPT,
    "Coder": CODER_PROMPT,
    "Legal": LEGAL_PROMPT,
    "Doctor": DOCTOR_PROMPT,
    "Learning": LEARNING_PROMPT,
    "Marketing": MARKETING_PROMPT,
    "Image Generation": IMAGE_GENERATION_PROMPT,
    "Video Generation": VIDEO_GENERATION_PROMPT
}

def get_role_prompt(role: str) -> str:
    """
    Get the system prompt for a specific role.
    
    Args:
        role (str): The role name
        
    Returns:
        str: The system prompt for the role, or General prompt if role not found
    """
    return ROLE_PROMPTS.get(role, ROLE_PROMPTS["General"])

def get_available_roles() -> list:
    """
    Get list of all available roles.
    
    Returns:
        list: List of available role names
    """
    return list(ROLE_PROMPTS.keys())
