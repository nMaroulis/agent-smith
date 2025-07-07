from abc import ABC, abstractmethod


class BaseLLM(ABC):
    """Base class for LLMs."""
    def __init__(self, name: str):
        self.name = name
        self.client = None

    @abstractmethod
    def generate(self, prompt: str, **kwargs) -> str:
        """Generate a response from the LLM."""
        ...

    
    @abstractmethod
    def list_models(self) -> list[str]:
        """List available models."""
        ...


    @abstractmethod
    def list_embeddings_models(self) -> list[str]:
        """List available embeddings models."""
        ...


class BaseAPILLM(BaseLLM):
    """Base class for API LLMs."""

    def __init__(self, name: str, api_key: str):
        super().__init__(name)
        self.api_key = api_key


    @abstractmethod
    def validate_key(self) -> bool:
        """
        Validate the API key.

        Returns:
            bool: True if the key is valid, otherwise False.
        """
        ...


class BaseLocalLLM(BaseLLM):
    """Base class for local LLMs."""

    def __init__(self):
        super().__init__("BaseLocalLLM")
