from pydantic import BaseModel
from typing import Optional

class FlowCreate(BaseModel):
    name: str
    description: Optional[str] = None
    serialized_graph: dict

class FlowOut(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    serialized_graph: dict

    class Config:
        orm_mode = True
