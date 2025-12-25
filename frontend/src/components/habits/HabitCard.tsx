import { useState } from 'react';
import { Habit } from '@/lib/habitApi';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Circle, Flame, Target } from 'lucide-react';

interface HabitCardProps {
  habit: Habit;
  summary?: any;
  onMark: (date?: string) => void;
  onMarkLoading?: boolean;
  onClick?: () => void;
}

export function HabitCard({ habit, summary, onMark, onMarkLoading, onClick }: HabitCardProps) {
  const [isMarking, setIsMarking] = useState(false);

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

  return (
    <Card 
      className="p-4 hover:shadow-lg transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 dark:text-white">{habit.title}</h3>
          {habit.description && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{habit.description}</p>
          )}
        </div>
        <button
          onClick={handleMark}
          disabled={isMarking || onMarkLoading}
          className={`ml-2 p-2 rounded-full transition-all ${
            isMarking || onMarkLoading
              ? 'opacity-50 cursor-not-allowed'
              : 'hover:bg-green-100 dark:hover:bg-green-900'
          }`}
        >
          {isMarking || onMarkLoading ? (
            <Circle className="w-6 h-6 text-gray-400" />
          ) : (
            <CheckCircle2 className="w-6 h-6 text-green-600 hover:text-green-700" />
          )}
        </button>
      </div>

      <div className="space-y-3">
        {/* Streak */}
        {summary?.currentStreak > 0 && (
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

        {/* Completion Rate */}
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

        {/* Tags */}
        {habit.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {habit.tags.map(tag => (
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
          Difficulty: <span className="font-medium capitalize">{habit.difficulty}</span>
        </div>
      </div>
    </Card>
  );
}
