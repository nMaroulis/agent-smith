from fastapi import FastAPI, APIRouter
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from api.llms import router as llm_router
from api.flows import router as flow_router
from api.tools import router as tool_router
from api.chatbot import router as chatbot_router
from core.startup import startup

app = FastAPI(title="Agentsmith API", description="Agentsmith API", version="0.0.1")


# CORS middleware configuration
origins = [
    "http://localhost:5173",  # Default Vite dev server
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
router.include_router(tool_router)
router.include_router(chatbot_router)
app.include_router(router)


@app.get("/", include_in_schema=False)
def root():
    return RedirectResponse(url="/api/health")


@app.api_route("/api/health", methods=["GET", "HEAD"])
def read_health():
    return {"status": "ok"}


if __name__ == "__main__":
    startup()
    uvicorn.run(app, host="0.0.0.0", port=8000, workers=1, log_level='debug', access_log=True)
    