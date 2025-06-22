from fastapi import APIRouter
from schemas.llms import APILLM, LocalLLM, LLM

router = APIRouter(prefix="/llm", tags=["LLM"])


@router.post("/api/new")
def new_api_key(provide:str, api_key: str):
    return {"message": "Hello World"}


@router.delete("/api/delete")
def delete_api_key():
    return {"message": "Hello World"}


@router.get("/api/list", response_model=list[APILLM])
async def list_api_keys():
    # Dummy data for API LLMs
    return [
        {
            "id": "1",
            "type": "api",
            "provider": "openai",
            "model": "gpt-4-turbo",
            "name": "My OpenAI API"
        },
        {
            "id": "2",
            "type": "api",
            "provider": "anthropic",
            "model": "claude-3-opus",
            "name": "My Anthropic API"
        }
    ]


@router.post("/local/new")
def new_local_llm():
    return {"message": "Hello World"}


@router.delete("/local/delete")
def delete_local_llm():
    return {"message": "Hello World"}


@router.get("/local/list", response_model=list[LocalLLM])
async def list_local_llms():
    # Dummy data for local LLMs
    return [
        {
            "id": "3",
            "type": "local",
            "provider": "llama-cpp",
            "model": "/models/llama/llama-3-8b.Q4_K_M.gguf",
            "name": "Local LLaMA 3 8B"
        },
        {
            "id": "4",
            "type": "local",
            "provider": "llama-cpp",
            "model": "/models/llama/mistral-7b-instruct-v0.1.Q4_K_M.gguf",
            "name": "Local Mistral 7B"
        }
    ]
