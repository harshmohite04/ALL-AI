from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes_preprocess import router as preprocess_router

app = FastAPI(title="ALL-AI FastAPI Service")

# CORS: allow all origins during development. Tighten for production.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount routers
app.include_router(preprocess_router)

@app.get("/")
async def root():
    return {"status": "ok", "service": "fastapi"}
