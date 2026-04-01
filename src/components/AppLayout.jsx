import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AppLayout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, logOut } = useAuth();

  const currentPath = location.pathname;

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'grid_view', path: '/dashboard' },
    { id: 'tasks', label: 'Schedule', icon: 'pending_actions', path: '/tasks' },
    { id: 'calendar', label: 'Calendar', icon: 'calendar_today', path: '/calendar' },
    { id: 'settings', label: 'Settings', icon: 'settings', path: '/settings' },
  ];

  const isActive = (path) => currentPath === path;

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
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 font-label text-xs font-bold uppercase tracking-widest ${
                isActive(item.path)
                  ? 'text-secondary border-r-2 border-secondary bg-secondary/10 shadow-[0_0_10px_rgba(34,211,238,0.2)]'
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
              }`}
            >
              <span className="material-symbols-outlined text-xl">{item.icon}</span>
              <span>{item.label}</span>
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
            <div className="flex items-center gap-4 text-zinc-400">
              <button className="hover:text-secondary transition-colors">
                <span className="material-symbols-outlined text-[20px]">notifications</span>
              </button>
              <button 
                onClick={() => { logOut(); navigate('/'); }}
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
    </div>
  );
};

export default AppLayout;
