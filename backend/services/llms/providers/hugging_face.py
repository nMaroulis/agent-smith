from services.llms.base import BaseAPILLM
from huggingface_hub import InferenceClient
from typing import Optional, AsyncGenerator
import requests


class HuggingFaceAPILLM(BaseAPILLM):
    """Hugging Face API LLM."""
    def __init__(self, api_key: Optional[str] = None):
        super().__init__(name="huggingface", api_key=api_key)
        if api_key is not None:
            self.client = InferenceClient(api_key=self.api_key)


    def get_completion(
        self,
        system_prompt: str,
        user_prompt: str,
        model: str = "mistralai/Mistral-7B-Instruct-v0.3",
        temperature: float = 0.7,
        max_tokens: int = 2048,) -> str:
        """
        Get a non-streaming completion from Hugging Face Inference API.
        """

        response = self.client.chat_completion(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            model=model,
            max_tokens=max_tokens,
            temperature=temperature,
            top_p=1.0,
            stream=False,
        )

        return response.choices[0].message.content


    async def stream_completion(
        self,
        system_prompt: str,
        user_prompt: str,
        model: str = "mistralai/Mistral-7B-Instruct-v0.3",
        temperature: float = 0.7,
        max_tokens: int = 2048,
    ) -> AsyncGenerator[str, None]:
        """
        Stream chat completions from Hugging Face API as an async generator.
        """
        stream = self.client.chat_completion(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            model=model,
            max_tokens=max_tokens,
            temperature=temperature,
            top_p=1.0,
            stream=True,
        )

        for chunk in stream:
            if chunk.choices and chunk.choices[0].delta:
                delta = chunk.choices[0].delta
                if delta.content:
                    yield delta.content
    
    @staticmethod
    def validate_key(api_key: str) -> bool:
        """
        Test if the provided Hugging Face API key is valid.

        Args:
            api_key (str): The Hugging Face API key.

        Returns:
            bool: True if the key is valid, False otherwise.
        """

        url = "https://huggingface.co/api/whoami-v2"
        headers = {
            "Authorization": f"Bearer {api_key}"
        }

        try:
            response = requests.get(url, headers=headers, timeout=5)
            return response.status_code == 200
        except requests.RequestException as e:
            print(f"Connection error: {e}")
            return False
        except Exception as e:
            print(f"Connection error: {e}")
            return False


    def validate(self) -> bool:
        return self.validate_key(self.api_key)

    def list_models(self) -> list[str]:
        """List available models from the Hugging Face client."""

        return [
            # 🔷 Open-source Chat Models
            "mistralai/Mistral-7B-Instruct-v0.3",        # Top open-source model for chat
            "mistralai/Mistral-7B-Instruct-v0.2",        # Top open-source model for chat
            "mistralai/Mixtral-8x7B-Instruct-v0.1",      # Mixture of Experts, strong multitasker
            "meta-llama/Meta-Llama-3-8B-Instruct",       # Small LLaMA 3 for fast chat
            "meta-llama/Meta-Llama-3-70B-Instruct",      # SOTA open-weight, large scale

            # 🔷 Falcon
            "tiiuae/falcon-7b-instruct",                 # Lightweight, instruction-tuned
            "tiiuae/falcon-40b-instruct",                # Large model (RAM-heavy)

            # 🔷 OpenChat / OpenHermes (fine-tuned Mistral)
            "openchat/openchat-3.5-1210",                # OpenChat fine-tuned Mistral
            "teknium/OpenHermes-2.5-Mistral-7B",         # Good coding/chat performance

            # 🔷 Nous Research
            "NousResearch/Nous-Hermes-2-Mistral-7B-DPO", # DPO-tuned Hermes (Mistral base)
            "NousResearch/Nous-Capybara-7B-V1p9",        # RLHF-tuned Mistral variant

            # 🔷 Zephyr (chat-tuned Mistral)
            "HuggingFaceH4/zephyr-7b-alpha",             # Hugging Face's own tuned chat model

            # 🔷 Code + Multimodal capable
            "codellama/CodeLlama-13b-Instruct-hf",       # Code-focused LLaMA
            "deepseek-ai/deepseek-coder-6.7b-instruct",  # Strong code + reasoning model

            # 🔷 Yi (Chinese + multilingual support)
            "01-ai/Yi-34B-Chat",                         # High-quality multilingual chat model
        ]

    def list_embeddings_models(self) -> list[str]:
        """
        List available embeddings models from the Hugging Face client.
        Currently hardcoded. TODO: implement filtering in models list.
        Returns:
            list[str]: List of available embeddings models.
        """
        return [
            "sentence-transformers/all-MiniLM-L6-v2",          # fast & widely used
            "sentence-transformers/all-mpnet-base-v2",         # stronger, slower
            "intfloat/e5-small-v2",                            # retrieval-optimized
            "intfloat/e5-base-v2",
            "intfloat/multilingual-e5-small",                  # multilingual
            "BAAI/bge-small-en-v1.5",                          # strong for RAG tasks
            "BAAI/bge-base-en-v1.5",
            "thenlper/gte-small",                              # open-source alternative to E5
        ]


    def to_code(self) -> str:
        """Generate a Python code snippet for the LLM."""
        return self.render_template("llms/api/hugging_face.jinja",
            model_name="mistralai/Mistral-7B-Instruct-v0.2",
        )


    def to_node(self) -> dict:
        pass

    
    def env_variables(self) -> list[str]:
        return f"HUGGING_FACE_API_KEY={self.api_key}"


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
                "max": 4096,
                "default": 2048,
            }
        }