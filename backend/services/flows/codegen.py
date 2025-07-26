from jinja2 import Environment, FileSystemLoader, select_autoescape
from schemas.flows import FlowPayload
import os
from db.session import get_db 
from services.llms.factory import get_llm_client_by_alias
from services.tools.factory import get_tool_by_name
from sqlalchemy.orm import Session


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
        self.db: Session = next(get_db())

    def sanitize_label(self, label: str) -> str:
        return label.lower().strip().replace(" ", "_").replace("-", "_")

    def generate(self, flow: FlowPayload) -> str:
        template = self.env.get_template(self.template_name)

        llms = []
        tools = []
        nodes = []

        llms_code = ""
        tools_code = ""
        for node in flow.graph.nodes:

            # LLMs
            if node.data.llm is not None and node.data.llm.alias not in llms:
                is_remote = node.data.llm.type == "remote"
                llm = get_llm_client_by_alias(node.data.llm.alias, db=self.db, is_remote=is_remote)
                llms_code += llm.to_code(node.data.llm.model) + "\n"
                llms.append(node.data.llm.alias)
            if len(llms_code) == 0: llms_code += "pass"

            # Tools
            if node.data.tool is not None and node.data.tool.name not in tools:
                # fetch tool and get code
                tool = get_tool_by_name(self.db, node.data.tool.name)
                tools_code += tool.to_code() + "\n"
                tools.append(node.data.tool.name)
            if len(tools_code) == 0: tools_code += "pass"

            # Node functions and code
            if node.type not in ["start", "end"]:
                nodes.append(
                    {
                        "id": node.id,
                        "function_name": self.sanitize_label(node.data.label),
                        "type": node.type
                    }
                )

        # Entry & finish points
        # entry_point = next((n.id for n in flow.graph.nodes if n.type == "start"), "start")
        # finish_point = next((n.id for n in flow.graph.nodes if n.type == "end"), "end")

        # EDGES
        edges = []
        for edge in flow.graph.edges:
            if edge.source.startswith("start"):
                edge.source = 'START'
            elif edge.source.startswith("end"):
                edge.source = 'END'
            else:
                edge.source = f'"{edge.source}"'
            if edge.target.startswith("start"):
                edge.target = 'START'
            elif edge.target.startswith("end"):
                edge.target = 'END'
            else:
                edge.target = f'"{edge.target}"'
            edges.append({"source": edge.source, "target": edge.target})

        return template.render(
            nodes=nodes,
            # entry_point=entry_point,
            # finish_point=finish_point,
            edges=edges,
            llms_code=llms_code,
            tools_code=tools_code,
        )
