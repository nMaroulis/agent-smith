from services.tools.base import BaseAPICallTool
from schemas.tools import ToolCreate


class APICallTool(BaseAPICallTool):
    def __init__(self, tool: ToolCreate):
        super().__init__(tool)
    
    def to_code(self) -> str:
        return self.render_template("tools/api_call/api_call.jinja",
            name=self.tool.name.lower().replace(" ", "_"),
            base_url=self.tool.config.get("base_url", ""),
            endpoint=self.tool.config.get("endpoint", ""),
            headers=self.tool.config.get("headers", {}),
            request_body=self.tool.config.get("request_body", {}),
            auth_type=self.tool.config.get("auth_type", ""),
            auth_token=self.tool.config.get("auth_token", ""),
            http_method=self.tool.config.get("http_method", "GET"),
            query_params=self.tool.config.get("query_params", {}),
        )


    def to_node(self) -> dict:
        return {
            "name": self.tool.name,
            "type": "api_call",
            "base_url": self.tool.config.get("base_url", ""),
            "endpoint": self.tool.config.get("endpoint", ""),
            "headers": self.tool.config.get("headers", {}),
            "request_body": self.tool.config.get("request_body", {}),
            "auth_type": self.tool.config.get("auth_type", ""),
            "auth_token": self.tool.config.get("auth_token", ""),
            "http_method": self.tool.config.get("http_method", "GET"),
            "query_params": self.tool.config.get("query_params", {}),
        }

