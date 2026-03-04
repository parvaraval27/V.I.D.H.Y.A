import { api } from './api';

export interface Message {
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
  metadata?: {
    intent?: string;
    score?: number;
    action?: AssistantAction;
    slots?: Record<string, any>;
  };
}

export interface AssistantAction {
  type: 'navigate' | 'task_created' | 'task_updated' | 'task_deleted' | 'task_restored' | 'task_marked' | 'task_unmarked';
  path?: string;
  taskId?: string;
}

export interface AssistantResponse {
  message: string;
  action?: AssistantAction;
  data?: any;
  intent?: string;
  confidence?: number;
}

export const assistantAPI = {
  sendMessage: async (text: string): Promise<AssistantResponse> => {
    const { data } = await api.post('/assistant/message', { text });
    return data;
  },

  getHistory: async (): Promise<Message[]> => {
    const { data } = await api.get('/assistant/history');
    return data.messages || [];
  },

  resetConversation: async (newSession = false): Promise<void> => {
    await api.post('/assistant/reset', { newSession });
  },

  getSuggestions: async (): Promise<string[]> => {
    const { data } = await api.get('/assistant/suggestions');
    return data.suggestions || [];
  },
};
