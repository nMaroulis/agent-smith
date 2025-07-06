from ..base import BaseWebSearchTool


class DuckDuckGoWebSearchTool(BaseWebSearchTool):
    def __init__(self, tool: Tool):
        self.tool = tool