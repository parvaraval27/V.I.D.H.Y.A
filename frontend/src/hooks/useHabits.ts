import { useState, useCallback } from 'react';
import { habitAPI, Habit, HabitSummary } from '@/lib/habitApi';

export const useHabits = () => {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHabits = useCallback(async (archive = false) => {
    setLoading(true);
    setError(null);
    try {
      const data = await habitAPI.getAllHabits(archive);
      setHabits(data);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to fetch habits');
    } finally {
      setLoading(false);
    }
  }, []);

  const createHabit = useCallback(async (habit: Partial<Habit>) => {
    try {
      const newHabit = await habitAPI.createHabit(habit);
      setHabits([newHabit, ...habits]);
      return newHabit;
    } catch (err: any) {
      throw new Error(err?.response?.data?.message || 'Failed to create habit');
    }
  }, [habits]);

  const updateHabit = useCallback(async (id: string, updates: Partial<Habit>) => {
    try {
      const updated = await habitAPI.updateHabit(id, updates);
      setHabits(habits.map(h => h._id === id ? updated : h));
      return updated;
    } catch (err: any) {
      throw new Error(err?.response?.data?.message || 'Failed to update habit');
    }
  }, [habits]);

  const deleteHabit = useCallback(async (id: string) => {
    try {
      await habitAPI.deleteHabit(id);
      setHabits(habits.filter(h => h._id !== id));
    } catch (err: any) {
      throw new Error(err?.response?.data?.message || 'Failed to delete habit');
    }
  }, [habits]);

  const markComplete = useCallback(async (id: string, date?: string) => {
    try {
      const result = await habitAPI.markComplete(id, date);
      return result;
    } catch (err: any) {
      throw new Error(err?.response?.data?.message || 'Failed to mark habit');
    }
  }, []);

  const unmarkComplete = useCallback(async (id: string, date?: string) => {
    try {
      const result = await habitAPI.unmarkComplete(id, date);
      return result;
    } catch (err: any) {
      throw new Error(err?.response?.data?.message || 'Failed to unmark habit');
    }
  }, []);

  return {
    habits,
    loading,
    error,
    fetchHabits,
    createHabit,
    updateHabit,
    deleteHabit,
    markComplete,
    unmarkComplete
  };
};

export const useHabitDetail = (habitId: string) => {
  const [summary, setSummary] = useState<HabitSummary | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await habitAPI.getSummary(habitId);
      setSummary(data);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to fetch summary');
    } finally {
      setLoading(false);
    }
  }, [habitId]);

  const fetchHistory = useCallback(async (from?: string, to?: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await habitAPI.getHistory(habitId, from, to);
      setHistory(data);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to fetch history');
    } finally {
      setLoading(false);
    }
  }, [habitId]);

  return {
    summary,
    history,
    loading,
    error,
    fetchSummary,
    fetchHistory
  };
};
