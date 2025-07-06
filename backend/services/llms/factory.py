from services.llms.providers.anthropic import AnthropicAPILLM
from services.llms.providers.openai import OpenAIAPILLM
from services.llms.local.llama_cpp import LlamaCppLLM
from services.llms.providers.hugging_face import HuggingFaceAPILLM


def get_llm_client(name: str, **kwargs):
    if name == "anthropic":
        return AnthropicAPILLM()
    elif name == "openai":
        return OpenAIAPILLM()
    elif name == "huggingface":
        return HuggingFaceAPILLM()
    elif name == "llama_cpp":
        return LlamaCppLLM()
    else:
        raise ValueError(f"Unknown LLM provider: {name}")
