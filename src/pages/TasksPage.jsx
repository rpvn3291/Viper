import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, query, onSnapshot, doc, getDoc, setDoc, addDoc, serverTimestamp, updateDoc, deleteDoc, where } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { GoogleGenAI } from '@google/genai';
import { Plus, Check, Trash2, RefreshCcw, Settings, LogOut } from 'lucide-react';

const TasksPage = () => {
  const { currentUser, logOut } = useAuth();
  const navigate = useNavigate();
  
  const [tasks, setTasks] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [newTask, setNewTask] = useState('');
  const [estimatedHours, setEstimatedHours] = useState(1);
  const [targetDate, setTargetDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [isDaily, setIsDaily] = useState(false);
  const [routines, setRoutines] = useState([]);
  const [dailyCondition, setDailyCondition] = useState("");
  const [dailyMood, setDailyMood] = useState(null);

  // Initial Fetching
  useEffect(() => {
    if (!currentUser) return;
    
    // Fetch Profile first for redirection logic
    getDoc(doc(db, 'users', currentUser.uid, 'profile', 'config'))
      .then(snap => {
        if (snap.exists()) {
          setProfile(snap.data());
        } else {
          // No profile found, redirect to questionnaire
          navigate('/setup');
        }
      })
      .catch((err) => {
        console.error("Firestore Error:", err);
      });

    // Listen to Tasks explicitly scoped to the viewing Date
    const qTasks = query(
      collection(db, 'users', currentUser.uid, 'tasks'),
      where('date', '==', targetDate)
    );
    const unsubscribeTasks = onSnapshot(qTasks, (snapshot) => {
      const tsks = [];
      snapshot.forEach(doc => tsks.push({ id: doc.id, ...doc.data() }));
      // sort by created at descending
      tsks.sort((a, b) => b.createdAt?.toMillis() - a.createdAt?.toMillis());
      setTasks(tsks);
    });

    // Listen to Daily Routines
    const qRoutines = query(collection(db, 'users', currentUser.uid, 'routines'));
    const unsubscribeRoutines = onSnapshot(qRoutines, (snapshot) => {
      const rts = [];
      snapshot.forEach(doc => rts.push({ id: doc.id, ...doc.data() }));
      setRoutines(rts);
    });

    // Fetch Daily Context (mood & condition) for the target date
    const fetchDailyContext = async () => {
      try {
        const docRef = doc(db, 'users', currentUser.uid, 'dailyContext', targetDate);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setDailyCondition(docSnap.data().extraCondition || "");
          setDailyMood(docSnap.data().mood || null);
        } else {
          setDailyCondition("");
          setDailyMood(null);
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

  // Task Actions
  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newTask.trim()) return;

    try {
      if (isDaily) {
        await addDoc(collection(db, 'users', currentUser.uid, 'routines'), {
          task: newTask,
          duration: estimatedHours,
          createdAt: serverTimestamp()
        });
        setIsDaily(false);
      } else {
        await addDoc(collection(db, 'users', currentUser.uid, 'tasks'), {
          task: newTask,
          priority: "normal",
          duration: estimatedHours,
          status: "pending",
          date: targetDate, // Strictly bind to target Date
          createdAt: serverTimestamp()
        });
      }
      setNewTask('');
      setEstimatedHours(1);
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

  const handleDeleteRoutine = async (routineId) => {
    await deleteDoc(doc(db, 'users', currentUser.uid, 'routines', routineId));
  };

  // AI Generation
  const generateSchedule = async () => {
    if (!profile || tasks.filter(t => t.status === 'pending').length === 0) {
      alert("Please add some pending tasks to generate a schedule!");
      return;
    }

    setLoading(true);
    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) {
        alert("Please set VITE_GEMINI_API_KEY in your .env file!");
        setLoading(false);
        return;
      }
      
      const ai = new GoogleGenAI({ apiKey });

      const pendingTasks = tasks.filter(t => t.status === 'pending').map(t => ({
        taskId: t.id,
        task: t.task,
        duration: Number(t.duration)
      }));

      const payload = {
        targetDate,
        dailyMood: dailyMood || 'Not specified',
        extraCondition: dailyCondition || 'None',
        tasks: pendingTasks,
        dailyRoutines: routines.map(r => ({ task: r.task, duration: Number(r.duration) })),
        userProfile: {
          startTime: Number(profile.startTime),
          peakTime: profile.peakTime,
          preference: profile.preference,
          availableHours: Number(profile.availableHours),
          blockedTime: profile.blockedTime,
          sleepTime: profile.sleepTime,
          workStyle: profile.workStyle || 'deep-work',
          chronotype: profile.chronotype || 'early-bird',
          hobbies: profile.hobbies || '',
          dislikes: profile.dislikes || ''
        },
        history: tasks.filter(t => t.status === 'completed' || t.status === 'missed').map(t => ({
          task: t.task,
          status: t.status
        })).slice(0, 10)
      };

      const prompt = `
        You are an expert AI Life Scheduler. Analyze the following user profile, target date, task backlog, daily routines, history, and the user's current condition:
        ${JSON.stringify(payload)}

        The user has declared their mood for today is: ${dailyMood ? `"${dailyMood}"` : 'neutral'}.
        They have provided extra instructions/conditions for today: "${dailyCondition ? dailyCondition : 'None'}".
        You MUST accommodate this mood and condition. For instance, if they are tired, lack interest, or feel sad, you should space out tasks, include ample breaks, or avoid packing the schedule. If they are happy or energetic, you can bunch challenging tasks during peak times.


        Your job is to act as a calendar engine for the targetDate: ${targetDate}.
        Assign a precise 'start' and 'end' time (in 24-hour decimal format, e.g., 8.5 for 08:30 or 14.25 for 14:15) for every standard task AND every daily routine.
        
        RULES:
        1. Base your scheduling around the user's Chronotype ('early-bird', 'night-owl', etc.) and Peak Productivity Time.
        2. NEVER schedule any tasks or routines during the user's sleepTime (start to end).
        3. NEVER schedule personal tasks during the user's professional blockedTime (but professional/work tasks can be scheduled here if explicit). If there is no specific professional task, do not schedule anything in blockedTime.
        4. Do not just list them sequentially. Consider what the task/routine is. For example, align sleep-related routines with sleepTime.
        4. Spread tasks out intelligently if their workStyle is 'pomodoro', or group them if 'deep-work'.
        5. Observe the task history: if they notoriously 'miss' a specific task, try scheduling it during their Peak Productivity Time.
        6. You must schedule EVERY task in the pending backlog PLUS EVERY routine inside the dailyRoutines array.
        7. The 'taskId' should be returned exactly as provided (if any). Daily routines will not have a taskId, do not invent one.

        Output EXACTLY valid JSON matching the following schema, nothing else, no markdown formatting:
        [
          { "task": "Task Name", "start": 8.5, "end": 10.0, "priority": "high", "taskId": "abc" },
          { "task": "Gym", "start": 17.0, "end": 18.0, "priority": "medium" }
        ]
      `;

      const modelsToTry = [
        'gemini-3-flash-preview',
        'gemini-2.5-flash',
        'gemini-2.0-flash',
        'gemini-1.5-flash'
      ];

      let result = null;
      let usedModel = '';

      for (const modelName of modelsToTry) {
        console.log(`🚀 Sending request to Gemini using model: ${modelName}...`);
        try {
          result = await ai.models.generateContent({
            model: modelName,
            contents: prompt
          });
          usedModel = modelName;
          console.log(`✅ Successfully received response from exactly this model: ${usedModel}!`);
          break; // Stop looping once we get a successful response
        } catch (error) {
          console.warn(`⚠️ Model ${modelName} failed (likely high demand or 503). Attempting fallback... Error message:`, error.message);
        }
      }

      // If every single model fails
      if (!result) {
        throw new Error("All backup Gemini models are currently overloaded. Please try again later.");
      }
      
      const responseText = result.text.trim();
      let newSchedule = [];
      try {
        let cleanJson = responseText.replace(/^```json/g, '').replace(/```$/g, '').trim();
        newSchedule = JSON.parse(cleanJson);
      } catch(e) {
        console.error("AI Output failed to parse:", responseText);
        alert("AI returned invalid data. Please try again.");
        return;
      }

      console.log("🧠 Writing smart timestamped schedule to database...");

      if(newSchedule.length > 0) {
        await setDoc(doc(db, 'users', currentUser.uid, 'schedule', targetDate), {
          items: newSchedule,
          generatedAt: new Date().toISOString()
        });
        // Immediately redirect to dashboard/calendar
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
    <div className="min-h-screen bg-slate-50 relative p-6 font-sans flex flex-col items-center">
      {/* Top Navbar */}
      <div className="w-full max-w-4xl flex justify-between items-center mb-8 bg-white p-4 px-6 rounded-2xl shadow-sm border border-slate-100">
        <h1 className="text-2xl font-black text-slate-800 tracking-tight">VIPER Task Management</h1>
        <div className="flex gap-4">
          <button onClick={() => navigate('/settings')} className="text-slate-500 hover:text-primary-600 flex items-center gap-2 font-medium transition">
            <Settings className="w-5 h-5" /> Settings
          </button>
          <button onClick={() => { logOut(); navigate('/'); }} className="text-slate-500 hover:text-red-500 flex items-center gap-2 font-medium transition">
            <LogOut className="w-5 h-5" /> Logout
          </button>
        </div>
      </div>

      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Left Column: Form & Actions */}
        <div className="md:col-span-1 flex flex-col gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h2 className="text-xl font-bold text-slate-800 mb-4 flex justify-between items-center">
              Target Date
            </h2>
            <input 
              type="date" 
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="w-full bg-slate-50 p-3 rounded-xl border border-slate-200 focus:border-primary-500 outline-none transition-colors font-semibold text-slate-700"
            />
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h2 className="text-xl font-bold text-slate-800 mb-4">Add Task</h2>
            <form onSubmit={handleAdd} className="flex flex-col gap-3">
              <input 
                type="text" 
                placeholder="e.g. Study Programming" 
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
                className="w-full bg-slate-50 p-3 rounded-xl border border-slate-200 focus:border-primary-500 outline-none transition-colors"
                required
              />
              <div className="flex gap-2">
                <input 
                  type="number" 
                  min="0.5" step="0.5" 
                  placeholder="Hours" 
                  value={estimatedHours}
                  onChange={(e) => setEstimatedHours(Number(e.target.value))}
                  className="w-full bg-slate-50 p-3 rounded-xl border border-slate-200 focus:border-primary-500 outline-none transition-colors"
                  required
                />
                <button type="submit" className="bg-primary-600 hover:bg-primary-700 text-white p-3 rounded-xl flex items-center justify-center transition-colors shadow-lg shadow-primary-600/20">
                  <Plus className="w-5 h-5" />
                </button>
              </div>
              <label className="flex items-center gap-2 mt-1 text-slate-600 font-semibold cursor-pointer select-none">
                <input type="checkbox" checked={isDaily} onChange={(e) => setIsDaily(e.target.checked)} className="w-5 h-5 rounded border-slate-300 text-primary-600 focus:ring-primary-500 cursor-pointer"/>
                Repeat Daily <span className="text-xs text-slate-400 font-normal">(Permanent Habit)</span>
              </label>
            </form>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h2 className="text-xl font-bold text-slate-800 mb-2">Daily Condition</h2>
            {dailyMood && (
              <div className="mb-3 text-sm font-semibold text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-200 inline-block">
                Recorded Mood: <span className="text-primary-600 font-bold">{dailyMood}</span>
              </div>
            )}
            <textarea 
              placeholder="e.g., I'm feeling tired today, please keep work light..." 
              value={dailyCondition}
              onChange={(e) => setDailyCondition(e.target.value)}
              onBlur={() => saveDailyCondition(dailyCondition)}
              className="w-full bg-slate-50 p-3 rounded-xl border border-slate-200 focus:border-primary-500 outline-none transition-colors min-h-[100px] resize-none text-slate-700 font-medium"
            />
          </div>

          <button 
            onClick={generateSchedule}
            disabled={loading || tasks.filter(t => t.status === 'pending').length === 0}
            className={`w-full flex items-center justify-center gap-3 bg-slate-900 hover:bg-black text-white font-bold py-4 rounded-2xl transition-all shadow-xl shadow-slate-900/20 ${(loading || tasks.filter(t => t.status === 'pending').length === 0) && 'opacity-70 cursor-not-allowed'}`}
          >
            <RefreshCcw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Generating AI Schedule...' : 'Generate Today\'s AI Schedule'}
          </button>

          <button 
            onClick={() => navigate('/calendar', { state: { date: targetDate } })}
            className="w-full flex items-center justify-center gap-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold py-3 rounded-2xl transition-all shadow-sm"
          >
            View Existing Schedule
          </button>
        </div>

        <div className="md:col-span-2 flex flex-col gap-6">
          {/* Backlog Box */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col max-h-[50vh]">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800">Your Backlog <span className="text-sm font-normal text-slate-400 ml-2">({targetDate})</span></h2>
              <span className="bg-primary-100 text-primary-700 px-3 py-1 rounded-full text-sm font-bold">
                {tasks.filter(t => t.status === 'pending').length} Pending
              </span>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-3">
              {tasks.map(t => (
                <div key={t.id} className={`p-4 rounded-xl border transition-all ${t.status === 'completed' ? 'bg-slate-50 border-slate-100 opacity-60' : 'bg-white border-slate-200 shadow-sm hover:border-primary-200'}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <h4 className={`font-semibold ${t.status === 'completed' ? 'line-through text-slate-400' : 'text-slate-800'}`}>{t.task}</h4>
                      <div className="flex gap-2 mt-2">
                        <span className="text-xs font-semibold bg-slate-100 text-slate-500 px-2.5 py-1 rounded-lg">Duration: {t.duration}h</span>
                        {t.priority !== 'normal' && <span className="text-xs font-semibold bg-amber-100 text-amber-700 px-2.5 py-1 rounded-lg">Priority: {t.priority}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handleToggleComplete(t.id, t.status)}
                        className={`p-2.5 rounded-full border transition-colors ${t.status === 'completed' ? 'bg-green-500 border-green-500 text-white' : 'border-slate-200 text-slate-400 hover:text-green-500 hover:border-green-500'}`}
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(t.id)}
                        className="p-2.5 rounded-full border border-transparent text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {tasks.length === 0 && (
                <div className="text-center text-slate-400 py-10 flex flex-col items-center">
                  <div className="bg-slate-100 p-4 rounded-full mb-4">
                    <Check className="w-8 h-8 text-slate-300" />
                  </div>
                  <p className="font-semibold text-lg">No one-off tasks today.</p>
                </div>
              )}
            </div>
          </div>

          {/* Daily Habits Box */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col max-h-[30vh]">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-800">Daily Habits</h2>
              <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold">
                {routines.length} Fixed
              </span>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {routines.map(r => (
                <div key={r.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-slate-700">{r.task}</h4>
                    <span className="text-xs font-semibold text-slate-500">Duration: {r.duration}h</span>
                  </div>
                  <button onClick={() => handleDeleteRoutine(r.id)} className="p-2 text-slate-400 hover:text-red-500 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {routines.length === 0 && (
                <div className="text-center text-slate-400 py-6 text-sm">
                  Add a task and check "Repeat Daily" to save a habit.
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default TasksPage;
