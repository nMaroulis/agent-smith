from fastapi import APIRouter, Depends, HTTPException
from schemas.llms import RemoteLLM, LocalLLM, ListLLMs, RemoteLLMOut, LocalLLMOut
from crud.llms import get_remote_llms, create_remote_llm, update_remote_llm_by_id, get_remote_llm_by_id, delete_remote_llm_by_id, create_local_llm, get_local_llms, get_local_llm_by_id, update_local_llm_by_id, delete_local_llm_by_id
from typing import Optional
from sqlalchemy.orm import Session
from db.session import get_db

router = APIRouter(prefix="/llms", tags=["LLM"])


@router.get("/", response_model=ListLLMs)
def list_llms(limit: Optional[int] = None, db: Session = Depends(get_db)):
    """List all LLMs - currently unused"""
    return ListLLMs(api=[], local=[])


###########################
## Remote LLMs - though API
###########################

@router.get("/remote", response_model=list[RemoteLLMOut])
def list_remote_llms(limit: Optional[int] = None, db: Session = Depends(get_db)):
    return get_remote_llms(db, limit)


@router.post("/remote")
def new_api_key(llm: RemoteLLM, db: Session = Depends(get_db)):
    return create_remote_llm(db, llm.provider, llm.name, llm.api_key)


@router.get("/remote/{id}", description="Get a remote LLM by ID", response_model=RemoteLLMOut)
def get_remote_llm(id: int, db: Session = Depends(get_db)):
    return get_remote_llm_by_id(db, id)


@router.put("/remote/{id}", description="Update a remote LLM by ID")
def update_api_key(id: int, llm: RemoteLLM, db: Session = Depends(get_db)):
    updated = update_remote_llm_by_id(db, id, llm.provider, llm.name, llm.api_key)
    if not updated:
        raise HTTPException(status_code=404, detail="LLM not found")
    return updated


@router.delete("/remote/{id}")
def delete_api_key(id: int, db: Session = Depends(get_db)):
    deleted = delete_remote_llm_by_id(db, id)
    if not deleted:
        raise HTTPException(status_code=404, detail="LLM not found")
    return deleted


# API Status Check

class APIKeyRequest(BaseModel):
    api_key: str

@router.post("/validate-openai-key")
def validate_openai_key(request: APIKeyRequest):
    """
    Validates an OpenAI API key by attempting to list available models.
    """
    try:
        client = OpenAI(api_key=request.api_key)
        response = client.models.list()
        model_ids = [model.id for model in response.data]
        return {
            "valid": True,
            "models": model_ids
        }
    except AuthenticationError:
        raise HTTPException(status_code=401, detail="Invalid OpenAI API key.")
    except OpenAIError as e:
        raise HTTPException(status_code=500, detail=f"OpenAI error: {str(e)}")


#############
## Local LLMs
#############

@router.get("/local", response_model=list[LocalLLMOut])
def list_local_llms(limit: Optional[int] = None, db: Session = Depends(get_db)):
    return get_local_llms(db, limit)


@router.post("/local")
def new_local_llm(llm: LocalLLM, db: Session = Depends(get_db)):
    return create_local_llm(db, llm.provider, llm.name, llm.path)


@router.get("/local/{id}", description="Get a local LLM by ID", response_model=LocalLLMOut)
def get_local_llm(id: int, db: Session = Depends(get_db)):
    return get_local_llm_by_id(db, id)


@router.put("/local/{id}", description="Update a local LLM by ID")
def update_local_llm(id: int, llm: LocalLLM, db: Session = Depends(get_db)):
    updated = update_local_llm_by_id(db, id, llm.provider, llm.name, llm.path)
    if not updated:
        raise HTTPException(status_code=404, detail="LLM not found")
    return updated


@router.delete("/local/{id}")
def delete_local_llm(id: int, db: Session = Depends(get_db)):
    deleted = delete_local_llm_by_id(db, id)
    if not deleted:
        raise HTTPException(status_code=404, detail="LLM not found")
    return deleted