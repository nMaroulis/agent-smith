# FastAPI endpoints to accept state/message schema from UI

from fastapi import APIRouter
from schemas.state_io import StateSchemaRequest

router = APIRouter(prefix="/state", tags=["State"], responses={404: {"description": "Not found"}})


@router.post("/define")
def define_state_schema(schema: StateSchemaRequest):
    # Save to file, db, or memory
    return {"success": True}


@router.post("/message/define")
def define_message_schema(schema: StateSchemaRequest):
    return {"success": True}
