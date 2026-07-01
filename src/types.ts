export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  /**
   * True while the assistant is actively producing this message
   * (between the first text_delta and the final done/error event).
   * Drives the in-bubble blinking caret to give the user feedback
   * that more content is still streaming. Cleared once done/error fires.
   */
  streaming?: boolean;
  /**
   * ID of the agent that produced this message.
   */
  agentId?: string;
  /**
   * Display name of the agent that produced this message.
   */
  agentName?: string;
  /**
   * Reasoning for why this agent was selected.
   */
  agentReasoning?: string;
}

export interface ToolLampState {
  id: string;
  label: string;
  icon: string;
  active: boolean;
  animKey: number;   // Incremented on each activation to remount and replay animation
}

/**
 * Lightweight summary of a conversation, returned by /conversations.
 * Used to render the left sidebar — does NOT contain full message content.
 */
export interface ConversationSummary {
  id: string;
  title: string;
  preview?: string;
  lastMessageAt?: number;
  createdAt?: number;
  userId?: string;
  messageCount?: number;
}

export interface ListConversationsParams {
  userId: string;
  limit?: number;
  order?: 'asc' | 'desc';
  after?: string;
  before?: string;
}

export interface ListConversationsResponse {
  conversations: ConversationSummary[];
  nextCursor?: string;
  previousCursor?: string;
}

/**
 * Agent definition exposed to the frontend.
 */
export interface AgentDefinition {
  id: string;
  name: string;
  avatar?: string;
  description: string;
  role: 'super' | 'coder' | 'writer' | 'researcher' | 'reviewer' | 'custom';
  systemPrompt: string;
  skillIds: string[];
  isBuiltIn: boolean;
}

/**
 * Skill definition exposed to the frontend.
 */
export interface SkillDefinition {
  id: string;
  name: string;
  description: string;
  version: string;
}
