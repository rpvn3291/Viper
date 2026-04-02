import React, { useRef, useEffect, useState } from 'react';
import { RefreshCcw, LogOut, Check, X } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { db } from '../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';

const decimalToTime = (decimalHour) => {
  const hrs = Math.floor(decimalHour);
  const mins = Math.round((decimalHour - hrs) * 60);
  const period = hrs >= 12 ? 'PM' : 'AM';
  const displayHrs = hrs % 12 || 12;
  const displayMins = mins.toString().padStart(2, '0');
  return `${displayHrs}:${displayMins} ${period}`;
};

const CalendarGrid = ({ schedule = [], onGenerate, loading, logOut, selectedDate = format(new Date(), 'yyyy-MM-dd') }) => {
  const scrollRef = useRef(null);
  const { currentUser } = useAuth();
  const [updating, setUpdating] = useState(false);

  // Time grid layout: 24 hours
  const hours = Array.from({ length: 24 }).map((_, i) => i);
  const displayDate = parseISO(selectedDate);

  // Auto-scroll to current hour (e.g., 9 AM)
  useEffect(() => {
    if (scrollRef.current) {
      const currentHour = new Date().getHours();
      scrollRef.current.scrollTop = Math.max(0, currentHour * 60 - 100);
    }
  }, [selectedDate]);

  const handleStatusChange = async (targetBlock, newStatus) => {
    if (!currentUser || updating) return;
    setUpdating(true);
    
    try {
      // 1. Update the actual Task doc in history
      if (targetBlock.taskId) {
        await updateDoc(doc(db, 'users', currentUser.uid, 'tasks', targetBlock.taskId), {
          status: newStatus
        });
      }

      // 2. Update the Schedule explicitly so it renders the Checkmark/Cross natively in this view
      const scheduleRef = doc(db, 'users', currentUser.uid, 'schedule', selectedDate);
      const snap = await getDoc(scheduleRef);
      if (snap.exists()) {
        const data = snap.data();
        const updatedItems = data.items.map(b => 
          (b.task === targetBlock.task && b.start === targetBlock.start)
            ? { ...b, blockStatus: newStatus } 
            : b
        );
        await updateDoc(scheduleRef, { items: updatedItems });
      }

    } catch (err) {
      console.error("Failed to update status:", err);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-screen bg-slate-50 relative">
      {/* Top Bar */}
      <div className="bg-white h-16 border-b border-slate-200 px-6 flex items-center justify-between shadow-sm z-20 pl-64">
        <h1 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
          <span>AI Scheduler</span>
        </h1>
        <div className="flex gap-4">
          <button 
            onClick={onGenerate}
            disabled={loading}
            className={`flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-bold py-2.5 px-6 rounded-full transition-all shadow-md shadow-primary-500/20 ${loading && 'opacity-75 cursor-not-allowed'}`}
          >
            <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Thinking...' : 'Recalculate'}
          </button>
          <button onClick={logOut} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Calendar Header */}
      <div className="bg-white border-b border-slate-200 flex pl-20 shadow-sm z-10 sticky top-0">
         <div className="flex-1 py-4 text-center">
           <p className="text-xs font-bold uppercase tracking-widest text-primary-600">
             {format(displayDate, 'EEEE')}
           </p>
           <div className="mt-1 flex flex-col items-center justify-center mx-auto w-10 h-10 bg-primary-600 text-white rounded-full shadow-lg shadow-primary-500/30">
              <span className="text-xl font-bold font-sans">{format(displayDate, 'd')}</span>
           </div>
         </div>
      </div>

      {/* Grid Content */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto w-full flex bg-slate-50 pb-24"
      >
        {/* Time axis */}
        <div className="w-20 shrink-0 border-r border-slate-200 bg-white shadow-[2px_0_10px_rgba(0,0,0,0.01)] z-10">
          {hours.map((hr) => (
            <div key={hr} className="h-[72px] border-b border-slate-100 relative pt-2 text-right pr-4 group">
              <span className="text-xs font-semibold text-slate-400">
                {hr === 0 ? '12 AM' : hr < 12 ? `${hr} AM` : hr === 12 ? '12 PM' : `${hr-12} PM`}
              </span>
            </div>
          ))}
        </div>

        {/* Column Area */}
        <div className="flex-1 flex relative">
          <div className="flex-1 relative">
            {hours.map((hr) => (
              <div key={`grid-${hr}`} className="h-[72px] border-b border-dashed border-slate-200" />
            ))}

            {schedule.map((block, idx) => {
              const isCompleted = block.blockStatus === 'completed';
              const isMissed = block.blockStatus === 'missed';
              
              let bgStyle = "bg-gradient-to-r from-primary-50 to-indigo-50 border-l-4 border-primary-500";
              if (isCompleted) bgStyle = "bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-500 opacity-80";
              if (isMissed) bgStyle = "bg-gradient-to-r from-red-50 to-rose-50 border-l-4 border-red-500 opacity-60";

              return (
                <div 
                  key={idx}
                  className={`absolute left-2 right-4 ${bgStyle} rounded-lg p-3 overflow-hidden shadow-sm flex flex-col group transition-all`}
                  style={{
                    top: `${block.start * 72}px`,
                    height: `${(block.end - block.start) * 72}px`
                  }}
                >
                  <div className="flex justify-between items-start">
                    <h4 className={`text-sm font-bold truncate leading-tight ${isCompleted ? 'text-green-800 line-through' : isMissed ? 'text-red-800' : 'text-slate-800'}`}>
                      {block.task}
                    </h4>
                    
                    {/* Action Buttons Overlay (shown on hover if not acted upon yet) */}
                    {!isCompleted && !isMissed && (
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white/50 backdrop-blur-sm rounded-lg p-0.5 shadow-sm">
                        <button 
                          onClick={() => handleStatusChange(block, 'completed')}
                          disabled={updating}
                          className="p-1 text-green-600 hover:bg-green-100 rounded-md transition"
                          title="Mark Done"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => handleStatusChange(block, 'missed')}
                          disabled={updating}
                          className="p-1 text-red-600 hover:bg-red-100 rounded-md transition"
                          title="Mark Missed"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                  
                  <span className={`text-xs font-medium mt-auto ${isCompleted ? 'text-green-600' : isMissed ? 'text-red-600' : 'text-primary-600'}`}>
                    {decimalToTime(block.start)} - {decimalToTime(block.end)}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Current Time Line (Only show if date is today) */}
          {selectedDate === format(new Date(), 'yyyy-MM-dd') && (
            <div className="absolute left-0 w-full flex items-center z-10 pointer-events-none" style={{ top: `${new Date().getHours() * 72 + (new Date().getMinutes() / 60) * 72}px` }}>
              <div className="w-3 h-3 bg-red-500 rounded-full border-2 border-white -ml-2" />
              <div className="h-0.5 w-full bg-gradient-to-r from-red-500 to-red-300 shadow-[0_2px_4px_rgba(239,68,68,0.3)]" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CalendarGrid;
