from abc import ABC, abstractmethod
from schemas.tools import ToolCreate
import os
from jinja2 import Environment, FileSystemLoader, select_autoescape
from utils.naming_utils import sanitize_to_func_name


class BaseTool(ABC):
    def __init__(self, tool: ToolCreate):
        self.tool = tool

        # Setup Jinja2 once for all subclasses
        templates_path = os.path.abspath(
            os.path.join(os.path.dirname(__file__), "../../templates")
        )
        self.env = Environment(
            loader=FileSystemLoader(templates_path),
            autoescape=select_autoescape()
        )

    
    @abstractmethod
    def to_code(self) -> str:
        """Returns the Python code (as string) for the tool."""
        ...


    @abstractmethod
    def to_node(self) -> dict:
        """Returns a LangGraph node config."""
        ...
    

    def render_template(self, template_path: str, **kwargs) -> str:
        """Optional Helper Function: Render a template with the given kwargs"""
        template = self.env.get_template(template_path)
        return template.render(**kwargs)


    @abstractmethod
    def get_default_agent_prompts(self) -> dict:
        """Returns the default agent prompts for the tool."""
        return {"system_prompt": "", "user_prompt": ""}


    @staticmethod
    def sanitize_to_func_name(name: str) -> str:
        """Convert an arbitrary string into a valid Python function name."""
        return sanitize_to_func_name(name)



class BaseRAGTool(BaseTool):
    def __init__(self, tool: ToolCreate):
        super().__init__(tool)

    def get_default_agent_prompts(self) -> dict:
        return {"system_prompt": """You are a technical AI assistant. Answer the user's question based only on the provided documentation below.
            Use precise, technical language, and cite relevant facts when possible. Do not hallucinate or make up facts.
            If the answer is not in the documents, say so clearly.
            Documentation:
            """, 
            "user_prompt": "{context}\n\nQuestion:\n{query}"}


class BaseWebSearchTool(BaseTool):
    def __init__(self, tool: ToolCreate):
        super().__init__(tool)

    def get_default_agent_prompts(self) -> dict:
        return {"system_prompt": """You are an assistant that summarizes and explains search results from the web. Only use the information below to answer the user. Be helpful, clear, and avoid guessing. Search Results:""",
            "user_prompt": "{context}\n\nUser's question:\n{query}"}


class BaseAPICallTool(BaseTool):
    def __init__(self, tool: ToolCreate):
        super().__init__(tool)
    
    def get_default_agent_prompts(self) -> dict:
        return {"system_prompt": """You are an assistant that calls an API to retrieve information.
            Only use the information below to answer the user. Be helpful, clear, and avoid guessing.
            API Response:
            """,
            "user_prompt": "{context}\n\nUser's question:\n{query}"}