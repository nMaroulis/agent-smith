from jinja2 import Environment, FileSystemLoader, select_autoescape
from schemas.flows import FlowPayload
import os


class CodeGenerator:
    def __init__(self, template_name: str = "langgraph_main.jinja2"):
        self.template_name = template_name
        templates_path = os.path.abspath(
            os.path.join(os.path.dirname(__file__), "../../templates/flows")
        )
        self.env = Environment(
            loader=FileSystemLoader(templates_path),
            autoescape=select_autoescape()
        )

    def sanitize_label(self, label: str) -> str:
        return label.lower().strip().replace(" ", "_").replace("-", "_")

    def generate(self, flow: FlowPayload) -> str:
        template = self.env.get_template(self.template_name)

        nodes = [
            {
                "id": node.id,
                "function_name": self.sanitize_label(node.data.label or node.type)
            }
            for node in flow.graph.nodes
        ]

        entry_point = next((n.id for n in flow.graph.nodes if n.type == "start"), "start")
        finish_point = next((n.id for n in flow.graph.nodes if n.type == "end"), "end")

        edges = [
            {"source": e.source, "target": e.target}
            for e in flow.graph.edges
        ]

        return template.render(
            nodes=nodes,
            entry_point=entry_point,
            finish_point=finish_point,
            edges=edges
        )
