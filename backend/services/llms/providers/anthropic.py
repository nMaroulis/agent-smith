from services.llms.base import BaseAPILLM
from anthropic import AuthenticationError as AnthropicAuthError
from anthropic import Anthropic

class AnthropicAPILLM(BaseAPILLM):
    """Anthropic API LLM."""
    def __init__(self, api_key: str):
        super().__init__("anthropic", api_key)
        self.client = Anthropic(api_key=self.api_key)


    def generate(self, prompt: str, **kwargs) -> str:
        """Generate a response from the LLM."""
        ...
    

    def validate_key(self) -> bool:
        """
        Validate the API key by attempting to list models from the Anthropic API.

        Returns:
            bool: True if the API key is valid, False if it is invalid.
        """
        try:
            self.client.models.list()
            return True
        except AnthropicAuthError:
            return False
        except Exception as e:
            print(e)
            return False


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