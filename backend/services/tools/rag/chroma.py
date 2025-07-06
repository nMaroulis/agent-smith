from services.tools.base import BaseRAGTool
from schemas.tools import ToolCreate


class ChromaRAGTool(BaseRAGTool):

    def __init__(self, tool: ToolCreate):
        super().__init__(tool)


    def to_code(self) -> str:
        return self.render_template("tools/rag/chroma.jinja",
            name=self.tool.name.lower().replace(" ", "_"),
            vector_store_path=self.tool.config.get("vector_store_path"),
            vector_store_url=self.tool.config.get("vector_store_url"),
            index_name=self.tool.config.get("index_name", "default"),
            top_k=self.tool.config.get("retriever_top_k", 3),
            similarity_threshold=self.tool.config.get("similarity_threshold"),
            llm_followup_prompt=self.tool.config.get(
                "llm_followup_prompt",
                "Answer the following question using the context: {context}\nQuestion: {question}"
            )
        )


    def to_node(self) -> dict:
        return {
            "name": self.tool.name,
            "type": "rag",
            "library": "chromadb",
            "vector_store_path": self.tool.config.get("vector_store_path"),
            "index_name": self.tool.config.get("index_name"),
            "top_k": self.tool.config.get("retriever_top_k", 3),
            "similarity_threshold": self.tool.config.get("similarity_threshold"),
            "llm_followup_prompt": self.tool.config.get("llm_followup_prompt"),
        }
