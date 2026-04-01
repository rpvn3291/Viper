import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { format, addDays, startOfWeek, addWeeks, subWeeks, getWeek } from 'date-fns';
import AppLayout from '../components/AppLayout';

const CalendarPage = () => {
  const { currentUser } = useAuth();
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [schedule, setSchedule] = useState({});
  const [weekStats, setWeekStats] = useState({ total: 0, completed: 0, pending: 0 });
  const [lastSync, setLastSync] = useState(null);
  const syncCountRef = useRef(0);

  // Calculate week days based on currentWeek
  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekDays = useMemo(() => 
    Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), 
    [weekStart.getTime()]
  );
  const timeSlots = Array.from({ length: 11 }, (_, i) => i + 13);

  // Reset sync counter when week changes
  useEffect(() => {
    syncCountRef.current = 0;
    setLastSync(null);
  }, [currentWeek.getTime()]);

  // Subscribe to schedule data
  useEffect(() => {
    if (!currentUser) return;

    const unsubscribes = [];
    
    weekDays.forEach(day => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const unsub = onSnapshot(
        doc(db, 'users', currentUser.uid, 'schedule', dateStr),
        (docSnap) => {
          setSchedule(prev => {
            const newSchedule = {
              ...prev,
              [dateStr]: docSnap.exists() ? docSnap.data().items || [] : []
            };
            return newSchedule;
          });
          
          // Update sync time only once per week change
          syncCountRef.current += 1;
          if (syncCountRef.current === weekDays.length) {
            setLastSync(new Date());
          }
        }
      );
      unsubscribes.push(unsub);
    });

    return () => unsubscribes.forEach(unsub => unsub());
  }, [currentUser?.uid, weekStart.getTime()]);

  // Calculate week stats whenever schedule changes
  useEffect(() => {
    const allTasks = Object.values(schedule).flat();
    const total = allTasks.length;
    const completed = allTasks.filter(t => t.completed).length;
    const pending = total - completed;
    setWeekStats({ total, completed, pending });
  }, [schedule]);

  const nextWeek = () => setCurrentWeek(addWeeks(currentWeek, 1));
  const prevWeek = () => setCurrentWeek(subWeeks(currentWeek, 1));

  const getEventStyle = (task, index) => {
    const startHour = parseInt(task.startTime?.split(':')[0]) || 13;
    const duration = task.duration || 60;
    const top = (startHour - 13) * 96;
    const height = (duration / 60) * 96;
    
    const colors = [
      { bg: 'bg-secondary/10', border: 'border-secondary', text: 'text-secondary' },
      { bg: 'bg-primary/10', border: 'border-primary', text: 'text-primary' },
      { bg: 'bg-tertiary/10', border: 'border-tertiary', text: 'text-tertiary' },
    ];
    const color = colors[index % colors.length];
    
    return { top, height, color };
  };

  const weekNumber = getWeek(currentWeek);
  const isToday = (date) => format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');

  return (
    <AppLayout>
      <div className="p-8 min-h-screen bg-surface">
        {/* Calendar Header Controls */}
        <div className="flex items-end justify-between mb-8">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-tertiary animate-pulse shadow-[0_0_8px_rgba(78,222,163,0.6)]"></div>
              <span className="font-headline text-[10px] tracking-[0.2em] text-tertiary uppercase font-bold">SYSTEM_SYNC_LIVE</span>
            </div>
            <h1 className="font-headline text-4xl font-bold tracking-tighter">
              {format(selectedDate, 'EEEE').toUpperCase()} <span className="text-primary">{format(selectedDate, 'dd')}</span> {format(selectedDate, 'MMM').toUpperCase()}
            </h1>
          </div>
          <div className="flex gap-1">
            <button 
              onClick={prevWeek}
              className="bg-surface-container-low p-3 rounded-l-xl border-r border-white/5 hover:bg-surface-container-high transition-colors"
            >
              <span className="material-symbols-outlined text-on-surface">chevron_left</span>
            </button>
            <div className="bg-surface-container-low px-6 flex items-center font-headline text-sm font-bold tracking-widest text-zinc-300">
              WEEK_{weekNumber}
            </div>
            <button 
              onClick={nextWeek}
              className="bg-surface-container-low p-3 rounded-r-sm hover:bg-surface-container-high transition-colors"
            >
              <span className="material-symbols-outlined text-on-surface">chevron_right</span>
            </button>
          </div>
        </div>

        {/* Weekly HUD Calendar Grid */}
        <div className="grid grid-cols-[80px_repeat(7,1fr)] border-t border-white/5 rounded-xl overflow-hidden bg-surface-container-low shadow-2xl">
          {/* Column Headers */}
          <div className="bg-surface-container border-b border-r border-white/10 h-12 flex items-center justify-center font-headline text-[10px] text-zinc-500 font-bold uppercase">
            TIME
          </div>
          {weekDays.map((day, i) => (
            <div 
              key={i}
              onClick={() => setSelectedDate(day)}
              className={`bg-surface-container border-b border-r border-white/10 h-12 flex flex-col items-center justify-center cursor-pointer transition-all ${
                isToday(day) ? 'ring-1 ring-secondary/30 bg-secondary/5' : ''
              } ${format(day, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd') ? 'bg-primary/5' : ''}`}
            >
              <span className={`font-headline text-[10px] ${isToday(day) ? 'text-secondary' : 'text-zinc-500'}`}>
                {format(day, 'EEE').toUpperCase()}
              </span>
              <span className={`font-headline text-sm font-bold ${isToday(day) ? 'text-secondary' : format(day, 'E') === 'Sat' || format(day, 'E') === 'Sun' ? 'text-zinc-400' : 'text-on-surface'}`}>
                {format(day, 'dd')}
              </span>
            </div>
          ))}

          {/* Time Slots & Grid */}
          <div className="contents relative">
            {/* Time Markers */}
            <div className="flex flex-col border-r border-white/10">
              {timeSlots.map((hour) => (
                <div key={hour} className="h-24 border-b border-white/5 flex items-center justify-center font-headline text-[10px] text-zinc-500">
                  {hour}:00
                </div>
              ))}
            </div>

            {/* Main Calendar Area */}
            <div className="col-span-7 grid grid-cols-7 relative bg-surface-container-lowest/50">
              {/* Current Time Indicator */}
              {isToday(selectedDate) && (
                <div 
                  className="absolute left-0 right-0 h-[2px] bg-error/80 shadow-[0_0_10px_rgba(255,180,171,0.5)] z-20 flex items-center"
                  style={{ top: `${((new Date().getHours() - 13) * 96) + (new Date().getMinutes() / 60 * 96)}px` }}
                >
                  <div className="absolute -left-1 w-2 h-2 rounded-full bg-error"></div>
                </div>
              )}

              {/* Grid Lines */}
              <div className="absolute inset-0 pointer-events-none">
                {[...Array(7)].map((_, col) => (
                  <div 
                    key={col}
                    className="absolute top-0 bottom-0 border-r border-white/5"
                    style={{ left: `${(col / 7) * 100}%`, width: `${100 / 7}%` }}
                  />
                ))}
                {timeSlots.map((_, row) => (
                  <div 
                    key={row}
                    className="absolute left-0 right-0 border-b border-white/5"
                    style={{ top: `${(row / 11) * 100}%`, height: `${100 / 11}%` }}
                  />
                ))}
              </div>

              {/* Events */}
              {weekDays.map((day, dayIndex) => {
                const dateStr = format(day, 'yyyy-MM-dd');
                const dayTasks = schedule[dateStr] || [];
                
                return (
                  <div key={dayIndex} className="relative h-[1056px]">
                    {dayTasks.map((task, taskIndex) => {
                      const { top, height, color } = getEventStyle(task, taskIndex);
                      return (
                        <div
                          key={taskIndex}
                          className="absolute left-0 right-0 px-1 z-10"
                          style={{ top: `${top}px`, height: `${height}px` }}
                        >
                          <div className={`h-full ${color.bg} border-l-4 ${color.border} p-2 rounded-r-lg group hover:brightness-110 transition-all cursor-pointer overflow-hidden backdrop-blur-sm`}>
                            <div className={`font-headline text-[10px] font-bold ${color.text} uppercase tracking-widest truncate`}>
                              {task.title}
                            </div>
                            <div className="font-body text-[10px] text-white/70 mt-0.5 line-clamp-2">
                              {task.description || `${task.startTime} - ${task.endTime}`}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* System Stats Footer */}
        <div className="mt-8 grid grid-cols-4 gap-6">
          <div className="bg-surface-container-low p-6 rounded-xl border-l-4 border-primary/40 relative overflow-hidden">
            <div className="absolute top-0 right-0 opacity-10 scale-150">
              <span className="material-symbols-outlined text-6xl text-primary">calendar_view_week</span>
            </div>
            <div className="font-headline text-[10px] text-zinc-500 tracking-widest uppercase">Weekly Load</div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-headline font-bold text-primary">{weekStats.total}</span>
              <span className="text-xs text-zinc-400">Tasks Scheduled</span>
            </div>
          </div>
          <div className="bg-surface-container-low p-6 rounded-xl border-l-4 border-secondary/40 relative overflow-hidden">
            <div className="absolute top-0 right-0 opacity-10 scale-150">
              <span className="material-symbols-outlined text-6xl text-secondary">percent</span>
            </div>
            <div className="font-headline text-[10px] text-zinc-500 tracking-widest uppercase">Week Progress</div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-headline font-bold text-secondary">
                {weekStats.total === 0 ? 0 : Math.round((weekStats.completed / weekStats.total) * 100)}%
              </span>
              <span className="text-xs text-tertiary font-bold uppercase">
                {weekStats.completed}/{weekStats.total} Done
              </span>
            </div>
          </div>
          <div className="bg-surface-container-low p-6 rounded-xl border-l-4 border-tertiary/40 relative overflow-hidden">
            <div className="absolute top-0 right-0 opacity-10 scale-150">
              <span className="material-symbols-outlined text-6xl text-tertiary">sync</span>
            </div>
            <div className="font-headline text-[10px] text-zinc-500 tracking-widest uppercase">Last Sync</div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-headline font-bold text-tertiary">
                {lastSync ? format(lastSync, 'HH:mm') : '--:--'}
              </span>
              <span className="text-xs text-zinc-400">
                {lastSync ? format(lastSync, 'a') : ''}
              </span>
            </div>
          </div>
          <div className="bg-surface-container-low p-6 rounded-xl border-l-4 border-error/40 relative overflow-hidden">
            <div className="absolute top-0 right-0 opacity-10 scale-150">
              <span className="material-symbols-outlined text-6xl text-error">pending_actions</span>
            </div>
            <div className="font-headline text-[10px] text-zinc-500 tracking-widest uppercase">Pending Tasks</div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-headline font-bold text-error">
                {weekStats.pending}
              </span>
              <span className="text-xs text-zinc-400">
                {weekStats.pending === 0 ? 'All Caught Up!' : 'To Complete'}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 opacity-50 pointer-events-none">
          <div className="h-1 bg-gradient-to-r from-transparent via-zinc-800 to-transparent"></div>
          <div className="flex justify-center items-center mt-4">
            <div className="font-headline text-[10px] text-zinc-700 tracking-[0.4em] uppercase">
              VIPER Planner — AI-Powered Scheduling
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default CalendarPage;
