"""
Prompts package for role-based system prompts.
Contains individual prompt files for better maintainability.
"""

from .general import GENERAL_PROMPT
from .finance import FINANCE_PROMPT
from .coding import CODING_PROMPT
from .coder import CODER_PROMPT
from .legal import LEGAL_PROMPT
from .doctor import DOCTOR_PROMPT
from .learning import LEARNING_PROMPT
from .marketing import MARKETING_PROMPT
from .image_generation import IMAGE_GENERATION_PROMPT
from .video_generation import VIDEO_GENERATION_PROMPT

__all__ = [
    'GENERAL_PROMPT',
    'FINANCE_PROMPT', 
    'CODING_PROMPT',
    'CODER_PROMPT',
    'LEGAL_PROMPT',
    'DOCTOR_PROMPT',
    'LEARNING_PROMPT',
    'MARKETING_PROMPT',
    'IMAGE_GENERATION_PROMPT',
    'VIDEO_GENERATION_PROMPT'
]
