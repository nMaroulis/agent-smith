from services.llms.base import BaseLocalLLM
from typing import Optional, AsyncGenerator
import requests
import json


class LMStudioLLM(BaseLocalLLM):
    """LM Studio LLM provider that connects to local LM Studio server."""
    
    def __init__(self, host: Optional[str] = None, port: Optional[int] = None):
        super().__init__("lm-studio")
        self.host = host or "127.0.0.1"
        self.port = port or 1234
        self.base_url = f"http://{self.host}:{self.port}/v1"
        self.client = None
    
    def _test_connection(self) -> bool:
        """Test if LM Studio server is running."""
        try:
            response = requests.get(f"{self.base_url}/models", timeout=5)
            return response.status_code == 200
        except requests.exceptions.RequestException:
            return False
    
    def _get_session(self):
        """Create a requests session for API calls."""
        if not self.client:
            self.client = requests.Session()
        return self.client
    
    def get_completion(
        self,
        system_prompt: str,
        user_prompt: str,
        model: str = "local-model",
        temperature: float = 0.1,
        max_tokens: int = 1024,
        **kwargs,
    ) -> str:
        """Get a non-streaming completion from LM Studio."""
        session = self._get_session()
        
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]
        
        payload = {
            "model": model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
            "stream": False
        }
        
        try:
            response = session.post(
                f"{self.base_url}/chat/completions",
                json=payload,
                timeout=30
            )
            response.raise_for_status()
            result = response.json()
            return result["choices"][0]["message"]["content"]
        except requests.exceptions.RequestException as e:
            raise Exception(f"Failed to get completion from LM Studio: {e}")
    
    async def stream_completion(
        self,
        system_prompt: str,
        user_prompt: str,
        model: str = "local-model",
        temperature: float = 0.1,
        max_tokens: int = 1024,
        **kwargs,
    ) -> AsyncGenerator[str, None]:
        """Stream a completion from LM Studio."""
        session = self._get_session()
        
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]
        
        payload = {
            "model": model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
            "stream": True
        }
        
        try:
            response = session.post(
                f"{self.base_url}/chat/completions",
                json=payload,
                stream=True,
                timeout=30
            )
            response.raise_for_status()
            
            for line in response.iter_lines():
                if line:
                    line_str = line.decode('utf-8')
                    if line_str.startswith('data: '):
                        data_str = line_str[6:]
                        if data_str.strip() == '[DONE]':
                            break
                        try:
                            data = json.loads(data_str)
                            if 'choices' in data and len(data['choices']) > 0:
                                delta = data['choices'][0].get('delta', {})
                                if 'content' in delta:
                                    yield delta['content']
                        except json.JSONDecodeError:
                            continue
        except requests.exceptions.RequestException as e:
            raise Exception(f"Failed to stream completion from LM Studio: {e}")
    
    def list_models(self) -> list[str]:
        """List available models from LM Studio."""
        session = self._get_session()
        
        try:
            response = session.get(f"{self.base_url}/models", timeout=10)
            response.raise_for_status()
            result = response.json()
            return [model["id"] for model in result.get("data", [])]
        except requests.exceptions.RequestException as e:
            raise Exception(f"Failed to list models from LM Studio: {e}")
    
    def list_embeddings_models(self) -> list[str]:
        """List available embeddings models from LM Studio."""
        # LM Studio typically doesn't expose embeddings models through the same endpoint
        # This would need to be implemented based on specific LM Studio capabilities
        return []
    
    def to_code(self, model: str) -> str:
        """Generate a Python code snippet for the LM Studio LLM."""
        return f'''
import requests
import json


class LMStudioClient:
    def __init__(self, host="localhost", port=1234):
        self.base_url = f"http://127.0.0.1:1234/v1"

    def get_completion(
        self,
        system_prompt,
        user_prompt,
        model="{model}",
        temperature=0.1,
        max_tokens=1024,
    ):
        messages = [
            {{"role": "system", "content": system_prompt}},
            {{"role": "user", "content": user_prompt}},
        ]

        payload = {{
            "model": model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
        }}

        response = requests.post(f"{{self.base_url}}/chat/completions", json=payload)
        return response.json()["choices"][0]["message"]["content"]

    def get_completion_stream(
        self,
        system_prompt,
        user_prompt,
        model="{model}",
        temperature=0.1,
        max_tokens=1024,
    ):
        messages = [
            {{"role": "system", "content": system_prompt}},
            {{"role": "user", "content": user_prompt}},
        ]

        payload = {{
            "model": model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
            "stream": True,
        }}

        response = requests.post(
            f"{{self.base_url}}/chat/completions", json=payload, stream=True
        )
        return response
'''
    
    def to_node(self) -> dict:
        """Generate a LangGraph node config for the LM Studio LLM."""
        return {
            "type": "lm-studio",
            "config": {
                "host": self.host,
                "port": self.port
            }
        }
    
    def get_tunable_parameters(self, model: str) -> dict:
        """Get tunable parameters for the LM Studio LLM."""
        return {
            "temperature": {
                "type": "float",
                "default": 0.1,
                "min": 0.0,
                "max": 2.0,
            },
            "max_tokens": {
                "type": "int",
                "default": 1024,
                "min": 1,
                "max": 8192,
            },
            "top_p": {
                "type": "float",
                "default": 0.95,
                "min": 0.0,
                "max": 1.0,
            },
            "frequency_penalty": {
                "type": "float",
                "default": 0.0,
                "min": -2.0,
                "max": 2.0,
            },
            "presence_penalty": {
                "type": "float",
                "default": 0.0,
                "min": -2.0,
                "max": 2.0,
            }
        }
    
    def get_recommended_path(self) -> str:
        """Get the recommended configuration for LM Studio."""
        return f"Connect to LM Studio at {self.base_url}"
