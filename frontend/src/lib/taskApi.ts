import { api } from './api';

export interface Task {
  _id: string;
  userId: string;
  title: string;
  description?: string;
  tags: string[];
  startDate: string;
  schedule: {
    kind: 'daily' | 'once' | 'monthly' | 'weekly';
    interval?: number;
    daysOfWeek?: number[];
    dayOfMonth?: number;
    time?: string;
  };

  target: number;
  difficulty: 'easy' | 'medium' | 'hard';
  // removed visibility; added priority and labelColor
  priority: 'low' | 'medium' | 'high';
  labelColor?: string;
  lastCompletedDate?: string;
  position?: { x: number; y: number };
  zIndex?: number;
  width?: number;
  height?: number;
  archive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TaskWithSummary extends Task {
  summary: TaskSummary | null;
}

export interface TaskSummary {
  _id: string;
  taskId: string;
  userId: string;
  currentStreak: number;
  maxStreak: number;
  completionRate: number;
  lastCompletedAt?: string;
  longestGapDays: number;
  totalCompletions: number;
  weeklyScore?: number;
  productivityIndex?: number;
}

export interface TaskLog {
  _id: string;
  taskId: string;
  userId: string;
  date: string;
  count: number;
  createdAt: string;
}

// Task API calls
export const taskAPI = {
  // List all tasks (supports filters: archive, tags (comma separated string), priority, status, sort)
  getAllTasks: async (options: { archive?: boolean; tags?: string; priority?: string; status?: string; sort?: string; q?: string; completed?: boolean } = {}) => {
    const tzOffset = -new Date().getTimezoneOffset();
    const params = { ...options, tz: tzOffset };
    const { data } = await api.get('/tasks', {
      params,
    });
    return data;
  },

  // Create new task
  createTask: async (task: Partial<Task>) => {
    const { data } = await api.post('/tasks', task);
    return data;
  },

  // Update task
  updateTask: async (id: string, updates: Partial<Task>) => {
    const { data } = await api.put(`/tasks/${id}`, updates);
    return data;
  },

  // Delete (archive) task. Pass { permanent: true } to permanently delete
  deleteTask: async (id: string, options?: { permanent?: boolean }) => {
    const params: any = {};
    if (options?.permanent) params.permanent = true;
    const { data } = await api.delete(`/tasks/${id}`, { params });
    return data;
  },

  // Mark task as complete
  markComplete: async (id: string, date?: string, count?: number) => {
    const tzOffset = -new Date().getTimezoneOffset();
    const { data } = await api.post(`/tasks/${id}/mark`, {
      date: date || new Date().toISOString(),
      count: count || 1,
      timezoneOffset: tzOffset
    });
    return data;
  },

  // Unmark task
  unmarkComplete: async (id: string, date?: string) => {
    const tzOffset = -new Date().getTimezoneOffset();
    const { data } = await api.post(`/tasks/${id}/unmark`, {
      date: date || new Date().toISOString(),
      timezoneOffset: tzOffset
    });
    return data;
  },

  // Get task history
  getHistory: async (id: string, from?: string, to?: string) => {
    const { data } = await api.get(`/tasks/${id}/history`, {
      params: { from, to },
    });
    return data;
  },

  // Get task summary
  getSummary: async (id: string) => {
    const { data } = await api.get(`/tasks/${id}/summary`);
    return data;
  },

  // Get dashboard data
  getDashboard: async (range = 30) => {
    const { data } = await api.get('/tasks/dashboard', {
      params: { range },
    });
    return data;
  },

  // Bulk mark/unmark
  bulkMark: async (ids: string[], date?: string) => {
    const { data } = await api.post('/tasks/bulk/mark', { ids, date });
    return data;
  },

  bulkUnmark: async (ids: string[], date?: string) => {
    const { data } = await api.post('/tasks/bulk/unmark', { ids, date });
    return data;
  },

  // Restore archived task
  restoreTask: async (id: string) => {
    const { data } = await api.post(`/tasks/${id}/restore`);
    return data;
  },

  // Position updates for sticky board
  updatePosition: async (id: string, payload: { position?: { x: number; y: number }; zIndex?: number; width?: number; height?: number }) => {
    const { data } = await api.patch(`/tasks/${id}/position`, payload);
    return data;
  },

  bulkUpdatePositions: async (positions: Array<{ id: string; position?: { x: number; y: number }; zIndex?: number; width?: number; height?: number }>) => {
    const { data } = await api.post('/tasks/positions/bulk', { positions });
    return data;
  },

  // Get global statistics
  getStatistics: async () => {
    const { data } = await api.get('/tasks/statistics');
    return data;
  },
};
