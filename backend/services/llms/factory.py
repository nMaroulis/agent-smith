from services.llms.providers.anthropic import AnthropicAPILLM
from services.llms.providers.openai import OpenAIAPILLM
from services.llms.local.llama_cpp import LlamaCppLLM
# etc.

def get_llm(name: str, **kwargs):
    if name == "anthropic":
        return AnthropicAPILLM()
    elif name == "openai":
        return OpenAIAPILLM()
    elif name == "llama_cpp":
        return LlamaCppLLM()
    else:
        raise ValueError(f"Unknown LLM provider: {name}")
