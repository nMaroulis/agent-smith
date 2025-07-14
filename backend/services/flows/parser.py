from schemas.flows import FlowPayload

def parse_flow(flow: FlowPayload):
    print("=== Flow Metadata ===")
    print(f"Name: {flow.name}")
    print(f"Description: {flow.description}")

    print("\n=== Nodes ===")
    for node in flow.graph.nodes:
        print(f"- ID: {node.id}")
        print(f"  Type: {node.type}")
        print(f"  Position: ({node.position.x}, {node.position.y})")
        print(f"  Label: {node.data.label}")
        print(f"  Tool: {node.data.tool}")
        if node.data.llm:
            print("  LLM:")
            print(f"    Alias: {node.data.llm.alias}")
            print(f"    Provider: {node.data.llm.provider}")
            print(f"    Model: {node.data.llm.model}")
            print(f"    Type: {node.data.llm.type}")
        print()

    print("=== Edges ===")
    for edge in flow.graph.edges:
        print(f"- From {edge.source} → {edge.target}")
        print(f"  ID: {edge.id}")
        print(f"  Animated: {edge.animated}")
        print(f"  Style: {edge.style}")
        print()

    print("=== State ===")
    print(flow.state.dict())

    return None
