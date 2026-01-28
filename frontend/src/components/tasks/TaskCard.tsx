import { useState, useMemo } from 'react';
import { Task } from '@/lib/taskApi';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Circle, Flame, Target, Pencil, Check } from 'lucide-react';

interface TaskCardProps {
  task: Task;
  summary?: any;
  onMark: (date?: string) => void;
  onMarkLoading?: boolean;
  onClick?: () => void;
}

function isSameDay(d1?: string | Date, d2?: Date) {
  if (!d1) return false;
  const a = new Date(d1);
  return a.getUTCFullYear() === d2.getUTCFullYear() && a.getUTCMonth() === d2.getUTCMonth() && a.getUTCDate() === d2.getUTCDate();
}

export function TaskCard({ task, summary, onMark, onMarkLoading, onClick }: TaskCardProps) {
  const [isMarking, setIsMarking] = useState(false);

  const today = useMemo(() => {
    const d = new Date();
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  }, []);

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
  const nextDue = useMemo(() => {
    try {
      if (!task.schedule || task.schedule.kind !== 'daily') return null;
      const now = new Date();
      const todayMidnight = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
      
      if (!summary?.lastCompletedAt) {
        // Never completed - due today
        return todayMidnight;
      }
      
      const last = new Date(summary.lastCompletedAt);
      const lastMidnight = new Date(Date.UTC(last.getUTCFullYear(), last.getUTCMonth(), last.getUTCDate()));
      const nextFromLast = new Date(lastMidnight);
      nextFromLast.setDate(nextFromLast.getDate() + 1);
      
      // Return the later of (lastCompleted + 1 day) or today
      return nextFromLast > todayMidnight ? nextFromLast : todayMidnight;
    } catch (e) {
      return null;
    }
  }, [task.schedule, summary]);

  const timeRemaining = useMemo(() => {
    if (!nextDue) return null;
    const now = new Date();
    const diff = nextDue.getTime() - now.getTime();
    
    // If past due (negative diff), show "Overdue"
    if (diff < 0) {
      const overdueDays = Math.floor(Math.abs(diff) / (1000 * 60 * 60 * 24));
      if (overdueDays > 0) return `Overdue by ${overdueDays} day${overdueDays > 1 ? 's' : ''}`;
      return 'Due now';
    }
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days > 0) return `${days} day${days > 1 ? 's' : ''}`;
    const hours = Math.ceil(diff / (1000 * 60 * 60));
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''}`;
    return 'Due now';
  }, [nextDue]);

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
          {nextDue && !isOnceTask && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Next due: <span className="font-medium">{timeRemaining}</span>
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
                className={`pencil-checkbox ${doneToday ? 'checked' : ''} ${isMarking || onMarkLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                aria-pressed={doneToday}
              >
                <Pencil className="pencil-icon w-5 h-5 text-gray-700" />
                <Check className="check-icon w-5 h-5 text-green-600" />
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
