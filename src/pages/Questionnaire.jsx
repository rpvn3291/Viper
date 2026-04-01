import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { Save, Clock, Brain } from 'lucide-react';

const Questionnaire = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  
  const [formData, setFormData] = useState({
    startTime: 9,
    peakTime: 'morning',
    preference: 'hard-first',
    availableHours: 6,
    blockedTimeStart: 10,
    blockedTimeEnd: 17
  });

  useEffect(() => {
    // Check if profile already exists
    const checkProfile = async () => {
      try {
        const docRef = doc(db, 'users', currentUser.uid, 'profile', 'config');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          // If already filled out, go straight to dashboard
          navigate('/dashboard');
        } else {
          setLoading(false);
        }
      } catch (err) {
        console.error("Error checking profile:", err);
        setLoading(false);
      }
    };
    checkProfile();
  }, [currentUser, navigate]);

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
        }
      };
      
      await setDoc(doc(db, 'users', currentUser.uid, 'profile', 'config'), payload);
      navigate('/dashboard');
    } catch (err) {
      console.error("Error saving profile", err);
    }
  };

  if (loading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="bg-white max-w-xl w-full rounded-3xl shadow-xl overflow-hidden animate-fade-in-up">
        <div className="bg-primary-600 p-8 text-white text-center">
          <Brain className="w-12 h-12 mx-auto mb-4 text-primary-200" />
          <h2 className="text-3xl font-bold">Configure Your AI Worker</h2>
          <p className="text-primary-100 mt-2">Let's personalize your schedule engine.</p>
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
            <h3 className="font-bold text-slate-800">Fixed Blocked Time (e.g. Work/College)</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Block Start</label>
                <select name="blockedTimeStart" value={formData.blockedTimeStart} onChange={handleChange} className="w-full p-3 bg-slate-100 rounded-xl outline-none">
                  {[...Array(24)].map((_, i) => (
                    <option key={i} value={i}>{i === 0 ? '12 AM' : i < 12 ? `${i} AM` : i === 12 ? '12 PM' : `${i-12} PM`}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Block End</label>
                <select name="blockedTimeEnd" value={formData.blockedTimeEnd} onChange={handleChange} className="w-full p-3 bg-slate-100 rounded-xl outline-none">
                  {[...Array(24)].map((_, i) => (
                    <option key={i} value={i}>{i === 0 ? '12 AM' : i < 12 ? `${i} AM` : i === 12 ? '12 PM' : `${i-12} PM`}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <button type="submit" className="w-full mt-6 flex justify-center items-center gap-2 bg-primary-600 text-white font-bold py-4 rounded-xl hover:bg-primary-700 transition shadow-lg shadow-primary-500/30">
            <Save className="w-5 h-5" />
            Save & Continue to Dashboard
          </button>
        </form>
      </div>
    </div>
  );
};

export default Questionnaire;
