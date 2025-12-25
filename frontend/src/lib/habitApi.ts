import { api } from './api';

export interface Habit {
  _id: string;
  userId: string;
  title: string;
  description?: string;
  tags: string[];
  startDate: string;
  schedule: {
    kind: 'daily' | 'weekdays' | 'every_n_days' | 'monthly' | 'custom';
    days?: number[];
    n?: number;
    dayOfMonth?: number;
  };
  reminder: {
    enabled: boolean;
    time?: string;
    channels: string[];
  };
  target: number;
  difficulty: 'easy' | 'medium' | 'hard';
  visibility: 'private' | 'friends' | 'public';
  archive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface HabitSummary {
  _id: string;
  habitId: string;
  userId: string;
  currentStreak: number;
  maxStreak: number;
  completionRate: number;
  lastCompletedAt?: string;
  longestGapDays: number;
  totalCompletions: number;
}

export interface HabitLog {
  _id: string;
  habitId: string;
  userId: string;
  date: string;
  count: number;
  createdAt: string;
}

// Habit API calls
export const habitAPI = {
  // List all habits
  getAllHabits: async (archive = false) => {
    const { data } = await api.get('/habits', {
      params: { archive },
    });
    return data;
  },

  // Create new habit
  createHabit: async (habit: Partial<Habit>) => {
    const { data } = await api.post('/habits', habit);
    return data;
  },

  // Update habit
  updateHabit: async (id: string, updates: Partial<Habit>) => {
    const { data } = await api.put(`/habits/${id}`, updates);
    return data;
  },

  // Delete (archive) habit
  deleteHabit: async (id: string) => {
    const { data } = await api.delete(`/habits/${id}`);
    return data;
  },

  // Mark habit as complete
  markComplete: async (id: string, date?: string, count?: number) => {
    const { data } = await api.post(`/habits/${id}/mark`, {
      date: date || new Date().toISOString(),
      count: count || 1,
    });
    return data;
  },

  // Unmark habit
  unmarkComplete: async (id: string, date?: string) => {
    const { data } = await api.post(`/habits/${id}/unmark`, {
      date: date || new Date().toISOString(),
    });
    return data;
  },

  // Get habit history
  getHistory: async (id: string, from?: string, to?: string) => {
    const { data } = await api.get(`/habits/${id}/history`, {
      params: { from, to },
    });
    return data;
  },

  // Get habit summary
  getSummary: async (id: string) => {
    const { data } = await api.get(`/habits/${id}/summary`);
    return data;
  },

  // Get dashboard data
  getDashboard: async (range = 30) => {
    const { data } = await api.get('/habits/dashboard', {
      params: { range },
    });
    return data;
  },
};
