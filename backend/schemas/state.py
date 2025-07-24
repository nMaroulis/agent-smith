from pydantic import BaseModel
from typing import List, Optional, Dict, Any, Literal


class StateField(BaseModel):
    id: str
    name: str
    type: Literal['str', 'int', 'float', 'bool', 'List[str]', 'Dict[str, Any]']
    isOptional: bool
    initialValue: Optional[str] = None
    fieldMetadata: Optional[Dict[str, Any]] = None
    isInternal: Optional[bool] = False


class State(BaseModel):
    fields: List[StateField] = []