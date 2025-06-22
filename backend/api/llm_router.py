from fastapi import APIRouter

router = APIRouter(prefix="/llm", tags=["LLM"])

@router.post("/api/new")
def new_api_key(provide:str, api_key: str):
    return {"message": "Hello World"}

@router.delete("/api/delete")
def delete_api_key():
    return {"message": "Hello World"}

@router.get("/api/list")
def list_api_keys():
    return {"message": "Hello World"}

@router.post("/local/new")
def new_local_llm():
    return {"message": "Hello World"}

@router.delete("/local/delete")
def delete_local_llm():
    return {"message": "Hello World"}

@router.get("/local/list")
def list_local_llms():
    return {"message": []}
