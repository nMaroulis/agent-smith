from services.llms.base import BaseLocalLLM
from typing import Optional, AsyncGenerator
import os
from llama_cpp import Llama


class LlamaCppLLM(BaseLocalLLM):
    """LLaMA-CPP LLM."""
    def __init__(self, path: Optional[str] = None):
        super().__init__("llama-cpp", path)
        self.client = None
    

    def _load_model(self, model_path: str):
        self.client = Llama(
            model_path=f"{self.path}/{model_path}",
            n_ctx=1024,
            n_threads=4,
            verbose=False,
        )
        return

    def get_completion(
        self,
        system_prompt: str,
        user_prompt: str,
        model: str,
        temperature: float = 0.1,
        max_tokens: int = 1024,
        **kwargs,
    ) -> str:
        prompt = f"<|system|>\n{system_prompt}\n<|user|>\n{user_prompt}\n<|assistant|>\n"
        self._load_model(model)
        output = self.client(
            prompt,
            temperature=temperature,
            stream=False
        )
        return output["choices"][0]["text"]


    async def stream_completion(
        self,
        system_prompt: str,
        user_prompt: str,
        model: str,
        temperature: float = 0.1,
        max_tokens: int = 1024,
        **kwargs,
    ) -> AsyncGenerator[str, None]:
        prompt = f"<|system|>\n{system_prompt}\n<|user|>\n{user_prompt}\n<|assistant|>\n"
        self._load_model(model)
        stream = self.client(
            prompt,
            temperature=temperature,
            stream=True,
        )
        for chunk in stream:
            yield chunk["choices"][0]["text"]


    def list_models(self) -> list[str]:
        """List available models."""
        model_files = os.listdir(self.path)
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
    

    def get_recommended_path(self) -> str:
        """Get the recommended path for the LLM."""
        MODEL_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../../models/llama_cpp"))
        return MODEL_PATH