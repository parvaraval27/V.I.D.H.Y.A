import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { taskAPI, Task } from '@/lib/taskApi';
import { Trash2, RotateCw } from 'lucide-react';

interface ArchivedTasksDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRestore?: () => void; // callback after restore or delete to refresh parent
}

export default function ArchivedTasksDialog({ open, onOpenChange, onRestore }: ArchivedTasksDialogProps) {
  const [archived, setArchived] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false);
  const [deletingAll, setDeletingAll] = useState(false);

  const fetchArchived = async () => {
    setLoading(true);
    try {
      const tasks = await taskAPI.getAllTasks({ archive: true });
      setArchived(tasks || []);
    } catch (err) {
      console.error('Error fetching archived tasks', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchArchived();
      setConfirmDeleteAll(false);
    }
  }, [open]);

  const handleRestore = async (id: string) => {
    try {
      await taskAPI.restoreTask(id);
      await fetchArchived();
      onRestore && onRestore();
    } catch (err) {
      console.error('Error restoring task', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Permanently delete this task? This cannot be undone.')) return;
    try {
      await taskAPI.deleteTask(id, { permanent: true });
      await fetchArchived();
      onRestore && onRestore();
    } catch (err) {
      console.error('Error deleting task', err);
    }
  };

  const handleDeleteAll = async () => {
    if (!confirmDeleteAll) {
      setConfirmDeleteAll(true);
      return;
    }
    setDeletingAll(true);
    try {
      await Promise.all(archived.map(t => taskAPI.deleteTask(t._id, { permanent: true })));
      await fetchArchived();
      onRestore && onRestore();
      setConfirmDeleteAll(false);
    } catch (err) {
      console.error('Error deleting all tasks', err);
    } finally {
      setDeletingAll(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl notebook-modal notebook-paper font-hand">
        <DialogHeader>
          <DialogTitle className="font-hand">Archived Tasks</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 max-h-96 overflow-auto">
          {loading ? (
            <p className="text-center text-gray-500">Loading...</p>
          ) : archived.length === 0 ? (
            <p className="text-center text-gray-500">No archived tasks</p>
          ) : (
            archived.map((t) => (
              <div key={t._id} className="p-3 border rounded flex items-start justify-between">
                <div>
                  <div className="font-semibold">{t.title}</div>
                  {t.description && <div className="text-sm text-gray-600 mt-1">{t.description}</div>}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleRestore(t._id)}>
                    <RotateCw className="w-4 h-4 mr-1" /> Restore
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handleDelete(t._id)}>
                    <Trash2 className="w-4 h-4 mr-1" /> Delete
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        <DialogFooter className="flex items-center gap-2 sm:justify-between">
          <div className="flex items-center gap-2">
            {archived.length > 0 && (
              confirmDeleteAll ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-red-600">Delete {archived.length} tasks?</span>
                  <Button 
                    size="sm" 
                    variant="destructive" 
                    onClick={handleDeleteAll}
                    disabled={deletingAll}
                  >
                    {deletingAll ? 'Deleting...' : 'Yes, Delete All'}
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => setConfirmDeleteAll(false)}
                    disabled={deletingAll}
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <Button 
                  size="sm" 
                  variant="destructive" 
                  onClick={handleDeleteAll}
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Delete All
                </Button>
              )
            )}
          </div>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}