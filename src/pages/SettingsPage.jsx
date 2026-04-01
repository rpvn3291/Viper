import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { Save, Clock, Brain, ArrowLeft } from 'lucide-react';

const SettingsPage = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  
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
    dislikes: ''
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const docRef = doc(db, 'users', currentUser.uid, 'profile', 'config');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
            setFormData({
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
            });
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
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
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
      alert("Profile updated successfully!");
      navigate('/tasks');
    } catch (err) {
      console.error("Error saving profile", err);
    }
  };

  if (loading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center">Loading Settings...</div>;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 relative">
      <button 
        onClick={() => navigate('/tasks')} 
        className="absolute top-6 left-6 flex items-center gap-2 text-slate-500 hover:text-slate-800 transition"
      >
        <ArrowLeft className="w-5 h-5" /> Back to Tasks
      </button>

      <div className="bg-white max-w-xl w-full rounded-3xl shadow-xl overflow-hidden animate-fade-in-up mt-10">
        <div className="bg-primary-600 p-8 text-white text-center">
          <Brain className="w-12 h-12 mx-auto mb-4 text-primary-200" />
          <h2 className="text-3xl font-bold">Profile Settings</h2>
          <p className="text-primary-100 mt-2">Update your AI worker preferences here.</p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary-500" /> Day Start Time
              </label>
              <select name="startTime" value={formData.startTime} onChange={handleChange} className="w-full p-3 bg-slate-100 border border-transparent focus:border-primary-500 rounded-xl outline-none transition">
                {[...Array(24)].map((_, i) => (
                  <option key={i} value={i}>{i === 0 ? '12 AM' : i < 12 ? `${i} AM` : i === 12 ? '12 PM' : `${i-12} PM`}</option>
                ))}
              </select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary-500" /> Available Hours/Day
              </label>
              <input type="number" name="availableHours" min="1" max="24" value={formData.availableHours} onChange={handleChange} className="w-full p-3 bg-slate-100 border border-transparent focus:border-primary-500 rounded-xl outline-none" required />
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h3 className="font-bold text-slate-800">Your Workflow</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Peak Productivity</label>
                <select name="peakTime" value={formData.peakTime} onChange={handleChange} className="w-full p-3 bg-slate-100 rounded-xl outline-none">
                  <option value="morning">Morning</option>
                  <option value="afternoon">Afternoon</option>
                  <option value="night">Night</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Task Preference</label>
                <select name="preference" value={formData.preference} onChange={handleChange} className="w-full p-3 bg-slate-100 rounded-xl outline-none">
                  <option value="hard-first">Hard Tasks First</option>
                  <option value="easy-first">Easy Tasks First</option>
                </select>
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h3 className="font-bold text-slate-800">Professional Work Hours</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Work Start Time</label>
                <select name="blockedTimeStart" value={formData.blockedTimeStart} onChange={handleChange} className="w-full p-3 bg-slate-100 rounded-xl outline-none">
                  {[...Array(24)].map((_, i) => (
                    <option key={i} value={i}>{i === 0 ? '12 AM' : i < 12 ? `${i} AM` : i === 12 ? '12 PM' : `${i-12} PM`}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Work End Time</label>
                <select name="blockedTimeEnd" value={formData.blockedTimeEnd} onChange={handleChange} className="w-full p-3 bg-slate-100 rounded-xl outline-none">
                  {[...Array(24)].map((_, i) => (
                    <option key={i} value={i}>{i === 0 ? '12 AM' : i < 12 ? `${i} AM` : i === 12 ? '12 PM' : `${i-12} PM`}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h3 className="font-bold text-slate-800">Sleep Schedule</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Bedtime</label>
                <select name="sleepTimeStart" value={formData.sleepTimeStart} onChange={handleChange} className="w-full p-3 bg-slate-100 rounded-xl outline-none">
                  {[...Array(24)].map((_, i) => (
                    <option key={i} value={i}>{i === 0 ? '12 AM' : i < 12 ? `${i} AM` : i === 12 ? '12 PM' : `${i-12} PM`}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Wake up Time</label>
                <select name="sleepTimeEnd" value={formData.sleepTimeEnd} onChange={handleChange} className="w-full p-3 bg-slate-100 rounded-xl outline-none">
                  {[...Array(24)].map((_, i) => (
                    <option key={i} value={i}>{i === 0 ? '12 AM' : i < 12 ? `${i} AM` : i === 12 ? '12 PM' : `${i-12} PM`}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h3 className="font-bold text-slate-800">Advanced Personalization</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Work Style</label>
                <select name="workStyle" value={formData.workStyle} onChange={handleChange} className="w-full p-3 bg-slate-100 rounded-xl outline-none">
                  <option value="deep-work">Deep Work (Long Blocks)</option>
                  <option value="pomodoro">Pomodoro (Frequent Breaks)</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Chronotype</label>
                <select name="chronotype" value={formData.chronotype} onChange={handleChange} className="w-full p-3 bg-slate-100 rounded-xl outline-none">
                  <option value="early-bird">Early Bird (Morning Heavy)</option>
                  <option value="mid-day">Mid-Day Regular</option>
                  <option value="night-owl">Night Owl (Late Night Heavy)</option>
                </select>
              </div>
            </div>

            <div className="space-y-2 mt-4">
              <label className="text-sm font-semibold text-slate-700">Core Interests & Hobbies</label>
              <input type="text" name="hobbies" value={formData.hobbies} onChange={handleChange} placeholder="e.g. Gaming, Reading, Swimming" className="w-full p-3 bg-slate-100 border border-transparent focus:border-primary-500 rounded-xl outline-none" />
            </div>

            <div className="space-y-2 mt-4">
              <label className="text-sm font-semibold text-slate-700">What Tasks Do You Avoid Most?</label>
              <input type="text" name="dislikes" value={formData.dislikes} onChange={handleChange} placeholder="e.g. Cleaning, Emails, Documentation" className="w-full p-3 bg-slate-100 border border-transparent focus:border-primary-500 rounded-xl outline-none" />
            </div>
          </div>

          <button type="submit" className="w-full mt-6 flex justify-center items-center gap-2 bg-primary-600 text-white font-bold py-4 rounded-xl hover:bg-primary-700 transition shadow-lg shadow-primary-500/30">
            <Save className="w-5 h-5" />
            Save Changes
          </button>
        </form>
      </div>
    </div>
  );
};

export default SettingsPage;
