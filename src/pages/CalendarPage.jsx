import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { doc, onSnapshot, updateDoc, setDoc, serverTimestamp, query, collection, where } from 'firebase/firestore';
import { format, addDays, startOfWeek, addWeeks, subWeeks, getWeek } from 'date-fns';
import AppLayout from '../components/AppLayout';

const CalendarPage = () => {
  const { currentUser } = useAuth();
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [schedule, setSchedule] = useState({});
  const [weekStats, setWeekStats] = useState({ total: 0, completed: 0, pending: 0 });
  const [weekTasks, setWeekTasks] = useState([]);
  const [weekContexts, setWeekContexts] = useState({});
  const [routines, setRoutines] = useState([]);
  const [lastSync, setLastSync] = useState(null);
  const syncCountRef = useRef(0);

  // Calculate week days based on currentWeek
  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekDays = useMemo(() => 
    Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), 
    [weekStart.getTime()]
  );
  // 24 hours schedule
  const timeSlots = Array.from({ length: 24 }, (_, i) => i);

  // Reset sync counter when week changes
  useEffect(() => {
    syncCountRef.current = 0;
    setLastSync(null);
  }, [currentWeek.getTime()]);

  // Subscribe to tasks for the week
  useEffect(() => {
    if (!currentUser) return;
    const dateStrings = weekDays.map(day => format(day, 'yyyy-MM-dd'));
    const qTasks = query(collection(db, 'users', currentUser.uid, 'tasks'), where('date', 'in', dateStrings));
    
    const unsubTasks = onSnapshot(qTasks, (snapshot) => {
       const tsks = [];
       snapshot.forEach(d => tsks.push({ id: d.id, ...d.data() }));
       setWeekTasks(tsks);
    });
    
    return () => unsubTasks();
  }, [currentUser?.uid, weekStart.getTime()]);

  // Subscribe to routines for legacy task matching
  useEffect(() => {
    if (!currentUser) return;
    const unsubRoutines = onSnapshot(collection(db, 'users', currentUser.uid, 'routines'), (snapshot) => {
       const rts = [];
       snapshot.forEach(d => rts.push({ id: d.id, ...d.data() }));
       setRoutines(rts);
    });
    return () => unsubRoutines();
  }, [currentUser?.uid]);

  // Subscribe to schedule data and daily context
  useEffect(() => {
    if (!currentUser) return;

    const unsubscribes = [];
    
    weekDays.forEach(day => {
      const dateStr = format(day, 'yyyy-MM-dd');
      
      const unsubSched = onSnapshot(
        doc(db, 'users', currentUser.uid, 'schedule', dateStr),
        (docSnap) => {
          setSchedule(prev => {
            const newSchedule = {
              ...prev,
              [dateStr]: docSnap.exists() ? docSnap.data().items || [] : []
            };
            return newSchedule;
          });
          
          syncCountRef.current += 1;
          if (syncCountRef.current === weekDays.length) {
            setLastSync(new Date());
          }
        }
      );
      unsubscribes.push(unsubSched);

      const unsubCtx = onSnapshot(
        doc(db, 'users', currentUser.uid, 'dailyContext', dateStr),
        (docSnap) => {
           setWeekContexts(prev => ({
             ...prev,
             [dateStr]: docSnap.exists() ? docSnap.data() : {}
           }));
        }
      );
      unsubscribes.push(unsubCtx);
    });

    return () => unsubscribes.forEach(unsub => unsub());
  }, [currentUser?.uid, weekStart.getTime()]);

  // Calculate week stats whenever schedule, tasks or context changes
  useEffect(() => {
    const allTasks = Object.values(schedule).flat();
    const total = allTasks.length;
    
    let completed = 0;
    Object.entries(schedule).forEach(([dateStr, items]) => {
      const dayContext = weekContexts[dateStr] || {};
      const completedRoutines = dayContext.completedRoutines || [];
      
      items.forEach(t => {
         let lookupId = t.taskId;
         if (!lookupId) {
             const fTask = weekTasks.find(wt => wt.task.toLowerCase().trim() === t.task.toLowerCase().trim() && wt.date === dateStr);
             if (fTask) lookupId = fTask.id;
             else {
                 const fRoutine = routines.find(rt => rt.task.toLowerCase().trim() === t.task.toLowerCase().trim());
                 if (fRoutine) lookupId = fRoutine.id;
             }
         }

         if (lookupId) {
            const matchedTask = weekTasks.find(wt => wt.id === lookupId);
            if (matchedTask && matchedTask.status === 'completed') {
                completed++;
            } else if (completedRoutines.includes(lookupId)) {
                completed++;
            }
         }
      });
    });

    const pending = total - completed;
    setWeekStats({ total, completed, pending });
  }, [schedule, weekTasks, weekContexts]);

  const handleToggleEvent = async (scheduleItem, dateStr) => {
      let matchedTaskId = scheduleItem.taskId;
      let matchedTask = null;

      if (!matchedTaskId) {
          matchedTask = weekTasks.find(wt => wt.task.toLowerCase().trim() === scheduleItem.task.toLowerCase().trim() && wt.date === dateStr);
          if (matchedTask) {
              matchedTaskId = matchedTask.id;
          } else {
              const matchedRoutine = routines.find(rt => rt.task.toLowerCase().trim() === scheduleItem.task.toLowerCase().trim());
              if (matchedRoutine) matchedTaskId = matchedRoutine.id;
          }
      } else {
          matchedTask = weekTasks.find(wt => wt.id === matchedTaskId);
      }

      if (!matchedTaskId) {
          console.warn("Could not match legacy schedule item to any active task or routine.");
          return;
      }

      if (matchedTask) {
          const newStatus = matchedTask.status === 'completed' ? 'pending' : 'completed';
          await updateDoc(doc(db, 'users', currentUser.uid, 'tasks', matchedTaskId), {
             status: newStatus
          });
      } else {
          // Assume routine
          const dayContext = weekContexts[dateStr] || {};
          const completedRoutines = dayContext.completedRoutines || [];
          const isCompleted = completedRoutines.includes(matchedTaskId);
          
          const newCompletedRoutines = isCompleted 
             ? completedRoutines.filter(id => id !== matchedTaskId)
             : [...completedRoutines, matchedTaskId];
             
          await setDoc(
             doc(db, 'users', currentUser.uid, 'dailyContext', dateStr), 
             { completedRoutines: newCompletedRoutines, updatedAt: serverTimestamp() },
             { merge: true }
          );
      }
  };

  const nextWeek = () => setCurrentWeek(addWeeks(currentWeek, 1));
  const prevWeek = () => setCurrentWeek(subWeeks(currentWeek, 1));

  const formatDecimalTime = (decimalHours) => {
    const dh = parseFloat(decimalHours);
    if (isNaN(dh)) return '';
    const hours = Math.floor(dh);
    const minutes = Math.round((dh - hours) * 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  const getEventStyle = (task, index) => {
    let startHour = parseFloat(task.start);
    if (isNaN(startHour)) startHour = 0;
    let endHour = parseFloat(task.end);
    if (isNaN(endHour)) endHour = startHour + 1;
    const durationHours = endHour - startHour;
    
    const top = startHour * 96;
    const height = durationHours * 96;
    
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
                  {hour.toString().padStart(2, '0')}:00
                </div>
              ))}
            </div>

            {/* Main Calendar Area */}
            <div className="col-span-7 grid grid-cols-7 relative bg-surface-container-lowest/50">
              {/* Removed Current Time Indicator from here to place inside individual day columns */}

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
                    style={{ top: `${(row / timeSlots.length) * 100}%`, height: `${100 / timeSlots.length}%` }}
                  />
                ))}
              </div>

              {/* Events */}
              {weekDays.map((day, dayIndex) => {
                const dateStr = format(day, 'yyyy-MM-dd');
                const dayTasks = schedule[dateStr] || [];
                
                return (
                  <div key={dayIndex} className="relative h-[2304px]">
                    {/* Current Time Indicator for this specific day */}
                    {isToday(day) && (
                      <div 
                        className="absolute left-0 right-0 h-[2px] bg-error/80 shadow-[0_0_10px_rgba(255,180,171,0.5)] z-20 flex items-center"
                        style={{ top: `${(new Date().getHours() * 96) + (new Date().getMinutes() / 60 * 96)}px` }}
                      >
                        <div className="absolute -left-1 w-2 h-2 rounded-full bg-error"></div>
                      </div>
                    )}
                    {dayTasks.map((task, taskIndex) => {
                      const { top, height, color } = getEventStyle(task, taskIndex);
                      
                      let isCompleted = false;
                      let lookupId = task.taskId;
                      if (!lookupId) {
                          const fTask = weekTasks.find(wt => wt.task.toLowerCase().trim() === task.task.toLowerCase().trim() && wt.date === dateStr);
                          if (fTask) lookupId = fTask.id;
                          else {
                              const fRoutine = routines.find(rt => rt.task.toLowerCase().trim() === task.task.toLowerCase().trim());
                              if (fRoutine) lookupId = fRoutine.id;
                          }
                      }

                      if (lookupId) {
                          const matchedTask = weekTasks.find(wt => wt.id === lookupId);
                          if (matchedTask && matchedTask.status === 'completed') isCompleted = true;
                          
                          const dayContext = weekContexts[dateStr] || {};
                          if (dayContext.completedRoutines && dayContext.completedRoutines.includes(lookupId)) isCompleted = true;
                      }

                      return (
                        <div
                          key={taskIndex}
                          className={`absolute left-0 right-0 px-1 z-10 transition-all ${isCompleted ? 'opacity-40 grayscale hover:opacity-100 hover:grayscale-0' : ''}`}
                          style={{ top: `${top}px`, height: `${height}px` }}
                        >
                          <div 
                            onClick={() => handleToggleEvent(task, dateStr)}
                            className={`h-full ${color.bg} border-l-4 ${color.border} p-2 rounded-r-lg group hover:brightness-110 transition-all cursor-pointer overflow-hidden backdrop-blur-sm flex flex-col relative`}
                          >
                            {isCompleted && (
                                <div className="absolute inset-0 bg-black/20 flex flex-col justify-center items-end pr-2 pointer-events-none">
                                    <span className="material-symbols-outlined text-white text-3xl opacity-30 drop-shadow-md">check_circle</span>
                                </div>
                            )}
                            <div className={`font-headline text-[10px] font-bold ${color.text} uppercase tracking-widest truncate ${isCompleted ? 'line-through opacity-80' : ''}`}>
                              {task.task}
                            </div>
                            <div className="font-body text-[10px] text-white/70 mt-0.5 opacity-80 whitespace-nowrap overflow-hidden text-ellipsis">
                              {formatDecimalTime(task.start)} - {formatDecimalTime(task.end)}
                            </div>
                            {task.priority && (
                              <div className="mt-1 flex items-center">
                                <span className={`text-[8px] px-1 py-0.5 rounded uppercase font-bold tracking-widest ${
                                  task.priority === 'high' ? 'bg-error/20 text-error' : 
                                  task.priority === 'medium' ? 'bg-secondary/20 text-secondary' : 'bg-zinc-800 text-zinc-400'
                                }`}>
                                  {task.priority}
                                </span>
                              </div>
                            )}
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
