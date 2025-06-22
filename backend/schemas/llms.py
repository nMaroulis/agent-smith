from enum import Enum
from typing import Optional, Literal
from pydantic import BaseModel, Field, HttpUrl


class LLMType(str, Enum):
    API = "api"
    LOCAL = "local"


class APIProvider(str, Enum):
    OPENAI = "openai"
    ANTHROPIC = "anthropic"
    HUGGINGFACE = "huggingface"


class LocalLLMProvider(str, Enum):
    LLAMA_CPP = "llama-cpp"


class BaseLLM(BaseModel):
    """Base model for all LLM types"""
    id: str
    type: LLMType
    name: str
    model: str


class APILLM(BaseLLM):
    """Model for API-based LLMs"""
    type: Literal[LLMType.API] = LLMType.API
    provider: APIProvider
    api_key: Optional[str] = Field(
        None,
        description="API key for the LLM provider. Only included in responses when explicitly requested.",
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
                "model": "gpt-4-turbo"
            }
        }


class LocalLLM(BaseLLM):
    """Model for locally hosted LLMs"""
    type: Literal[LLMType.LOCAL] = LLMType.LOCAL
    provider: LocalLLMProvider
    model_path: str = Field(
        ...,
        description="Filesystem path to the model file",
        alias="model"  # Keep alias for backward compatibility with frontend
    )

    class Config:
        json_schema_extra = {
            "example": {
                "id": "3",
                "type": "local",
                "name": "Local LLaMA 3 8B",
                "provider": "llama-cpp",
                "model": "/models/llama/llama-3-8b.Q4_K_M.gguf"
            }
        }


# Union type that can represent any LLM type
LLM = APILLM | LocalLLM