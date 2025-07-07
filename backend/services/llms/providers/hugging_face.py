from services.llms.base import BaseAPILLM
from huggingface_hub import InferenceClient

class HuggingFaceAPILLM(BaseAPILLM):
    """Hugging Face API LLM."""
    def __init__(self):
        super().__init__(name="huggingface")
        self.client = None # TODO add client initialization with huggingface and api key from DB
    
    def generate(self, prompt: str, **kwargs) -> str:
        """Generate a response from the LLM."""
        ...
    
    @staticmethod
    def validate_key(api_key: str) -> bool:
        """
        Validate the API key.

        Args:
            api_key (str): The API key to validate.

        Returns:
            bool: True if the key is valid, otherwise False.
        """
        try:
            temp_client = InferenceClient(api_key=api_key)
            temp_client.models.list()
            return True
        except Exception as e:
            print(e)
            return False
        
    def list_models(self):
        """List available models from the Hugging Face client."""
        return [
            # 🔷 Open-source Chat Models
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

    def list_embeddings_models(self):
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
