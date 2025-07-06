from services.tools.factory import get_tool_generator
from schemas.tool import Tool

def test_chroma_rag_code_generation():
    tool = Tool(
        name="ProductDocsRAG",
        type="rag",
        library="chromadb",
        vector_store_path="./data",
        collection_name="product_docs",
        retriever_top_k=3,
        prompt_template="Answer the question using: {{context}}"
    )

    generator = get_tool_generator(tool)
    code = generator.render_code()

    assert "Chroma(persist_directory=" in code
    assert "retriever = vectorstore.as_retriever" in code
    assert "def ProductDocsRAG" in code
