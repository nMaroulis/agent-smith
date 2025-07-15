from fastapi import APIRouter, Depends, HTTPException, Path, Query
from schemas.llms import RemoteLLM, LocalLLM, ListLLMs, RemoteLLMOut, LocalLLMOut, LLMValidationRequest, LLMValidationResponse, RemoteLLMUpdate, ListModels, ListEmbeddingsModels, LLMTunableParameters
from crud.llms import get_remote_llms, create_remote_llm, update_remote_llm_by_alias, get_remote_llm_by_alias, delete_remote_llm_by_alias, create_local_llm, get_local_llms, get_local_llm_by_alias, update_local_llm_by_alias, delete_local_llm_by_alias
from typing import Optional
from sqlalchemy.orm import Session
from db.session import get_db
from services.llms.factory import get_llm_client_by_provider, get_remote_llm_client_by_alias, get_local_llm_client_by_alias


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
    return create_remote_llm(db, llm.alias, llm.provider, llm.api_key)


@router.get("/remote/{alias}", description="Get a remote LLM by alias", response_model=RemoteLLMOut)
def get_remote_llm(alias: str, db: Session = Depends(get_db)):
    return get_remote_llm_by_alias(db, alias)


@router.put("/remote/{alias}", description="Update a remote LLM by alias")
def update_api_key(alias: str, llm: RemoteLLMUpdate, db: Session = Depends(get_db)):
    updated = update_remote_llm_by_alias(db, old_alias=alias, new_alias=llm.alias, api_key=llm.api_key)
    if not updated:
        raise HTTPException(status_code=404, detail="LLM not found")
    return updated


@router.delete("/remote/{alias}")
def delete_api_key(alias: str, db: Session = Depends(get_db)):
    deleted = delete_remote_llm_by_alias(db, alias)
    if not deleted:
        raise HTTPException(status_code=404, detail="LLM not found")
    return deleted


@router.get("/remote/{alias}/models", response_model=ListModels)
async def get_available_remote_models(alias: str = Path(..., description="The remote LLM alias"), db: Session = Depends(get_db)):
    try:
        llm = get_remote_llm_client_by_alias(alias=alias, db=db)
        return {"models": llm.list_models()}
    except Exception as e:
        print(e)
        return {"error": f"Validation error: {str(e)}"}


@router.get("/remote/{alias}/embeddings_models", response_model=ListEmbeddingsModels)
async def get_available_remote_embeddings_models(alias: str = Path(..., description="The remote LLM alias"), db: Session = Depends(get_db)):
    try:
        llm = get_remote_llm_client_by_alias(alias=alias, db=db)
        return {"embeddings_models": llm.list_embeddings_models()}
    except Exception as e:
        print(e)
        return {"error": f"Validation error: {str(e)}"}

# API Status Check

@router.post("/remote/validate-key", response_model=LLMValidationResponse, description="Validate a remote LLM API key")
async def validate_llm_key(data: LLMValidationRequest):
    try:
        llm = get_llm_client_by_provider(provider=data.provider.lower().replace(" ", "_"))
        if not llm.validate_key(data.api_key):
            return {"valid": False, "message": "Invalid API key"}
        return {"valid": True, "message": "API key is valid"}
    except Exception as e:
        return {"valid": False, "message": f"Validation error: {str(e)}"}


@router.get("/remote/{alias}/validate-key", response_model=LLMValidationResponse, description="Validate a saved remote LLM's API key")
async def validate_remote_llm_key(alias: str = Path(..., description="The remote LLM alias"), db: Session = Depends(get_db)):
    try:
        llm = get_remote_llm_client_by_alias(alias=alias, db=db)
        if not llm.validate():
            return {"valid": False, "message": "Invalid API key"}
        return {"valid": True, "message": "API key is valid"}
    except Exception as e:
        return {"valid": False, "message": f"Validation error: {str(e)}"}


@router.get("/remote/{alias}/parameters", response_model=LLMTunableParameters, description="Get tunable parameters for a remote LLM")
async def get_tunable_parameters(alias: str = Path(..., description="The remote LLM alias"), model: Optional[str] = Query(None, description="The remote LLM model"), db: Session = Depends(get_db)):
    try:
        llm = get_remote_llm_client_by_alias(alias=alias, db=db)
        return llm.get_tunable_parameters(model)
    except Exception as e:
        print(e)
        return {"error": f"Validation error: {str(e)}"}


#############
## Local LLMs
#############

@router.get("/local", response_model=list[LocalLLMOut])
def list_local_llms(limit: Optional[int] = None, db: Session = Depends(get_db)):
    return get_local_llms(db, limit)


@router.post("/local")
def new_local_llm(llm: LocalLLM, db: Session = Depends(get_db)):
    return create_local_llm(db, llm.provider, llm.name, llm.path)


@router.get("/local/{alias}", description="Get a local LLM by alias", response_model=LocalLLMOut)
def get_local_llm(alias: str = Path(..., description="The local LLM alias"), db: Session = Depends(get_db)):
    return get_local_llm_by_alias(db, alias)


@router.put("/local/{alias}", description="Update a local LLM by alias")
def update_local_llm(alias: str, llm: LocalLLM, db: Session = Depends(get_db)):
    updated = update_local_llm_by_alias(db, alias, llm.provider, llm.path)
    if not updated:
        raise HTTPException(status_code=404, detail="LLM not found")
    return updated


@router.delete("/local/{alias}")
def delete_local_llm(alias: str, db: Session = Depends(get_db)):
    deleted = delete_local_llm_by_alias(db, alias)
    if not deleted:
        raise HTTPException(status_code=404, detail="LLM not found")
    return deleted


@router.get("/local/{alias}/models", response_model=list[str])
async def get_available_local_models(alias: str = Path(..., description="The local LLM alias"), db: Session = Depends(get_db)):
    try:
        llm = get_local_llm_client_by_alias(alias=alias, db=db)
        return {"models": llm.list_models()}
    except Exception as e:
        return {"error": f"Validation error: {str(e)}"}


@router.get("/local/{alias}/embeddings_models", response_model=list[str])
async def get_available_local_embeddings_models(alias: str = Path(..., description="The local LLM alias"), db: Session = Depends(get_db)):
    try:
        llm = get_local_llm_client_by_alias(alias=alias, db=db)
        return {"embeddings_models": llm.list_embeddings_models()}
    except Exception as e:
        return {"error": f"Validation error: {str(e)}"}


@router.get("/local/{alias}/parameters", response_model=LLMTunableParameters, description="Get tunable parameters for a local LLM")
async def get_tunable_parameters(alias: str = Path(..., description="The local LLM alias"), model: Optional[str] = Query(None, description="The local LLM model"), db: Session = Depends(get_db)):
    try:
        llm = get_local_llm_client_by_alias(alias=alias, db=db)
        return llm.get_tunable_parameters(model)
    except Exception as e:
        print(e)
        return {"error": f"Validation error: {str(e)}"}
