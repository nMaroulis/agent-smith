# Pydantic schemas for state and message config via API

from pydantic import BaseModel
from typing import List

class FieldDef(BaseModel):
    name: str
    type: str  # str, int, bool, list, dict
    default: str | None = None

class StateSchemaRequest(BaseModel):
    name: str
    fields: List[FieldDef]

class MessageSchemaRequest(BaseModel):
    name: str
    fields: List[FieldDef]
