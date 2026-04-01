import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import AppLayout from '../components/AppLayout';

const SettingsPage = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    startTime: 9,
    peakTime: 'morning',
    preference: 'hard-first',
    availableHours: 6,
    blockedTimeStart: 9,
    blockedTimeEnd: 17,
    sleepTimeStart: 22,
    sleepTimeEnd: 7,
    workStyle: 'deep-work',
    chronotype: 'early-bird',
    hobbies: '',
    dislikes: '',
    neuralFocus: 84,
    energyOutput: 75,
    processEfficiency: 90,
    theme: 'void',
    accentColor: 'primary',
    hudOpacity: true,
    tacticalAudio: false
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const docRef = doc(db, 'users', currentUser.uid, 'profile', 'config');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setFormData(prev => ({
            ...prev,
            startTime: data.startTime || 9,
            peakTime: data.peakTime || 'morning',
            preference: data.preference || 'hard-first',
            availableHours: data.availableHours || 6,
            blockedTimeStart: data.blockedTime?.start ?? 9,
            blockedTimeEnd: data.blockedTime?.end ?? 17,
            sleepTimeStart: data.sleepTime?.start ?? 22,
            sleepTimeEnd: data.sleepTime?.end ?? 7,
            workStyle: data.workStyle || 'deep-work',
            chronotype: data.chronotype || 'early-bird',
            hobbies: data.hobbies || '',
            dislikes: data.dislikes || ''
          }));
        }
      } catch (err) {
        console.error("Error fetching profile:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [currentUser]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
  };

  const handleSliderChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: parseInt(value) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        startTime: Number(formData.startTime),
        peakTime: formData.peakTime,
        preference: formData.preference,
        availableHours: Number(formData.availableHours),
        blockedTime: {
          start: Number(formData.blockedTimeStart),
          end: Number(formData.blockedTimeEnd)
        },
        sleepTime: {
          start: Number(formData.sleepTimeStart),
          end: Number(formData.sleepTimeEnd)
        },
        workStyle: formData.workStyle,
        chronotype: formData.chronotype,
        hobbies: formData.hobbies,
        dislikes: formData.dislikes
      };
      
      await setDoc(doc(db, 'users', currentUser.uid, 'profile', 'config'), payload);
      
      // Show success toast
      const toast = document.createElement('div');
      toast.className = 'fixed bottom-8 right-8 bg-tertiary text-on-tertiary px-6 py-3 rounded-lg font-headline text-sm font-bold uppercase tracking-widest z-50 animate-fade-in-up';
      toast.textContent = 'PROTOCOLS_UPDATED';
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 3000);
    } catch (err) {
      console.error("Error saving profile", err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <AppLayout>
      <div className="ml-64 pt-24 px-12 min-h-screen bg-surface flex items-center justify-center">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-secondary animate-spin">progress_activity</span>
          <span className="font-headline text-zinc-400">LOADING_SETTINGS...</span>
        </div>
      </div>
    </AppLayout>
  );

  return (
    <AppLayout>
      <div className="ml-64 pt-24 px-12 pb-12 min-h-screen bg-surface">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-12">
            <h1 className="font-headline text-4xl font-bold tracking-tight text-white flex items-center gap-4">
              COMMAND_CENTER_SETTINGS
              <span className="text-[10px] bg-secondary-container/20 text-secondary border border-secondary/20 px-2 py-0.5 rounded-sm font-label tracking-[0.2em] uppercase">Authenticated</span>
            </h1>
            <p className="text-zinc-500 font-body text-sm mt-2 tracking-wide">
              Configure operational parameters and interface aesthetics for the NEON_OS core.
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Settings Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Section: System Calibration */}
              <section className="lg:col-span-8 space-y-6">
                <div className="bg-surface-container-low p-8 rounded-tl-xl rounded-br-sm border-t border-l border-white/5 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                    <span className="material-symbols-outlined text-6xl">tune</span>
                  </div>
                  <div className="flex items-center gap-3 mb-8">
                    <div className="w-2 h-2 rounded-full bg-tertiary animate-pulse shadow-[0_0_8px_rgba(78,222,163,0.6)]"></div>
                    <h2 className="font-headline text-lg font-bold tracking-wider uppercase text-white">System Calibration</h2>
                  </div>

                  <div className="space-y-10">
                    {/* Day Start Time */}
                    <div className="group">
                      <div className="flex justify-between items-end mb-4">
                        <label className="font-label text-xs font-bold uppercase tracking-[0.15em] text-zinc-400 group-focus-within:text-secondary transition-colors">
                          Day Start Time
                        </label>
                        <span className="font-headline text-secondary text-sm font-bold tracking-tighter">
                          {formData.startTime}:00
                        </span>
                      </div>
                      <input 
                        type="range" 
                        name="startTime"
                        min="0" 
                        max="23" 
                        value={formData.startTime}
                        onChange={(e) => handleSliderChange('startTime', e.target.value)}
                        className="w-full appearance-none bg-surface-container-lowest h-1 rounded-none cursor-pointer custom-slider"
                      />
                      <p className="text-[10px] text-zinc-600 mt-2 font-body tracking-tight">
                        Defines the operational hour when your daily protocol begins.
                      </p>
                    </div>

                    {/* Available Hours */}
                    <div className="group">
                      <div className="flex justify-between items-end mb-4">
                        <label className="font-label text-xs font-bold uppercase tracking-[0.15em] text-zinc-400 group-focus-within:text-secondary transition-colors">
                          Available Hours/Day
                        </label>
                        <span className="font-headline text-secondary text-sm font-bold tracking-tighter">
                          {formData.availableHours}h
                        </span>
                      </div>
                      <input 
                        type="range" 
                        name="availableHours"
                        min="1" 
                        max="16" 
                        value={formData.availableHours}
                        onChange={(e) => handleSliderChange('availableHours', e.target.value)}
                        className="w-full appearance-none bg-surface-container-lowest h-1 rounded-none cursor-pointer custom-slider"
                      />
                      <p className="text-[10px] text-zinc-600 mt-2 font-body tracking-tight">
                        Maximum productive hours available for task allocation.
                      </p>
                    </div>

                    {/* Peak Productivity */}
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="font-label text-xs font-bold uppercase tracking-[0.15em] text-zinc-400 block mb-3">
                          Peak Productivity
                        </label>
                        <select 
                          name="peakTime" 
                          value={formData.peakTime}
                          onChange={handleChange}
                          className="w-full bg-surface-container-lowest border border-white/10 text-on-surface px-4 py-3 font-headline text-sm focus:border-secondary/50 focus:outline-none transition-colors"
                        >
                          <option value="morning">Morning (06:00 - 12:00)</option>
                          <option value="afternoon">Afternoon (12:00 - 18:00)</option>
                          <option value="night">Night (18:00 - 00:00)</option>
                        </select>
                      </div>
                      <div>
                        <label className="font-label text-xs font-bold uppercase tracking-[0.15em] text-zinc-400 block mb-3">
                          Task Preference
                        </label>
                        <select 
                          name="preference" 
                          value={formData.preference}
                          onChange={handleChange}
                          className="w-full bg-surface-container-lowest border border-white/10 text-on-surface px-4 py-3 font-headline text-sm focus:border-secondary/50 focus:outline-none transition-colors"
                        >
                          <option value="hard-first">Hard Tasks First</option>
                          <option value="easy-first">Easy Tasks First</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Work Hours Section */}
                <div className="bg-surface-container-low p-8 rounded-tl-xl rounded-br-sm border-t border-l border-white/5">
                  <div className="flex items-center gap-3 mb-8">
                    <span className="material-symbols-outlined text-zinc-500">schedule</span>
                    <h2 className="font-headline text-lg font-bold tracking-wider uppercase text-white">Work Block Configuration</h2>
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="font-label text-xs font-bold uppercase tracking-[0.15em] text-zinc-400 block mb-3">
                        Block Start
                      </label>
                      <select 
                        name="blockedTimeStart" 
                        value={formData.blockedTimeStart}
                        onChange={handleChange}
                        className="w-full bg-surface-container-lowest border border-white/10 text-on-surface px-4 py-3 font-headline text-sm focus:border-secondary/50 focus:outline-none transition-colors"
                      >
                        {[...Array(24)].map((_, i) => (
                          <option key={i} value={i}>
                            {i === 0 ? '12 AM' : i < 12 ? `${i} AM` : i === 12 ? '12 PM' : `${i-12} PM`}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="font-label text-xs font-bold uppercase tracking-[0.15em] text-zinc-400 block mb-3">
                        Block End
                      </label>
                      <select 
                        name="blockedTimeEnd" 
                        value={formData.blockedTimeEnd}
                        onChange={handleChange}
                        className="w-full bg-surface-container-lowest border border-white/10 text-on-surface px-4 py-3 font-headline text-sm focus:border-secondary/50 focus:outline-none transition-colors"
                      >
                        {[...Array(24)].map((_, i) => (
                          <option key={i} value={i}>
                            {i === 0 ? '12 AM' : i < 12 ? `${i} AM` : i === 12 ? '12 PM' : `${i-12} PM`}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Sleep Schedule */}
                <div className="bg-surface-container-low p-8 rounded-tl-xl rounded-br-sm border-t border-l border-white/5">
                  <div className="flex items-center gap-3 mb-8">
                    <span className="material-symbols-outlined text-zinc-500">bedtime</span>
                    <h2 className="font-headline text-lg font-bold tracking-wider uppercase text-white">Sleep Protocol</h2>
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="font-label text-xs font-bold uppercase tracking-[0.15em] text-zinc-400 block mb-3">
                        Bedtime
                      </label>
                      <select 
                        name="sleepTimeStart" 
                        value={formData.sleepTimeStart}
                        onChange={handleChange}
                        className="w-full bg-surface-container-lowest border border-white/10 text-on-surface px-4 py-3 font-headline text-sm focus:border-secondary/50 focus:outline-none transition-colors"
                      >
                        {[...Array(24)].map((_, i) => (
                          <option key={i} value={i}>
                            {i === 0 ? '12 AM' : i < 12 ? `${i} AM` : i === 12 ? '12 PM' : `${i-12} PM`}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="font-label text-xs font-bold uppercase tracking-[0.15em] text-zinc-400 block mb-3">
                        Wake Time
                      </label>
                      <select 
                        name="sleepTimeEnd" 
                        value={formData.sleepTimeEnd}
                        onChange={handleChange}
                        className="w-full bg-surface-container-lowest border border-white/10 text-on-surface px-4 py-3 font-headline text-sm focus:border-secondary/50 focus:outline-none transition-colors"
                      >
                        {[...Array(24)].map((_, i) => (
                          <option key={i} value={i}>
                            {i === 0 ? '12 AM' : i < 12 ? `${i} AM` : i === 12 ? '12 PM' : `${i-12} PM`}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </section>

              {/* Sidebar: Interface Customization */}
              <section className="lg:col-span-4 space-y-6">
                <div className="bg-surface-container-high p-8 rounded-tl-xl rounded-br-sm border-t border-l border-white/5 shadow-[0_0_30px_rgba(0,0,0,0.5)]">
                  <div className="flex items-center gap-3 mb-8">
                    <span className="material-symbols-outlined text-primary">palette</span>
                    <h2 className="font-headline text-sm font-bold tracking-wider uppercase text-white">Interface</h2>
                  </div>

                  <div className="space-y-8">
                    {/* Chronotype */}
                    <div>
                      <label className="font-label text-[10px] font-bold uppercase tracking-widest text-zinc-400 block mb-4">
                        Chronotype
                      </label>
                      <select 
                        name="chronotype" 
                        value={formData.chronotype}
                        onChange={handleChange}
                        className="w-full bg-surface-container-lowest border border-white/10 text-on-surface px-4 py-3 font-headline text-sm focus:border-secondary/50 focus:outline-none transition-colors"
                      >
                        <option value="early-bird">Early Bird</option>
                        <option value="mid-day">Mid-Day Regular</option>
                        <option value="night-owl">Night Owl</option>
                      </select>
                    </div>

                    {/* Work Style */}
                    <div>
                      <label className="font-label text-[10px] font-bold uppercase tracking-widest text-zinc-400 block mb-4">
                        Work Style
                      </label>
                      <select 
                        name="workStyle" 
                        value={formData.workStyle}
                        onChange={handleChange}
                        className="w-full bg-surface-container-lowest border border-white/10 text-on-surface px-4 py-3 font-headline text-sm focus:border-secondary/50 focus:outline-none transition-colors"
                      >
                        <option value="deep-work">Deep Work (Long Blocks)</option>
                        <option value="pomodoro">Pomodoro (Frequent Breaks)</option>
                      </select>
                    </div>

                    {/* Hobbies */}
                    <div>
                      <label className="font-label text-[10px] font-bold uppercase tracking-widest text-zinc-400 block mb-4">
                        Core Interests
                      </label>
                      <input 
                        type="text" 
                        name="hobbies"
                        value={formData.hobbies}
                        onChange={handleChange}
                        placeholder="Gaming, Reading, etc."
                        className="w-full bg-surface-container-lowest border border-white/10 text-on-surface px-4 py-3 font-headline text-sm focus:border-secondary/50 focus:outline-none transition-colors placeholder-zinc-600"
                      />
                    </div>

                    {/* Dislikes */}
                    <div>
                      <label className="font-label text-[10px] font-bold uppercase tracking-widest text-zinc-400 block mb-4">
                        Task Avoidance
                      </label>
                      <input 
                        type="text" 
                        name="dislikes"
                        value={formData.dislikes}
                        onChange={handleChange}
                        placeholder="Cleaning, Emails, etc."
                        className="w-full bg-surface-container-lowest border border-white/10 text-on-surface px-4 py-3 font-headline text-sm focus:border-secondary/50 focus:outline-none transition-colors placeholder-zinc-600"
                      />
                    </div>

                    {/* Accent Color Picker */}
                    <div>
                      <label className="font-label text-[10px] font-bold uppercase tracking-widest text-zinc-400 block mb-4">
                        Neural Accent
                      </label>
                      <div className="grid grid-cols-4 gap-3">
                        <button 
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, accentColor: 'primary' }))}
                          className={`h-10 w-full bg-primary border-2 ${formData.accentColor === 'primary' ? 'border-white/40 shadow-[0_0_15px_rgba(221,183,255,0.3)]' : 'border-white/10'} hover:scale-105 transition-transform`}
                        />
                        <button 
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, accentColor: 'secondary' }))}
                          className={`h-10 w-full bg-secondary border-2 ${formData.accentColor === 'secondary' ? 'border-white/40' : 'border-white/10'} hover:scale-105 transition-transform`}
                        />
                        <button 
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, accentColor: 'tertiary' }))}
                          className={`h-10 w-full bg-tertiary border-2 ${formData.accentColor === 'tertiary' ? 'border-white/40' : 'border-white/10'} hover:scale-105 transition-transform`}
                        />
                        <button 
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, accentColor: 'error' }))}
                          className={`h-10 w-full bg-error border-2 ${formData.accentColor === 'error' ? 'border-white/40' : 'border-white/10'} hover:scale-105 transition-transform`}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Support Card */}
                <div className="bg-gradient-to-br from-primary/10 to-transparent p-6 border border-primary/20 rounded-xl">
                  <div className="flex gap-4">
                    <span className="material-symbols-outlined text-primary text-3xl">support_agent</span>
                    <div>
                      <h3 className="font-headline text-xs font-bold text-white uppercase tracking-widest">System Support</h3>
                      <p className="text-[10px] text-zinc-400 mt-1 leading-relaxed">
                        Direct uplink to NEON_PROTOCOL engineering team available for Tier-3 operators.
                      </p>
                      <button 
                        type="button"
                        className="mt-4 px-4 py-2 border border-primary/30 text-primary text-[10px] font-bold uppercase tracking-widest hover:bg-primary hover:text-on-primary transition-all duration-100"
                      >
                        Establish Link
                      </button>
                    </div>
                  </div>
                </div>

                {/* Save Button */}
                <button 
                  type="submit"
                  disabled={saving}
                  className="w-full py-4 bg-primary text-on-primary font-headline font-bold text-sm tracking-widest uppercase rounded-lg shadow-[0_0_15px_rgba(168,85,247,0.15)] hover:brightness-110 active:scale-[0.97] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <>
                      <span className="material-symbols-outlined animate-spin">progress_activity</span>
                      SYNCING...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined">save</span>
                      SAVE PROTOCOLS
                    </>
                  )}
                </button>
              </section>
            </div>
          </form>

          {/* Footer */}
          <div className="mt-12 opacity-50 pointer-events-none">
            <div className="h-1 bg-gradient-to-r from-transparent via-zinc-800 to-transparent"></div>
            <div className="flex justify-between items-center mt-4">
              <div className="font-headline text-[10px] text-zinc-700 tracking-[0.4em] uppercase">
                System Core Rev: 99.4.0
              </div>
              <div className="font-headline text-[10px] text-zinc-700 tracking-[0.4em] uppercase">
                NEON_OS TACTICAL HUD
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default SettingsPage;
