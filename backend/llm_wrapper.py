import asyncio
import logging
from typing import Any, Dict, Optional
from functools import wraps
from api_key_manager import api_key_manager, ProviderType
from constants import (
    llm_ChatOpenAI, llm_ChatGoogleGenerativeAI, llm_ChatGroq, 
    llm_ChatAnthropic, llm_ChatDeepseek, llm_ChatPerplexity,
)

logger = logging.getLogger(__name__)

class LLMWrapper:
    """Wrapper for LLM calls with automatic key rotation and usage tracking"""
    
    def __init__(self):
        self.provider_map = {
            ProviderType.OPENAI: llm_ChatOpenAI,
            ProviderType.GOOGLE: llm_ChatGoogleGenerativeAI,
            ProviderType.GROQ: llm_ChatGroq,
            ProviderType.ANTHROPIC: llm_ChatAnthropic,
            ProviderType.DEEPSEEK: llm_ChatDeepseek,
            ProviderType.PERPLEXITY: llm_ChatPerplexity,
        }
    
    def _get_provider_from_model(self, model_name: str) -> ProviderType:
        """Determine provider from model name"""
        model_lower = model_name.lower()
        
        if any(x in model_lower for x in ['gpt', 'openai']):
            return ProviderType.OPENAI
        elif any(x in model_lower for x in ['gemini', 'google']):
            return ProviderType.GOOGLE
        elif 'groq' in model_lower:
            return ProviderType.GROQ
        elif any(x in model_lower for x in ['claude', 'anthropic']):
            return ProviderType.ANTHROPIC
        elif 'deepseek' in model_lower:
            return ProviderType.DEEPSEEK
        elif any(x in model_lower for x in ['sonar', 'perplexity', 'pplx']):
            return ProviderType.PERPLEXITY
        else:
            # Default fallback - you might want to adjust this
            return ProviderType.OPENAI
    
    def _estimate_tokens(self, messages) -> int:
        """Rough token estimation for tracking"""
        if isinstance(messages, list):
            total_chars = sum(len(str(msg)) for msg in messages)
        else:
            total_chars = len(str(messages))
        
        # Rough estimation: ~4 characters per token
        return total_chars // 4
    
    async def invoke_with_rotation(self, model_name: str, messages, max_retries: int = 3) -> Any:
        """Invoke LLM with automatic key rotation on rate limits"""
        provider = self._get_provider_from_model(model_name)
        estimated_tokens = self._estimate_tokens(messages)
        
        last_exception = None
        
        for attempt in range(max_retries):
            try:
                # Get available key
                key_info = api_key_manager.get_available_key(provider)
                if not key_info:
                    raise Exception(f"No available API keys for {provider.value}")
                
                api_key, key_id = key_info
                logger.info(f"Attempt {attempt + 1}: Using {provider.value} key: {key_id}")
                
                # Get LLM instance
                llm_func = self.provider_map[provider]
                llm = llm_func(model_name)
                
                # Make the request
                if asyncio.iscoroutinefunction(llm.invoke):
                    result = await llm.invoke(messages)
                else:
                    result = llm.invoke(messages)
                
                # Record successful request
                api_key_manager.record_request(
                    provider=provider,
                    key_id=key_id,
                    tokens=estimated_tokens,
                    success=True
                )
                
                logger.info(f"Successful request to {provider.value} with key {key_id}")
                return result
                
            except Exception as e:
                last_exception = e
                error_msg = str(e).lower()
                
                # Record failed request
                if 'key_info' in locals():
                    api_key_manager.record_request(
                        provider=provider,
                        key_id=key_id,
                        tokens=0,
                        success=False
                    )
                
                # Check if it's a rate limit error
                is_rate_limit = any(phrase in error_msg for phrase in [
                    'rate limit', 'quota exceeded', 'too many requests', 
                    'rate_limit_exceeded', '429'
                ])
                
                if is_rate_limit:
                    logger.warning(f"Rate limit hit for {provider.value} key {key_id}, trying next key")
                    continue
                else:
                    # Non-rate-limit error, don't retry
                    logger.error(f"Non-retryable error for {provider.value}: {str(e)}")
                    raise e
        
        # All retries exhausted
        raise last_exception or Exception(f"All API keys exhausted for {provider.value}")
    
    def invoke_sync_with_rotation(self, model_name: str, messages, max_retries: int = 3) -> Any:
        """Synchronous version of invoke_with_rotation"""
        return asyncio.run(self.invoke_with_rotation(model_name, messages, max_retries))

# Global wrapper instance
llm_wrapper = LLMWrapper()

# Decorator for easy use
def with_key_rotation(max_retries: int = 3):
    """Decorator to add key rotation to LLM functions"""
    def decorator(func):
        @wraps(func)
        async def async_wrapper(*args, **kwargs):
            # Extract model name and messages from function arguments
            # This assumes the function signature follows a pattern
            if len(args) >= 2:
                model_name = args[0] if isinstance(args[0], str) else args[1]
                messages = args[1] if isinstance(args[0], str) else args[0]
            else:
                # Fallback - call original function
                return await func(*args, **kwargs)
            
            return await llm_wrapper.invoke_with_rotation(model_name, messages, max_retries)
        
        @wraps(func)
        def sync_wrapper(*args, **kwargs):
            if len(args) >= 2:
                model_name = args[0] if isinstance(args[0], str) else args[1]
                messages = args[1] if isinstance(args[0], str) else args[0]
            else:
                return func(*args, **kwargs)
            
            return llm_wrapper.invoke_sync_with_rotation(model_name, messages, max_retries)
        
        return async_wrapper if asyncio.iscoroutinefunction(func) else sync_wrapper
    return decorator
