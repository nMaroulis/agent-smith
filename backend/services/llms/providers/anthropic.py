from services.llms.base import BaseAPILLM
from anthropic import AuthenticationError as AnthropicAuthError
from anthropic import Anthropic

class AnthropicAPILLM(BaseAPILLM):
    """Anthropic API LLM."""
    def __init__(self):
        super().__init__("anthropic")
        self.client = None # TODO add client initialization with anthropic and api key from DB
    

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
            temp_client.models.list()
            return True
        except AnthropicAuthError:
            return False
        except Exception as e:
            print(e)
            return False


    def list_models(self):
        """List available models from the Anthropic client."""
        return [model["id"] for model in self.client.models.list()["data"]]


    def list_embeddings_models(self):
        """
        List available embeddings models from the Anthropic client.
        Currently hardcoded. TODO: implement filtering in models list.
        Returns:
            list[str]: List of available embeddings models.
        """
        # raise NotImplementedError("Anthropic does not support embedding models.")
        return []
