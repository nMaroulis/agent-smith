from ..base import BaseWebSearchTool
from schemas.tools import ToolCreate

class DuckDuckGoWebSearchTool(BaseWebSearchTool):

    def __init__(self, tool: ToolCreate):
        super().__init__(tool)
    

    def to_code(self) -> str:
        return self.render_template("tools/web_search/duckduckgo.jinja",
            name=self.tool.name.lower().replace(" ", "_"),
            max_results=self.tool.config.get("max_results"),
        )


    def to_node(self) -> dict:
        return {
            "name": self.tool.name,
            "type": "web_search",
            "library": "duckduckgo",
            "max_results": self.tool.config.get("max_results"),
        }
