from pydantic import BaseModel
from typing import Optional, List, Dict, Any, Literal
from schemas.state import State

# ----- Basic Substructures for parsing -----

class Position(BaseModel):
    x: float
    y: float

class MarkerEnd(BaseModel):
    type: str
    color: str

class LLMConfig(BaseModel):
    alias: Optional[str] = ""
    provider: Optional[str] = ""
    model: Optional[str] = ""
    type: Optional[str] = ""

class ToolConfig(BaseModel):
    id: Optional[int] = None
    name: str
    description: Optional[str] = ""

class NodeData(BaseModel):
    label: str
    description: Optional[str] = ""
    type: str
    tool: Optional[ToolConfig] = None
    node: Optional[Dict[str, Any]] = {}
    llm: Optional[LLMConfig] = None

class GraphNode(BaseModel):
    id: str
    type: str
    position: Position
    data: NodeData
    width: Optional[float]
    height: Optional[float]
    selected: Optional[bool] = False

class GraphEdge(BaseModel):
    id: str
    type: str
    source: str
    target: str
    sourceHandle: Optional[str]
    targetHandle: Optional[str]
    animated: Optional[bool]
    style: Optional[Dict[str, Any]]
    markerEnd: Optional[MarkerEnd]
    selected: Optional[bool] = False

class Graph(BaseModel):
    nodes: List[GraphNode]
    edges: List[GraphEdge]

# ----- Main Flow Parser -----

class FlowPayload(BaseModel):
    name: str
    description: Optional[str] = ""
    graph: Graph
    state: Optional[State] = State()


# ----- CRUD Operations -----

class FlowCreate(BaseModel):
    name: str
    description: Optional[str] = ""
    graph: Graph
    state: Optional[State] = State()


class FlowOut(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    graph: Graph
    state: Optional[State] = State()

    class Config:
        from_attributes = True
