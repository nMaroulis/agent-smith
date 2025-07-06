from services.llms.base import BaseAPILLM
from openai import OpenAI, AuthenticationError, OpenAIError


class OpenAIAPILLM(BaseAPILLM):
    """OpenAI API LLM."""
    def __init__(self):
        super().__init__(name="openai")
        self.client = None # TODO add client initialization with openAI and api key from DB


    def generate(self, prompt: str, **kwargs) -> str:
        """Generate a response from the LLM."""
        ...


    @staticmethod
    def validate_key(api_key: str) -> bool:
        """
        Validate the API key by attempting to list models from the OpenAI API.

        Args:
            api_key (str): The API key to validate.

        Returns:
            bool: True if the API key is valid, False if it is invalid.
        """
        try:
            temp_client = OpenAI(api_key=api_key)
            temp_client.models.list()
            return True
        except AuthenticationError:
            return False
        except OpenAIError:
            return False


    def list_models(self):
        """List available models from the OpenAI client."""
        return [model.id for model in self.client.models.list().data]