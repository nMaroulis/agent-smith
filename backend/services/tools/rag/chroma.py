from services.tools.base import BaseRAGTool
from schemas import Tool


class ChromaRAGTool(BaseRAGTool):

    def __init__(self, tool: Tool):
        super().__init__(tool)

    def to_code(self) -> str:

        return self.render_template("tools/rag/chroma_rag_tool.py.jinja",
            name=self.tool.name,
            vector_store_path=self.tool.config.get("vector_store_path", "./data"),
            collection_name=self.tool.config.get("collection_name", "default"),
            top_k=self.tool.config.get("retriever_top_k", 3),
            similarity_threshold=self.tool.config.get("similarity_threshold"),
            prompt_template=self.tool.config.get(
                "prompt_template",
                "Answer the following question using the context: {{context}}\nQuestion: {{question}}"
            )
        )


    def to_node(self) -> dict:
        return {
            "name": self.tool.name,
            "type": "rag",
            "library": "chromadb",
            "vector_store_path": self.tool.config.get("vector_store_path"),
            "collection_name": self.tool.config.get("collection_name"),
            "top_k": self.tool.config.get("retriever_top_k", 3),
            "similarity_threshold": self.tool.config.get("similarity_threshold"),
            "prompt_template": self.tool.config.get("prompt_template"),
            "llm_model": self.tool.config.get("llm_model", "openai/gpt-3.5-turbo"),
        }
