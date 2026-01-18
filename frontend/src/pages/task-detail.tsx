import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Flame, 
  TrendingUp, 
  Calendar,
  Edit,
  Archive,
  CheckCircle2,
  Circle,
  Loader2,
  Trash2,
  RotateCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useTaskDetail } from '@/hooks/useTasks';
import NotebookLayout from '@/components/notebook/NotebookLayout';
import { taskAPI } from '@/lib/taskApi';
import { CreateTaskDialog } from '@/components/tasks/CreateTaskDialog';
import ArchivedTasksDialog from '@/components/tasks/ArchivedTasksDialog';

export function TaskDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [task, setTask] = useState<any>(null);
  const [loadingTask, setLoadingTask] = useState(true);
  const [historyDays, setHistoryDays] = useState(30);

  const { summary, history, loading: loadingDetail, error, fetchSummary, fetchHistory } = useTaskDetail(id || '');

  useEffect(() => {
    if (!id) return;

    const fetchTask = async () => {
      try {
        const tasks = await taskAPI.getAllTasks({ archive: false });
        const found = tasks.find((t: any) => t._id === id);
        setTask(found || null);
      } catch (err) {
        console.error('Error fetching task:', err);
      } finally {
        setLoadingTask(false);
      }
    };

    fetchTask();
    fetchSummary();
    fetchHistory(
      new Date(Date.now() - historyDays * 24 * 60 * 60 * 1000).toISOString(),
      new Date().toISOString()
    );
  }, [id, historyDays, fetchSummary, fetchHistory]);

  const [editOpen, setEditOpen] = useState(false);
  const [archivedOpen, setArchivedOpen] = useState(false);

  const handleArchive = async () => {
    if (!task) return;
    try {
      await taskAPI.updateTask(task._id, { archive: true });
      navigate('/tasks');
    } catch (error) {
      console.error('Error archiving task:', error);
    }
  };

  const handleDelete = async () => {
    if (!task) return;
    if (!confirm('Delete this task permanently?')) return;
    try {
      await taskAPI.deleteTask(task._id);
      navigate('/tasks');
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const handleUpdate = async (updates: Partial<any>) => {
    if (!task) return;
    try {
      await taskAPI.updateTask(task._id, updates as any);
      // reload the task
      const tasks = await taskAPI.getAllTasks({ archive: false });
      const found = tasks.find((t: any) => t._id === id);
      setTask(found || null);
    } catch (err) {
      console.error('Error updating task', err);
    }
  };

  const handleMarkComplete = async () => {
    if (!task) return;
    try {
      await taskAPI.markComplete(task._id);
      await fetchSummary();
      await fetchHistory(
        new Date(Date.now() - historyDays * 24 * 60 * 60 * 1000).toISOString(),
        new Date().toISOString()
      );
    } catch (error) {
      console.error('Error marking task:', error);
    }
  };

  if (loadingTask) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!task) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <p className="text-gray-600 dark:text-gray-400 mb-4">Task not found</p>
        <Button onClick={() => navigate('/tasks')}>Back to Tasks</Button>
      </div>
    );
  }

  const completionPercentage = summary?.completionRate ? Math.round(summary.completionRate * 100) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900 p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        <NotebookLayout title={task.title}>
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            className="mb-4"
            onClick={() => navigate('/tasks')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          <div className="flex items-start justify-between">
            <div>
              {task.description && (
                <p className="text-gray-600 dark:text-gray-400 mt-2">{task.description}</p>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleArchive}
              >
                <Archive className="w-4 h-4 mr-2" />
                Archive
              </Button>
              <Button variant="destructive" size="sm" onClick={handleDelete}>
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
              
            </div>
          </div>
        </div>

        {/* Main Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Current Streak */}
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Current Streak
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                  {summary?.currentStreak || 0}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  days
                </p>
              </div>
              <Flame className="w-8 h-8 text-orange-500" />
            </div>
          </Card>

          {/* Max Streak */}
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Best Streak
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                  {summary?.maxStreak || 0}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  days
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-500" />
            </div>
          </Card>

          {/* Completion Rate */}
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Completion Rate
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                  {completionPercentage}%
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  overall
                </p>
              </div>
              <Calendar className="w-8 h-8 text-green-500" />
            </div>
          </Card>
        </div>

        {/* Mark Complete Button */}
        <div className="mb-6">
          <Button
            size="lg"
            className="w-full bg-green-600 hover:bg-green-700 text-white"
            onClick={handleMarkComplete}
          >
            <CheckCircle2 className="w-5 h-5 mr-2" />
            Mark Today's Completion
          </Button>
        </div>

        {/* Details Card */}
        <Card className="p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Task Details
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Difficulty</p>
              <p className="font-semibold text-gray-900 dark:text-white capitalize mt-1">
                {task.difficulty}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Schedule</p>
              <p className="font-semibold text-gray-900 dark:text-white capitalize mt-1">
                {task.schedule?.kind.replace('_', ' ')}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Daily Target</p>
              <p className="font-semibold text-gray-900 dark:text-white mt-1">
                {task.target}x
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Priority</p>
              <div className="flex items-center gap-2 mt-1">
                <div className="w-3 h-3 rounded-full" style={{ background: task.labelColor || (task.priority === 'high' ? '#ef4444' : task.priority === 'low' ? '#10b981' : '#1d4ed8') }} />
                <p className="font-semibold text-gray-900 dark:text-white capitalize">
                  {task.priority}
                </p>
              </div>
            </div>
          </div>

          {/* Tags */}
          {task.tags?.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Tags</p>
              <div className="flex flex-wrap gap-1">
                {task.tags.map((tag: string) => (
                  <span
                    key={tag}
                    className="inline-block px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </Card>

        {/* History */}
        <Card className="p-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Recent History
            </h2>
            <div className="flex gap-2 mt-3">
              {[7, 30, 90].map((days) => (
                <Button
                  key={days}
                  variant={historyDays === days ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setHistoryDays(days)}
                >
                  Last {days}d
                </Button>
              ))}
            </div>
          </div>

          {loadingDetail ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            </div>
          ) : history.length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">
              No completions in this period
            </p>
          ) : (
            <div className="space-y-2">
              {history.map((log) => (
                <div
                  key={log._id}
                  className="flex items-center justify-between p-3 notebook-note"
                >
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded bg-green-50 text-green-600">
                      ✓
                    </div>
                    <span className="text-sm text-gray-900 dark:text-white font-hand">
                      {new Date(log.date).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {log.count}x completed
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Edit Dialog */}
        <CreateTaskDialog open={editOpen} onOpenChange={setEditOpen} onSubmit={handleUpdate} loading={false} initialData={task} mode="edit" />

        {/* Archived dialog */}
        <ArchivedTasksDialog open={archivedOpen} onOpenChange={setArchivedOpen} onRestore={() => { /* nothing else needed here */ }} />

        </NotebookLayout>
      </div>
    </div>
  );
}