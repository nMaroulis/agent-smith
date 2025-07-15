from services.llms.base import BaseAPILLM
from anthropic import AuthenticationError as AnthropicAuthError
from anthropic import Anthropic
from typing import Optional


class AnthropicAPILLM(BaseAPILLM):
    """Anthropic API LLM."""
    def __init__(self, api_key: Optional[str] = None):
        super().__init__("anthropic", api_key)
        if api_key is not None:
            self.client = Anthropic(api_key=self.api_key)


    def generate(self, prompt: str, **kwargs) -> str:
        """Generate a response from the LLM."""
        ...
    
    @staticmethod
    def validate_key(api_key: str) -> bool:
        """
        Validate the API key by attempting to list models from the Anthropic API.

        Returns:
            bool: True if the API key is valid, False if it is invalid.
        """
        try:
            Anthropic(api_key=api_key).models.list()
            return True
        except AnthropicAuthError:
            return False
        except Exception as e:
            print(e)
            return False


    def validate(self) -> bool:
        return self.validate_key(self.api_key)


    def list_models(self) -> list[str]:
        """List available models from the Anthropic client."""
        try:
            models = self.client.models.list()
            return [model.id for model in models.data]
        except Exception as e:
            print(f"Error listing Anthropic models: {e}")
            return []


    def list_embeddings_models(self) -> list[str]:
        """
        List available embeddings models from the Anthropic client.
        Currently hardcoded. TODO: implement filtering in models list.
        Returns:
            list[str]: List of available embeddings models.
        """
        # raise NotImplementedError("Anthropic does not support embedding models.")
        return []


    def to_code(self) -> str:
        """Generate a Python code snippet for the LLM."""
        return self.render_template("llms/api/anthropic.jinja",
            model_name="claude-3-5-sonnet-20240620",
        )


    def to_node(self) -> dict:
        pass

    
    def env_variables(self) -> list[str]:
        return f"ANTHROPIC_API_KEY={self.api_key}"
    
    
    def get_tunable_parameters(self) -> dict:
        return {
            "temperature": {
                "type": "float",
                "min": 0.0,
                "max": 1.0,
                "default": 0.7,
            },
            "max_tokens": {
                "type": "int",
                "min": 1,
                "max": 16000,
                "default": 8000,
            }
        }