import React, { useRef, useEffect } from 'react';
import { RefreshCcw, LogOut } from 'lucide-react';
import { format, addDays, startOfToday, isSameDay } from 'date-fns';

const CalendarGrid = ({ schedule, onGenerate, loading, logOut }) => {
  const scrollRef = useRef(null);

  // Time grid layout: 24 hours
  const hours = Array.from({ length: 24 }).map((_, i) => i);
  const today = startOfToday();
  const days = [today, addDays(today, 1), addDays(today, 2)];

  // Auto-scroll to current hour (e.g., 9 AM)
  useEffect(() => {
    if (scrollRef.current) {
      const currentHour = new Date().getHours();
      scrollRef.current.scrollTop = Math.max(0, currentHour * 60 - 100);
    }
  }, []);

  return (
    <div className="flex-1 flex flex-col h-screen bg-slate-50 relative">
      {/* Top Bar */}
      <div className="bg-white h-16 border-b border-slate-200 px-6 flex items-center justify-between shadow-sm z-20">
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

      {/* Calendar Header (Days) */}
      <div className="bg-white border-b border-slate-200 flex pl-20 shadow-sm z-10 sticky top-0">
        {days.map((day, idx) => (
          <div key={idx} className="flex-1 py-4 text-center border-l border-slate-100 first:border-0 relative">
            <p className={`text-xs font-bold uppercase tracking-widest ${idx === 0 ? 'text-primary-600' : 'text-slate-400'}`}>
              {format(day, 'MMM')}
            </p>
            <div className={`mt-1 flex flex-col items-center justify-center mx-auto w-10 h-10 ${idx === 0 ? 'bg-primary-600 text-white rounded-full shadow-lg shadow-primary-500/30' : 'text-slate-700'}`}>
               <span className="text-xl font-bold font-sans">{format(day, 'd')}</span>
            </div>
          </div>
        ))}
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

        {/* Days Column Area */}
        <div className="flex-1 flex relative relative">
          {days.map((day, dIdx) => (
            <div key={dIdx} className="flex-1 border-r border-slate-100/50 relative">
               {hours.map((hr) => (
                 <div key={`grid-${hr}`} className="h-[72px] border-b border-dashed border-slate-200" />
               ))}

              {/* Render Blocks for TODAY ONLY for this prototype */}
              {dIdx === 0 && schedule.map((block, idx) => (
                <div 
                  key={idx}
                  className="absolute left-1 right-1 bg-gradient-to-r from-primary-50 to-indigo-50 border-l-4 border-primary-500 rounded-lg p-2 overflow-hidden shadow-sm flex flex-col"
                  style={{
                    top: `${block.start * 72}px`,
                    height: `${(block.end - block.start) * 72}px`
                  }}
                >
                   <h4 className="text-sm font-bold text-slate-800 truncate leading-tight">{block.task}</h4>
                   <span className="text-xs text-primary-600 font-medium mt-auto">
                     {block.start}:00 - {block.end}:00
                   </span>
                </div>
              ))}
            </div>
          ))}

          {/* Current Time Line (Fake it for now to overlay across) */}
          <div className="absolute left-0 w-full flex items-center z-10 pointer-events-none" style={{ top: `${new Date().getHours() * 72 + (new Date().getMinutes() / 60) * 72}px` }}>
            <div className="w-3 h-3 bg-red-500 rounded-full border-2 border-white -ml-2" />
            <div className="h-0.5 w-full bg-gradient-to-r from-red-500 to-red-300 shadow-[0_2px_4px_rgba(239,68,68,0.3)]" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarGrid;
