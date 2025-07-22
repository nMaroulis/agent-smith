import React from 'react';
import { FiHelpCircle } from 'react-icons/fi';
import { Popover } from '@headlessui/react';

interface RAGConfigProps {
  formData: any;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  onGenerateDefaultPrompt: () => void;
  setFormData: (updater: (prev: any) => any) => void;
}

export const RAGConfig: React.FC<RAGConfigProps> = ({
  formData,
  onInputChange,
  onGenerateDefaultPrompt,
  setFormData,
}) => {
  return (
    <div className="space-y-6 bg-gray-700/30 p-4 rounded-lg">
      <h3 className="text-lg font-medium text-white">RAG Configuration</h3>
      
      <div>
        <label htmlFor="rag_type" className="block text-sm font-medium text-gray-300 mb-1">
          RAG Type *
        </label>
        <select
          id="rag_type"
          name="config.rag_type"
          required
          className="mt-1 block w-full border border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-gray-800 text-white"
          value={formData.config?.rag_type || ''}
          onChange={onInputChange}
        >
          <option value="">Select RAG type</option>
          <option value="local">Local</option>
          <option value="remote">Remote</option>
          <option value="hybrid">Hybrid</option>
        </select>
      </div>

      <div>
        <label htmlFor="library" className="block text-sm font-medium text-gray-300 mb-1">
          Vector Store Library *
        </label>
        <select
          id="library"
          name="config.library"
          required
          className="mt-1 block w-full border border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-gray-800 text-white"
          value={formData.config?.library || ''}
          onChange={onInputChange}
        >
          <option value="">Select library</option>
          <option value="ChromaDB">ChromaDB</option>
          <option value="FAISS">FAISS</option>
          <option value="Weaviate">Weaviate</option>
          <option value="Qdrant">Qdrant</option>
          <option value="Milvus">Milvus</option>
          <option value="Custom">Custom</option>
        </select>
      </div>

      {(formData.config?.rag_type === 'local' || formData.config?.rag_type === 'hybrid') && (
        <div>
          <label htmlFor="vector_store_path" className="block text-sm font-medium text-gray-300 mb-1">
            Vector Store Path *
          </label>
          <input
            type="text"
            id="vector_store_path"
            name="config.vector_store_path"
            className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border border-gray-600 rounded-md bg-gray-800 text-white p-2"
            placeholder="./data/vector_store"
            value={formData.config?.vector_store_path || ''}
            onChange={onInputChange}
          />
        </div>
      )}

      {(formData.config?.rag_type === 'remote' || formData.config?.rag_type === 'hybrid') && (
        <div>
          <label htmlFor="vector_store_url" className="block text-sm font-medium text-gray-300 mb-1">
            Vector Store URL *
          </label>
          <input
            type="url"
            id="vector_store_url"
            name="config.vector_store_url"
            className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border border-gray-600 rounded-md bg-gray-800 text-white p-2"
            placeholder="https://example.com/vector-api"
            value={formData.config?.vector_store_url || ''}
            onChange={onInputChange}
          />
        </div>
      )}

      <div className="space-y-4 mt-6">
        <h4 className="text-md font-medium text-gray-300">Retrieval Settings</h4>
        
        <div>
          <label htmlFor="retriever_top_k" className="block text-sm font-medium text-gray-300 mb-1">
            Number of Documents to Retrieve
          </label>
          <input
            type="number"
            id="retriever_top_k"
            name="config.retriever_top_k"
            min="1"
            max="20"
            className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border border-gray-600 rounded-md bg-gray-800 text-white p-2"
            value={formData.config?.retriever_top_k || 3}
            onChange={onInputChange}
          />
        </div>

        <div>
          <label htmlFor="similarity_threshold" className="block text-sm font-medium text-gray-300 mb-1">
            Similarity Threshold (0-1)
          </label>
          <input
            type="number"
            id="similarity_threshold"
            name="config.similarity_threshold"
            min="0"
            max="1"
            step="0.05"
            className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border border-gray-600 rounded-md bg-gray-800 text-white p-2"
            value={formData.config?.similarity_threshold || 0.7}
            onChange={onInputChange}
          />
        </div>

        <div className="flex items-center">
          <input
            id="use_mmr"
            name="config.use_mmr"
            type="checkbox"
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-600 rounded bg-gray-700"
            checked={formData.config?.use_mmr || false}
            onChange={onInputChange}
          />
          <label htmlFor="use_mmr" className="ml-2 block text-sm text-gray-300">
            Use Maximal Marginal Relevance (MMR)
          </label>
        </div>

        <div>
          <label htmlFor="score_function" className="block text-sm font-medium text-gray-300 mb-1">
            Similarity Function
          </label>
          <select
            id="score_function"
            name="config.score_function"
            className="mt-1 block w-full border border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-gray-800 text-white"
            value={formData.config?.score_function || 'cosine'}
            onChange={onInputChange}
          >
            <option value="cosine">Cosine Similarity</option>
            <option value="dot_product">Dot Product</option>
            <option value="euclidean">Euclidean Distance</option>
          </select>
        </div>

        <div>
          <div className="flex items-center mb-1">
            <label htmlFor="index_name" className="block text-sm font-medium text-gray-300">
              Index Name
            </label>
            <Popover className="relative ml-2">
              <Popover.Button className="text-gray-400 hover:text-blue-400 focus:outline-none">
                <FiHelpCircle className="h-4 w-4" />
              </Popover.Button>
              <Popover.Panel className="absolute z-10 w-72 p-3 mt-2 bg-gray-800 border border-gray-600 rounded-md shadow-lg">
                <div className="text-sm text-gray-200">
                  <h4 className="font-medium mb-2">Index Name by Library</h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-xs">
                      <thead>
                        <tr className="border-b border-gray-600">
                          <th className="text-left py-1 pr-2">Library</th>
                          <th className="text-left py-1 px-2">Equivalent</th>
                          <th className="text-left py-1 pl-2">Purpose</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-700">
                        <tr>
                          <td className="py-1 pr-2">ChromaDB</td>
                          <td className="py-1 px-2">collection_name</td>
                          <td className="py-1 pl-2">Logical grouping of documents/vectors</td>
                        </tr>
                        <tr>
                          <td className="py-1 pr-2">FAISS</td>
                          <td className="py-1 px-2">-</td>
                          <td className="py-1 pl-2">No native names (you store/load from path)</td>
                        </tr>
                        <tr>
                          <td className="py-1 pr-2">Weaviate</td>
                          <td className="py-1 px-2">class name</td>
                          <td className="py-1 pl-2">Defines a schema and namespace</td>
                        </tr>
                        <tr>
                          <td className="py-1 pr-2">Qdrant</td>
                          <td className="py-1 px-2">collection_name</td>
                          <td className="py-1 pl-2">The name of a vector collection</td>
                        </tr>
                        <tr>
                          <td className="py-1 pr-2">Milvus</td>
                          <td className="py-1 px-2">collection_name</td>
                          <td className="py-1 pl-2">The container for your indexed vectors</td>
                        </tr>
                        <tr>
                          <td className="py-1 pr-2">Pinecone</td>
                          <td className="py-1 px-2">index_name</td>
                          <td className="py-1 pl-2">Top-level index (also defines namespace)</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </Popover.Panel>
            </Popover>
          </div>
          <input
            type="text"
            id="index_name"
            name="config.index_name"
            className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border border-gray-600 rounded-md bg-gray-800 text-white p-2"
            placeholder="default_index"
            value={formData.config?.index_name || ''}
            onChange={onInputChange}
          />
        </div>

        <div>
          <label htmlFor="filter_metadata" className="block text-sm font-medium text-gray-300 mb-1">
            Filter Metadata (JSON)
          </label>
          <textarea
            id="filter_metadata"
            name="filter_metadata"
            rows={3}
            className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border border-gray-600 rounded-md bg-gray-800 text-white p-2 font-mono text-sm"
            placeholder='{"source": "docs", "lang": "en"}'
            value={formData.config?.filter_metadata ? JSON.stringify(formData.config.filter_metadata, null, 2) : '{}'}
            onChange={(e) => {
              try {
                const parsed = JSON.parse(e.target.value);
                setFormData(prev => ({
                  ...prev,
                  config: {
                    ...prev.config,
                    filter_metadata: parsed
                  }
                }));
              } catch (err) {
                // Invalid JSON, don't update
              }
            }}
          />
        </div>
      </div>

      <div>
        <div className="flex justify-between items-center mb-1">
          <label htmlFor="rag_llm_prompt" className="block text-sm font-medium text-gray-300">
            LLM Follow-up Prompt
          </label>
          <button
            type="button"
            onClick={onGenerateDefaultPrompt}
            className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded"
          >
            Use Default
          </button>
        </div>
        <textarea
          id="rag_llm_prompt"
          name="config.llm_followup_prompt"
          rows={4}
          className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border border-gray-600 rounded-md bg-gray-800 text-white p-2 font-mono text-sm"
          placeholder="Enter a prompt to process the retrieved context with an LLM..."
          value={formData.config?.llm_followup_prompt || ''}
          onChange={onInputChange}
        />
        <p className="mt-1 text-xs text-gray-400">
          This prompt will be used to process the retrieved context with an LLM. Use {'{context}'} to insert the retrieved context and {'{question}'} for the user's query.
        </p>
      </div>
    </div>
  );
};

export default RAGConfig;
