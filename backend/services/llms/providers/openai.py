from services.llms.base import BaseAPILLM
from openai import OpenAI, AuthenticationError, OpenAIError
from typing import Optional

class OpenAIAPILLM(BaseAPILLM):
    """OpenAI API LLM."""

    def __init__(self, api_key: Optional[str] = None):
        super().__init__(name="openai", api_key=api_key)
        if api_key is not None:
            self.client = OpenAI(api_key=self.api_key)


    def generate(self, prompt: str, **kwargs) -> str:
        """Generate a response from the LLM. - Dummy code"""
        return self.client.chat.completions.create(
            model="gpt-4",
            messages=[{"role": "user", "content": prompt}],
            **kwargs
        ).choices[0].message.content


    @staticmethod
    def validate_key(api_key: str) -> bool:
        """
        Validate the API key by attempting to list models from the OpenAI API.

        Returns:
            bool: True if the API key is valid, False if it is invalid.
        """
        try:
            OpenAI(api_key=api_key).models.list()
            return True
        except Exception as e:
            print(e)
            return False


    def validate(self) -> bool:
        return self.validate_key(self.api_key)


    def list_models(self) -> list[str]:
        """List available models from the OpenAI client."""
        try:
            return [model.id for model in self.client.models.list().data]
        except OpenAIError:
            return []
        except Exception as e:
            print(e)
            return []
    

    def list_embeddings_models(self) -> list[str]:
        """
        List available embeddings models from the OpenAI client.
        Currently hardcoded. TODO: implement filtering in models list.
        Returns:
            list[str]: List of available embeddings models.
        """
        return [
            "text-embedding-3-small",
            "text-embedding-3-large",
            "text-embedding-ada-002"
        ]


    def to_code(self) -> str:
        """Generate a Python code snippet for the LLM."""
        return self.render_template("llms/api/openai.jinja",
            model_name="gpt-4",
        )


    def to_node(self) -> dict:
        pass

    
    def env_variables(self) -> list[str]:
        return f"OPENAI_API_KEY={self.api_key}"