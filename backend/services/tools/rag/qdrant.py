from ..base import BaseRAGTool

class QdrantRAGTool(BaseRAGTool):
    def get_vectorstore_code(self) -> str:
        return (
            f'Qdrant(url="{self.tool.vector_store_url}", '
            f'collection_name="{self.tool.collection_name}")'
        )
