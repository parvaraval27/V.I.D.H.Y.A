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
  Trash2
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
      <div className="mx-auto">
        <NotebookLayout title={task.title} beforeTitle={<Button variant="ghost" className="ml-auto" onClick={() => navigate('/tasks')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>} wide>
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {task.description && (
              <p className="font-hand text-lg text-slate-600 leading-relaxed max-w-xl">{task.description}</p>
            )}
            
            <div className="flex gap-2 shrink-0">
              <button 
                onClick={() => setEditOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-amber-100 dark:bg-amber-900/40 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-800 transition-all"
              >
                <Edit className="w-4 h-4" />
                Edit
              </button>
              <button 
                onClick={handleArchive}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-amber-100 dark:bg-amber-900/40 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-800 transition-all"
              >
                <Archive className="w-4 h-4" />
                Archive
              </button>
              <button 
                onClick={async ()=>{
                  if (!confirm('Permanently delete this task? This cannot be undone.')) return;
                  try {
                    await taskAPI.deleteTask(task._id, { permanent: true });
                    navigate('/tasks');
                  } catch (e) {
                    console.error('Permanent delete failed', e);
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-red-100 dark:bg-red-900/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-800 transition-all"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column - Stats & Action */}
          <div className="lg:col-span-1 space-y-4">
            {/* Stats Stack */}
            <div className="bg-amber-50/50 rounded-lg border border-dashed border-amber-300 p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-dashed border-amber-200">
                <div>
                  <p className="font-hand text-sm text-amber-700">Current Streak</p>
                  <p className="font-hand text-2xl text-slate-800">{summary?.currentStreak || 0} <span className="text-base text-slate-500">days</span></p>
                </div>
                <Flame className="w-6 h-6 text-orange-400" />
              </div>
              
              <div className="flex items-center justify-between pb-3 border-b border-dashed border-amber-200">
                <div>
                  <p className="font-hand text-sm text-amber-700">Best Streak</p>
                  <p className="font-hand text-2xl text-slate-800">{summary?.maxStreak || 0} <span className="text-base text-slate-500">days</span></p>
                </div>
                <TrendingUp className="w-6 h-6 text-blue-400" />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-hand text-sm text-amber-700">Completion Rate</p>
                  <p className="font-hand text-2xl text-slate-800">{completionPercentage}%</p>
                </div>
                <Calendar className="w-6 h-6 text-green-400" />
              </div>
            </div>

            {/* Mark Complete */}
            <Button
              size="lg"
              className="w-full font-hand text-lg bg-green-600 hover:bg-green-700 text-white"
              onClick={handleMarkComplete}
            >
              <CheckCircle2 className="w-5 h-5 mr-2" />
              Mark Complete
            </Button>

            {/* Quick Info */}
            <div className="bg-amber-50/50 rounded-lg border border-dashed border-amber-300 p-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="font-hand text-sm text-amber-700">Difficulty</p>
                  <p className="font-hand text-lg text-slate-800 capitalize">{task.difficulty}</p>
                </div>
                <div>
                  <p className="font-hand text-sm text-amber-700">Schedule</p>
                  <p className="font-hand text-lg text-slate-800 capitalize">{task.schedule?.kind.replace('_', ' ')}</p>
                </div>
                <div>
                  <p className="font-hand text-sm text-amber-700">Target</p>
                  <p className="font-hand text-lg text-slate-800">{task.target}x daily</p>
                </div>
                <div>
                  <p className="font-hand text-sm text-amber-700">Priority</p>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: task.labelColor || (task.priority === 'high' ? '#ef4444' : task.priority === 'low' ? '#10b981' : '#3b82f6') }} />
                    <p className="font-hand text-lg text-slate-800 capitalize">{task.priority}</p>
                  </div>
                </div>
              </div>
              
              {task.tags?.length > 0 && (
                <div className="mt-3 pt-3 border-t border-dashed border-amber-300">
                  <div className="flex flex-wrap gap-1.5">
                    {task.tags.map((tag: string) => (
                      <span key={tag} className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded border border-amber-300 font-hand text-sm">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - History */}
          <div className="lg:col-span-2">
            <div className="bg-amber-50/50 rounded-lg border border-dashed border-amber-300 p-5 h-full">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-dashed border-amber-200">
                <h2 className="font-hand text-xl text-amber-800">History</h2>
                <div className="flex gap-1">
                  {[7, 30, 90].map((days) => (
                    <button
                      key={days}
                      onClick={() => setHistoryDays(days)}
                      className={`px-3 py-1 font-hand text-sm rounded-lg border transition-colors ${
                        historyDays === days 
                          ? 'bg-amber-200 border-amber-400 text-amber-900' 
                          : 'border-amber-200 text-amber-700 hover:bg-amber-100'
                      }`}
                    >
                      {days}d
                    </button>
                  ))}
                </div>
              </div>

              {loadingDetail ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-amber-400" />
                </div>
              ) : history.length === 0 ? (
                <div className="text-center py-12 text-amber-600">
                  <Circle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="font-hand">No completions in this period</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {history.map((log) => (
                    <div
                      key={log._id}
                      className="flex items-center justify-between py-2 px-3 rounded-lg bg-white/50 border border-amber-200"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-green-600 font-hand text-xl">✓</span>
                        <span className="font-hand text-slate-700">
                          {new Date(log.date).toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </div>
                      <span className="font-hand text-sm text-amber-700 bg-amber-100 px-2 py-0.5 rounded border border-amber-200">
                        {log.count}×
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Edit Dialog */}
        <CreateTaskDialog open={editOpen} onOpenChange={setEditOpen} onSubmit={handleUpdate} loading={false} initialData={task} mode="edit" />

        {/* Archived dialog */}
        <ArchivedTasksDialog open={archivedOpen} onOpenChange={setArchivedOpen} onRestore={() => { /* nothing else needed here */ }} />

        </NotebookLayout>
      </div>
    </div>
  );
}