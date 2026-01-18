import React from 'react';
import NotebookLayout from '@/components/notebook/NotebookLayout';
import { Button } from '@/components/ui/button';
import { Plus, Filter } from 'lucide-react';

export default function CalendarPage() {
  // This is a frontend-only mock of the calendar UI per your design.
  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-full mx-auto">
        <NotebookLayout title="Calendar" wide>
          <div className="flex gap-6">
            {/* Left sidebar - mini month and categories */}
            <aside className="w-64">
              <div className="bg-white p-4 rounded border shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">August 2023</h3>
                  <div className="flex gap-2">
                    <button className="w-7 h-7 rounded bg-gray-100 flex items-center justify-center">◀</button>
                    <button className="w-7 h-7 rounded bg-gray-100 flex items-center justify-center">▶</button>
                  </div>
                </div>

                {/* Mini calendar grid (static) */}
                <div className="grid grid-cols-7 gap-1 text-xs text-center mb-4">
                  {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
                    <div key={d} className="font-medium text-gray-500">{d}</div>
                  ))}
                  {Array.from({length: 35}).map((_,i) => (
                    <div key={i} className="p-1 rounded hover:bg-gray-100">{(i>=3 && i<34) ? i-2 : ''}</div>
                  ))}
                </div>

                <div className="mt-2">
                  <h4 className="font-semibold mb-2">Scheduled</h4>
                  <div className="text-sm text-gray-600">— no items —</div>
                </div>

                <div className="mt-4 pt-4 border-t">
                  <h4 className="font-semibold mb-2">Categories</h4>
                  <div className="flex flex-col gap-2 text-sm">
                    <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-yellow-400"/> Work</div>
                    <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-indigo-400"/> Education</div>
                    <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-red-400"/> Personal</div>
                  </div>
                </div>
              </div>
            </aside>

            {/* Main calendar area */}
            <main className="flex-1">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-semibold">August 2023</h2>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">Today</Button>
                  <Button variant="outline" size="sm" className="flex items-center gap-2"><Filter className="w-4 h-4"/> Filter</Button>
                  <Button size="sm" className="flex items-center gap-2"><Plus className="w-4 h-4"/> Add Reminder</Button>
                </div>
              </div>

              <div className="bg-white rounded border shadow-sm p-4">
                {/* Month grid header */}
                <div className="grid grid-cols-7 gap-2 text-sm text-gray-500 mb-2">
                  {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
                    <div key={d} className="text-center font-medium">{d}</div>
                  ))}
                </div>

                {/* Month cells (static) */}
                <div className="grid grid-cols-7 gap-3">
                  {Array.from({length: 35}).map((_, idx) => (
                    <div key={idx} className="min-h-[96px] border rounded p-2">
                      <div className="text-xs font-semibold mb-2">{(idx>=3 && idx<34) ? idx-2 : ''}</div>
                      {/* example event */}
                      {idx === 11 && (
                        <div className="bg-yellow-100 rounded p-1 text-xs">07:30am · Weekly Review</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </main>
          </div>
        </NotebookLayout>
      </div>
    </div>
  );
}