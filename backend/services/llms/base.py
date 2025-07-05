from abc import ABC, abstractmethod


class BaseLLM(ABC):
    """Base class for LLMs."""
    def __init__(self, name: str):
        self.name = name
    
    @abstractmethod
    def generate(self, prompt: str, **kwargs) -> str:
        """Generate a response from the LLM."""
        ...

    @abstractmethod
    def get_name(self) -> str:
        """Get the name of the LLM."""
        return self.name



class BaseAPILLM(BaseLLM):
    """Base class for API LLMs."""

    def __init__(self, api_key: str):
        self.api_key = api_key
        # common API LLM setup


class BaseLocalLLM(BaseLLM):
    """Base class for local LLMs."""

    def __init__(self, model_path: str):
        self.model_path = model_path

