from langchain_openai import ChatOpenAI
from langchain_anthropic import ChatAnthropic
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_groq import ChatGroq
from langchain_deepseek import ChatDeepSeek
from langchain_perplexity import ChatPerplexity
from langchain_xai import ChatXAI


llm_ChatOpenAI = ChatOpenAI(
    model="gpt-4o",
    temperature=0,
    max_tokens=None,
    timeout=None,
    max_retries=2,
    api_key="",  # if you prefer to pass api key in directly instaed of using env vars
    # base_url="...",
    # organization="...",
    # other params...
)

llm_ChatAnthropic = ChatAnthropic(
    model="claude-3-5-sonnet-latest",
    temperature=0,
    max_tokens=1024,
    timeout=None,
    max_retries=2,
    # other params...
)


llm_ChatGoogleGenerativeAI = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash",
    temperature=0,
    max_tokens=None,
    timeout=None,
    max_retries=2,
    # other params...
)


llm_ChatGroq = ChatGroq(
    model="deepseek-r1-distill-llama-70b",
    temperature=0,
    max_tokens=None,
    reasoning_format="parsed",
    timeout=None,
    max_retries=2,
    # other params...
)

llm_ChatDeepSeek = ChatDeepSeek(
    model="deepseek-chat",
    temperature=0,
    max_tokens=None,
    timeout=None,
    max_retries=2,
    # other params...
)

llm_ChatPerplexity = ChatPerplexity(
    temperature=0, 
    pplx_api_key="YOUR_API_KEY", 
    model="sonar"
)

llm_ChatXAI = ChatXAI(
    model="grok-beta",
    temperature=0,
    max_tokens=None,
    timeout=None,
    max_retries=2,
    # other params...
)
