import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { HabitCard } from '@/components/habits/HabitCard';
import { CreateHabitDialog } from '@/components/habits/CreateHabitDialog';
import { useHabits } from '@/hooks/useHabits';
import { habitAPI } from '@/lib/habitApi';

export function HabitDashboardPage() {
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [marking, setMarking] = useState<string | null>(null);

  const { habits, loading, error, fetchHabits, markComplete } = useHabits();

  useEffect(() => {
    fetchHabits(false); // Load active habits
  }, []);

  const handleCreateHabit = async (habitData: any) => {
    setCreating(true);
    try {
      await habitAPI.createHabit(habitData);
      await fetchHabits(false);
      setDialogOpen(false);
    } catch (error) {
      console.error('Error creating habit:', error);
    } finally {
      setCreating(false);
    }
  };

  const handleMarkHabit = async (habitId: string) => {
    setMarking(habitId);
    try {
      await markComplete(habitId);
      await fetchHabits(false); // Refresh to get updated summary
    } catch (error) {
      console.error('Error marking habit:', error);
    } finally {
      setMarking(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900 p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
                Daily Habits
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Build streaks and track your progress
              </p>
            </div>
            <Button
              onClick={() => setDialogOpen(true)}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              New Habit
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
        {!loading && habits.length === 0 && (
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
              No habits yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Create your first habit to start building a better routine
            </p>
            <Button onClick={() => setDialogOpen(true)}>
              Create Your First Habit
            </Button>
          </div>
        )}

        {/* Habits Grid */}
        {!loading && habits.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {habits.map((habit) => (
              <HabitCard
                key={habit._id}
                habit={habit}
                summary={habit.summary}
                onMark={() => handleMarkHabit(habit._id)}
                onMarkLoading={marking === habit._id}
                onClick={() => navigate(`/habits/${habit._id}`)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create Dialog */}
      <CreateHabitDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleCreateHabit}
        loading={creating}
      />
    </div>
  );
}
