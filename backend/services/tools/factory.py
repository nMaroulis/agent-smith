from services.tools.rag.chroma import ChromaRAGTool
from services.tools.rag.qdrant import QdrantRAGTool
from services.tools.base import BaseTool
from services.tools.web_search.duckduckgo import DuckDuckGoWebSearchTool


def get_tool_generator(tool) -> BaseTool:
    if tool.type == "rag":
        if tool.library == "chromadb":
            return ChromaRAGTool(tool)
        elif tool.library == "qdrant":
            return QdrantRAGTool(tool)
        else:
            raise ValueError("Unsupported RAG library")
    elif tool.type == "web_search":
        if tool.library == "duckduckgo":
            return DuckDuckGoWebSearchTool(tool)
        else:
            raise ValueError("Unsupported web search library")
    raise ValueError("Unsupported tool type")
