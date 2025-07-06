from services.llms.base import BaseAPILLM
from anthropic import AuthenticationError as AnthropicAuthError
from anthropic import Anthropic

class AnthropicAPILLM(BaseAPILLM):
    """Anthropic API LLM."""
    def __init__(self, api_key: str):
        super().__init__(api_key)
    

    def generate(self, prompt: str, **kwargs) -> str:
        """Generate a response from the LLM."""
        ...
    

    @staticmethod
    def validate_key(api_key: str) -> bool:
        """
        Validate the API key by attempting to list models from the Anthropic API.

        Args:
            api_key (str): The API key to validate.

        Returns:
            bool: True if the API key is valid, False if it is invalid.
        """
        try:
            temp_client = Anthropic(api_key=api_key)
            temp_client.models()
            return True
        except AnthropicAuthError:
            return False
        except Exception:
            return False
    
    def list_models(self):
        """List available models from the Anthropic client."""
        return [model["id"] for model in self.client.models.list()["data"]]
