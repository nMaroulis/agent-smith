import { type NodeTypes } from 'reactflow';
import NodeComponent from './NodeComponent';

// Define node types outside the component to prevent recreation
export const nodeTypes = {
  default: NodeComponent,
  node: NodeComponent,
  router: NodeComponent,
  trigger: NodeComponent,
  start: NodeComponent,
  end: NodeComponent,
} as NodeTypes;
