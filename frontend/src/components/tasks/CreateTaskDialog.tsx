import { useState, useEffect } from 'react';
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
import { Flame, Target, Calendar, Tag, Palette, Zap } from 'lucide-react';

interface CreateTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (task: Partial<Task> & { deadline?: string | null; enableStreak?: boolean }) => Promise<any>;
  loading?: boolean;
  initialData?: Partial<Task> & { deadline?: string | null; enableStreak?: boolean };
  mode?: 'create' | 'edit';
}

type ScheduleKind = 'daily' | 'once' | 'monthly' | 'weekly';

const ALLOWED_COLORS = ['#ff7eb9','#ff65a3','#7afcff','#feff9c','#fff740'];

export function CreateTaskDialog({
  open,
  onOpenChange,
  onSubmit,
  loading,
  initialData,
  mode = 'create',
}: CreateTaskDialogProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    tags: [] as string[],
    schedule: { kind: 'daily' as ScheduleKind, interval: 1, daysOfWeek: [] as number[], dayOfMonth: undefined as number | undefined, time: undefined as string | undefined },
    difficulty: 'medium' as 'easy' | 'medium' | 'hard',
    priority: 'medium' as 'low' | 'medium' | 'high',
    labelColor: ALLOWED_COLORS[3],
    target: 1,
    deadline: null as string | null,
    enableStreak: true,
  });

  const [tagInput, setTagInput] = useState('');
  const [weekDays, setWeekDays] = useState<number[]>([]);

  useEffect(() => {
    if (open && initialData) {
      setFormData({
        title: initialData.title || '',
        description: initialData.description || '',
        tags: initialData.tags || [],
        schedule: {
          kind: initialData.schedule?.kind || 'daily',
          interval: initialData.schedule?.interval ?? 1,
          daysOfWeek: initialData.schedule?.daysOfWeek || [],
          dayOfMonth: initialData.schedule?.dayOfMonth,
          time: initialData.schedule?.time,
        },
        difficulty: (initialData.difficulty as any) || 'medium',
        priority: (initialData.priority as any) || 'medium',
        labelColor: initialData.labelColor || ALLOWED_COLORS[3],
        target: initialData.target || 1,
        deadline: initialData.deadline ? new Date(initialData.deadline).toISOString().slice(0,10) : null,
        enableStreak: initialData.enableStreak !== undefined ? initialData.enableStreak : true,
      });
      setWeekDays(initialData.schedule?.daysOfWeek || []);
    } else if (open && !initialData) {
      // Reset form for create mode
      setFormData({
        title: '',
        description: '',
        tags: [],
        schedule: { kind: 'daily', interval: 1, daysOfWeek: [], dayOfMonth: undefined, time: undefined },
        difficulty: 'medium',
        priority: 'medium',
        labelColor: ALLOWED_COLORS[3],
        target: 1,
        deadline: null,
        enableStreak: true,
      });
      setWeekDays([]);
      setTagInput('');
    }
  }, [open, initialData]);

  const toggleWeekDay = (d: number) => setWeekDays(w => w.includes(d) ? w.filter(x => x !== d) : [...w, d]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const schedule = { ...formData.schedule } as any;
      if (schedule.kind === 'weekly') schedule.daysOfWeek = weekDays;
      await onSubmit({ ...formData, schedule, deadline: formData.deadline || null });
      onOpenChange(false);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({ ...formData, tags: [...formData.tags, tagInput.trim()] });
      setTagInput('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl notebook-modal notebook-paper font-hand p-0 overflow-hidden">
        <div className="flex flex-col md:flex-row">
          {/* Left Panel - Main Info */}
          <div className="flex-1 p-6 space-y-4">
            <DialogHeader className="pb-2">
              <DialogTitle className="font-hand text-2xl flex items-center gap-2">
                {mode === 'edit' ? 'Edit Task' : 'New Task'}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} id="task-form" className="space-y-4">
              {/* Title */}
              <div>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="What do you want to accomplish?"
                  className="text-lg font-medium border-0 border-b-2 border-dashed border-amber-300 rounded-none px-0 focus:border-amber-500 bg-transparent"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Add notes... (optional)"
                  rows={2}
                  className="resize-none border-dashed border-amber-200 bg-amber-50/50"
                />
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-amber-600" />
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                    placeholder="Add tags..."
                    className="flex-1 h-8 text-sm border-dashed"
                  />
                  <Button type="button" size="sm" variant="ghost" onClick={addTag} className="h-8">+</Button>
                </div>
                {formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {formData.tags.map((tag) => (
                      <span key={tag} className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-800 rounded text-xs">
                        #{tag}
                        <button type="button" onClick={() => setFormData({ ...formData, tags: formData.tags.filter(t => t !== tag) })} className="font-bold">×</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Schedule - Compact Buttons */}
              <div className="space-y-2">
                <Label className="text-xs text-gray-500 flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> Schedule
                </Label>
                <div className="flex gap-1 flex-wrap">
                  {(['daily', 'once', 'weekly', 'monthly'] as const).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setFormData({ ...formData, schedule: { ...formData.schedule, kind: s } })}
                      className={`px-3 py-1.5 text-xs rounded-full border transition-all ${
                        formData.schedule.kind === s 
                          ? 'bg-amber-500 text-white border-amber-500' 
                          : 'bg-white border-amber-200 hover:border-amber-400'
                      }`}
                    >
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </button>
                  ))}
                </div>

                {formData.schedule.kind === 'weekly' && (
                  <div className="flex gap-1 pt-1">
                    {['S','M','T','W','T','F','S'].map((d, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => toggleWeekDay(idx)}
                        className={`w-7 h-7 text-xs rounded-full border ${
                          weekDays.includes(idx) ? 'bg-amber-500 text-white' : 'bg-white border-amber-200'
                        }`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                )}

                {formData.schedule.kind === 'once' && (
                  <Input 
                    type="date" 
                    value={formData.deadline || ''} 
                    onChange={e => setFormData({...formData, deadline: e.target.value})}
                    className="h-8 text-sm w-auto"
                  />
                )}

                {formData.schedule.kind === 'monthly' && (
                  <Input 
                    type="number" 
                    min={1} max={31} 
                    placeholder="Day of month"
                    value={formData.schedule.dayOfMonth || ''} 
                    onChange={e => setFormData({...formData, schedule: {...formData.schedule, dayOfMonth: Number(e.target.value)}})}
                    className="h-8 text-sm w-24"
                  />
                )}
              </div>
            </form>
          </div>

          {/* Right Panel - Quick Settings */}
          <div className="w-full md:w-48 bg-amber-50/80 p-4 border-t md:border-t-0 md:border-l border-dashed border-amber-200 space-y-4">
            {/* Color Picker */}
            <div className="space-y-2">
              <Label className="text-xs text-gray-500 flex items-center gap-1">
                <Palette className="w-3 h-3" /> Color
              </Label>
              <div className="flex gap-1.5 flex-wrap">
                {ALLOWED_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setFormData({ ...formData, labelColor: c })}
                    className={`w-6 h-6 rounded-full transition-transform ${formData.labelColor === c ? 'ring-2 ring-offset-1 ring-amber-500 scale-110' : 'hover:scale-105'}`}
                    style={{ background: c }}
                  />
                ))}
              </div>
            </div>

            {/* Priority */}
            <div className="space-y-2">
              <Label className="text-xs text-gray-500 flex items-center gap-1">
                <Zap className="w-3 h-3" /> Priority
              </Label>
              <div className="flex gap-1">
                {(['low', 'medium', 'high'] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setFormData({ ...formData, priority: p })}
                    className={`flex-1 px-2 py-1 text-xs rounded border transition-all ${
                      formData.priority === p
                        ? p === 'high' ? 'bg-red-500 text-white border-red-500'
                          : p === 'low' ? 'bg-green-500 text-white border-green-500'
                          : 'bg-amber-500 text-white border-amber-500'
                        : 'bg-white border-gray-200'
                    }`}
                  >
                    {p.charAt(0).toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Difficulty */}
            <div className="space-y-2">
              <Label className="text-xs text-gray-500 flex items-center gap-1">
                <Target className="w-3 h-3" /> Difficulty
              </Label>
              <div className="flex gap-1">
                {(['easy', 'medium', 'hard'] as const).map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setFormData({ ...formData, difficulty: d })}
                    className={`flex-1 px-2 py-1 text-xs rounded border transition-all ${
                      formData.difficulty === d ? 'bg-amber-500 text-white border-amber-500' : 'bg-white border-gray-200'
                    }`}
                  >
                    {d.charAt(0).toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Streak Toggle */}
            <div className="space-y-2">
              <Label className="text-xs text-gray-500 flex items-center gap-1">
                <Flame className="w-3 h-3" /> Streak
              </Label>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, enableStreak: !formData.enableStreak })}
                className={`w-full px-3 py-1.5 text-xs rounded border transition-all flex items-center justify-center gap-1 ${
                  formData.enableStreak ? 'bg-orange-500 text-white border-orange-500' : 'bg-white border-gray-200'
                }`}
              >
                 {formData.enableStreak ? 'On' : 'Off'}
              </button>
            </div>

            {/* Target */}
            <div className="space-y-2">
              <Label className="text-xs text-gray-500">Daily Target</Label>
              <Input
                type="number"
                min="1"
                value={formData.target}
                onChange={(e) => setFormData({ ...formData, target: parseInt(e.target.value) || 1 })}
                className="h-8 text-sm text-center"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <DialogFooter className="px-6 py-3 bg-gray-50 border-t">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="submit" form="task-form" disabled={loading || !formData.title} className="bg-amber-500 hover:bg-amber-600">
            {loading ? '...' : (mode === 'edit' ? 'Save' : 'Create')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}