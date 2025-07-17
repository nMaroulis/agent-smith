from services.llms.base import BaseLocalLLM
from typing import AsyncGenerator
import os

MODEL_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../../../models/llama_cpp"))


class LlamaCppLLM(BaseLocalLLM):
    """LLaMA-CPP LLM."""
    def __init__(self, model_path: str):
        super().__init__(model_path)


    def get_completion(self, system_prompt: str, user_prompt: str, **kwargs) -> str:
        """Get a non-streaming completion from the LLM."""
        ...


    def stream_completion(self, system_prompt: str, user_prompt: str, **kwargs) -> AsyncGenerator[str, None]:
        """Stream a completion from the LLM."""
        ...


    def list_models(self) -> list[str]:
        """List available models."""
        model_files = os.listdir(MODEL_PATH)
        return model_files



    def list_embeddings_models(self) -> list[str]:
        """List available embeddings models."""
        return []


    def to_code(self) -> str:
        """Generate a Python code snippet for the LLM."""
        ...
    

    def to_node(self) -> dict:
        """Generate a LangGraph node config for the LLM."""
        ...


    def get_tunable_parameters(self, model: str) -> dict:
        """Get tunable parameters for the LLM.
        Args:
            model (str): The model to get tunable parameters for.
        Returns:
            dict: A dictionary of tunable parameters.
        """
        return {}