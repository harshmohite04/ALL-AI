from langchain_openai import ChatOpenAI
from langchain_groq import ChatGroq
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_community.chat_models import ChatPerplexity
from dotenv import load_dotenv
from langchain_anthropic import ChatAnthropic
from langchain_deepseek import ChatDeepSeek
from api_key_manager import api_key_manager, ProviderType

import logging

load_dotenv()
logger = logging.getLogger(__name__)

def llm_ChatOpenAI(openai_model_name):
    key_info = api_key_manager.get_available_key(ProviderType.OPENAI)
    if not key_info:
        raise Exception("No available OpenAI API keys")
    
    api_key, key_id = key_info
    logger.info(f"Using OpenAI key: {key_id}")
    
    return ChatOpenAI(
        model=openai_model_name,  
        temperature=0.7,
        api_key=api_key
    )

def llm_ChatGoogleGenerativeAI(google_model_name):
    key_info = api_key_manager.get_available_key(ProviderType.GOOGLE)
    if not key_info:
        raise Exception("No available Google API keys")
    
    api_key, key_id = key_info
    logger.info(f"Using Google key: {key_id}")
    
    return ChatGoogleGenerativeAI(
        model=google_model_name,   
        temperature=0.7,
        google_api_key=api_key
    )

def llm_ChatGroq(groq_model_name):
    key_info = api_key_manager.get_available_key(ProviderType.GROQ)
    if not key_info:
        raise Exception("No available Groq API keys")
    
    api_key, key_id = key_info
    logger.info(f"Using Groq key: {key_id}")
    
    return ChatGroq(
        model=groq_model_name,  
        temperature=0.7,
        groq_api_key=api_key
    )

def llm_ChatAnthropic(anthropic_model_name):
    key_info = api_key_manager.get_available_key(ProviderType.ANTHROPIC)
    if not key_info:
        raise Exception("No available Anthropic API keys")
    
    api_key, key_id = key_info
    logger.info(f"Using Anthropic key: {key_id}")
    
    return ChatAnthropic(
        model=anthropic_model_name,
        temperature=0.7,
        anthropic_api_key=api_key
    )

def llm_ChatDeepseek(deepseek_model_name):
    key_info = api_key_manager.get_available_key(ProviderType.DEEPSEEK)
    if not key_info:
        raise Exception("No available DeepSeek API keys")
    
    api_key, key_id = key_info
    logger.info(f"Using DeepSeek key: {key_id}")
    
    return ChatDeepSeek(
        model=deepseek_model_name,  
        temperature=0.7,
        api_key=api_key
    )

def llm_ChatPerplexity(perplexity_model_name: str):
    key_info = api_key_manager.get_available_key(ProviderType.PERPLEXITY)
    if not key_info:
        raise Exception("No available Perplexity API keys")

    api_key, key_id = key_info
    logger.info(f"Using Perplexity key: {key_id}")

    # ChatPerplexity reads PPLX_API_KEY from environment if not passed explicitly,
    # but we pass api_key so it works with our rotation system.
    return ChatPerplexity(
        model=perplexity_model_name,
        temperature=0.7,
        api_key=api_key,
    )