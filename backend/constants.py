from langchain_openai import ChatOpenAI
from langchain_groq import ChatGroq
from langchain_google_genai import ChatGoogleGenerativeAI
import os
from dotenv import load_dotenv


load_dotenv()

llm_ChatOpenAI = ChatOpenAI(
    model="gpt-4o",  
    temperature=0.7,
)

llm_ChatGoogleGenerativeAI = ChatGoogleGenerativeAI(
    model="gemini-2.0-flash",   
    temperature=0.7,
)

llm_ChatGroq = ChatGroq(
    model="llama-3.1-8b-instant",  
    temperature=0.7,
)
