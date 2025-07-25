from abc import ABC, abstractmethod
from schemas.tools import ToolCreate
import os
from jinja2 import Environment, FileSystemLoader, select_autoescape


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


class BaseRAGTool(BaseTool):
    def __init__(self, tool: ToolCreate):
        super().__init__(tool)


class BaseWebSearchTool(BaseTool):
    def __init__(self, tool: ToolCreate):
        super().__init__(tool)


class BaseAPICallTool(BaseTool):
    def __init__(self, tool: ToolCreate):
        super().__init__(tool)