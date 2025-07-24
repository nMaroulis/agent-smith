from services.llms.base import BaseAPILLM
from openai import OpenAI, OpenAIError, APIError, ChatCompletion
from typing import Optional, AsyncGenerator


class OpenAIAPILLM(BaseAPILLM):
    """OpenAI API LLM."""

    def __init__(self, api_key: Optional[str] = None):
        super().__init__(name="openai", api_key=api_key)
        if api_key is not None:
            self.client = OpenAI(api_key=self.api_key)


    def get_completion(
        self,
        system_prompt: str,
        user_prompt: str,
        model: str = "gpt-4o",
        temperature: float = 0.7,
        max_tokens: int = 2048,
    ) -> str:
        """
        Get a non-streaming completion from OpenAI.

        Args:
            system_prompt (str): Instructions for the assistant.
            user_prompt (str): The user message.
            model (str): OpenAI model name.
            temperature (float): Sampling temperature.
            max_tokens (int): Max tokens to generate.

        Returns:
            str: The model-generated response.
        """
        try:
            response: ChatCompletion = self.client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                temperature=temperature,
                max_tokens=max_tokens,
            )
            return response.choices[0].message.content.strip()
        except APIError as e:
            raise RuntimeError(f"OpenAI API error: {e}")


    async def stream_completion(
        self,
        system_prompt: str,
        user_prompt: str,
        model: str = "gpt-4o",
        temperature: float = 0.7,
        max_tokens: int = 2048,
    ) -> AsyncGenerator[str, None]:
        """
        Stream a completion from OpenAI, yielding parts of the message as they arrive.

        Args:
            system_prompt (str): Instructions for the assistant.
            user_prompt (str): The user message.
            model (str): OpenAI model name.
            temperature (float): Sampling temperature.
            max_tokens (int): Max tokens to generate.

        Yields:
            str: Partial responses (tokens or phrases).
        """
        try:
            stream = self.client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                temperature=temperature,
                max_tokens=max_tokens,
                stream=True,
            )

            async for chunk in stream:
                if chunk.choices and chunk.choices[0].delta.content:
                    yield chunk.choices[0].delta.content
        except APIError as e:
            raise RuntimeError(f"OpenAI streaming API error: {e}")


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


    def to_code(self, model: str = "gpt-4") -> str:
        """Generate a Python code snippet for the LLM."""
        return self.render_template("llms/api/openai.jinja",
            model_name=model,
        )


    def to_node(self) -> dict:
        pass

    
    def env_variables(self) -> list[str]:
        return f"OPENAI_API_KEY={self.api_key}"
    

    def get_tunable_parameters(self, model: str) -> dict:
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