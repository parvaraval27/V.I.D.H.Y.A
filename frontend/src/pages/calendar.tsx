

import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import NotebookLayout from '@/components/notebook/NotebookLayout';
import { Button } from '@/components/ui/button';
import { Plus, ChevronLeft, ChevronRight, X, Trash2, ArrowLeft } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { getReminderTypes, getReminders, createReminder, createReminderType, deleteReminder, getCodeforcesContests, getLeetCodeContests, getAtCoderContests } from '@/lib/calendarApi';

function startOfMonth(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1, 0, 0, 0, 0));
}
function endOfMonth(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0, 23, 59, 59, 999));
}

function getCalendarGrid(date: Date) {
  // returns array of Date objects covering the 6x7 grid starting from Sunday
  const firstOfMonth = startOfMonth(date);
  const startWeekday = firstOfMonth.getUTCDay(); // 0..6
  const gridStart = new Date(firstOfMonth);
  gridStart.setUTCDate(firstOfMonth.getUTCDate() - startWeekday);

  const days: Date[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(Date.UTC(gridStart.getUTCFullYear(), gridStart.getUTCMonth(), gridStart.getUTCDate() + i));
    days.push(d);
  }
  return days;
}

function formatDateKey(date: Date) {
  // YYYY-MM-DD in UTC
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
}

export default function CalendarPage() {
  const THEME_PURPLE = '#7C3AED';
  const hexToRgba = (hex: string, alpha: number) => {
    let h = String(hex || '#000000').replace('#','');
    if (h.length === 3) h = h.split('').map(c => c + c).join('');
    const r = parseInt(h.substring(0,2),16);
    const g = parseInt(h.substring(2,4),16);
    const b = parseInt(h.substring(4,6),16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };
  const resolveColor = (c?: string) => {
    if (!c) return THEME_PURPLE;
    if (String(c).toLowerCase() === '#10b981') return THEME_PURPLE; // override backend default green to theme purple
    return c;
  };

  const [types, setTypes] = useState<any[]>([]);
  const [enabledTypeIds, setEnabledTypeIds] = useState<Set<string>>(new Set());
  const [occurrences, setOccurrences] = useState<any[]>([]);
  const [currentMonth, setCurrentMonth] = useState<Date>(() => startOfMonth(new Date()));

  // Codeforces feed toggle & cached contests
  const [showCfContests, setShowCfContests] = useState(true);
  const [cfContests, setCfContests] = useState<any[]>([]);
  // LeetCode feed toggle & cached contests (proxied via backend)
  const [showLeetCodeContests, setShowLeetCodeContests] = useState(true);
  const [leetContests, setLeetContests] = useState<any[]>([]);
  // AtCoder feed toggle & cached contests
  const [showAtCoderContests, setShowAtCoderContests] = useState(true);
  const [atCoderContests, setAtCoderContests] = useState<any[]>([]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // active date highlight & popup
  const [activeDay, setActiveDay] = useState<Date | null>(null);
  const [dayPopupOpen, setDayPopupOpen] = useState(false);

  // form state (reminder)
  const [title, setTitle] = useState('');
  const [dateStr, setDateStr] = useState('');
  const [timeStr, setTimeStr] = useState('');
  const [typeId, setTypeId] = useState<string | null>(null);
  const [color, setColor] = useState<string>('#6D28D9');
  const [repeatKind, setRepeatKind] = useState<'single' | 'monthly' | 'yearly'>('single');
  const [interval, setInterval] = useState<number>(1);
  const [until, setUntil] = useState<string>('');

  // type creation dialog
  const [typeDialogOpen, setTypeDialogOpen] = useState(false);
  const [newTypeName, setNewTypeName] = useState('');
  const [newTypeColor, setNewTypeColor] = useState('#6D28D9');

  const createType = async () => {
    if (!newTypeName) {
      alert('Provide a type name');
      return;
    }
    try {
      const res = await createReminderType({ name: newTypeName, color: newTypeColor });
      setTypes(prev => [...prev, res.data]);
      setTypeDialogOpen(false);
      setNewTypeName('');
      setNewTypeColor('#6D28D9');
    } catch (e) {
      alert('Failed to create type');
    }
  };

  const onDateCellClick = (d: Date) => {
    // select/highlight on first click, show popup on second click
    const clickedKey = formatDateKey(d);
    if (!activeDay || formatDateKey(activeDay) !== clickedKey) {
      setActiveDay(d);
      setSelectedDate(d);
      // don't open popup yet
    } else {
      setDayPopupOpen(true);
    }
  };

  const gridDates = useMemo(() => getCalendarGrid(currentMonth), [currentMonth]);

  // Map occurrences by UTC dateKey, filtering by enabled types
  const occMap = useMemo(() => {
    const m: Record<string, any[]> = {};
    occurrences.forEach((o:any) => {
      // Filter: show external feeds always, but filter reminders by enabled type
      const isExternalFeed = o.source === 'codeforces' || o.source === 'leetcode' || o.source === 'atcoder';
      // Check type._id (backend returns type object, not typeId directly)
      const typeId = o.type?._id || o.typeId;
      const hasType = !!typeId;
      const isTypeEnabled = !hasType || enabledTypeIds.has(typeId);
      if (!isExternalFeed && !isTypeEnabled) return;
      
      const d = new Date(o.occurrenceDate);
      const key = formatDateKey(d);
      if (!m[key]) m[key] = [];
      m[key].push(o);
    });
    return m;
  }, [occurrences, enabledTypeIds]);

  useEffect(() => {
    const load = async () => {
      try {
        const t = await getReminderTypes();
        const loadedTypes = t.data.types || [];
        setTypes(loadedTypes);
        // Enable all types by default
        setEnabledTypeIds(new Set(loadedTypes.map((tp: any) => tp._id)));
      } catch (e) {
        // ignore
      }

      // load occurrences visible in current grid range
      const from = gridDates[0];
      const to = gridDates[gridDates.length - 1];
      try {
        const res = await getReminders({ from: from.toISOString(), to: to.toISOString() });
        let occs = res.data.occurrences || [];

        // Optionally fetch Codeforces upcoming contests and merge
        if (showCfContests) {
          try {
            const cf = await getCodeforcesContests();
            if (cf && cf.status === 'OK') {
              const fromTS = Math.floor(from.getTime() / 1000);
              const toTS = Math.floor(to.getTime() / 1000);
              const upcoming = cf.result.filter((c:any) => c.phase === 'BEFORE' && c.startTimeSeconds && c.startTimeSeconds >= fromTS && c.startTimeSeconds <= toTS);
              const mapped = upcoming.map((c:any) => ({
                title: c.name,
                occurrenceDate: new Date(c.startTimeSeconds * 1000).toISOString(),
                color: '#FF5722',
                url: `https://codeforces.com/contest/${c.id}`,
                source: 'codeforces',
                durationSeconds: c.durationSeconds || 0
              }));
              setCfContests(mapped);
              occs = occs.concat(mapped);
            } else {
              setCfContests([]);
            }
          } catch (e) {
            setCfContests([]);
          }
        } else {
          setCfContests([]);
        }

        // Optionally fetch LeetCode upcoming contests from alfa-leetcode-api
        if (showLeetCodeContests) {
          try {
            const lcRes = await getLeetCodeContests();
            // Response: { count, contests: [ { title, titleSlug, startTime, duration, ... } ] }
            if (lcRes && Array.isArray(lcRes.contests)) {
              const fromTS = Math.floor(from.getTime() / 1000);
              const toTS = Math.floor(to.getTime() / 1000);
              const upcoming = lcRes.contests.filter((c:any) => c.startTime && c.startTime >= fromTS && c.startTime <= toTS);
              const mapped = upcoming.map((c:any) => ({
                title: c.title,
                occurrenceDate: new Date(c.startTime * 1000).toISOString(),
                color: '#FFA116', // LeetCode orange
                url: `https://leetcode.com/contest/${c.titleSlug}`,
                source: 'leetcode',
                durationSeconds: c.duration || 0
              }));
              setLeetContests(mapped);
              occs = occs.concat(mapped);
            } else {
              setLeetContests([]);
            }
          } catch (e) {
            setLeetContests([]);
          }
        } else {
          setLeetContests([]);
        }

        // Optionally fetch AtCoder upcoming contests from kontests.net
        if (showAtCoderContests) {
          try {
            const acRes = await getAtCoderContests();
            console.log('AtCoder API response:', acRes);
            // Response: [ { name, url, start_time (ISO), end_time, duration (seconds string), site, status } ]
            if (acRes && Array.isArray(acRes) && acRes.length > 0) {
              const fromTS = Math.floor(from.getTime() / 1000);
              const toTS = Math.floor(to.getTime() / 1000);
              console.log('AtCoder date range:', { from: from.toISOString(), to: to.toISOString(), fromTS, toTS });
              const upcoming = acRes.filter((c:any) => {
                const startTS = Math.floor(new Date(c.start_time).getTime() / 1000);
                console.log('AtCoder contest:', c.name, 'startTS:', startTS, 'in range:', startTS >= fromTS && startTS <= toTS);
                return startTS >= fromTS && startTS <= toTS;
              });
              const mapped = upcoming.map((c:any) => ({
                title: c.name,
                occurrenceDate: new Date(c.start_time).toISOString(),
                color: '#00A0E9', // AtCoder blue
                url: c.url,
                source: 'atcoder',
                durationSeconds: parseInt(c.duration, 10) || 0
              }));
              console.log('AtCoder mapped contests:', mapped);
              setAtCoderContests(mapped);
              occs = occs.concat(mapped);
            } else {
              console.warn('AtCoder API returned empty or invalid data:', acRes);
              setAtCoderContests([]);
            }
          } catch (e) {
            console.error('AtCoder fetch error:', e);
            setAtCoderContests([]);
          }
        } else {
          setAtCoderContests([]);
        }

        setOccurrences(occs);
      } catch (e) {
        setOccurrences([]);
      }
    };
    load();
  }, [currentMonth, showCfContests, showLeetCodeContests, showAtCoderContests, gridDates]);

  const openAddDialog = (date?: Date) => {
    setSelectedDate(date || startOfMonth(new Date()));
    const d = date ? date : new Date();
    setDateStr(`${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,'0')}-${String(d.getUTCDate()).padStart(2,'0')}`);
    setTimeStr('');
    setTitle('');
    setTypeId(null);
    setColor('#6D28D9');
    setRepeatKind('single');
    setInterval(1);
    setUntil('');
    setDialogOpen(true);
  };

  const submitReminder = async () => {
    if (!title || !dateStr) {
      alert('Please provide title and date');
      return;
    }

    let iso = `${dateStr}T00:00:00.000Z`;
    if (timeStr) {
      iso = `${dateStr}T${timeStr}:00.000Z`;
    }

    const repeat:any = { kind: repeatKind, interval };
    if (until) repeat.until = new Date(until).toISOString();

    try {
      await createReminder({ title, occurrenceDate: iso, repeat, typeId: typeId || null, color: color || null });
      setDialogOpen(false);
      // reload occurrences for the month
      const res = await getReminders({ from: gridDates[0].toISOString(), to: gridDates[gridDates.length - 1].toISOString() });
      setOccurrences(res.data.occurrences || []);
    } catch (e: any) {
      console.error('Failed to create reminder:', e);
      if (e.response?.status === 401) {
        alert('Please log in to create reminders');
      } else {
        alert('Failed to create reminder: ' + (e.response?.data?.message || e.message));
      }
    }
  };

  const prevMonth = () => {
    const d = new Date(Date.UTC(currentMonth.getUTCFullYear(), currentMonth.getUTCMonth() - 1, 1));
    setCurrentMonth(d);
  };
  const nextMonth = () => {
    const d = new Date(Date.UTC(currentMonth.getUTCFullYear(), currentMonth.getUTCMonth() + 1, 1));
    setCurrentMonth(d);
  };
  const goToday = () => setCurrentMonth(startOfMonth(new Date()));

  const monthLabel = `${currentMonth.toLocaleString('default', { month: 'long', timeZone: 'UTC' })} ${currentMonth.getUTCFullYear()}`;

  const navigate = useNavigate();

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-full mx-auto">
        <NotebookLayout title="Calendar" wide beforeTitle={
          <Button variant="ghost" className="ml-auto" onClick={() => navigate('/')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        }>
          <div className="flex gap-6">
            {/* Left sidebar (purple themed with notebook style) */}
            <aside className="w-64">
              <div className="p-5 rounded-lg border-2 border-dashed border-purple-300 bg-purple-50/50">
                {/* Date display */}
                <div className="flex items-start justify-between mb-4 pb-4 border-b border-dashed border-purple-200">
                  <div>
                    <div className="font-hand text-6xl text-purple-700">{(selectedDate || new Date()).getUTCDate()}</div>
                    <div className="font-hand text-lg text-purple-600 mt-1">{(selectedDate || new Date()).toLocaleString('default',{weekday:'long', timeZone: 'UTC'})}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-hand text-sm text-purple-500">{(selectedDate || new Date()).toLocaleString('default',{month:'short', timeZone: 'UTC'})} {(selectedDate || new Date()).getUTCFullYear()}</div>
                  </div>
                </div>

                {/* Events This Month */}
                <div className="mb-4">
                  <h4 className="font-hand text-lg text-purple-800 mb-2">Events This Month</h4>
                  <div className="text-sm">
                    {occurrences.length ? (
                      <ul className="space-y-2">
                        {occurrences.slice(0,5).map((o,i)=> {
                          const rc = resolveColor(o.color);
                          return (
                            <li key={i} className="flex items-start gap-2 p-2 rounded-lg bg-white/60 border border-purple-200">
                              <span className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{background: rc}}/>
                              <div className="font-hand text-sm text-slate-700 truncate">{new Date(o.occurrenceDate).toLocaleDateString()} · {o.title}</div>
                            </li>
                          );
                        })}
                      </ul>
                    ) : (
                      <div className="font-hand text-sm text-purple-400 italic">No events this month</div>
                    )}
                  </div>
                </div>

                {/* Create Event Button */}
                <div className="mb-4 pt-3 border-t border-dashed border-purple-200">
                  <button 
                    onClick={() => openAddDialog()} 
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium bg-purple-100 border border-purple-300 text-purple-700 hover:bg-purple-200 transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    <span className="font-hand text-base">Add Reminder</span>
                  </button>
                </div>

                {/* Categories */}
                <div className="pt-3 border-t border-dashed border-purple-200">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-hand text-lg text-purple-800">Categories</h4>
                    <button className="font-hand text-sm text-purple-600 hover:text-purple-800" onClick={()=>setTypeDialogOpen(true)}>+ Add</button>
                  </div>
                  <div className="flex flex-col gap-1.5 text-sm">
                    {types.length ? types.map(t => {
                      const isEnabled = enabledTypeIds.has(t._id);
                      return (
                        <div 
                          key={t._id} 
                          className={`flex items-center gap-2 cursor-pointer select-none p-1.5 rounded-lg transition-colors ${isEnabled ? 'bg-white/60' : 'opacity-50'}`}
                          onClick={() => {
                            setEnabledTypeIds(prev => {
                              const next = new Set(prev);
                              if (next.has(t._id)) next.delete(t._id);
                              else next.add(t._id);
                              return next;
                            });
                          }}
                        >
                          <span className="w-3 h-3 rounded-full" style={{background: resolveColor(t.color)}}/>
                          <span className="font-hand text-slate-700">{t.name}</span>
                        </div>
                      );
                    }) : (
                      <div className="font-hand text-sm text-purple-400 italic">No categories yet</div>
                    )}
                  </div>
                </div>

                {/* External Feeds */}
                <div className="mt-3 pt-3 border-t border-dashed border-purple-200">
                  <h4 className="font-hand text-lg text-purple-800 mb-2">External Feeds</h4>
                  <div className="flex flex-col gap-1.5 text-sm">
                    <div 
                      className={`flex items-center gap-2 cursor-pointer select-none p-1.5 rounded-lg transition-colors ${showCfContests ? 'bg-white/60' : 'opacity-50'}`}
                      onClick={() => setShowCfContests(s => !s)}
                    >
                      <span className="w-3 h-3 rounded-full" style={{background: '#FF5722'}}/> 
                      <span className="font-hand text-slate-700">Codeforces</span>
                    </div>
                    <div 
                      className={`flex items-center gap-2 cursor-pointer select-none p-1.5 rounded-lg transition-colors ${showLeetCodeContests ? 'bg-white/60' : 'opacity-50'}`}
                      onClick={() => setShowLeetCodeContests(s => !s)}
                    >
                      <span className="w-3 h-3 rounded-full" style={{background: '#FFA116'}}/> 
                      <span className="font-hand text-slate-700">LeetCode</span>
                    </div>
                    <div 
                      className={`flex items-center gap-2 cursor-pointer select-none p-1.5 rounded-lg transition-colors ${showAtCoderContests ? 'bg-white/60' : 'opacity-50'}`}
                      onClick={() => setShowAtCoderContests(s => !s)}
                    >
                      <span className="w-3 h-3 rounded-full" style={{background: '#00A0E9'}}/> 
                      <span className="font-hand text-slate-700">AtCoder</span>
                    </div>
                  </div>
                </div>
              </div>
            </aside>

            {/* Main calendar area */}
            <main className="flex-1">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <button onClick={prevMonth} className="w-9 h-9 rounded-lg bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600 hover:bg-purple-100 transition-colors"><ChevronLeft className="w-4 h-4"/></button>
                  <h2 className="font-hand text-2xl text-slate-800">{monthLabel}</h2>
                  <button onClick={nextMonth} className="w-9 h-9 rounded-lg bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600 hover:bg-purple-100 transition-colors"><ChevronRight className="w-4 h-4"/></button>
                </div>

                <div className="flex items-center gap-2">
                  <button onClick={goToday} className="px-4 py-2 rounded-lg text-sm font-medium bg-purple-100 border border-purple-300 text-purple-700 hover:bg-purple-200 transition-all font-hand">Today</button>
                  <button onClick={() => openAddDialog()} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-purple-100 border border-purple-300 text-purple-700 hover:bg-purple-200 transition-all font-hand"><Plus className="w-4 h-4"/> Add Reminder</button>
                </div>
              </div>

              <div className="bg-white/80 rounded-lg border-2 border-dashed border-purple-200 p-4">
                <div className="grid grid-cols-7 gap-2 text-sm text-purple-500 mb-2">
                  {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
                    <div key={d} className="text-center font-hand font-medium">{d}</div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-3">
                  {gridDates.map((d, idx) => {
                    const isCurrentMonth = d.getUTCMonth() === currentMonth.getUTCMonth();
                    const key = formatDateKey(d);
                    const items = occMap[key] || [];
                    const isActive = activeDay && formatDateKey(activeDay) === key;
                    return (
                      <div
                        key={idx}
                        onClick={() => onDateCellClick(d)}
                        className={`min-h-[96px] border border-purple-100 rounded-lg p-2 cursor-pointer transition-colors ${isCurrentMonth ? 'bg-white/60 hover:bg-purple-50/50' : 'bg-gray-50/50 text-gray-400'} ${isActive ? 'ring-2 ring-purple-300 bg-purple-50' : ''}`}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-hand text-sm font-semibold text-slate-600">{d.getUTCDate()}</div>
                          <button onClick={(e)=>{ e.stopPropagation(); openAddDialog(d); }} className="w-7 h-7 rounded-lg bg-purple-50 border border-purple-200 text-purple-600 flex items-center justify-center text-sm hover:bg-purple-100 transition-colors">
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="flex flex-col gap-1">
                          {items.slice(0,3).map((o:any,i:number) => {
                            const rc = resolveColor(o.color);
                            const timeStr = new Date(o.occurrenceDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                            if (o.url) {
                              return (
                                <a key={i} href={o.url} target="_blank" rel="noreferrer" className="rounded-lg p-1.5 text-xs truncate block font-hand" style={{background: hexToRgba(rc, 0.12), color: rc}} title={o.title}>
                                  {o.title} · {timeStr}
                                </a>
                              );
                            }
                            return (
                              <div key={i} className="rounded-lg p-1.5 text-xs truncate font-hand" style={{background: hexToRgba(rc, 0.12), color: rc}} title={o.title}>
                                {o.title} · {timeStr}
                              </div>
                            );
                          })}
                          {items.length > 3 && (<div className="font-hand text-xs text-gray-500">+{items.length - 3} more</div>)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </main>
          </div>
        </NotebookLayout>
      </div>

      {/* Add/Edit Reminder Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="border-2 border-dashed border-purple-200 bg-purple-50/100">
          <DialogHeader>
            <DialogTitle className="font-hand text-xl text-purple-800">Add Reminder</DialogTitle>
          </DialogHeader>

          <div className="grid gap-3">
            <div>
              <label className="font-hand text-sm text-slate-700">Title</label>
              <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Reminder title" className="mt-1 border-purple-200 focus:border-purple-400" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-hand text-sm text-slate-700">Date</label>
                <Input type="date" value={dateStr} onChange={e=>setDateStr(e.target.value)} className="mt-1 border-purple-200 focus:border-purple-400" />
              </div>
              <div>
                <label className="font-hand text-sm text-slate-700">Time</label>
                <Input type="time" value={timeStr} onChange={e=>setTimeStr(e.target.value)} className="mt-1 border-purple-200 focus:border-purple-400" />
              </div>
            </div>

            <div>
              <label className="font-hand text-sm text-slate-700">Type</label>
              <Select value={typeId ?? '__none'} onValueChange={(val:any)=>{
                if (val === '__none') {
                  setTypeId(null);
                } else {
                  setTypeId(val);
                  // Auto-assign the type's color
                  const selectedType = types.find(t => t._id === val);
                  if (selectedType?.color) setColor(selectedType.color);
                }
              }}>
                <SelectTrigger className="w-full mt-1 border-purple-200"><SelectValue placeholder="Select type"/></SelectTrigger>
                <SelectContent>
                  <SelectItem value={'__none'}>None</SelectItem>
                  {types.map(t=> <SelectItem key={t._id} value={t._id}>{t.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {/* Only show color picker when no type is selected */}
              {!typeId ? (
                <div>
                  <label className="font-hand text-sm text-slate-700">Color</label>
                  <div className="flex gap-2 mt-1.5">
                    {['#6D28D9', '#BE185D', '#047857', '#0F766E', '#A16207'].map(c => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setColor(c)}
                        className={`w-6 h-6 rounded-full border-2 transition-all ${color === c ? 'border-purple-600 scale-110' : 'border-transparent'}`}
                        style={{ background: c }}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <div>
                  <label className="font-hand text-sm text-slate-700">Color</label>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="w-6 h-6 rounded-full border-2 border-purple-200" style={{ background: color }} />
                    <span className="font-hand text-xs text-slate-500">From category</span>
                  </div>
                </div>
              )}
              <div>
                <label className="font-hand text-sm text-slate-700">Repeat</label>
                <Select value={repeatKind} onValueChange={(val:any)=>setRepeatKind(val)}>
                  <SelectTrigger className="w-full mt-1 border-purple-200"><SelectValue placeholder="single"/></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={'single'}>Single</SelectItem>
                    <SelectItem value={'monthly'}>Monthly</SelectItem>
                    <SelectItem value={'yearly'}>Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="font-hand text-sm text-slate-700">Every</label>
                <div className="flex items-center gap-1 mt-1">
                  <Input type="number" min={1} value={String(interval)} onChange={e=>setInterval(Number(e.target.value || 1))} className="w-16 border-purple-200" />
                  <span className="font-hand text-sm text-slate-500">{repeatKind === 'monthly' ? 'month(s)' : repeatKind === 'yearly' ? 'year(s)' : ''}</span>
                </div>
              </div>
            </div>

            <div>
              <label className="font-hand text-sm text-slate-700">Repeat Until (optional)</label>
              <Input type="date" value={until} onChange={e=>setUntil(e.target.value)} className="mt-1 border-purple-200" />
            </div>
          </div>

          <DialogFooter className="mt-4 gap-2">
            <button onClick={()=>setDialogOpen(false)} className="px-4 py-2 rounded-lg text-sm font-medium bg-slate-100 border border-slate-200 text-slate-600 hover:bg-slate-200 transition-all font-hand">Cancel</button>
            <button onClick={submitReminder} className="px-4 py-2 rounded-lg text-sm font-medium bg-purple-100 border border-purple-300 text-purple-700 hover:bg-purple-200 transition-all font-hand">Create</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Day Details Popup */}
      <Dialog open={dayPopupOpen} onOpenChange={setDayPopupOpen}>
        <DialogContent className="day-popup-content border-2 border-dashed border-purple-200 bg-purple-50/30">
          <DialogHeader>
            <DialogTitle className="font-hand text-xl text-purple-800">Events on {activeDay ? activeDay.toLocaleDateString() : ''}</DialogTitle>
            <div>
              <button aria-label="Add reminder for this day" onClick={()=>{ setDayPopupOpen(false); if (activeDay) openAddDialog(activeDay); }} className="absolute right-12 top-4 w-8 h-8 rounded-lg bg-purple-100 border border-purple-200 text-purple-600 flex items-center justify-center hover:bg-purple-200 transition-colors"><Plus className="w-4 h-4" /></button>
              <button aria-label="Close day popup" onClick={()=>setDayPopupOpen(false)} className="absolute right-4 top-4 w-8 h-8 rounded-lg bg-white border border-purple-200 text-purple-600 flex items-center justify-center hover:bg-purple-50 transition-colors"><X className="w-4 h-4" /></button>
            </div>
          </DialogHeader>

          <div className="grid gap-2">
            {activeDay ? (
              (occMap[formatDateKey(activeDay)] || []).length ? (
                (occMap[formatDateKey(activeDay)] || []).map((o:any, i:number)=> (
                  <div key={i} className="flex items-center gap-3 p-3 border border-purple-200 rounded-lg bg-white/60">
                    <span className="w-3 h-3 rounded-full" style={{background: resolveColor(o.color)}} />
                    <div className="flex-1">
                      <div className="font-hand font-medium text-slate-800">{o.title} {o.source && <span className="font-hand text-xs ml-2 text-slate-500">· {o.source === 'codeforces' ? 'Codeforces' : (o.source === 'leetcode' ? 'LeetCode' : (o.source === 'codechef' ? 'CodeChef' : (o.source === 'atcoder' ? 'AtCoder' : o.source)))}</span>}</div>
                      <div className="font-hand text-xs text-slate-500">{new Date(o.occurrenceDate).toLocaleString()}</div>
                      {o.url && (<a href={o.url} target="_blank" rel="noreferrer" className="font-hand text-xs text-purple-600 hover:text-purple-800">Open on {o.source === 'codeforces' ? 'Codeforces' : (o.source === 'leetcode' ? 'LeetCode' : (o.source === 'codechef' ? 'CodeChef' : (o.source === 'atcoder' ? 'AtCoder' : 'Source')))}</a>)}
                    </div>
                    {/* Delete button - only for user reminders (not external contests) */}
                    {!o.source && o.reminderId && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="w-7 h-7 rounded-lg hover:bg-red-100 border border-transparent hover:border-red-200 flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {/* For single events, show "Delete this event" */}
                          {(!o.repeat || o.repeat?.kind === 'single') && (
                            <DropdownMenuItem
                              className="text-red-600 cursor-pointer"
                              onClick={async () => {
                                await deleteReminder(o.reminderId);
                                // Refresh occurrences
                                const from = startOfMonth(currentMonth).toISOString();
                                const to = endOfMonth(currentMonth).toISOString();
                                const res = await getReminders({ from, to });
                                setOccurrences(res.data.occurrences || []);
                                setDayPopupOpen(false);
                              }}
                            >
                              Delete this event
                            </DropdownMenuItem>
                          )}
                          {/* For recurring events, show both options */}
                          {o.repeat?.kind && o.repeat.kind !== 'single' && (
                            <>
                              <DropdownMenuItem
                                className="text-red-600 cursor-pointer"
                                onClick={async () => {
                                  // Delete single occurrence by passing the occurrence date
                                  await deleteReminder(o.reminderId, { occurrenceDate: new Date(o.occurrenceDate).toISOString() });
                                  // Refresh occurrences
                                  const from = startOfMonth(currentMonth).toISOString();
                                  const to = endOfMonth(currentMonth).toISOString();
                                  const res = await getReminders({ from, to });
                                  setOccurrences(res.data.occurrences || []);
                                  setDayPopupOpen(false);
                                }}
                              >
                                Delete this event
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-red-600 cursor-pointer"
                                onClick={async () => {
                                  // Delete entire series by passing deleteAll=true
                                  await deleteReminder(o.reminderId, { deleteAll: true });
                                  // Refresh occurrences
                                  const from = startOfMonth(currentMonth).toISOString();
                                  const to = endOfMonth(currentMonth).toISOString();
                                  const res = await getReminders({ from, to });
                                  setOccurrences(res.data.occurrences || []);
                                  setDayPopupOpen(false);
                                }}
                              >
                                Delete all in series
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                ))
              ) : (
                <div className="font-hand text-sm text-slate-500 italic">No events for this day.</div>
              )
            ) : null}
          </div>

          <DialogFooter className="mt-4">
            <button onClick={()=>setDayPopupOpen(false)} className="px-4 py-2 rounded-lg text-sm font-medium bg-slate-100 border border-slate-200 text-slate-600 hover:bg-slate-200 transition-all font-hand">Close</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Hide the built-in dialog close for day popup and rely on our custom styled close */}
      <style>{`.day-popup-content > .absolute.right-4.top-4{ display: none; }`}</style>

      {/* Create Type Dialog */}
      <Dialog open={typeDialogOpen} onOpenChange={setTypeDialogOpen}>
        <DialogContent className="border-2 border-dashed border-purple-200 bg-purple-50/30">
          <DialogHeader>
            <DialogTitle className="font-hand text-xl text-purple-800">Create Category</DialogTitle>
          </DialogHeader>

          <div className="grid gap-3">
            <div>
              <label className="font-hand text-sm text-slate-700">Name</label>
              <Input value={newTypeName} onChange={e=>setNewTypeName(e.target.value)} placeholder="Work, Personal" className="mt-1 border-purple-200 focus:border-purple-400" />
            </div>
            <div>
              <label className="font-hand text-sm text-slate-700">Color</label>
              <div className="flex gap-2 mt-1.5">
                {['#6D28D9', '#BE185D', '#047857', '#0F766E', '#A16207'].map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setNewTypeColor(c)}
                    className={`w-6 h-6 rounded-full border-2 transition-all ${newTypeColor === c ? 'border-purple-600 scale-110' : 'border-transparent'}`}
                    style={{ background: c }}
                  />
                ))}
              </div>
            </div>
          </div>

          <DialogFooter className="mt-4 gap-2">
            <button onClick={()=>setTypeDialogOpen(false)} className="px-4 py-2 rounded-lg text-sm font-medium bg-slate-100 border border-slate-200 text-slate-600 hover:bg-slate-200 transition-all font-hand">Cancel</button>
            <button onClick={createType} className="px-4 py-2 rounded-lg text-sm font-medium bg-purple-100 border border-purple-300 text-purple-700 hover:bg-purple-200 transition-all font-hand">Create</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}