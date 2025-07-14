from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import StreamingResponse
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
import json
import time
from datetime import datetime
from pydantic import BaseModel
from db.session import get_db

router = APIRouter(prefix="/playground/chatbot", tags=["Chatbot"])
