from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import StreamingResponse
from typing import Optional, List, Dict, Any, Literal
from sqlalchemy.orm import Session
import json
import time
from datetime import datetime
from pydantic import BaseModel, Field
from db.session import get_db
import asyncio
import uuid
from typing import AsyncGenerator

router = APIRouter(prefix="/api/playground/chatbot", tags=["Chatbot"])

# Models
class Message(BaseModel):
    role: Literal["user", "assistant", "system"]
    content: str

class ChatRequest(BaseModel):
    messages: List[Message]
    model: str
    temperature: float = Field(0.7, ge=0, le=2)
    max_tokens: int = Field(2048, ge=1, le=4096)
    top_p: float = Field(1.0, ge=0, le=1)
    frequency_penalty: float = Field(0.0, ge=0, le=2)
    presence_penalty: float = Field(0.0, ge=0, le=2)
    stream: bool = False

class TokenUsage(BaseModel):
    prompt_tokens: int
    completion_tokens: int
    total_tokens: int

class ChatResponse(BaseModel):
    id: str
    object: str = "chat.completion"
    created: int
    model: str
    usage: TokenUsage
    choices: List[Dict[str, Any]]

class ChatCompletionChunk(BaseModel):
    id: str
    object: str = "chat.completion.chunk"
    created: int
    model: str
    choices: List[Dict[str, Any]]

# Mock LLM service - replace with actual implementation
class LLMService:
    async def generate_chat_completion(
        self, 
        messages: List[Message],
        model: str,
        temperature: float = 0.7,
        max_tokens: int = 2048,
        top_p: float = 1.0,
        frequency_penalty: float = 0.0,
        presence_penalty: float = 0.0,
        stream: bool = False
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

llm_service = LLMService()

@router.post("/chat", response_model=ChatResponse, response_model_exclude_unset=True)
async def chat(
    request: ChatRequest,
    db: Session = Depends(get_db)
):
    """
    Chat with the selected LLM model.
    """
    if not request.messages:
        raise HTTPException(status_code=400, detail="Messages cannot be empty")
    
    # In a real implementation, validate the model against available models
    if not request.model:
        raise HTTPException(status_code=400, detail="Model must be specified")
    
    if request.stream:
        raise HTTPException(status_code=400, detail="Use /chat/stream for streaming")
    
    # Get the response from the LLM service
    response = None
    async for chunk in llm_service.generate_chat_completion(
        messages=request.messages,
        model=request.model,
        temperature=request.temperature,
        max_tokens=request.max_tokens,
        top_p=request.top_p,
        frequency_penalty=request.frequency_penalty,
        presence_penalty=request.presence_penalty,
        stream=False
    ):
        response = chunk
    
    if not response:
        raise HTTPException(status_code=500, detail="Failed to generate response")
    
    return response

@router.post("/chat/stream")
async def chat_stream(
    request: ChatRequest,
    db: Session = Depends(get_db)
):
    """
    Stream chat responses from the selected LLM model.
    """
    if not request.messages:
        raise HTTPException(status_code=400, detail="Messages cannot be empty")
    
    if not request.model:
        raise HTTPException(status_code=400, detail="Model must be specified")
    
    if not request.stream:
        raise HTTPException(status_code=400, detail="Use /chat for non-streaming")
    
    async def event_generator():
        async for chunk in llm_service.generate_chat_completion(
            messages=request.messages,
            model=request.model,
            temperature=request.temperature,
            max_tokens=request.max_tokens,
            top_p=request.top_p,
            frequency_penalty=request.frequency_penalty,
            presence_penalty=request.presence_penalty,
            stream=True
        ):
            yield f"data: {json.dumps(chat_completion_chunk_to_dict(chunk))}\n\n"
            await asyncio.sleep(0.01)
        
        yield 'data: [DONE]\n\n'
    
    return StreamingResponse(event_generator(), media_type="text/event-stream")

def chat_completion_chunk_to_dict(chunk: Dict) -> Dict:
    """Convert a chat completion chunk to a dictionary."""
    return {
        "id": chunk.get("id", ""),
        "object": chunk.get("object", "chat.completion.chunk"),
        "created": chunk.get("created", int(time.time())),
        "model": chunk.get("model", ""),
        "choices": [
            {
                "delta": choice.get("delta", {}),
                "index": choice.get("index", 0),
                "finish_reason": choice.get("finish_reason")
            }
            for choice in chunk.get("choices", [])
        ]
    }
