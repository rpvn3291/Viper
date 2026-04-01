import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, query, onSnapshot, doc, getDoc, setDoc } from 'firebase/firestore';
import { format } from 'date-fns';
import TaskSidebar from '../components/TaskSidebar';
import CalendarGrid from '../components/CalendarGrid';

// Import Google AI SDK
import { GoogleGenerativeAI } from '@google/generative-ai';

const Dashboard = () => {
  const { currentUser, logOut } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [profile, setProfile] = useState(null);
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!currentUser) return;
    
    // Listen to tasks
    const qTasks = query(collection(db, 'users', currentUser.uid, 'tasks'));
    const unsubscribeTasks = onSnapshot(qTasks, (snapshot) => {
      const tsks = [];
      snapshot.forEach(doc => tsks.push({ id: doc.id, ...doc.data() }));
      setTasks(tsks);
    });

    // Get current profile config
    getDoc(doc(db, 'users', currentUser.uid, 'profile', 'config')).then(snap => {
      if (snap.exists()) setProfile(snap.data());
    });

    // Listen to today's schedule
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const unsubscribeSchedule = onSnapshot(doc(db, 'users', currentUser.uid, 'schedule', todayStr), (docSnap) => {
      if (docSnap.exists()) {
        setSchedule(docSnap.data().items || []);
      }
    });

    return () => {
      unsubscribeTasks();
      unsubscribeSchedule();
    };
  }, [currentUser]);

  const generateSchedule = async () => {
    if (!profile || tasks.filter(t => t.status === 'pending').length === 0) {
      alert("Please configure your profile and add some pending tasks first!");
      return;
    }

    setLoading(true);
    try {
      // Setup Gemini AI (Needs VITE_GEMINI_API_KEY in .env)
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) {
        alert("Please set VITE_GEMINI_API_KEY in your .env file!");
        setLoading(false);
        return;
      }
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const pendingTasks = tasks.filter(t => t.status === 'pending').map(t => ({
        task: t.task,
        duration: t.duration
      }));

      const prompt = `
        You are an expert AI Scheduler. I have the following configuration:
        Start Time: ${profile.startTime}:00
        Available Hours: ${profile.availableHours}
        Peak Productivity Time: ${profile.peakTime}
        Preference: ${profile.preference}
        Blocked Time: ${profile.blockedTime.start}:00 to ${profile.blockedTime.end}:00 (DO NOT SCHEDULE HERE)

        Pending Tasks to Schedule (Task Name and Expected Duration in Hours):
        ${JSON.stringify(pendingTasks)}

        Return a JSON array ONLY mapping out the schedule for TODAY. Start from ${profile.startTime}:00.
        Each object should have:
        - "task": String (Name of the task)
        - "start": Number (start hour, e.g. 9 for 9:00 AM)
        - "end": Number (end hour, e.g. 11 for 11:00 PM)

        Rules:
        - Total hours cannot exceed ${profile.availableHours}.
        - Do not overlap tasks.
        - Respect blocked time.
        - Output EXACTLY valid JSON, nothing else, no markdown formatting.
      `;

      const result = await model.generateContent(prompt);
      const responseText = result.response.text().trim();
      let newSchedule = [];
      try {
        // Strip markdown backticks if any
        let cleanJson = responseText.replace(/^```json/g, '').replace(/```$/g, '').trim();
        newSchedule = JSON.parse(cleanJson);
      } catch(e) {
        console.error("AI Output failed to parse:", responseText);
        alert("AI returned invalid data. Please try again.");
      }

      // Save to Firestore
      if(newSchedule.length > 0) {
        const todayStr = format(new Date(), 'yyyy-MM-dd');
        await setDoc(doc(db, 'users', currentUser.uid, 'schedule', todayStr), {
          items: newSchedule,
          generatedAt: new Date().toISOString()
        });
      }

    } catch (err) {
      console.error(err);
      alert("Failed to generate schedule.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      <TaskSidebar tasks={tasks} userId={currentUser?.uid} />
      <CalendarGrid 
        schedule={schedule} 
        onGenerate={generateSchedule} 
        loading={loading}
        logOut={logOut}
      />
    </div>
  );
};

export default Dashboard;
