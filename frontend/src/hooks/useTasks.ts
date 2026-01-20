import { useState, useCallback } from 'react';
import { taskAPI, Task, TaskSummary, TaskWithSummary } from '@/lib/taskApi';

export const useTasks = () => {
  const [tasks, setTasks] = useState<TaskWithSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = useCallback(async (archive = false) => {
    setLoading(true);
    setError(null);
    try {
      const data = await taskAPI.getAllTasks({ archive });
      setTasks(data);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to fetch tasks');
    } finally {
      setLoading(false);
    }
  }, []);

  const createTask = useCallback(async (task: Partial<Task>) => {
    try {
      const newTask = await taskAPI.createTask(task);
      setTasks([newTask, ...tasks]);
      return newTask;
    } catch (err: any) {
      throw new Error(err?.response?.data?.message || 'Failed to create task');
    }
  }, [tasks]);

  const updateTask = useCallback(async (id: string, updates: Partial<Task>) => {
    try {
      const updated = await taskAPI.updateTask(id, updates);
      setTasks(tasks.map(t => t._id === id ? { ...t, ...updated } : t));
      return updated;
    } catch (err: any) {
      throw new Error(err?.response?.data?.message || 'Failed to update task');
    }
  }, [tasks]);

  const deleteTask = useCallback(async (id: string) => {
    try {
      await taskAPI.deleteTask(id);
      setTasks(tasks.filter(t => t._id !== id));
    } catch (err: any) {
      throw new Error(err?.response?.data?.message || 'Failed to delete task');
    }
  }, [tasks]);

  const markComplete = useCallback(async (id: string, date?: string) => {
    try {
      const result = await taskAPI.markComplete(id, date);
      // update local summary & task if returned
      if (result?.summary) {
        setTasks(prev => prev.map(t => t._id === id ? { ...t, summary: result.summary } : t));
      }
      if (result?.task) {
        setTasks(prev => prev.map(t => t._id === id ? { ...t, ...result.task } : t));
      }
      return result;
    } catch (err: any) {
      throw new Error(err?.response?.data?.message || 'Failed to mark task');
    }
  }, []);

  const unmarkComplete = useCallback(async (id: string, date?: string) => {
    try {
      const result = await taskAPI.unmarkComplete(id, date);
      if (result?.summary) {
        setTasks(prev => prev.map(t => t._id === id ? { ...t, summary: result.summary } : t));
      }
      if (result?.task) {
        setTasks(prev => prev.map(t => t._id === id ? { ...t, ...result.task } : t));
      }
      return result;
    } catch (err: any) {
      throw new Error(err?.response?.data?.message || 'Failed to unmark task');
    }
  }, []);

  const updatePosition = useCallback(async (id: string, payload: { position?: { x: number; y: number }; zIndex?: number; width?: number; height?: number }) => {
    try {
      const data = await taskAPI.updatePosition(id, payload);
      setTasks(prev => prev.map(t => t._id === id ? { ...t, ...data.task } : t));
      return data;
    } catch (err: any) {
      throw new Error(err?.response?.data?.message || 'Failed to update position');
    }
  }, [setTasks]);

  const bulkUpdatePositions = useCallback(async (positions: Array<{ id: string; position?: { x: number; y: number }; zIndex?: number; width?: number; height?: number }>) => {
    try {
      const data = await taskAPI.bulkUpdatePositions(positions);
      // merge results
      if (data?.results) {
        setTasks(prev => prev.map(t => {
          const found = data.results.find((r: any) => r.id === t._id);
          return found ? { ...t, ...found } : t;
        }));
      }
      return data;
    } catch (err: any) {
      throw new Error(err?.response?.data?.message || 'Failed to bulk update positions');
    }
  }, [setTasks]);

  return {
    tasks,
    loading,
    error,
    fetchTasks,
    createTask,
    updateTask,
    deleteTask,
    markComplete,
    unmarkComplete,
    updatePosition,
    bulkUpdatePositions
  };
};

export const useTaskDetail = (taskId: string) => {
  const [summary, setSummary] = useState<TaskSummary | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await taskAPI.getSummary(taskId);
      setSummary(data);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to fetch summary');
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  const fetchHistory = useCallback(async (from?: string, to?: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await taskAPI.getHistory(taskId, from, to);
      setHistory(data);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to fetch history');
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  return {
    summary,
    history,
    loading,
    error,
    fetchSummary,
    fetchHistory
  };
};