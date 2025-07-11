import type { NodeType } from '../store/useFlowStore';

export interface CustomNode {
  id: string;
  type: NodeType;
  data: {
    type: NodeType;
    label: string;
    description?: string;
    llm?: {
      provider: string;
      model: string;
      providerName: string;
      modelName: string;
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
