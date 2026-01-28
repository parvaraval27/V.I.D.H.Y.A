import React, { useEffect, useState, useRef } from 'react';
import { Rnd } from 'react-rnd';
import { taskAPI, Task } from '@/lib/taskApi';
import { useTasks } from '@/hooks/useTasks';
import NotebookLayout from '@/components/notebook/NotebookLayout';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';


export function StickyBoard() {
  
const navigate = useNavigate();
const { tasks, loading, fetchTasks } = useTasks();
  const [localTasks, setLocalTasks] = useState<Task[]>([]);
  const maxZRef = useRef(1);

  useEffect(() => {
    fetchTasks({ archive: false });
  }, [fetchTasks]);

  useEffect(() => {
    setLocalTasks(tasks as Task[]);
    // compute max z
    const max = tasks.reduce((m: number, t: any) => Math.max(m, t.zIndex || 0), 1);
    maxZRef.current = max || 1;
  }, [tasks]);

  const onDragStop = (id: string, x: number, y: number, zIndex?: number): void => {
    // optimistic UI update so move is visible immediately
    setLocalTasks(prev => prev.map(t => t._id === id ? { ...t, position: { x, y } } : t));

    taskAPI.updatePosition(id, { position: { x, y }, zIndex }).catch(err => {
      console.error('Error saving position', err);
      // optionally revert on failure (not doing revert for now)
    });
  };

  const onResizeStop = (id: string, x: number, y: number, width: number, height: number, zIndex?: number): void => {
    // optimistic UI update so resize is visible immediately
    setLocalTasks(prev => prev.map(t => t._id === id ? { ...t, position: { x, y }, width, height } : t));

    taskAPI.updatePosition(id, { position: { x, y }, width, height, zIndex }).catch(err => {
      console.error('Error saving resize', err);
      // optionally revert on failure
    });
  };

  const bringToFront = (id: string): void => {
    maxZRef.current += 1;
    const z = maxZRef.current;
    setLocalTasks(prev => prev.map(t => t._id === id ? { ...t, zIndex: z } : t));
    taskAPI.updatePosition(id, { zIndex: z }).catch(err => {
      console.error('Error saving zIndex', err);
    });
  };

  return (
    <NotebookLayout title="Task Board" beforeTitle={<Button variant="ghost" className="ml-auto" onClick={() => navigate('/tasks') }>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>}>
      <div className="mb-4 flex items-center justify-between">
        <div className="text-gray-600">Drag notes to arrange them. Overlap is allowed.</div>
        <div>
          <Button onClick={() => fetchTasks({ archive: false })}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Refresh
          </Button>
        </div>
      </div>
      
      {/* Loading State */}
      {loading && localTasks.length === 0 && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-yellow-600" />
        </div>
      )}
      
      <div
        className="w-full h-[80vh] bg-gradient-to-br from-yellow-50 to-yellow-100 p-6 rounded overflow-auto relative"
        onDoubleClick={(e) => {
          // Create new task at clicked position (relative to inner canvas)
          const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
          const x = e.clientX - rect.left + (e.currentTarget as HTMLDivElement).scrollLeft;
          const y = e.clientY - rect.top + (e.currentTarget as HTMLDivElement).scrollTop;

          // Quick create a placeholder task; user can edit later from details
          const newTask = {
            title: 'New Task',
            description: '',
            tags: [],
            schedule: { kind: 'daily' },
            target: 1,
            difficulty: 'medium',
            priority: 'medium',
            labelColor: '#feff9c',
            position: { x, y },
            width: 300,
            height: 220
          } as any;

          // Use API directly to create and refresh board
          taskAPI.createTask(newTask).then(() => fetchTasks({ archive: false })).catch(err => console.error('Error creating task at position', err));
        }}
      >
        <div style={{ width: 2000, height: 1600, position: 'relative' }}>
          {localTasks.map(task => (
            <Rnd
              key={task._id}
              size={{ width: task.width || 300, height: task.height || 220 }}
              position={{ x: task.position?.x || 20, y: task.position?.y || 20 }}
              // clicking/dragging anywhere on the note will move it (desktop-like)
              onMouseDown={() => bringToFront(task._id)}
              onDragStart={() => bringToFront(task._id)}
              onDragStop={(e, d) => onDragStop(task._id, d.x, d.y, task.zIndex)}
              onResizeStop={(e, direction, ref, delta, pos) => onResizeStop(task._id, pos.x, pos.y, parseInt(ref.style.width || '300'), parseInt(ref.style.height || '220'), task.zIndex)}
              style={{ zIndex: task.zIndex || 0, boxShadow: '0 6px 14px rgba(0,0,0,0.12)' }}
            >
              <div className="sticky-note font-hand h-full w-full rounded-sm" style={{ background: task.labelColor || '#fff6b0' }}>
                <div className="sticky-overlay absolute inset-0 rounded-sm" />

                <div className="sticky-top relative z-10">
                  <span className="text-xs opacity-70">{task.priority}</span>
                </div>

                <div className="sticky-content relative z-10 flex-1 flex flex-col items-start justify-start text-left">
                  <div className="sticky-title font-hand text-2xl leading-tight px-1">{task.title}</div>
                  <p className="sticky-desc px-1 mt-2 text-sm">{task.description || '— No details —'}</p>
                  <div className="mt-3 px-1 w-full text-xs opacity-70 flex items-center justify-between">
                    <span>{task.difficulty || task.priority}</span>
                    <span className="text-xs opacity-60">{(task.tags || []).slice(0,3).join(', ')}</span>
                  </div>
                </div>
              </div>
            </Rnd>
          ))}
        </div>
      </div>
    </NotebookLayout>
    
  );
}

export default StickyBoard;
