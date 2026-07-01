export type MemoryType = 'project' | 'checkpoint' | 'note' | 'task' | 'generic';

export interface Memory {
  id: string;
  type: MemoryType;
  scope: string; // conversation_id 或 'global'
  title: string;
  content: string;
  metadata?: Record<string, unknown>;
  createdAt: number;
  updatedAt: number;
}

export interface SearchResult {
  memory: Memory;
  rank: number;
}

export interface MemoryStats {
  total: number;
  byType: Record<MemoryType, number>;
  sizeBytes: number;
}
