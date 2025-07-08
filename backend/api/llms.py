from fastapi import APIRouter, Depends, HTTPException, Query
from schemas.llms import RemoteLLM, LocalLLM, ListLLMs, RemoteLLMOut, LocalLLMOut, LLMValidationRequest, LLMValidationResponse
from crud.llms import get_remote_llms, create_remote_llm, update_remote_llm_by_id, get_remote_llm_by_id, delete_remote_llm_by_id, create_local_llm, get_local_llms, get_local_llm_by_id, update_local_llm_by_id, delete_local_llm_by_id, get_api_key_by_name
from typing import Optional
from sqlalchemy.orm import Session
from db.session import get_db
from services.llms.factory import get_llm_client


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


@router.get("/remote/models/llms", response_model=list[str])
async def get_available_remote_models(provider: str = Query(..., description="The LLM provider (e.g., openai, anthropic)"), name: str = Query(..., description="The LLM name"), db: Session = Depends(get_db)):
    try:
        api_key = get_api_key_by_name(db, provider=provider, name=name)
        llm = get_llm_client(provider=provider.lower().replace(" ", "_"), api_key=api_key)
        return llm.list_models()
    except Exception as e:
        print(e)
        return {"error": f"Validation error: {str(e)}"}


@router.get("/remote/models/embeddings", response_model=list[str])
async def get_available_remote_embeddings_models(provider: str = Query(..., description="The LLM provider (e.g., openai, anthropic)"), name: str = Query(..., description="The LLM name"), db: Session = Depends(get_db)):
    try:
        api_key = get_api_key_by_name(db, provider=provider, name=name)
        llm = get_llm_client(provider=provider.lower().replace(" ", "_"), api_key=api_key)
        return llm.list_embeddings_models()
    except Exception as e:
        print(e)
        return {"error": f"Validation error: {str(e)}"}

# API Status Check

@router.post("/validate-key", response_model=LLMValidationResponse)
async def validate_llm_key(data: LLMValidationRequest):
    try:
        llm = get_llm_client(provider=data.provider.lower().replace(" ", "_"), api_key=data.api_key)
        if not llm.validate_key():
            return {"valid": False, "message": "Invalid API key"}
        return {"valid": True, "message": "API key is valid"}
    except Exception as e:
        return {"valid": False, "message": f"Validation error: {str(e)}"}


@router.get("/validate-key", response_model=LLMValidationResponse)
async def validate_remote_llm_key(provider: str = Query(..., description="The LLM provider (e.g., openai, anthropic)"), name: str = Query(..., description="The LLM name"), db: Session = Depends(get_db)):
    try:
        api_key = get_api_key_by_name(db, provider=provider, name=name)
        llm = get_llm_client(provider=provider.lower().replace(" ", "_"), api_key=api_key)
        if not llm.validate_key():
            return {"valid": False, "message": "Invalid API key"}
        return {"valid": True, "message": "API key is valid"}
    except Exception as e:
        return {"valid": False, "message": f"Validation error: {str(e)}"}


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


@router.get("/local/models/llms", response_model=list[str])
async def get_available_local_models(provider: str):
    try:
        llm = get_llm_client(provider=provider.lower().replace(" ", "_"))
        return llm.list_models()
    except Exception as e:
        return {"error": f"Validation error: {str(e)}"}
