from pydantic import BaseModel
from typing import Optional

class FlowCreate(BaseModel):
    name: str
    description: Optional[str] = None
    graph: dict
    state: dict

class FlowOut(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    graph: dict
    state: dict

    class Config:
        from_attributes = True
