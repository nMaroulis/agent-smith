from ..base import BaseWebSearchTool
from schemas.tools import ToolCreate

class DuckDuckGoWebSearchTool(BaseWebSearchTool):
    def __init__(self, tool: ToolCreate):
        self.tool = tool