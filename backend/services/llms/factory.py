from services.llms.providers.anthropic import AnthropicAPILLM
from services.llms.providers.openai import OpenAIAPILLM
from services.llms.local.llama_cpp import LlamaCppLLM
from services.llms.providers.hugging_face import HuggingFaceAPILLM
from typing import Optional
from crud.llms import get_api_key_by_alias, get_remote_llm_by_alias, get_local_llm_by_alias
from sqlalchemy.orm import Session


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


def get_remote_llm_client_by_alias(alias: str, db: Session):
    try:
        llm = get_remote_llm_by_alias(db, alias=alias)
        api_key = get_api_key_by_alias(db, alias=alias)
        if llm.provider == "anthropic":
            return AnthropicAPILLM(api_key=api_key)
        elif llm.provider == "openai":
            return OpenAIAPILLM(api_key=api_key)
        elif llm.provider == "huggingface":
            return HuggingFaceAPILLM(api_key=api_key)
        else:
            raise ValueError(f"Unknown Remote LLM provider: {llm.provider}")
    except Exception as e:
        print(f"Validation error: {str(e)}")
        raise e


def get_local_llm_client_by_alias(alias: str, db: Session):
    try:
        llm = get_local_llm_by_alias(db, alias=alias)
        if llm.provider == "llama_cpp":
            return LlamaCppLLM()
        else:
            raise ValueError(f"Unknown Local LLM provider: {llm.provider}")
    except Exception as e:
        print(f"Validation error: {str(e)}")
        raise e
