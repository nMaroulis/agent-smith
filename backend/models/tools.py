from db.base import Base
from sqlalchemy import Column, String, Integer, Text, JSON, Enum, Boolean
import enum

class ToolType(enum.Enum):
    RAG = "rag"
    WEB_SEARCH = "web_search"
    CUSTOM_CODE = "custom_code"
    AGENT = "agent"
    API_CALL = "api_call"
    LLM_TOOL = "llm_tool"
    OTHER = "other"


class Tool(Base):
    __tablename__ = "tools"

    id = Column(Integer, primary_key=True)
    name = Column(String(100), unique=True, nullable=False)  # user-friendly name
    description = Column(Text, nullable=True)  # what it does
    type = Column(Enum(ToolType), nullable=False)  # kind of tool
    config = Column(JSON, nullable=True)  # tool-specific config (e.g. retriever params, URL)
    code = Column(Text, nullable=True)  # for inline Python logic or serialized agents
    is_active = Column(Boolean, default=True)  # toggle use

    def __repr__(self):
        return f"<Tool(id={self.id}, name='{self.name}', type='{self.type.name}')>"
