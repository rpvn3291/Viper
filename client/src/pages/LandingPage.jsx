import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Calendar, BrainCircuit, CheckCircle } from 'lucide-react';

const LandingPage = () => {
  const { signInWithGoogle } = useAuth();

  return (
    <div className="min-h-screen bg-darker text-white flex flex-col items-center justify-center p-6 bg-gradient-to-br from-[#0f172a] to-[#020617]">
      <div className="text-center max-w-2xl mx-auto space-y-8 animate-fade-in-up">
        <div className="flex justify-center mb-6">
          <div className="bg-primary-600/20 p-4 rounded-3xl shrink-0">
            <BrainCircuit className="w-16 h-16 text-primary-500" />
          </div>
        </div>
        
        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight">
          AI-Powered <span className="text-primary-500">Task Scheduler</span>
        </h1>
        
        <p className="text-xl text-slate-300">
          Personalize your daily workflow using AI. It learns from your behavior, respects your constraints, and guarantees maximum productivity.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
          <button 
            onClick={signInWithGoogle}
            className="flex items-center gap-3 bg-white text-darker font-bold py-3 px-8 rounded-full hover:bg-slate-200 transition-all duration-300 shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:shadow-[0_0_25px_rgba(59,130,246,0.5)] transform hover:-translate-y-1"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
            Sign in with Google
          </button>
        </div>

        {/* Feature grid */}
        <div className="grid md:grid-cols-3 gap-6 mt-16 text-left">
          <div className="bg-white/5 border border-white/10 p-6 rounded-2xl backdrop-blur-sm">
            <Calendar className="w-8 h-8 text-primary-500 mb-4" />
            <h3 className="font-bold text-lg mb-2">Smart Scheduling</h3>
            <p className="text-slate-400 text-sm">Automatically plot your tasks into a workable daily planner. No blocks left empty.</p>
          </div>
          <div className="bg-white/5 border border-white/10 p-6 rounded-2xl backdrop-blur-sm">
            <BrainCircuit className="w-8 h-8 text-primary-500 mb-4" />
            <h3 className="font-bold text-lg mb-2">AI Prioritization</h3>
            <p className="text-slate-400 text-sm">Gemini analyzes your past momentum and habits to suggest exactly what to tackle next.</p>
          </div>
          <div className="bg-white/5 border border-white/10 p-6 rounded-2xl backdrop-blur-sm">
            <CheckCircle className="w-8 h-8 text-primary-500 mb-4" />
            <h3 className="font-bold text-lg mb-2">Behavior Tracking</h3>
            <p className="text-slate-400 text-sm">Mark tasks as complete or missed and watch the AI dynamically adapt to your style.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
