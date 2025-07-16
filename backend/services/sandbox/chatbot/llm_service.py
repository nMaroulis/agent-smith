from typing import List, Dict, Optional, AsyncGenerator
import uuid
import time
import asyncio
from schemas.sandbox.chatbot import Message
from services.llms.factory import get_llm_client_by_alias
from db.session import get_db

class LLMService:
    def __init__(self):
        self.llm_factory = get_llm_client_by_alias
        self.db = get_db()

    async def generate_chat_completion(
        self,
        messages: List[Message],
        model: str,
        llm_alias: Optional[str] = None,
        llm_type: str = 'remote',
        temperature: Optional[float] = 0.7,
        max_tokens: Optional[int] = 2048,
        top_p: Optional[float] = 1.0,
        frequency_penalty: Optional[float] = 0.0,
        presence_penalty: Optional[float] = 0.0,
        stream: Optional[bool] = False,
    ) -> AsyncGenerator[Dict, None]:
        """
        Unified chat interface across multiple LLM backends.
        """
        # Use llm_alias if provided, otherwise fall back to model-based selection
        is_remote = llm_type.lower() == 'remote'
        llm = self.llm_factory(alias=llm_alias, db=self.db, is_remote=is_remote) if llm_alias else None
        if not llm:
            raise ValueError(f"Could not initialize LLM with alias: {llm_alias}")
            
        completion_id = f"chatcmpl-{uuid.uuid4()}"
        created = int(time.time())
        
        system_prompt = "You are a helpful assistant."
        user_prompt = "\n".join([f"{m.role}: {m.content}" for m in messages])

        if stream:
            for token in llm.stream_completion(
                system_prompt=system_prompt,
                user_prompt=user_prompt,
                model=model,
                temperature=temperature,
                max_tokens=max_tokens,
            ):
                yield {
                    "id": completion_id,
                    "object": "chat.completion.chunk",
                    "created": created,
                    "model": model,
                    "llm_type": llm_type,
                    "choices": [
                        {
                            "delta": {"content": token},
                            "index": 0,
                            "finish_reason": None,
                        }
                    ],
                }
                # await asyncio.sleep(0.01)

            yield {
                "id": completion_id,
                "object": "chat.completion.chunk",
                "created": created,
                "model": model,
                "llm_type": llm_type,
                "choices": [
                    {
                        "delta": {},
                        "index": 0,
                        "finish_reason": "stop",
                    }
                ],
            }

        else:
            text = llm.get_completion(
                system_prompt=system_prompt,
                user_prompt=user_prompt,
                model=model,
                temperature=temperature,
                max_tokens=max_tokens,
            )

            yield {
                "id": completion_id,
                "object": "chat.completion",
                "created": created,
                "model": model,
                "llm_type": llm_type,
                "usage": {
                    "prompt_tokens": len(user_prompt.split()),
                    "completion_tokens": len(text.split()),
                    "total_tokens": len(user_prompt.split()) + len(text.split()),
                },
                "choices": [
                    {
                        "message": {"role": "assistant", "content": text},
                        "finish_reason": "stop",
                        "index": 0,
                    }
                ],
            }



# Mock LLM service - replace with actual implementation
class MockLLMService:
    async def generate_chat_completion(
            self, 
            messages: List[Message],
            model: str,
            llm_alias: Optional[str] = None,
            llm_type: str = 'remote',
            temperature: Optional[float] = 0.7,
            max_tokens: Optional[int] = 2048,
            top_p: Optional[float] = 1.0,
            frequency_penalty: Optional[float] = 0.0,
            presence_penalty: Optional[float] = 0.0,
            stream: Optional[bool] = False
    ) -> AsyncGenerator[Dict, None]:
        # This is a mock implementation
        # In a real implementation, this would call the actual LLM API
        
        completion_id = f"chatcmpl-{uuid.uuid4()}"
        created = int(time.time())
        
        if stream:
            # Simulate streaming response
            full_response = "This is a simulated streaming response. " \
                          "In a real implementation, this would be chunks from the LLM."
            
            for i in range(0, len(full_response), 5):
                chunk = full_response[i:i+5]
                yield {
                    "id": completion_id,
                    "object": "chat.completion.chunk",
                    "created": created,
                    "model": model,
                    "llm_type": llm_type,
                    "choices": [
                        {
                            "delta": {"content": chunk},
                            "index": 0,
                            "finish_reason": None
                        }
                    ]
                }
                await asyncio.sleep(0.01)  # Simulate network delay
            
            # Send final chunk
            yield {
                "id": completion_id,
                "object": "chat.completion.chunk",
                "created": created,
                "model": model,
                "choices": [
                    {
                        "delta": {},
                        "index": 0,
                        "finish_reason": "stop"
                    }
                ]
            }
        else:
            # Simulate non-streaming response
            await asyncio.sleep(0.5)  # Simulate processing time
            
            response = {
                "id": completion_id,
                "object": "chat.completion",
                "created": created,
                "model": model,
                "llm_type": llm_type,
                "usage": {
                    "prompt_tokens": sum(len(msg.content.split()) for msg in messages),
                    "completion_tokens": 42,  # Mock value
                    "total_tokens": sum(len(msg.content.split()) for msg in messages) + 42
                },
                "choices": [
                    {
                        "message": {
                            "role": "assistant",
                            "content": "This is a simulated response. In a real implementation, " \
                                      "this would be the actual response from the LLM."
                        },
                        "finish_reason": "stop",
                        "index": 0
                    }
                ]
            }
            yield response
