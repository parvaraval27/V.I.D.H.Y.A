import { useState, useMemo } from 'react';
import { Task } from '@/lib/taskApi';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Circle, Flame, Target, Check, CheckSquare } from 'lucide-react';

interface TaskCardProps {
  task: Task;
  summary?: any;
  onMark: (date?: string) => void;
  onMarkLoading?: boolean;
  onClick?: () => void;
}

function isSameDay(d1?: string | Date, d2?: Date) {
  if (!d1 || !d2) return false;
  const a = new Date(d1);
  // Use local timezone for comparison
  return a.getFullYear() === d2.getFullYear() && a.getMonth() === d2.getMonth() && a.getDate() === d2.getDate();
}

export function TaskCard({ task, summary, onMark, onMarkLoading, onClick }: TaskCardProps) {
  const [isMarking, setIsMarking] = useState(false);

  const today = useMemo(() => new Date(), []);

  const doneToday = isSameDay(summary?.lastCompletedAt, today);
  const isCompletedOnce = task.schedule && task.schedule.kind === 'once' && (summary?.totalCompletions || 0) >= 1;

  const handleMark = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMarking(true);
    try {
      await onMark();
    } finally {
      setIsMarking(false);
    }
  };

  const completionPercentage = summary?.completionRate ? Math.round(summary.completionRate * 100) : 0;

  // compute next due date for simple schedules (daily)
  // Simple logic: if completed today, next due is tomorrow. Otherwise, due today.
  const timeRemaining = useMemo(() => {
    if (!task.schedule || task.schedule.kind !== 'daily') return null;
    
    // If completed today, next due is tomorrow
    if (doneToday) {
      return 'Tomorrow';
    }
    
    // Not completed today - due today
    return 'Today';
  }, [task.schedule, doneToday]);

  const borderColor = task.labelColor || (task.priority === 'high' ? '#ef4444' : task.priority === 'low' ? '#10b981' : '#1d4ed8');
  const isOnceTask = task.schedule?.kind === 'once';

  return (
    <Card 
      className={`p-4 hover:shadow-lg transition-shadow cursor-pointer notebook-note relative ${isCompletedOnce ? 'opacity-70 bg-gray-50 dark:bg-gray-800' : ''}`}
      onClick={onClick}
      style={{ borderLeft: `4px solid ${isCompletedOnce ? '#9333ea' : borderColor}` }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className={`font-hand text-2xl leading-tight ${isCompletedOnce ? 'line-through text-gray-500' : ''}`}>{task.title}</h3>
            {/* One-time task badge */}
            {isOnceTask && !isCompletedOnce && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                One-time
              </span>
            )}
            {/* Streak badge */}
            {summary?.currentStreak > 0 && !isOnceTask && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-700">
                <Flame className="w-3 h-3 mr-1 text-orange-500" />
                {summary.currentStreak}
              </span>
            )}
          </div>

          {task.description && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{task.description}</p>
          )}

          {/* Next due / time remaining - only for recurring tasks */}
          {timeRemaining && !isOnceTask && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Next due: <span className={`font-medium ${doneToday ? 'text-green-600' : 'text-amber-600'}`}>{timeRemaining}</span>
            </p>
          )}
        </div>
        <div className="ml-2">
            {isCompletedOnce ? (
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-600 text-white text-sm font-medium">✓ Done</div>
            ) : (
              <button
                onClick={handleMark}
                disabled={isMarking || onMarkLoading}
                className={`w-10 h-10 rounded-lg border-2 flex items-center justify-center transition-all ${isMarking || onMarkLoading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'} ${doneToday ? 'bg-green-100 border-green-500 text-green-600' : 'border-amber-300 bg-amber-50 text-amber-600 hover:bg-amber-100'}`}
                aria-pressed={doneToday}
              >
                {doneToday ? (
                  <Check className="w-6 h-6" strokeWidth={3} />
                ) : (
                  <CheckSquare className="w-5 h-5" />
                )}
              </button>
            )}
          </div>
      </div>

      <div className="space-y-3">
        {/* Streak (detailed) - only for recurring tasks */}
        {summary?.currentStreak > 0 && !isOnceTask && (
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-orange-500" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {summary.currentStreak} day streak
              {summary.maxStreak > summary.currentStreak && 
                ` (Best: ${summary.maxStreak})`
              }
            </span>
          </div>
        )}

        {/* Completion Rate - only for recurring tasks */}
        {!isOnceTask && (
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                Completion Rate
              </span>
              <span className="text-xs font-semibold text-gray-900 dark:text-white">
                {completionPercentage}%
              </span>
            </div>
            <Progress value={completionPercentage} className="h-2" />
          </div>
        )}

        {/* Completed message for one-time tasks */}
        {isOnceTask && isCompletedOnce && (
          <div className="text-sm text-purple-600 dark:text-purple-400 font-medium">
            ✓ Task completed
          </div>
        )}

        {/* Tags */}
        {task.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {task.tags.map(tag => (
              <span
                key={tag}
                className="inline-block px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Difficulty */}
        <div className="text-xs text-gray-500 dark:text-gray-400">
          Difficulty: <span className="font-medium capitalize">{task.difficulty}</span>
        </div>
      </div>
    </Card>
  );
}
