from pydantic import BaseModel, Field
from typing import List, Dict, Any, Literal, Optional


class Message(BaseModel):
    role: Literal["user", "assistant", "system"]
    content: str

class ChatRequest(BaseModel):
    messages: List[Message]
    model: Optional[str] = Field(None, description="Optional model name")
    llm_alias: str = Field(..., description="Alias for the LLM configuration")
    llm_type: Literal['remote', 'local'] = Field(..., description="Type of LLM: 'remote' or 'local'")
    temperature: Optional[float] = Field(None, ge=0, le=1)
    max_tokens: Optional[int] = Field(None, ge=1, le=4096)
    top_p: Optional[float] = Field(None, ge=0, le=1)
    frequency_penalty: Optional[float] = Field(None, ge=0, le=2)
    presence_penalty: Optional[float] = Field(None, ge=0, le=2)

class TokenUsage(BaseModel):
    prompt_tokens: int
    completion_tokens: int
    total_tokens: int

class ChatResponse(BaseModel):
    id: str
    object: str = "chat.completion"
    created: int
    model: str
    usage: TokenUsage
    choices: List[Dict[str, Any]]

class ChatCompletionChunk(BaseModel):
    id: str
    object: str = "chat.completion.chunk"
    created: int
    model: str
    choices: List[Dict[str, Any]]
