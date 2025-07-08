from enum import Enum
from typing import Optional, Literal
from pydantic import BaseModel, Field, HttpUrl


class LLMType(str, Enum):
    API = "api"
    LOCAL = "local"


class RemoteProvider(str, Enum):
    OPENAI = "openai"
    ANTHROPIC = "anthropic"
    HUGGINGFACE = "huggingface"


class LocalProvider(str, Enum):
    LLAMA_CPP = "llama-cpp"


class BaseLLM(BaseModel):
    """Base model for all LLM types"""
    type: LLMType
    name: str


class RemoteLLM(BaseLLM):
    """Model for API-based remote LLMs"""
    type: Literal[LLMType.API] = LLMType.API
    provider: RemoteProvider
    api_key: str = Field(
        ...,
        description="API key for the LLM provider.",
        exclude=True
    )
    base_url: Optional[HttpUrl] = Field(
        None,
        description="Base URL for the API. Only needed for self-hosted or custom endpoints."
    )

    class Config:
        json_schema_extra = {
            "example": {
                "id": "1",
                "type": "api",
                "name": "My OpenAI API",
                "provider": "openai",
                "base_url": "https://api.openai.com/v1"
            }
        }


class RemoteLLMOut(BaseModel):
    id: int
    type: Literal[LLMType.API] = LLMType.API
    name: str
    provider: RemoteProvider
    base_url: Optional[HttpUrl] = None

    class Config:
        from_attributes = True


class LocalLLM(BaseLLM):
    """Model for locally hosted LLMs"""
    type: Literal[LLMType.LOCAL] = LLMType.LOCAL
    provider: LocalProvider
    path: str = Field(
        ...,
        description="Filesystem path to the model file",
        # alias="model"  # Keep alias for backward compatibility with frontend
    )

    class Config:
        json_schema_extra = {
            "example": {
                "id": "3",
                "type": "local",
                "name": "Local LLaMA 3 8B",
                "provider": "llama-cpp",
                "path": "/models/llama/llama-3-8b.Q4_K_M.gguf"
            }
        }

class LocalLLMOut(BaseModel):
    id: int
    type: Literal[LLMType.LOCAL] = LLMType.LOCAL
    name: str
    provider: LocalProvider
    path: str

    class Config:
        from_attributes = True



class ListLLMs(BaseModel):
    api: list[RemoteLLMOut]
    local: list[LocalLLMOut]


# Union type that can represent any LLM type
LLM = RemoteLLM | LocalLLM


class LLMValidationRequest(BaseModel):
    provider: str  # "openai", "anthropic", etc.
    api_key: str


class LLMValidationResponse(BaseModel):
    valid: bool
    message: str