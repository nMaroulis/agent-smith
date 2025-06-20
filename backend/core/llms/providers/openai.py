from ...base import BaseAPILLM


class OpenAIAPILLM(BaseAPILLM):
    """OpenAI API LLM."""
    def __init__(self, api_key: str):
        super().__init__(api_key)
    
    def generate(self, prompt: str, **kwargs) -> str:
        """Generate a response from the LLM."""
        ...
