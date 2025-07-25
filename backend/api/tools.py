from fastapi import APIRouter, Depends, HTTPException
from schemas.tools import ToolOut, ToolCreate
from crud.tools import get_tools, create_tool, get_tool_by_id, update_tool_by_id, delete_tool_by_id
from typing import Optional
from sqlalchemy.orm import Session
from db.session import get_db
from services.tools.factory import get_tool as get_tool_object


router = APIRouter(prefix="/tools", tags=["Tool"])


@router.get("/", response_model=list[ToolOut])
def list_tools(limit: Optional[int] = None, db: Session = Depends(get_db)):
    """List all tools"""
    return get_tools(db, limit)


@router.post("/")
def new_tool(tool: ToolCreate, db: Session = Depends(get_db)):
    # Generate code if not provided
    if not tool.code:
        tool = get_tool_object(tool)
        tool.code = tool.to_code()

    return create_tool(db, tool.name, tool.description, tool.type, tool.config, tool.code, tool.is_active)


@router.get("/{id}", description="Get a tool by ID")
def get_tool(id: int, db: Session = Depends(get_db)):
    return get_tool_by_id(db, id)


@router.put("/{id}", description="Update a tool by ID")
def update_tool(id: int, tool: ToolCreate, db: Session = Depends(get_db)):
    updated = update_tool_by_id(db, id, tool.name, tool.description, tool.type, tool.config, tool.code, tool.is_active)
    if not updated:
        raise HTTPException(status_code=404, detail="Tool not found")
    return updated


@router.delete("/{id}", description="Delete a tool by ID")
def delete_tool(id: int, db: Session = Depends(get_db)):
    deleted = delete_tool_by_id(db, id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Tool not found")
    return deleted


@router.post("/preview_code")
def preview_tool_code(tool: ToolCreate):
    tool = get_tool_object(tool)
    return {"code": tool.to_code()}
