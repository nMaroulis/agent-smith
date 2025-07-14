# StateDefinition and Message schema

from typing import TypedDict, Optional
from pydantic import BaseModel

class StateDefinition(TypedDict, total=False):
    question: str
    answer: str
    context: list[str]
    memory: Optional[dict]

class Message(BaseModel):
    role: str
    content: str
    name: Optional[str] = None
    metadata: Optional[dict] = None
