import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Loader2, AlertCircle, ArrowLeft, Search, LayoutGrid, Archive, MoreVertical, CheckCircle2, ListTodo } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TaskCard } from '@/components/tasks/TaskCard';
import { CreateTaskDialog } from '@/components/tasks/CreateTaskDialog';
import ArchivedTasksDialog from '@/components/tasks/ArchivedTasksDialog';
import { useTasks } from '@/hooks/useTasks';
import NotebookLayout from '@/components/notebook/NotebookLayout';
import { taskAPI } from '@/lib/taskApi';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function TaskDashboardPage() {
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [marking, setMarking] = useState<string | null>(null);

  // Module transition state
  const [showTransition, setShowTransition] = useState(true);
  const [transitionVisible, setTransitionVisible] = useState(false);

  // Search and filter
  // 'search' is the text input (supports #tag syntax)
  const [search, setSearch] = useState('');
  const [showCompleted, setShowCompleted] = useState(false);

  const { tasks, loading, error, fetchTasks, markComplete } = useTasks();

  // Helper to extract search filters - avoids duplicate code
  const getSearchFilters = () => {
    const tags = (search.match(/#\w+/g) || []).map(t => t.replace('#','')).join(',') || undefined;
    const q = search.replace(/#\w+/g, '').trim() || undefined;
    return { archive: false, q, tags, completed: showCompleted || undefined };
  };

  // Module transition effect
  useEffect(() => {
    setTransitionVisible(true);
    const fadeTimer = setTimeout(() => {
      setTransitionVisible(false);
    }, 1000);
    const finishTimer = setTimeout(() => {
      setShowTransition(false);
    }, 1400);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(finishTimer);
    };
  }, []);

  useEffect(() => {
    // debounce search to reduce backend calls
    const handler = setTimeout(() => {
      fetchTasks(getSearchFilters());
    }, 250);

    return () => clearTimeout(handler);
  }, [search, showCompleted, fetchTasks]);

  const handleCreateTask = async (taskData: any) => {
    setCreating(true);
    try {
      await taskAPI.createTask(taskData);
      await fetchTasks(getSearchFilters());
      setDialogOpen(false);
    } catch (error: any) {
      console.error('Error creating task:', error);
      alert(error?.response?.data?.message || 'Failed to create task');
    } finally {
      setCreating(false);
    }
  };

  const handleMarkTask = async (taskId: string) => {
    setMarking(taskId);
    try {
      await markComplete(taskId);
      await fetchTasks(getSearchFilters());
    } catch (error: any) {
      console.error('Error marking task:', error);
      alert(error?.response?.data?.message || 'Failed to mark task');
    } finally {
      setMarking(null);
    }
  };

  const [archivedOpen, setArchivedOpen] = useState(false);

  // Transition screen
  if (showTransition) {
    return (
      <div className={`fixed inset-0 z-50 flex items-center justify-center bg-white transition-all duration-500 ${transitionVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}>
        <div className="text-6xl font-hand text-purple-800 tracking-wide">Module 4</div>
      </div>
    );
  }

  return (
    <NotebookLayout
      title="Daily Tasks"
      wide
      beforeTitle={<Button variant="ghost" className="ml-auto" onClick={() => navigate('/') }>
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back
      </Button>}
    >
      {/* Toolbar - Notebook Style */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          {/* Search Bar - Notebook Themed */}
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-amber-600" />
            </div>
            <input 
              placeholder="Search tasks or #tags..." 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              className="w-full pl-10 pr-4 py-2.5 font-hand text-lg bg-amber-50 dark:bg-amber-950/30 border-2 border-dashed border-amber-300 dark:border-amber-700 rounded-lg focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200 dark:focus:ring-amber-800 placeholder:text-amber-400 dark:placeholder:text-amber-600 transition-all"
            />
          </div>

          {/* Tab-style Active/Done Toggle */}
          <div className="flex items-center bg-amber-100 dark:bg-amber-900/40 rounded-lg p-1 border border-amber-200 dark:border-amber-800">
            <button
              onClick={() => setShowCompleted(false)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                !showCompleted 
                  ? 'bg-white dark:bg-gray-800 text-amber-700 dark:text-amber-300 shadow-sm' 
                  : 'text-amber-600 dark:text-amber-400 hover:text-amber-800'
              }`}
            >
              <ListTodo className="w-4 h-4" />
              Active
            </button>
            <button
              onClick={() => setShowCompleted(true)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                showCompleted 
                  ? 'bg-white dark:bg-gray-800 text-purple-700 dark:text-purple-300 shadow-sm' 
                  : 'text-amber-600 dark:text-amber-400 hover:text-amber-800'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              Done
            </button>
          </div>

          {/* Actions Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-amber-100 dark:bg-amber-900/40 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-800 transition-all">
                <MoreVertical className="w-4 h-4" />
                Actions
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => setDialogOpen(true)} className="cursor-pointer">
                <Plus className="w-4 h-4 mr-2 text-green-600" />
                New Task
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/tasks/board')} className="cursor-pointer">
                <LayoutGrid className="w-4 h-4 mr-2 text-blue-600" />
                Board View
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setArchivedOpen(true)} className="cursor-pointer">
                <Archive className="w-4 h-4 mr-2 text-amber-600" />
                Unarchive
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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

      {/* Create Dialog */}
      <CreateTaskDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleCreateTask}
        loading={creating}
      />

      {/* Archived Dialog */}
      <ArchivedTasksDialog open={archivedOpen} onOpenChange={setArchivedOpen} onRestore={() => fetchTasks({ archive: false })} />
    </NotebookLayout>
  );
}
