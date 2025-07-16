from services.llms.providers.anthropic import AnthropicAPILLM
from services.llms.providers.openai import OpenAIAPILLM
from services.llms.local.llama_cpp import LlamaCppLLM
from services.llms.providers.hugging_face import HuggingFaceAPILLM
from typing import Callable, Dict
from crud.llms import get_api_key_by_alias, get_remote_llm_by_alias, get_local_llm_by_alias
from sqlalchemy.orm import Session


REMOTE_PROVIDERS: Dict[str, Callable[[str], object]] = {
    "anthropic": lambda key: AnthropicAPILLM(api_key=key),
    "openai": lambda key: OpenAIAPILLM(api_key=key),
    "huggingface": lambda key: HuggingFaceAPILLM(api_key=key),
}

LOCAL_PROVIDERS: Dict[str, Callable[[], object]] = {
    "llama_cpp": lambda: LlamaCppLLM(),
}


def get_llm_client_by_alias(alias: str, db: Session, is_remote: bool):
    try:
        if is_remote:
            llm = get_remote_llm_by_alias(db, alias=alias)
            api_key = get_api_key_by_alias(db, alias=alias)

            if llm.provider not in REMOTE_PROVIDERS:
                raise ValueError(f"Unknown Remote LLM provider: {llm.provider}")

            return REMOTE_PROVIDERS[llm.provider](api_key)

        else:
            llm = get_local_llm_by_alias(db, alias=alias)

            if llm.provider not in LOCAL_PROVIDERS:
                raise ValueError(f"Unknown Local LLM provider: {llm.provider}")

            return LOCAL_PROVIDERS[llm.provider]()
    except Exception as e:
        print(f"LLM client instantiation error: {e}")
        raise



def get_llm_client_by_provider(provider: str, **kwargs):

    if provider == "anthropic":
        return AnthropicAPILLM()
    elif provider == "openai":
        return OpenAIAPILLM()
    elif provider == "huggingface":
        return HuggingFaceAPILLM()
    elif provider == "llama_cpp":
        return LlamaCppLLM()
    else:
        raise ValueError(f"Unknown LLM provider: {provider}")
