from services.tools.rag.chroma import ChromaRAGTool
from services.tools.rag.qdrant import QdrantRAGTool
from services.tools.base import BaseTool
from services.tools.web_search.duckduckgo import DuckDuckGoWebSearchTool
from services.tools.api_call.api_call import APICallTool
from schemas.tools import ToolCreate
from models.tools import ToolType
from crud.tools import get_tool_by_name as get_tool_by_name_db
from sqlalchemy.orm import Session


def get_tool(tool: ToolCreate) -> BaseTool:
    if tool.type == ToolType.RAG:
        if tool.config.get("library", "").lower() == "chromadb":
            return ChromaRAGTool(tool)
        elif tool.config.get("library", "").lower() == "qdrant":
            return QdrantRAGTool(tool)
        else:
            raise ValueError(f"Unsupported RAG library: {tool.library}")
    elif tool.type == ToolType.WEB_SEARCH:
        if tool.config.get("library", "").lower() == "duckduckgo":
            return DuckDuckGoWebSearchTool(tool)
        else:
            raise ValueError(f"Unsupported web search library: {tool.library}")
    elif tool.type == ToolType.API_CALL:
        return APICallTool(tool)
    raise ValueError(f"Unsupported tool type: {tool.type}")


def get_tool_by_name(db: Session, name: str) -> BaseTool:
    tool = get_tool_by_name_db(db, name)
    if not tool:
        return None
    return get_tool(tool)
    