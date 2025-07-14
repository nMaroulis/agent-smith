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
    alias: str


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
                "alias": "My OpenAI API",
                "type": "api",
                "provider": "openai",
                "base_url": "https://api.openai.com/v1"
            }
        }


class RemoteLLMUpdate(BaseLLM):
    """Model for updating API-based remote LLMs"""
    alias: str
    api_key: str
    base_url: Optional[HttpUrl] = None



class RemoteLLMOut(BaseModel):
    alias: str
    type: Literal[LLMType.API] = LLMType.API
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
                "alias": "My Local LLaMA",
                "type": "local",
                "provider": "llama-cpp",
                "path": "/models/llama/llama-3-8b.Q4_K_M.gguf"
            }
        }

class LocalLLMOut(BaseModel):
    type: Literal[LLMType.LOCAL] = LLMType.LOCAL
    alias: str
    provider: LocalProvider
    path: str

    class Config:
        from_attributes = True



class ListLLMs(BaseModel):
    api: list[RemoteLLMOut]
    local: list[LocalLLMOut]


class ListModels(BaseModel):
    models: list[str]

class ListEmbeddingsModels(BaseModel):
    embeddings_models: list[str]

# Union type that can represent any LLM type
LLM = RemoteLLM | LocalLLM


class LLMValidationRequest(BaseModel):
    provider: str  # "openai", "anthropic", etc.
    api_key: str


class LLMValidationResponse(BaseModel):
    valid: bool
    message: str