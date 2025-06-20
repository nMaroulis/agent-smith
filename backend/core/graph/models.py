from pydantic import BaseModel
from typing import Optional, List
from ..llms.base import BaseLLM


class BaseNode(BaseModel):
    id: str
    type: str
    name: str
    description: Optional[str] = None
    inputs: dict
    outputs: dict
    config: dict
    code: str
    metadata: Optional[dict] = {}
    llm: Optional[BaseLLM] = None


class Edge(BaseModel):
    source: str
    target: str
    source_output: Optional[str] = None
    target_input: Optional[str] = None


class AgentGraph(BaseModel):
    nodes: List[BaseNode]
    edges: List[Edge]
    metadata: Optional[dict] = {}

    def get_ordered_nodes(self) -> List[BaseNode]:
        # TODO: implement topological sort
        ...
