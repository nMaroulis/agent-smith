from abc import ABC, abstractmethod
import os
from jinja2 import Environment, FileSystemLoader, select_autoescape


class BaseLLM(ABC):
    """
    Base class for LLMs.

    Attributes:
        name (str): The name of the LLM.
        client: The client for the LLM.
        env: The Jinja2 environment for rendering templates.
    """
    def __init__(self, name: str):
        self.name = name
        self.client = None

        templates_path = os.path.abspath(
            os.path.join(os.path.dirname(__file__), "../../templates")
        )
        self.env = Environment(
            loader=FileSystemLoader(templates_path),
            autoescape=select_autoescape()
        )


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

    @abstractmethod
    def to_code(self) -> str:
        """Generate a Python code snippet for the LLM."""
        ...
    
    @abstractmethod
    def to_node(self) -> dict:
        """Generate a LangGraph node config for the LLM."""
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
    
    @abstractmethod
    def env_variables(self) -> list[str]:
        """Generate environment variables for the LLM."""
        ...


class BaseLocalLLM(BaseLLM):
    """Base class for local LLMs."""

    def __init__(self):
        super().__init__("BaseLocalLLM")
