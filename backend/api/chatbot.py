from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import StreamingResponse
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
import json
import time
from datetime import datetime
from pydantic import BaseModel
from db.session import get_db
from services.llms.factory import get_llm_client

router = APIRouter(prefix="/playground/chatbot", tags=["Chatbot"])

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[Dict[str, str]]
    model: str
    stream: bool = True
    is_local: bool = False

def format_chat_message(role: str, content: str):
    return {"role": role, "content": content}

@router.post("/chat")
async def chat_endpoint(request: Request, chat_request: ChatRequest, db: Session = Depends(get_db)):
    try:
        # Get the LLM client based on the request
        llm_client = get_llm_client(
            model_name=chat_request.model,
            is_local=chat_request.is_local,
            db=db
        )

        # Prepare messages for the LLM
        messages = [
            {"role": msg["role"], "content": msg["content"]}
            for msg in chat_request.messages
        ]

        if chat_request.stream:
            async def event_stream():
                full_response = ""
                start_time = time.time()
                
                # Stream the response
                async for chunk in await llm_client.astream_chat(messages):
                    if chunk:
                        # Format as Server-Sent Events
                        yield f"data: {json.dumps(chunk)}\n\n"
                        if 'choices' in chunk and chunk['choices']:
                            delta = chunk['choices'][0].get('delta', {})
                            if 'content' in delta:
                                full_response += delta['content']
                
                # Send a final message with metrics
                end_time = time.time()
                metrics = {
                    "type": "metrics",
                    "latency_ms": int((end_time - start_time) * 1000),
                    "timestamp": datetime.utcnow().isoformat()
                }
                yield f"data: {json.dumps(metrics)}\n\n"
                yield "data: [DONE]\n\n"

            return StreamingResponse(
                event_stream(),
                media_type="text/event-stream"
            )
        else:
            # Non-streaming response
            start_time = time.time()
            response = await llm_client.achat(messages)
            end_time = time.time()
            
            return {
                "id": f"chatcmpl-{int(time.time())}",
                "object": "chat.completion",
                "created": int(time.time()),
                "model": chat_request.model,
                "choices": [{
                    "index": 0,
                    "message": {
                        "role": "assistant",
                        "content": response
                    },
                    "finish_reason": "stop"
                }],
                "usage": {
                    "prompt_tokens": 0,  # These would be calculated by the LLM client
                    "completion_tokens": 0,
                    "total_tokens": 0,
                    "latency_ms": int((end_time - start_time) * 1000)
                }
            }
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
