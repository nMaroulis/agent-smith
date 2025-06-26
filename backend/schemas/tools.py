from pydantic import BaseModel
from typing import List, Optional, Dict
from models.tools import ToolType


class ToolOut(BaseModel):
    id: int
    name: str
    description: Optional[str]
    type: ToolType
    config: Optional[Dict] = None
    code: Optional[str] = None
    is_active: bool

    class Config:
        from_attributes = True


class ToolCreate(BaseModel):
    name: str
    description: Optional[str] = None
    type: ToolType
    config: Optional[dict] = None
    code: Optional[str] = None
    is_active: Optional[bool] = True


class ToolUpdate(BaseModel):
    id: int
    name: Optional[str] = None
    description: Optional[str] = None
    type: Optional[ToolType] = None
    config: Optional[dict] = None
    code: Optional[str] = None
    is_active: Optional[bool] = None
