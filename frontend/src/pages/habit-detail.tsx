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
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useHabitDetail } from '@/hooks/useHabits';
import { habitAPI } from '@/lib/habitApi';

export function HabitDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [habit, setHabit] = useState<any>(null);
  const [loadingHabit, setLoadingHabit] = useState(true);
  const [historyDays, setHistoryDays] = useState(30);

  const { summary, history, loading: loadingDetail, error, fetchSummary, fetchHistory } = useHabitDetail(id || '');

  useEffect(() => {
    if (!id) return;

    const fetchHabit = async () => {
      try {
        const habits = await habitAPI.getAllHabits(false);
        const found = habits.find((h: any) => h._id === id);
        setHabit(found || null);
      } catch (err) {
        console.error('Error fetching habit:', err);
      } finally {
        setLoadingHabit(false);
      }
    };

    fetchHabit();
    fetchSummary();
    fetchHistory(
      new Date(Date.now() - historyDays * 24 * 60 * 60 * 1000).toISOString(),
      new Date().toISOString()
    );
  }, [id, historyDays, fetchSummary, fetchHistory]);

  const handleArchive = async () => {
    if (!habit) return;
    try {
      await habitAPI.updateHabit(habit._id, { archive: true });
      navigate('/habits');
    } catch (error) {
      console.error('Error archiving habit:', error);
    }
  };

  const handleMarkComplete = async () => {
    if (!habit) return;
    try {
      await habitAPI.markComplete(habit._id);
      await fetchSummary();
      await fetchHistory(
        new Date(Date.now() - historyDays * 24 * 60 * 60 * 1000).toISOString(),
        new Date().toISOString()
      );
    } catch (error) {
      console.error('Error marking habit:', error);
    }
  };

  if (loadingHabit) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!habit) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <p className="text-gray-600 dark:text-gray-400 mb-4">Habit not found</p>
        <Button onClick={() => navigate('/habits')}>Back to Habits</Button>
      </div>
    );
  }

  const completionPercentage = summary?.completionRate ? Math.round(summary.completionRate * 100) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900 p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            className="mb-4"
            onClick={() => navigate('/habits')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
                {habit.title}
              </h1>
              {habit.description && (
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                  {habit.description}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
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
            Habit Details
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Difficulty</p>
              <p className="font-semibold text-gray-900 dark:text-white capitalize mt-1">
                {habit.difficulty}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Schedule</p>
              <p className="font-semibold text-gray-900 dark:text-white capitalize mt-1">
                {habit.schedule?.kind.replace('_', ' ')}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Daily Target</p>
              <p className="font-semibold text-gray-900 dark:text-white mt-1">
                {habit.target}x
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Visibility</p>
              <p className="font-semibold text-gray-900 dark:text-white capitalize mt-1">
                {habit.visibility}
              </p>
            </div>
          </div>

          {/* Tags */}
          {habit.tags?.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Tags</p>
              <div className="flex flex-wrap gap-1">
                {habit.tags.map((tag: string) => (
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
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded"
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-gray-900 dark:text-white">
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
      </div>
    </div>
  );
}
