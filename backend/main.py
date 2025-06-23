from fastapi import FastAPI, APIRouter
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from api.llm_router import router as llm_router
from api.flows import router as flow_router
from db.init_db import init_db


app = FastAPI(title="Agentsmith API", description="Agentsmith API", version="0.0.1")


# CORS middleware configuration
origins = [
    "http://localhost:3000",  # Default React dev server
    "http://localhost:5173",  # Default Vite dev server
    "http://localhost:8501",   # Streamlit
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
router = APIRouter(prefix="/api")
router.include_router(llm_router)
router.include_router(flow_router)
app.include_router(router)


@app.get("/")
def read_root():
    return {"status": "ok"}


if __name__ == "__main__":
    init_db()  # initialize DB if it doesn't exist
    uvicorn.run(app, host="0.0.0.0", port=8000, workers=1)
    