from fastapi import APIRouter
from schemas.llms import APILLM, LocalLLM, LLM
from crud.llms import create_llm_credential, get_llm_credentials, update_llm_credential, delete_llm_credential


router = APIRouter(prefix="/llms", tags=["LLM"])


@router.post("/api")
def new_api_key(provide:str, api_key: str):
    return {"message": "Hello World"}


@router.delete("/api")
def delete_api_key():
    return {"message": "Hello World"}


@router.get("/api", response_model=list[APILLM])
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


@router.post("/local")
def new_local_llm():
    return {"message": "Hello World"}


@router.delete("/local")
def delete_local_llm():
    return {"message": "Hello World"}


@router.get("/local", response_model=list[LocalLLM])
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
