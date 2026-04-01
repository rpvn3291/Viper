import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { format } from 'date-fns';
import { useNavigate, useLocation } from 'react-router-dom';
import CalendarGrid from '../components/CalendarGrid';
import { ArrowLeft, Calendar as CalendarIcon } from 'lucide-react';

const Dashboard = () => {
  const { currentUser, logOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Default to the date passed from TasksPage, or today
  const [selectedDate, setSelectedDate] = useState(
    location.state?.date || format(new Date(), 'yyyy-MM-dd')
  );
  
  const [schedule, setSchedule] = useState([]);

  useEffect(() => {
    if (!currentUser) return;
    
    // Listen to the selected date's schedule
    const unsubscribeSchedule = onSnapshot(doc(db, 'users', currentUser.uid, 'schedule', selectedDate), (docSnap) => {
      if (docSnap.exists()) {
        setSchedule(docSnap.data().items || []);
      } else {
        setSchedule([]); // clear if no schedule exists
      }
    });

    return () => unsubscribeSchedule();
  }, [currentUser, selectedDate]);

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans relative">
      {/* Small floating header */}
      <div className="absolute top-4 left-6 flex items-center gap-4 z-50">
        <button 
          onClick={() => navigate('/tasks')} 
          className="flex items-center gap-2 text-slate-500 hover:text-slate-900 bg-white/70 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm border border-slate-200 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Tasks
        </button>
        
        <div className="flex items-center gap-2 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm border border-slate-200">
          <CalendarIcon className="w-4 h-4 text-primary-500" />
          <input 
            type="date" 
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-transparent border-none outline-none text-sm font-semibold text-slate-700 cursor-pointer"
          />
        </div>
      </div>

      {/* CalendarGrid handles the UI */}
      <CalendarGrid 
        schedule={schedule} 
        onGenerate={() => navigate('/tasks')} 
        loading={false}
        logOut={logOut}
        selectedDate={selectedDate}
      />
    </div>
  );
};

export default Dashboard;
