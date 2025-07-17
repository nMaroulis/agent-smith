from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import StreamingResponse
from typing import Dict
from sqlalchemy.orm import Session
import json
import time
from db.session import get_db
import asyncio
from schemas.sandbox.chatbot import ChatRequest, ChatResponse
from services.sandbox.chatbot.llm_service import MockLLMService, LLMService

router = APIRouter(prefix="/playground/chatbot", tags=["Chatbot"])


llm_service = LLMService()

@router.post("/chat", response_model=ChatResponse, response_model_exclude_unset=True)
async def chat(
    request: ChatRequest,
    db: Session = Depends(get_db)
):
    print(request)
    """
    Chat with the selected LLM model.
    """
    if not request.messages:
        raise HTTPException(status_code=400, detail="Messages cannot be empty")
    
    # In a real implementation, validate the model against available models
    if not request.model:
        raise HTTPException(status_code=400, detail="Model must be specified")
    
    # Get the response from the LLM service
    response = None
    async for chunk in llm_service.generate_chat_completion(
        messages=request.messages,
        model=request.model,
        llm_alias=request.llm_alias,
        llm_type=request.llm_type,
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
    print(response)
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
        
    async def event_generator():
        async for chunk in llm_service.generate_chat_completion(
            messages=request.messages,
            model=request.model,
            llm_alias=request.llm_alias,
            llm_type=request.llm_type,
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
