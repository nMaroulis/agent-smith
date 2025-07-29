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

        llms = {}
        tools = {}
        nodes = []

        for node in flow.graph.nodes:

            # LLMs
            if node.data.llm is not None and node.data.llm.alias not in llms.keys():
                is_remote = node.data.llm.type == "remote"
                llm = get_llm_client_by_alias(node.data.llm.alias, db=self.db, is_remote=is_remote)
                llms[node.data.llm.alias] = llm.to_code(node.data.llm.model)

            if len(llms) == 0: llms["default"] = "pass"
    
            # Tools
            if node.data.tool is not None and node.data.tool.name not in tools.keys():
                # fetch tool and get code
                tool = get_tool_by_name(self.db, node.data.tool.name)
                tools[node.data.tool.name] = tool.to_code()
            if len(tools) == 0: tools["default"] = "pass"

            # Agent Node functions and code
            if node.type not in ["start", "end"]:
                if node.data.tool is None:
                    nodes.append("pass")
                else:
                    # TODO - renaming here and in the frontend, and schema for node config
                    # TODO - fix text output code in plain text mode
                    nodes.append(tool.get_agent_fn(agent_label=node.data.label, agent_description=node.data.description, system_prompt=f"""\"\"\"{node.data.node["systemPrompt"]}\"\"\"""", user_prompt=f"""f\"\"\"{node.data.node["userPrompt"]}\"\"\"""", tool_name=node.data.tool.name, agent_input=node.data.node["inputFormat"], agent_output=node.data.node["outputMode"]))

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
            edges=edges,
            llms=list(llms.values()),
            tools=list(tools.values()),
        )
