import requests

payload = {
    "user_query": "Hello, what is my name?",
    "models": ["OpenAI", "Groq"]
}

res = requests.post("http://127.0.0.1:8000/chat", json=payload)
print(res.json())

