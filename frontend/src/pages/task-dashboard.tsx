import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TaskCard } from '@/components/tasks/TaskCard';
import { CreateTaskDialog } from '@/components/tasks/CreateTaskDialog';
import { useTasks } from '@/hooks/useTasks';
import NotebookLayout from '@/components/notebook/NotebookLayout';
import { taskAPI } from '@/lib/taskApi';

export function TaskDashboardPage() {
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [marking, setMarking] = useState<string | null>(null);

  const { tasks, loading, error, fetchTasks, markComplete } = useTasks();

  useEffect(() => {
    fetchTasks(false); // Load active tasks
  }, []);

  const handleCreateTask = async (taskData: any) => {
    setCreating(true);
    try {
      await taskAPI.createTask(taskData);
      await fetchTasks(false);
      setDialogOpen(false);
    } catch (error) {
      console.error('Error creating task:', error);
    } finally {
      setCreating(false);
    }
  };

  const handleMarkTask = async (taskId: string) => {
    setMarking(taskId);
    try {
      await markComplete(taskId);
      await fetchTasks(false); // Refresh to get updated summary
    } catch (error) {
      console.error('Error marking task:', error);
    } finally {
      setMarking(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900 p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        <NotebookLayout title="Daily Tasks">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-gray-600 dark:text-gray-400 mt-2">Build streaks and track your progress</p>
            </div>
            <Button
              onClick={() => setDialogOpen(true)}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              New Task
            </Button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        )}

        {/* Empty State */}
        {!loading && tasks.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 dark:text-gray-600 mb-4">
              <svg
                className="w-16 h-16 mx-auto mb-4 opacity-50"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No tasks yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Create your first task to start building a better routine
            </p>
            <Button onClick={() => setDialogOpen(true)}>
              Create Your First Task
            </Button>
          </div>
        )}

        {/* Tasks Grid */}
        {!loading && tasks.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tasks.map((task) => (
              <TaskCard
                key={task._id}
                task={task}
                summary={task.summary}
                onMark={() => handleMarkTask(task._id)}
                onMarkLoading={marking === task._id}
                onClick={() => navigate(`/tasks/${task._id}`)}
              />
            ))}
          </div>
        )}
        </NotebookLayout>
      </div>

      {/* Create Dialog */}
      <CreateTaskDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleCreateTask}
        loading={creating}
      />
    </div>
  );
}
