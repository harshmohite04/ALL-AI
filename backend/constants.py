from langchain_openai import ChatOpenAI
from langchain_groq import ChatGroq
from langchain_google_genai import ChatGoogleGenerativeAI
import os
from dotenv import load_dotenv


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
