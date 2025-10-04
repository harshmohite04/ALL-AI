from langchain_openai import ChatOpenAI
from langchain_groq import ChatGroq
from langchain_google_genai import ChatGoogleGenerativeAI
import os
from dotenv import load_dotenv
from langchain_anthropic import ChatAnthropic
from langchain_deepseek import ChatDeepSeek

load_dotenv()

def llm_ChatOpenAI(openai_model_name):
    return ChatOpenAI(
    model=openai_model_name,  
    temperature=0.7,
)

def llm_ChatGoogleGenerativeAI(google_model_name):
    return ChatGoogleGenerativeAI(
    model=google_model_name,   
    temperature=0.7,
   
)

def llm_ChatGroq(groq_model_name):
    return ChatGroq(
    model=groq_model_name,  
    temperature=0.7,
)

def llm_ChatAnthropic(anthropic_model_name):
    return ChatAnthropic(
        model=anthropic_model_name,
        temperature=0.7
    )

def llm_ChatDeepseek(deepseek_model_name):
    return ChatDeepSeek(
    model=deepseek_model_name,  
    temperature=0.7,
)