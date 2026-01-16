import { useState } from 'react';
import { Task } from '@/lib/taskApi';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

interface CreateTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (task: Partial<Task>) => Promise<any>;
  loading?: boolean;
}

const scheduleOptions = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekdays', label: 'Weekdays (Mon-Fri)' },
  { value: 'every_n_days', label: 'Every N Days' },
  { value: 'monthly', label: 'Monthly' },
];

const difficultyOptions = [
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' },
];

const visibilityOptions = [
  { value: 'private', label: 'Private' },
  { value: 'friends', label: 'Friends Only' },
  { value: 'public', label: 'Public' },
];

export function CreateTaskDialog({
  open,
  onOpenChange,
  onSubmit,
  loading,
}: CreateTaskDialogProps) {
  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    tags: string[];
    schedule: { kind: 'daily' | 'weekdays' | 'every_n_days' | 'monthly' | 'custom' };
    difficulty: 'easy' | 'medium' | 'hard';
    visibility: 'private' | 'friends' | 'public';
    target: number;
    reminder: { enabled: boolean; channels: string[] };
  }>({
    title: '',
    description: '',
    tags: [] as string[],
    schedule: { kind: 'daily' },
    difficulty: 'medium',
    visibility: 'private',
    target: 1,
    reminder: { enabled: false, channels: ['in-app'] },
  });

  const [tagInput, setTagInput] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await onSubmit(formData);
      setFormData({
        title: '',
        description: '',
        tags: [],
        schedule: { kind: 'daily' },
        difficulty: 'medium',
        visibility: 'private',
        target: 1,
        reminder: { enabled: false, channels: ['in-app'] },
      });
      setTagInput('');
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tagInput.trim()],
      });
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(t => t !== tag),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md notebook-modal notebook-paper font-hand">
        <DialogHeader>
          <DialogTitle className="font-hand text-xl">Create New Task</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <Label htmlFor="title">Task Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              placeholder="e.g., Morning Revision"
              required
            />
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Why is this task important?"
              rows={2}
            />
          </div>

          {/* Tags */}
          <div>
            <Label htmlFor="tags">Tags</Label>
            <div className="flex gap-2 mb-2">
              <Input
                id="tags"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addTag();
                  }
                }}
                placeholder="Add tag and press Enter"
              />
              <Button type="button" variant="outline" onClick={addTag}>
                Add
              </Button>
            </div>
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {formData.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded text-sm"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="font-bold cursor-pointer"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Schedule */}
          <div>
            <Label htmlFor="schedule">Schedule</Label>
            <Select
              value={formData.schedule.kind}
              onValueChange={(value: 'daily' | 'weekdays' | 'every_n_days' | 'monthly' | 'custom') =>
                setFormData({
                  ...formData,
                  schedule: { kind: value },
                })
              }
            >
              <SelectTrigger id="schedule">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {scheduleOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Difficulty */}
          <div>
            <Label htmlFor="difficulty">Difficulty</Label>
            <Select
              value={formData.difficulty}
              onValueChange={(value: 'easy' | 'medium' | 'hard') =>
                setFormData({ ...formData, difficulty: value })
              }
            >
              <SelectTrigger id="difficulty">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {difficultyOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Visibility */}
          <div>
            <Label htmlFor="visibility">Visibility</Label>
            <Select
              value={formData.visibility}
              onValueChange={(value: 'private' | 'friends' | 'public') =>
                setFormData({ ...formData, visibility: value })
              }
            >
              <SelectTrigger id="visibility">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {visibilityOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Target */}
          <div>
            <Label htmlFor="target">Daily Target (times)</Label>
            <Input
              id="target"
              type="number"
              min="1"
              value={formData.target}
              onChange={(e) =>
                setFormData({ ...formData, target: parseInt(e.target.value) })
              }
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !formData.title}>
              {loading ? 'Creating...' : 'Create Task'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}