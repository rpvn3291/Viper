import React, { useState, useEffect } from 'react';
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

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekDays = [...Array(7)].map((_, i) => addDays(weekStart, i));
  const timeSlots = [...Array(11)].map((_, i) => i + 13); // 13:00 to 23:00

  useEffect(() => {
    if (!currentUser) return;

    const unsubscribes = [];
    
    // Listen to schedules for all days in the current week
    weekDays.forEach(day => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const unsub = onSnapshot(
        doc(db, 'users', currentUser.uid, 'schedule', dateStr),
        (docSnap) => {
          setSchedule(prev => ({
            ...prev,
            [dateStr]: docSnap.exists() ? docSnap.data().items || [] : []
          }));
        }
      );
      unsubscribes.push(unsub);
    });

    return () => unsubscribes.forEach(unsub => unsub());
  }, [currentUser, weekStart]);

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
              <span className="material-symbols-outlined text-6xl text-primary">rocket_launch</span>
            </div>
            <div className="font-headline text-[10px] text-zinc-500 tracking-widest uppercase">Weekly Load</div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-headline font-bold text-primary">{Math.min(100, Object.values(schedule).flat().length * 10)}%</span>
              <span className="text-xs text-zinc-400">Active Tasks</span>
            </div>
          </div>
          <div className="bg-surface-container-low p-6 rounded-xl border-l-4 border-secondary/40 relative overflow-hidden">
            <div className="absolute top-0 right-0 opacity-10 scale-150">
              <span className="material-symbols-outlined text-6xl text-secondary">speed</span>
            </div>
            <div className="font-headline text-[10px] text-zinc-500 tracking-widest uppercase">System Latency</div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-headline font-bold text-secondary">04ms</span>
              <span className="text-xs text-tertiary font-bold uppercase">OPTIMAL</span>
            </div>
          </div>
          <div className="bg-surface-container-low p-6 rounded-xl border-l-4 border-tertiary/40 relative overflow-hidden">
            <div className="absolute top-0 right-0 opacity-10 scale-150">
              <span className="material-symbols-outlined text-6xl text-tertiary">security</span>
            </div>
            <div className="font-headline text-[10px] text-zinc-500 tracking-widest uppercase">Sync Status</div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-headline font-bold text-tertiary">LIVE</span>
              <span className="text-xs text-zinc-400">Firebase</span>
            </div>
          </div>
          <div className="bg-surface-container-low p-6 rounded-xl border-l-4 border-error/40 relative overflow-hidden">
            <div className="absolute top-0 right-0 opacity-10 scale-150">
              <span className="material-symbols-outlined text-6xl text-error">warning</span>
            </div>
            <div className="font-headline text-[10px] text-zinc-500 tracking-widest uppercase">Pending Tasks</div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-headline font-bold text-error">
                {Object.values(schedule).flat().filter(t => !t.completed).length}
              </span>
              <span className="text-xs text-zinc-400">Requires attention</span>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default CalendarPage;
