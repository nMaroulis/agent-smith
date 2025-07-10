from fastapi import APIRouter, Depends, HTTPException
from typing import Optional
from sqlalchemy.orm import Session




router = APIRouter(prefix="/playground/chatbot", tags=["Chatbot"])


