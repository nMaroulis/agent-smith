# LangGraph runner from AgentGraph and StateDefinition

from langgraph.graph import StateGraph
from .models import AgentGraph
from .state import StateDefinition

def build_langgraph(agent_graph: AgentGraph, state_def: type) -> StateGraph:
    builder = StateGraph(state_def)
    for node in agent_graph.nodes:
        builder.add_node(node.id, your_node_handler(node))
    for edge in agent_graph.edges:
        builder.add_edge(edge.source, edge.target)
    return builder.compile()

def run_agent_flow(compiled_graph, input_data: dict):
    return compiled_graph.invoke(input_data)
