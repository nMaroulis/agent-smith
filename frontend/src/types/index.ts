import type { NodeType } from '../store/useFlowStore';

export interface CustomNode {
  id: string;
  type: NodeType;
  data: {
    type: NodeType;
    label: string;
    description?: string;
    node?: {
      inputFormat?: string;  // For input format selection (e.g., 'messages[-1]["content"]')
      outputMode?: 'text' | 'structured';  // For output mode selection
      systemPrompt?: string;  // System prompt for LLM nodes
      userPrompt?: string;    // User prompt template  
    }
    llm?: {
      alias: string;        // Unique identifier for the LLM
      provider: string;     // The provider (e.g., 'openai', 'anthropic')
      model: string;        // The model identifier
      type?: 'api' | 'local';
    };
    tool?: {
      id: string;
      name: string;
      description: string;
    } | null;
  };
  position: {
    x: number;
    y: number;
  };
}
