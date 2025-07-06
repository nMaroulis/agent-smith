from abc import ABC, abstractmethod
from schemas import Tool


class BaseTool(ABC):
    def __init__(self, tool: Tool):
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
    def __init__(self, tool: Tool):
        self.tool = tool


class BaseWebSearchTool(BaseTool):
    def __init__(self, tool: Tool):
        self.tool = tool