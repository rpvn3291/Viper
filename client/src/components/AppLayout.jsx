import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { format, addHours, isBefore, parseISO } from 'date-fns';

const AppLayout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, logOut } = useAuth();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [upcomingTasks, setUpcomingTasks] = useState([]);

  const currentPath = location.pathname;

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'grid_view', path: '/dashboard' },
    { id: 'tasks', label: 'Schedule', icon: 'pending_actions', path: '/tasks' },
    { id: 'calendar', label: 'Calendar', icon: 'calendar_today', path: '/calendar' },
    { id: 'settings', label: 'Settings', icon: 'settings', path: '/settings' },
  ];

  const isActive = (path) => currentPath === path;

  // Fetch upcoming tasks (due within 1 hour)
  useEffect(() => {
    if (!currentUser) return;

    const today = format(new Date(), 'yyyy-MM-dd');
    const q = query(collection(db, 'users', currentUser.uid, 'schedule'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const now = new Date();
      
      // CHANGE THIS VARIABLE to adjust how many hours ahead the notification looks
      const NOTIFICATION_HOURS_AHEAD = 6; 
      const notificationHorizon = addHours(now, NOTIFICATION_HOURS_AHEAD);
      
      const upcoming = [];

      snapshot.forEach((docSnap) => {
        const dateStr = docSnap.id;
        const items = docSnap.data().items || [];
        
        items.forEach((task) => {
          if (task.completed) return;
          
          // Parse task start time
          const startTime = task.start !== undefined ? task.start : task.startTime;
          if (startTime === undefined || startTime === null) return;
          const endTime = task.end !== undefined ? task.end : (task.endTime !== undefined ? task.endTime : startTime + 1);
          
          // Convert decimal time to hours and minutes
          const sHours = Math.floor(startTime);
          const sMinutes = Math.round((startTime - sHours) * 60);

          const eHours = Math.floor(endTime);
          const eMinutes = Math.round((endTime - eHours) * 60);
          
          // Create task datetime bounds
          const taskStartDate = parseISO(dateStr);
          taskStartDate.setHours(sHours, sMinutes, 0, 0);

          const taskEndDate = parseISO(dateStr);
          taskEndDate.setHours(eHours, eMinutes, 0, 0);
          
          // Check if task is currently active
          const isStarted = now.getTime() >= taskStartDate.getTime();
          const isNotFinished = now.getTime() < taskEndDate.getTime();

          if (isStarted && isNotFinished) {
            upcoming.push({
              title: task.task || task.title,
              isActive: true,
              date: dateStr,
              sortIdx: 0 // Active tasks float to top
            });
          }
          // Check if task is upcoming within the horizon
          else if (!isStarted && isBefore(taskStartDate, notificationHorizon)) {
            const minutesUntil = Math.round((taskStartDate - now) / (1000 * 60));
            upcoming.push({
              title: task.task || task.title,
              isActive: false,
              minutesUntil,
              date: dateStr,
              sortIdx: minutesUntil
            });
          }
        });
      });

      // Sort by active first, then soonest
      upcoming.sort((a, b) => a.sortIdx - b.sortIdx);
      setUpcomingTasks(upcoming);
    });

    return () => unsubscribe();
  }, [currentUser?.uid]);

  return (
    <div className="flex min-h-screen bg-surface text-on-surface font-body selection:bg-primary/30 selection:text-primary">
      {/* SideNavBar */}
      <aside className="fixed left-0 top-0 h-screen w-64 border-r border-white/5 bg-[#131313] flex flex-col z-40">
        {/* Logo */}
        <div className="p-6">
          <div className="text-2xl font-bold tracking-tighter text-primary font-headline uppercase">VIPER</div>
          <div className="font-label text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 mt-1">Planner</div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 mt-4 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                navigate(item.path);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 font-label text-xs font-bold uppercase tracking-widest text-left ${
                isActive(item.path)
                  ? 'text-secondary border-r-2 border-secondary bg-secondary/10 shadow-[0_0_10px_rgba(34,211,238,0.2)]'
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
              }`}
            >
              <span className="material-symbols-outlined text-xl pointer-events-none">{item.icon}</span>
              <span className="pointer-events-none">{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Bottom Section */}
        <div className="p-4 mt-auto">
          <button 
            onClick={() => navigate('/tasks')}
            className="w-full py-3 bg-primary text-on-primary font-headline font-bold text-xs tracking-widest uppercase rounded-lg shadow-[0_0_15px_rgba(168,85,247,0.15)] hover:brightness-110 active:scale-[0.97] transition-all"
          >
            DEPLOY MISSION
          </button>
          
          {/* User Profile */}
          <div className="mt-6 flex items-center gap-3 px-2">
            <div className="w-10 h-10 rounded bg-surface-container-high border border-outline-variant/20 flex items-center justify-center overflow-hidden">
              {currentUser?.photoURL ? (
                <img src={currentUser.photoURL} alt="User" className="w-full h-full object-cover" />
              ) : (
                <span className="material-symbols-outlined text-zinc-500">person</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-on-surface truncate">
                {currentUser?.displayName || 'OPERATOR_01'}
              </p>
              <p className="text-[10px] text-tertiary flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-tertiary animate-pulse"></span>
                ONLINE
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="ml-64 flex-1 flex flex-col min-h-screen">
        {/* TopNavBar */}
        <header className="fixed top-0 right-0 left-64 h-16 flex items-center justify-between px-8 z-30 bg-surface/80 backdrop-blur-xl border-b border-white/5">
          <div className="flex items-center gap-6">
            <span className="font-headline text-sm tracking-tight text-on-surface font-bold">
              {currentPath.replace('/', '').toUpperCase() || 'DASHBOARD'}
            </span>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4 text-zinc-400 relative">
              {/* Notifications */}
              <div className="relative">
                <button 
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="hover:text-secondary transition-colors relative"
                >
                  <span className="material-symbols-outlined text-[20px]">notifications</span>
                  {upcomingTasks.length > 0 && (
                    <span className={`absolute -top-1 -right-1 w-4 h-4 rounded-full text-[8px] flex items-center justify-center text-white font-bold ${upcomingTasks.some(t => t.isActive) ? 'bg-primary shadow-[0_0_8px_rgba(221,183,255,0.8)]' : 'bg-error'}`}>
                      {upcomingTasks.length}
                    </span>
                  )}
                </button>
                
                {/* Notifications Dropdown */}
                {showNotifications && (
                  <div className="absolute right-0 top-full mt-2 w-72 bg-surface-container-low border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden">
                    <div className="p-4 border-b border-white/5">
                      <h3 className="font-headline text-xs font-bold uppercase tracking-widest text-white">Upcoming Tasks</h3>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {upcomingTasks.length === 0 ? (
                        <div className="p-6 text-center">
                          <span className="material-symbols-outlined text-zinc-600 text-3xl mb-2">inbox</span>
                          <p className="text-zinc-500 text-xs">No upcoming tasks</p>
                        </div>
                      ) : (
                        upcomingTasks.map((task, idx) => (
                          <div key={idx} className={`p-3 border-b border-white/5 transition-colors ${task.isActive ? 'bg-primary/5 hover:bg-primary/10 border-l-2 border-primary' : 'hover:bg-white/5'}`}>
                            <p className="text-white text-xs font-bold truncate">{task.title}</p>
                            {task.isActive ? (
                                <p className="text-primary text-[10px] font-bold mt-1 uppercase tracking-widest flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span> IN PROGRESS
                                </p>
                            ) : (
                                <p className="text-secondary text-[10px]">Due in {task.minutesUntil} minutes</p>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Logout */}
              <button 
                onClick={() => setShowLogoutConfirm(true)}
                className="hover:text-error transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">power_settings_new</span>
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 pt-16 min-h-screen">
          {children}
        </main>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-surface-container-low p-6 rounded-2xl shadow-2xl max-w-sm w-full text-center border border-white/10">
            <div className="w-16 h-16 rounded-full bg-error/10 flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-error text-3xl">logout</span>
            </div>
            <h2 className="text-xl font-bold text-white mb-2 font-headline">Logout?</h2>
            <p className="text-zinc-400 mb-6 text-sm">Are you sure you want to sign out?</p>
            <div className="flex gap-3">
              <button 
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-3 bg-surface-container-high text-white rounded-lg font-headline font-bold text-xs uppercase tracking-widest hover:bg-surface-container-highest transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => { logOut(); navigate('/'); }}
                className="flex-1 py-3 bg-error text-on-error rounded-lg font-headline font-bold text-xs uppercase tracking-widest hover:brightness-110 transition-all"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AppLayout;
