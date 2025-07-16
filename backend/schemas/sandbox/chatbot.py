from pydantic import BaseModel, Field
from typing import List, Dict, Any, Literal, Optional


class Message(BaseModel):
    role: Literal["user", "assistant", "system"]
    content: str

class ChatRequest(BaseModel):
    messages: List[Message]
    model: Optional[str] = Field(None, description="Optional model name")
    llm_alias: Optional[str] = Field(None, description="Optional alias for the LLM configuration")
    llm_type: str = Field(..., description="Type of LLM: 'remote' or 'local'")
    temperature: Optional[float] = Field(0.7, ge=0, le=1)
    max_tokens: Optional[int] = Field(2048, ge=1, le=4096)
    top_p: Optional[float] = Field(1.0, ge=0, le=1)
    frequency_penalty: Optional[float] = Field(0.0, ge=0, le=2)
    presence_penalty: Optional[float] = Field(0.0, ge=0, le=2)
    stream: Optional[bool] = False

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
