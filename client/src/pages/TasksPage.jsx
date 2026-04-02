import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, query, onSnapshot, doc, getDoc, setDoc, addDoc, serverTimestamp, updateDoc, deleteDoc, where } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { format, parseISO } from 'date-fns';

import AppLayout from '../components/AppLayout';

const TasksPage = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [tasks, setTasks] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [newTask, setNewTask] = useState('');
  const [estimatedHours, setEstimatedHours] = useState(1);
  const [deadline, setDeadline] = useState('');
  const [targetDate, setTargetDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [isDaily, setIsDaily] = useState(false);
  const [routines, setRoutines] = useState([]);
  const [dailyCondition, setDailyCondition] = useState("");
  const [dailyMood, setDailyMood] = useState(null);
  const [completedRoutines, setCompletedRoutines] = useState([]);
  const [skippedRoutines, setSkippedRoutines] = useState([]);
  const [selectedModel, setSelectedModel] = useState('All Models');
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const dateInputRef = useRef(null);

  useEffect(() => {
    if (!currentUser) return;
    
    getDoc(doc(db, 'users', currentUser.uid, 'profile', 'config'))
      .then(snap => {
        if (snap.exists()) {
          setProfile(snap.data());
        } else {
          navigate('/setup');
        }
      })
      .catch((err) => {
        console.error("Firestore Error:", err);
      });

    const qTasks = query(
      collection(db, 'users', currentUser.uid, 'tasks'),
      where('date', '==', targetDate)
    );
    const unsubscribeTasks = onSnapshot(qTasks, (snapshot) => {
      const tsks = [];
      snapshot.forEach(doc => tsks.push({ id: doc.id, ...doc.data() }));
      tsks.sort((a, b) => b.createdAt?.toMillis() - a.createdAt?.toMillis());
      setTasks(tsks);
    });

    const qRoutines = query(collection(db, 'users', currentUser.uid, 'routines'));
    const unsubscribeRoutines = onSnapshot(qRoutines, (snapshot) => {
      const rts = [];
      snapshot.forEach(doc => rts.push({ id: doc.id, ...doc.data() }));
      setRoutines(rts);
    });

    const fetchDailyContext = async () => {
      try {
        const docRef = doc(db, 'users', currentUser.uid, 'dailyContext', targetDate);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setDailyCondition(docSnap.data().extraCondition || "");
          setDailyMood(docSnap.data().mood || null);
          setCompletedRoutines(docSnap.data().completedRoutines || []);
          setSkippedRoutines(docSnap.data().skippedRoutines || []);
        } else {
          setDailyCondition("");
          setDailyMood(null);
          setCompletedRoutines([]);
          setSkippedRoutines([]);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchDailyContext();

    return () => {
      unsubscribeTasks();
      unsubscribeRoutines();
    };
  }, [currentUser, navigate, targetDate]);

  const saveDailyCondition = async (conditionVal) => {
    if (!currentUser) return;
    try {
      const docRef = doc(db, 'users', currentUser.uid, 'dailyContext', targetDate);
      await setDoc(docRef, { extraCondition: conditionVal, updatedAt: serverTimestamp() }, { merge: true });
    } catch (err) {
      console.error(err);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newTask.trim()) return;

    try {
      if (isDaily) {
        await addDoc(collection(db, 'users', currentUser.uid, 'routines'), {
          task: newTask,
          estimatedHours: estimatedHours,
          deadline: deadline || null,
          createdAt: serverTimestamp()
        });
        setIsDaily(false);
      } else {
        await addDoc(collection(db, 'users', currentUser.uid, 'tasks'), {
          task: newTask,
          priority: "normal",
          estimatedHours: estimatedHours,
          deadline: deadline || null,
          status: "pending",
          date: targetDate,
          createdAt: serverTimestamp()
        });
      }
      setNewTask('');
      setEstimatedHours(1);
      setDeadline('');
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleComplete = async (taskId, currentStatus) => {
    const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
    await updateDoc(doc(db, 'users', currentUser.uid, 'tasks', taskId), {
      status: newStatus
    });
  };

  const handleDelete = async (taskId) => {
    await deleteDoc(doc(db, 'users', currentUser.uid, 'tasks', taskId));
  };

  const handleToggleRoutineComplete = async (routineId) => {
    if (!currentUser) return;
    try {
      const isCompleted = completedRoutines.includes(routineId);
      const newCompletedRoutines = isCompleted 
        ? completedRoutines.filter(id => id !== routineId)
        : [...completedRoutines, routineId];
      
      setCompletedRoutines(newCompletedRoutines);
      const docRef = doc(db, 'users', currentUser.uid, 'dailyContext', targetDate);
      await setDoc(docRef, { completedRoutines: newCompletedRoutines, updatedAt: serverTimestamp() }, { merge: true });
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleRoutineSkip = async (routineId) => {
    if (!currentUser) return;
    try {
      const isSkipped = skippedRoutines.includes(routineId);
      const newSkippedRoutines = isSkipped 
        ? skippedRoutines.filter(id => id !== routineId)
        : [...skippedRoutines, routineId];
      
      setSkippedRoutines(newSkippedRoutines);
      const docRef = doc(db, 'users', currentUser.uid, 'dailyContext', targetDate);
      await setDoc(docRef, { skippedRoutines: newSkippedRoutines, updatedAt: serverTimestamp() }, { merge: true });
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteRoutine = async (routineId) => {
    await deleteDoc(doc(db, 'users', currentUser.uid, 'routines', routineId));
  };

  const generateSchedule = async () => {
    if (!profile || tasks.filter(t => t.status === 'pending').length === 0) {
      alert("Please add some pending tasks to generate a schedule!");
      return;
    }

    setLoading(true);
    try {

      const pendingTasks = tasks.filter(t => t.status === 'pending').map(t => ({
        taskId: t.id,
        task: t.task,
        deadline: t.deadline || null,
        estimatedHours: Number(t.estimatedHours || t.duration)
      }));

      const payload = {
        targetDate,
        dailyMood: dailyMood || 'Not specified',
        extraCondition: dailyCondition || 'None',
        tasks: pendingTasks,
        dailyRoutines: routines
          .filter(r => !skippedRoutines.includes(r.id))
          .map(r => ({ taskId: r.id, task: r.task, deadline: r.deadline || null, estimatedHours: Number(r.estimatedHours || r.duration) })),
        userProfile: {
          startTime: Number(profile.startTime),
          peakTime: profile.peakTime,
          preference: profile.preference,
          availableHours: Number(profile.availableHours),
          blockedTime: profile.blockedTime,
          sleepTime: profile.sleepTime,
        },
        history: tasks.filter(t => t.status === 'completed' || t.status === 'missed').map(t => ({
          task: t.task,
          status: t.status
        })).slice(0, 10)
      };

      const parsedTargetDate = parseISO(targetDate);
      const isWeekend = parsedTargetDate.getDay() === 0 || parsedTargetDate.getDay() === 6;
      
      const isToday = targetDate === format(new Date(), 'yyyy-MM-dd');
      const currentTimeFloat = isToday ? (new Date().getHours() + new Date().getMinutes() / 60).toFixed(2) : null;

      const prompt = `
        You are an expert AI Life Scheduler. Analyze the following user profile, target date, task backlog, daily routines, history, and the user's current condition:
        ${JSON.stringify(payload)}

        The user has declared their mood for today is: ${dailyMood ? `"${dailyMood}"` : 'neutral'}.
        They have provided extra instructions/conditions for today: "${dailyCondition ? dailyCondition : 'None'}".
        You MUST accommodate this mood and condition.

        Your job is to act as a calendar engine for the targetDate: ${targetDate}.
        Assign a precise 'start' and 'end' time (in 24-hour decimal format) for every standard task AND every daily routine.
        
        RULES:
        1. Base your scheduling around the user's Peak Productivity Time.
        2. NEVER schedule any tasks during the user's sleepTime.
        3. ${isWeekend 
            ? "Today is a WEEKEND. The user's professional blocked time DOES NOT APPLY." 
            : "NEVER schedule personal tasks during the user's professional blockedTime."
        }
        4. You must schedule EVERY task in the pending backlog PLUS EVERY routine.
        5. The 'taskId' should be returned exactly as provided.
        ${isToday ? `6. IMPORTANT: It is currently ${currentTimeFloat} (in 24h decimal time). You MUST ONLY assign 'start' times strictly AFTER ${currentTimeFloat} today. Do NOT schedule anything in the past.` : ''}
        7. DEADLINES: If a task has a 'deadline' (HH:MM format), its 'end' time MUST be less than or equal to that deadline's decimal equivalent.
        8. CONFLICTS: For mathematically impossible overlaps, prioritize via Earliest Due Date. Push lower priority tasks past their deadline immediately following the blocking task rather than overlapping them.
        9. PROPORTIONAL REDUCTION: If the cumulative sum of all durations exceeds available hours, proportionally SHRINK the scheduled duration (end - start) for every item to squeeze them all in perfectly.

        Output EXACTLY valid JSON matching the following schema:
        [
          { "task": "Task Name", "start": 8.5, "end": 10.0, "priority": "high", "taskId": "abc" }
        ]
      `;

      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt,
          selectedModel: selectedModel === 'All Models' ? null : selectedModel
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Backend request failed");
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || "Backend returned failure");
      }
      
      const newSchedule = result.data;

      if(newSchedule.length > 0) {
        await setDoc(doc(db, 'users', currentUser.uid, 'schedule', targetDate), {
          items: newSchedule,
          generatedAt: new Date().toISOString()
        });
        navigate('/calendar', { state: { date: targetDate } });
      }

    } catch (err) {
      console.error(err);
      alert("Failed to generate schedule.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="p-8 min-h-[calc(100vh-64px)]">
        <div className="grid grid-cols-12 gap-8 max-w-7xl mx-auto">
          {/* Left Panel: Task Engine */}
          <div className="col-span-12 lg:col-span-7 space-y-8">
            {/* Date and Task Input Section */}
            <div className="bg-surface-container-low p-6 rounded-xl rounded-br-sm hud-border-cyan">
              <div className="flex items-center justify-between mb-8">
                <div className="flex flex-col">
                  <span className="font-label text-[10px] text-zinc-500 uppercase tracking-[0.2em] mb-1">Target Date</span>
                  <div 
                    className="flex items-center gap-3 bg-surface-container-lowest px-4 py-2 rounded border border-outline-variant/20 cursor-pointer"
                    onClick={() => dateInputRef.current && dateInputRef.current.showPicker?.()}
                  >
                    <span className="material-symbols-outlined text-secondary pointer-events-none">calendar_month</span>
                    <input 
                      ref={dateInputRef}
                      type="date" 
                      value={targetDate}
                      onChange={(e) => setTargetDate(e.target.value)}
                      className="bg-transparent border-none text-on-surface font-headline font-bold text-lg tracking-widest outline-none cursor-pointer"
                    />
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-label text-[10px] text-zinc-500 uppercase tracking-[0.2em]">Operational Status</span>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-2 h-2 rounded-full bg-tertiary animate-pulse"></div>
                    <span className="text-tertiary font-headline font-bold text-xs uppercase">READY</span>
                  </div>
                </div>
              </div>

              {/* Task Input Form */}
              <form onSubmit={handleAdd} className="space-y-4">
                <div>
                  <span className="font-label text-[10px] text-secondary uppercase tracking-[0.2em] mb-2 block">Initialize Mission Task</span>
                  <input 
                    type="text" 
                    placeholder="ENTER TASK PARAMETERS..." 
                    value={newTask}
                    onChange={(e) => setNewTask(e.target.value)}
                    className="w-full bg-surface-container-lowest border-none focus:ring-0 focus:border-b-2 focus:border-secondary border-b-2 border-outline-variant/10 p-4 font-headline text-lg tracking-tight placeholder:text-zinc-700 text-on-surface outline-none"
                    required
                  />
                </div>
                
                <div className="flex gap-4">
                  <div className="flex-1">
                    <span className="font-label text-[10px] text-zinc-500 uppercase tracking-[0.2em] mb-2 block">Estimation Time (hrs)</span>
                    <input 
                      type="number" 
                      min="0.5" 
                      step="0.5" 
                      value={estimatedHours}
                      onChange={(e) => setEstimatedHours(Number(e.target.value))}
                      className="w-full bg-surface-container-lowest border-none focus:ring-0 focus:border-b-2 focus:border-secondary border-b-2 border-outline-variant/10 p-4 font-headline text-lg tracking-tight text-on-surface outline-none"
                    />
                  </div>
                  <div className="flex-1">
                    <span className="font-label text-[10px] text-zinc-500 uppercase tracking-[0.2em] mb-2 block">Deadline (Opt)</span>
                    <input 
                      type="time" 
                      value={deadline}
                      onChange={(e) => setDeadline(e.target.value)}
                      className="w-full bg-surface-container-lowest border-none focus:ring-0 focus:border-b-2 focus:border-secondary border-b-2 border-outline-variant/10 p-4 font-headline text-lg tracking-tight text-on-surface outline-none"
                    />
                  </div>
                  <div className="flex items-end">
                    <label className="flex items-center gap-2 text-zinc-400 font-label text-xs uppercase tracking-widest cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={isDaily} 
                        onChange={(e) => setIsDaily(e.target.checked)} 
                        className="w-4 h-4 rounded border-zinc-600 bg-surface-container-lowest text-secondary focus:ring-secondary"
                      />
                      Daily Routine
                    </label>
                  </div>
                </div>

                {/* Daily Condition */}
                <div>
                  <span className="font-label text-[10px] text-zinc-500 uppercase tracking-[0.2em] mb-2 block">Daily Condition / Notes</span>
                  <textarea 
                    placeholder="e.g., I'm feeling tired today..." 
                    value={dailyCondition}
                    onChange={(e) => setDailyCondition(e.target.value)}
                    onBlur={() => saveDailyCondition(dailyCondition)}
                    className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded p-4 font-body text-sm text-on-surface placeholder:text-zinc-600 outline-none focus:border-secondary/50 min-h-[80px] resize-none"
                  />
                </div>

                {/* Model Selection Dropdown */}
                <div className="relative mb-4">
                  <span className="font-label text-[10px] text-zinc-500 uppercase tracking-[0.2em] mb-2 block">AI Engine Selection</span>
                  <div 
                    onClick={() => setShowModelDropdown(!showModelDropdown)}
                    className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded p-4 font-headline text-sm text-on-surface flex items-center justify-between cursor-pointer hover:border-primary/50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-sm">neurology</span>
                      <span className="uppercase tracking-widest">{selectedModel.replace(/-/g, ' ').replace('models/', '').toUpperCase()}</span>
                    </div>
                    <span className="material-symbols-outlined transition-transform duration-300" style={{ transform: showModelDropdown ? 'rotate(180deg)' : 'rotate(0)' }}>expand_more</span>
                  </div>
                  
                  {showModelDropdown && (
                    <div className="absolute bottom-full left-0 w-full mb-2 bg-surface-container-high border border-outline-variant/30 rounded-lg shadow-2xl z-50 overflow-hidden animate-fade-in-up">
                      {[
                        { id: 'All Models', label: 'All Models' },
                        { id: 'gemini-3.1-flash-live-preview', label: 'Gemini 3.1 Flash' },
                        { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
                        { id: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro' },
                        { id: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash' }
                      ].map((m) => (
                        <div 
                          key={m.id}
                          onClick={() => { setSelectedModel(m.id); setShowModelDropdown(false); }}
                          className={`px-4 py-3 hover:bg-primary/10 cursor-pointer flex items-center justify-between group transition-colors ${selectedModel === m.id ? 'bg-primary/20' : ''}`}
                        >
                          <span className={`font-headline text-xs uppercase tracking-widest ${selectedModel === m.id ? 'text-primary' : 'text-zinc-400 group-hover:text-zinc-200'}`}>
                            {m.label}
                          </span>
                          {selectedModel === m.id && <span className="material-symbols-outlined text-primary text-sm">check</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4">
                  <button 
                    type="button"
                    onClick={generateSchedule}
                    disabled={loading || tasks.filter(t => t.status === 'pending').length === 0}
                    className="bg-primary/10 hover:bg-primary/20 border border-primary/30 text-primary py-4 font-headline font-bold text-sm tracking-widest uppercase transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="material-symbols-outlined">auto_awesome</span>
                    {loading ? 'GENERATING...' : 'GENERATE_AI_SCHEDULE'}
                  </button>
                  <button 
                    type="button"
                    onClick={() => navigate('/calendar', { state: { date: targetDate } })}
                    className="bg-surface-container-lowest hover:bg-surface-container hover:text-on-surface border border-outline-variant/20 text-zinc-400 py-4 font-headline font-bold text-sm tracking-widest uppercase transition-all flex items-center justify-center gap-3"
                  >
                    <span className="material-symbols-outlined">visibility</span>
                    VIEW_SCHEDULE
                  </button>
                </div>

                <button 
                  type="submit"
                  className="w-full bg-primary text-on-primary py-6 rounded-lg font-headline font-black text-xl tracking-[0.3em] uppercase shadow-[0_0_30px_rgba(221,183,255,0.3)] hover:shadow-[0_0_40px_rgba(221,183,255,0.5)] transition-all flex items-center justify-center gap-4 group"
                >
                  INITIALIZE_TASK
                  <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">rocket_launch</span>
                </button>
              </form>
            </div>

            {/* Daily Condition Metrics */}
            <div className="bg-surface-container-low p-6 rounded-xl rounded-br-sm hud-border-purple relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5">
                <span className="material-symbols-outlined text-8xl">analytics</span>
              </div>
              <h3 className="font-headline font-bold text-xs uppercase tracking-[0.2em] text-zinc-400 mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-sm text-primary">monitor_heart</span>
                Daily Condition Metrics
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="font-label text-[10px] text-zinc-500 uppercase tracking-widest">Energy Level</span>
                      <span className="font-headline font-bold text-[10px] text-tertiary">
                        {dailyMood === 'Happy' ? '90%' : dailyMood === 'OK' ? '65%' : '40%'}
                      </span>
                    </div>
                    <div className="h-2 bg-surface-container-lowest rounded-full overflow-hidden flex gap-0.5">
                      <div 
                        className="h-full bg-tertiary transition-all duration-500" 
                        style={{ width: dailyMood === 'Happy' ? '90%' : dailyMood === 'OK' ? '65%' : '40%' }}
                      ></div>
                      <div 
                        className="h-full bg-zinc-800 transition-all duration-500" 
                        style={{ width: dailyMood === 'Happy' ? '10%' : dailyMood === 'OK' ? '35%' : '60%' }}
                      ></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="font-label text-[10px] text-zinc-500 uppercase tracking-widest">Focus Capacity</span>
                      <span className="font-headline font-bold text-[10px] text-secondary">
                        {dailyMood === 'Happy' ? '85%' : dailyMood === 'OK' ? '60%' : '35%'}
                      </span>
                    </div>
                    <div className="h-2 bg-surface-container-lowest rounded-full overflow-hidden flex gap-0.5">
                      <div 
                        className="h-full bg-secondary transition-all duration-500" 
                        style={{ width: dailyMood === 'Happy' ? '85%' : dailyMood === 'OK' ? '60%' : '35%' }}
                      ></div>
                      <div 
                        className="h-full bg-zinc-800 transition-all duration-500" 
                        style={{ width: dailyMood === 'Happy' ? '15%' : dailyMood === 'OK' ? '40%' : '65%' }}
                      ></div>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col justify-between">
                  <div 
                  onClick={() => {
                    const moods = ['Happy', 'OK', 'Tired/Sad'];
                    const currentIndex = moods.indexOf(dailyMood);
                    const nextMood = moods[(currentIndex + 1) % moods.length];
                    setDailyMood(nextMood);
                    const docRef = doc(db, 'users', currentUser.uid, 'dailyContext', targetDate);
                    setDoc(docRef, { mood: nextMood, updatedAt: serverTimestamp() }, { merge: true });
                  }}
                  className="flex items-center gap-4 bg-surface-container-lowest p-4 rounded border border-outline-variant/10 cursor-pointer hover:border-tertiary/50 transition-colors group"
                >
                  <div className="w-12 h-12 rounded-lg bg-tertiary/10 flex items-center justify-center text-tertiary group-hover:bg-tertiary/20 transition-colors">
                    <span className="material-symbols-outlined text-3xl">
                      {dailyMood === 'Happy' ? 'sentiment_very_satisfied' : dailyMood === 'OK' ? 'sentiment_neutral' : 'sentiment_dissatisfied'}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="font-label text-[10px] text-zinc-500 uppercase tracking-widest">Mood Profile (Click to Change)</p>
                    <p className="font-headline font-bold text-on-surface uppercase tracking-tighter">{dailyMood ? dailyMood.toUpperCase() : 'NOT_RECORDED'}</p>
                  </div>
                  <span className="material-symbols-outlined text-zinc-600 group-hover:text-tertiary transition-colors">edit</span>
                </div>
                  <div className="mt-4">
                    <span className="font-label text-[10px] text-zinc-500 uppercase tracking-widest block mb-2">Condition Note</span>
                    <p className="text-xs text-zinc-400 font-body leading-relaxed border-l-2 border-primary pl-4 italic">
                      {dailyCondition || 'No condition notes recorded for this date.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel: HUD Backlog & Habits */}
          <div className="col-span-12 lg:col-span-5 space-y-8">
            {/* Backlog Section */}
            <div className="bg-surface-container-low border border-white/5 rounded-xl rounded-tl-sm flex flex-col h-[300px]">
              <div className="p-6 border-b border-white/5 flex justify-between items-center bg-surface-container-high/30">
                <h3 className="font-headline font-bold text-xs uppercase tracking-[0.2em] text-zinc-300 flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm text-secondary">inventory_2</span>
                  Your Backlog
                </h3>
                <span className="bg-zinc-800 text-zinc-500 text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                  {tasks.filter(t => t.status === 'pending').length} Pending
                </span>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {tasks.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                    <div className="w-16 h-16 rounded-full border-2 border-dashed border-zinc-800 flex items-center justify-center mb-4">
                      <span className="material-symbols-outlined text-zinc-800 text-3xl">inbox</span>
                    </div>
                    <p className="font-headline text-zinc-600 uppercase text-[10px] tracking-widest font-bold">CLEAN_SLATE</p>
                    <p className="text-[10px] text-zinc-700 mt-1 max-w-[200px]">NO PENDING TASKS DETECTED IN LOCAL REPOSITORY</p>
                  </div>
                ) : (
                  tasks.map(t => (
                    <div key={t.id} className={`p-4 rounded-lg border transition-all flex items-center justify-between ${t.status === 'completed' ? 'bg-surface-container-lowest/50 border-white/5 opacity-60' : 'bg-surface-container-lowest border-white/10'}`}>
                      <div>
                        <h4 className={`font-semibold text-sm ${t.status === 'completed' ? 'line-through text-zinc-500' : 'text-on-surface'}`}>{t.task}</h4>
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-semibold text-zinc-500 uppercase">Est. Time: {t.estimatedHours || t.duration}h</span>
                          {t.deadline && <span className="text-[10px] font-semibold text-secondary uppercase bg-secondary/10 px-1 rounded">Dead: {t.deadline}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => handleToggleComplete(t.id, t.status)}
                          className={`p-2 rounded border transition-colors ${t.status === 'completed' ? 'bg-tertiary border-tertiary text-on-tertiary' : 'border-zinc-700 text-zinc-500 hover:text-tertiary hover:border-tertiary'}`}
                        >
                          <span className="material-symbols-outlined text-lg">check</span>
                        </button>
                        <button 
                          onClick={() => handleDelete(t.id)}
                          className="p-2 border border-transparent text-zinc-500 hover:bg-error/10 hover:text-error rounded transition-colors"
                        >
                          <span className="material-symbols-outlined text-lg">delete</span>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Habits Section */}
            <div className="bg-surface-container-low border border-white/5 rounded-xl rounded-tl-sm flex flex-col h-[300px]">
              <div className="p-6 border-b border-white/5 flex justify-between items-center bg-surface-container-high/30">
                <h3 className="font-headline font-bold text-xs uppercase tracking-[0.2em] text-zinc-300 flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm text-tertiary">cached</span>
                  Daily Habits
                </h3>
                <span className="bg-zinc-800 text-zinc-500 text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                  {routines.length} Fixed
                </span>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {routines.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                    <div className="w-16 h-16 rounded-full border-2 border-dashed border-zinc-800 flex items-center justify-center mb-4">
                      <span className="material-symbols-outlined text-zinc-800 text-3xl">refresh</span>
                    </div>
                    <p className="font-headline text-zinc-600 uppercase text-[10px] tracking-widest font-bold">ZERO_ROUTINES</p>
                    <p className="text-[10px] text-zinc-700 mt-1 max-w-[200px]">STABILIZE YOUR HUD BY DEFINING RECURRING PROTOCOLS</p>
                  </div>
                ) : (
                  routines.map(r => {
                    const isCompleted = completedRoutines.includes(r.id);
                    const isSkipped = skippedRoutines.includes(r.id);
                    return (
                      <div key={r.id} className={`p-4 rounded-lg border transition-all flex items-center justify-between ${isCompleted ? 'bg-surface-container-lowest/50 border-white/5 opacity-60' : isSkipped ? 'bg-surface-container-lowest border-zinc-700/30 opacity-40 grayscale' : 'bg-surface-container-lowest border-white/10'}`}>
                        <div>
                          <h4 className={`font-semibold text-sm ${isCompleted || isSkipped ? 'line-through text-zinc-500' : 'text-on-surface'}`}>{r.task}</h4>
                          <div className="flex items-center gap-3 mt-1">
                            {isSkipped ? (
                                <span className="text-[10px] font-semibold text-error/80 uppercase">SKIPPED</span>
                            ) : (
                                <span className="text-[10px] font-semibold text-zinc-500 uppercase">Est. Time: {r.estimatedHours || r.duration}h</span>
                            )}
                            {r.deadline && <span className="text-[10px] font-semibold text-secondary uppercase bg-secondary/10 px-1 rounded">Dead: {r.deadline}</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => handleToggleRoutineSkip(r.id)}
                            className={`p-2 rounded border transition-colors ${isSkipped ? 'bg-zinc-800 border-zinc-700 text-zinc-400' : 'border-primary/30 text-primary hover:bg-primary/10'}`}
                            title={isSkipped ? "Include in Schedule" : "Skip for Today"}
                          >
                            <span className="material-symbols-outlined text-lg">{isSkipped ? 'visibility_off' : 'visibility'}</span>
                          </button>
                          <button 
                            onClick={() => handleToggleRoutineComplete(r.id)}
                            disabled={isSkipped}
                            className={`p-2 rounded border transition-colors ${isCompleted ? 'bg-tertiary border-tertiary text-on-tertiary' : 'border-zinc-700 text-zinc-500 hover:text-tertiary hover:border-tertiary disabled:opacity-50'}`}
                          >
                            <span className="material-symbols-outlined text-lg">check</span>
                          </button>
                          <button 
                            onClick={() => handleDeleteRoutine(r.id)}
                            className="p-2 border border-transparent text-zinc-500 hover:bg-error/10 hover:text-error rounded transition-colors"
                          >
                            <span className="material-symbols-outlined text-lg">delete</span>
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Quick Stats Mini-HUD */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-surface-container-lowest p-4 border border-outline-variant/10 rounded">
                <span className="font-label text-[9px] text-zinc-500 uppercase block mb-1">Pending Tasks</span>
                <span className="font-headline font-bold text-xl text-secondary">{tasks.filter(t => t.status === 'pending').length}</span>
              </div>
              <div className="bg-surface-container-lowest p-4 border border-outline-variant/10 rounded">
                <span className="font-label text-[9px] text-zinc-500 uppercase block mb-1">Routines</span>
                <span className="font-headline font-bold text-xl text-tertiary">{routines.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default TasksPage;
