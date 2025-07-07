from services.llms.providers.anthropic import AnthropicAPILLM
from services.llms.providers.openai import OpenAIAPILLM
from services.llms.local.llama_cpp import LlamaCppLLM
from services.llms.providers.hugging_face import HuggingFaceAPILLM
from typing import Optional


def get_llm_client(provider: str, api_key: Optional[str] = None, **kwargs):

    if provider == "anthropic":
        return AnthropicAPILLM(api_key=api_key)
    elif provider == "openai":
        return OpenAIAPILLM(api_key=api_key)
    elif provider == "huggingface":
        return HuggingFaceAPILLM(api_key=api_key)
    elif provider == "llama_cpp":
        return LlamaCppLLM()
    else:
        raise ValueError(f"Unknown LLM provider: {provider}")
