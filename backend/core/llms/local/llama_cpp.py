from ...base import BaseLocalLLM


class LlamaCppLLM(BaseLocalLLM):
    """LLaMA-CPP LLM."""
    def __init__(self, model_path: str):
        super().__init__(model_path)
    
    def generate(self, prompt: str, **kwargs) -> str:
        """Generate a response from the LLM."""
        ...
