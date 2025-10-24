from jinja2 import Environment, FileSystemLoader, select_autoescape
from schemas.flows import FlowPayload
import os
from db.session import get_db 
from services.llms.factory import get_llm_client_by_alias
from services.tools.factory import get_tool_by_name
from sqlalchemy.orm import Session

import logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


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
        
        # Add file logging
        self.log_file = "/tmp/codegen_debug.log"
        self.log("CodeGenerator initialized")

    def sanitize_label(self, label: str) -> str:
        return label.lower().strip().replace(" ", "_").replace("-", "_")
    
    def log(self, message):
        """Log messages to both console and file"""
        print(message)
        logger.info(message)
        with open(self.log_file, "a") as f:
            f.write(f"{message}\n")
            f.flush()

    def generate(self, flow: FlowPayload) -> str:
        self.log(f"Starting code generation for flow: {flow.name}")
        template = self.env.get_template(self.template_name)

        llms = {}
        tools = {}
        nodes = []
        
        self.log(f"Flow has {len(flow.graph.nodes)} nodes and {len(flow.graph.edges)} edges")

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
                    nodes.append({"function_name": "pass", "code": "pass"})
                else:
                    self.log(f"Processing node: {node.id} of type {node.type} with tool: {node.data.tool.name}")
                    # fetch tool again to get the tool object
                    tool = get_tool_by_name(self.db, node.data.tool.name)
                    # TODO - renaming here and in the frontend, and schema for node config
                    # TODO - fix text output code in plain text mode
                    self.log(f"Got tool object, calling get_agent_fn with parameters:")
                    self.log(f"  agent_label: {node.data.label}")
                    self.log(f"  system_prompt: {node.data.node.get('systemPrompt')}")
                    self.log(f"  user_prompt: {node.data.node.get('userPrompt')}")
                    self.log(f"  tool_name: {tool.sanitize_to_func_name(node.data.tool.name)}")
                    function_code = tool.get_agent_fn(agent_label=node.data.label, agent_description=node.data.description, system_prompt=f"""\"\"\"{node.data.node["systemPrompt"]}\"\"\"""", user_prompt=f"""f\"\"\"{node.data.node["userPrompt"]}\"\"\"""", tool_name=tool.sanitize_to_func_name(node.data.tool.name), agent_input=node.data.node["inputFormat"], agent_output=node.data.node["outputMode"])
                    self.log(f"Generated function code length: {len(function_code)}")
                    
                    func_name = self.sanitize_label(node.data.label) or f"node_{node.id}"
                    self.log(f"Function name: {func_name}")
                    self.log(f"DEBUG: Total nodes so far: {len(nodes)}")
                    node_data = {"function_name": func_name, "code": function_code}
                    self.log(f"DEBUG: Node data keys: {node_data.keys()}")
                    nodes.append(node_data)
        print(f"DEBUG: Total nodes so far: {len(nodes)}")

        # Entry & finish points
        # entry_point = next((n.id for n in flow.graph.nodes if n.type == "start"), "start")
        # finish_point = next((n.id for n in flow.graph.nodes if n.type == "end"), "end")

        # EDGES
        edges = []
        for edge in flow.graph.edges:
            # Find matching node for source
            for node in flow.graph.nodes:
                if node.id == edge.source:  # Match node ID with edge source
                    if node.type not in ["start", "end"]:
                        func_name = self.sanitize_label(node.data.label) or f"node_{node.id}"
                        edge.source = func_name
                    elif node.type == "start":
                        edge.source = 'START'
                    elif node.type == "end":
                        edge.source = 'END'
                    break
            
            # Find matching node for target  
            for node in flow.graph.nodes:
                if node.id == edge.target:  # Match node ID with edge target
                    if node.type not in ["start", "end"]:
                        func_name = self.sanitize_label(node.data.label) or f"node_{node.id}"
                        edge.target = func_name
                    elif node.type == "start":
                        edge.target = 'START'
                    elif node.type == "end":
                        edge.target = 'END'
                    break
            
            edges.append({"source": edge.source, "target": edge.target})

        self.log(f"Rendering template with {len(nodes)} nodes, {len(edges)} edges, {len(llms)} llms, {len(tools)} tools")
        self.log(f"Nodes: {[n['function_name'] for n in nodes]}")
        try:
            result = template.render(
                nodes=nodes,
                edges=edges,
                llms=list(llms.values()),
                tools=list(tools.values()),
            )
            self.log("Template render successful")
            return result
        except Exception as e:
            self.log(f"Template render failed: {e}")
            raise
