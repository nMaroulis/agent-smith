from abc import ABC, abstractmethod
import os
from jinja2 import Environment, FileSystemLoader, select_autoescape
from typing import Optional, AsyncGenerator


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
        self.template = None  # Template for rendering code

    @abstractmethod
    def get_completion(self, system_prompt: str, user_prompt: str, **kwargs) -> str:
        """Get a non-streaming completion from the LLM."""
        ...


    @abstractmethod
    def stream_completion(self, system_prompt: str, user_prompt: str, **kwargs) -> AsyncGenerator[str, None]:
        """Stream a completion from the LLM."""
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
    def to_code(self, model: str) -> str:
        """Generate a Python code snippet for the LLM."""
        ...
    
    @abstractmethod
    def to_node(self) -> dict:
        """Generate a LangGraph node config for the LLM."""
        ...

    @abstractmethod
    def get_tunable_parameters(self, model: str) -> dict:
        """Get tunable parameters for the LLM.
        Args:
            model (str): The model to get tunable parameters for.
        Returns:
            dict: A dictionary of tunable parameters.
        """
        ...


class BaseAPILLM(BaseLLM):
    """Base class for API LLMs."""

    def __init__(self, name: str, api_key: Optional[str] = None):
        super().__init__(name)
        self.api_key = api_key

    @staticmethod
    @abstractmethod
    def validate_key(api_key: str) -> bool:
        """
        Validate the API key.
        Args:
            api_key (str): The API key to validate.
        Returns:
            bool: True if the key is valid, otherwise False.
        """
        ...

    @abstractmethod
    def validate(self) -> bool:
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

    def __init__(self, name: str, path: Optional[str] = None):
        super().__init__(name)
        self.path = path
