import React, { useState } from 'react';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Plus, Check, Trash2 } from 'lucide-react';

const TaskSidebar = ({ tasks, userId }) => {
  const [newTask, setNewTask] = useState('');
  const [estimatedHours, setEstimatedHours] = useState(1);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newTask.trim()) return;

    try {
      await addDoc(collection(db, 'users', userId, 'tasks'), {
        task: newTask,
        priority: "normal", // Let AI decide real priority later
        duration: estimatedHours,
        status: "pending",
        createdAt: serverTimestamp()
      });
      setNewTask('');
      setEstimatedHours(1);
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleComplete = async (taskId, currentStatus) => {
    const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
    await updateDoc(doc(db, 'users', userId, 'tasks', taskId), {
      status: newStatus
    });
  };

  const handleDelete = async (taskId) => {
    await deleteDoc(doc(db, 'users', userId, 'tasks', taskId));
  };

  return (
    <div className="w-80 bg-white border-r border-slate-200 h-full flex flex-col pt-6 z-10 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
      <div className="px-6 mb-6">
        <h2 className="text-2xl font-extrabold text-slate-800">Your Tasks</h2>
        <p className="text-slate-500 text-sm mt-1">Add tasks to be scheduled by AI</p>
      </div>

      <form onSubmit={handleAdd} className="px-6 mb-8 flex flex-col gap-3">
        <input 
          type="text" 
          placeholder="e.g. Study DSA" 
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          className="w-full bg-slate-50 p-3 rounded-xl border border-slate-200 focus:border-primary-500 outline-none transition-colors"
        />
        <div className="flex gap-2">
          <input 
            type="number" 
            min="0.5" step="0.5" 
            placeholder="Hours" 
            value={estimatedHours}
            onChange={(e) => setEstimatedHours(Number(e.target.value))}
            className="w-full bg-slate-50 p-3 rounded-xl border border-slate-200 focus:border-primary-500 outline-none transition-colors"
          />
          <button type="submit" className="bg-primary-600 hover:bg-primary-700 text-white p-3 rounded-xl flex items-center justify-center transition-colors shadow-lg shadow-primary-600/20">
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </form>

      <div className="flex-1 overflow-y-auto px-6 space-y-3 pb-6">
        {tasks.map(t => (
          <div key={t.id} className={`p-4 rounded-xl border transition-all ${t.status === 'completed' ? 'bg-slate-50 border-slate-100 opacity-60' : 'bg-white border-slate-200 shadow-sm'}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <h4 className={`font-semibold ${t.status === 'completed' ? 'line-through text-slate-400' : 'text-slate-700'}`}>{t.task}</h4>
                <div className="flex gap-2 mt-2">
                  <span className="text-xs font-medium bg-slate-100 text-slate-500 px-2 py-1 rounded-md">{t.duration}h</span>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <button 
                  onClick={() => handleToggleComplete(t.id, t.status)}
                  className={`p-1.5 rounded-full border transition-colors ${t.status === 'completed' ? 'bg-green-500 border-green-500 text-white' : 'border-slate-300 text-slate-400 hover:text-green-500 hover:border-green-500'}`}
                >
                  <Check className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => handleDelete(t.id)}
                  className="p-1.5 rounded-full border border-transparent text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
        {tasks.length === 0 && (
          <div className="text-center text-slate-400 py-10">No pending tasks.</div>
        )}
      </div>
    </div>
  );
};

export default TaskSidebar;
