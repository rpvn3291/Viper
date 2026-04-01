import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase";
import { collection, getDocs, doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { isBefore, startOfToday, parseISO, isValid, format } from "date-fns";
import AppLayout from "../components/AppLayout";

const Dashboard = () => {
    const { currentUser } = useAuth();
    const navigate = useNavigate();

    const [missedTasks, setMissedTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showMoodModal, setShowMoodModal] = useState(false);
    const todayStr = format(new Date(), 'yyyy-MM-dd');

    useEffect(() => {
        if (!currentUser) return;

        const fetchMissedTasks = async () => {
            try {
                setLoading(true);

                const snapshot = await getDocs(
                    collection(db, "users", currentUser.uid, "schedule")
                );

                const today = startOfToday();
                let missed = [];

                snapshot.forEach((docSnap) => {
                    const date = parseISO(docSnap.id);
                    if (!isValid(date)) return;
                    const items = docSnap.data().items || [];
                    if (isBefore(date, today)) {
                        const incomplete = items.filter((t) => !t.completed);
                        missed.push(...incomplete);
                    }
                });

                setMissedTasks(missed);
            } catch (err) {
                console.error("Error fetching missed tasks:", err);
            } finally {
                setLoading(false);
            }
        };

        const checkDailyMood = async () => {
            try {
                const moodRef = doc(db, "users", currentUser.uid, "dailyContext", todayStr);
                const moodSnap = await getDoc(moodRef);
                if (!moodSnap.exists() || !moodSnap.data().mood) {
                    setShowMoodModal(true);
                }
            } catch (err) {
                console.error("Error checking daily mood:", err);
            }
        };

        fetchMissedTasks();
        checkDailyMood();
    }, [currentUser, todayStr]);

    const handleMoodSelect = async (mood) => {
        setShowMoodModal(false);
        try {
            const moodRef = doc(db, "users", currentUser.uid, "dailyContext", todayStr);
            await setDoc(moodRef, {
                mood,
                updatedAt: serverTimestamp()
            }, { merge: true });
        } catch (err) {
            console.error("Error saving mood:", err);
        }
    };

    return (
        <AppLayout>
            <div className="p-8 min-h-screen">
                {/* Mood Modal */}
                {showMoodModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                        <div className="bg-surface-container-low p-8 rounded-2xl shadow-2xl max-w-sm w-full text-center border border-white/10">
                            <h2 className="text-2xl font-bold text-white mb-2 font-headline">How are you feeling today?</h2>
                            <p className="text-zinc-400 mb-8 text-sm">We'll use this to optimize your AI schedule.</p>
                            <div className="flex justify-center gap-3">
                                <button onClick={() => handleMoodSelect('Happy')} className="flex flex-col items-center gap-2 p-4 rounded-xl bg-tertiary/10 hover:bg-tertiary/20 transition-colors border border-tertiary/20 w-24">
                                    <span className="text-4xl leading-none">😊</span>
                                    <span className="font-semibold text-tertiary text-sm">Happy</span>
                                </button>
                                <button onClick={() => handleMoodSelect('OK')} className="flex flex-col items-center gap-2 p-4 rounded-xl bg-secondary/10 hover:bg-secondary/20 transition-colors border border-secondary/20 w-24">
                                    <span className="text-4xl leading-none">😐</span>
                                    <span className="font-semibold text-secondary text-sm">OK</span>
                                </button>
                                <button onClick={() => handleMoodSelect('Tired/Sad')} className="flex flex-col items-center gap-2 p-4 rounded-xl bg-primary/10 hover:bg-primary/20 transition-colors border border-primary/20 w-24">
                                    <span className="text-4xl leading-none">😴</span>
                                    <span className="font-semibold text-primary text-sm">Tired</span>
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <div className="max-w-7xl mx-auto">
                    {/* Dashboard Header */}
                    <div className="mb-12">
                        <h1 className="text-4xl font-extrabold font-headline text-white tracking-tight mb-2">Dashboard</h1>
                        <p className="text-zinc-400 font-medium text-sm">AI that plans your success.</p>
                    </div>

                    {/* Main Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                        {/* Progress/Efficiency Section */}
                        <section className="lg:col-span-8 bg-surface-container-low rounded-2xl border border-white/5 p-10 flex flex-col items-center justify-center relative overflow-hidden group shadow-2xl">
                            {/* Subtle Background Glow */}
                            <div className="absolute -top-24 -right-24 w-64 h-64 bg-secondary/10 blur-[100px] rounded-full"></div>
                            <div className="w-full flex justify-between items-center mb-10 relative z-10">
                                <h3 className="font-headline font-bold text-xs uppercase tracking-[0.2em] text-zinc-400">Efficiency Telemetry</h3>
                                <div className="flex items-center gap-1.5 px-3 py-1 bg-white/5 rounded-lg border border-white/10">
                                    <span className="text-[10px] font-bold text-zinc-300">LIVE_DATA</span>
                                </div>
                            </div>
                            {/* Visual Gauge */}
                            <div className="relative w-72 h-72 flex items-center justify-center mb-4">
                                <svg className="w-full h-full -rotate-90">
                                    <circle className="text-white/5" cx="144" cy="144" fill="transparent" r="130" stroke="currentColor" strokeWidth="8"></circle>
                                    <circle className="text-secondary progress-ring-glow" cx="144" cy="144" fill="transparent" r="130" stroke="currentColor" strokeDasharray="816" strokeDashoffset="130" strokeLinecap="round" strokeWidth="12"></circle>
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                                    <span className="text-7xl font-extrabold font-headline text-white tracking-tighter text-glow-cyan">84<span className="text-secondary text-3xl font-bold ml-1">%</span></span>
                                    <span className="font-medium text-[11px] text-zinc-400 uppercase tracking-[0.3em] mt-3">Peak Performance</span>
                                </div>
                            </div>
                            <div className="mt-12 grid grid-cols-3 gap-16 w-full max-w-xl relative z-10">
                                <div className="text-center">
                                    <p className="text-white font-headline font-bold text-2xl mb-1">{Math.round(((missedTasks.length > 0 ? 0 : 1) * 100))}<span className="text-zinc-500 text-sm ml-1">%</span></p>
                                    <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Today's Performance</p>
                                </div>
                                <div className="text-center border-x border-white/5 px-4">
                                    <p className="text-tertiary font-headline font-bold text-2xl mb-1">{missedTasks.length}<span className="text-tertiary/60 text-sm ml-1"></span></p>
                                    <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Pending Tasks</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-white font-headline font-bold text-2xl mb-1">{new Date().toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase()}</p>
                                    <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Active Day</p>
                                </div>
                            </div>
                        </section>

                        {/* Right Column: Missed Tasks & Questionnaire */}
                        <div className="lg:col-span-4 space-y-8">
                            {/* Missed Tasks Section */}
                            <section className="bg-surface-container-low rounded-2xl border border-white/5 p-7 shadow-xl">
                                <div className="flex justify-between items-center mb-8">
                                    <h3 className="font-headline font-bold text-xs uppercase tracking-[0.2em] text-zinc-400">Critical Alerts</h3>
                                    <span className={`flex h-2 w-2 rounded-full ${missedTasks.length > 0 ? 'bg-error' : 'bg-tertiary'}`}></span>
                                </div>
                                <div className="space-y-4">
                                    {loading ? (
                                        <p className="text-zinc-500 text-sm">Loading...</p>
                                    ) : missedTasks.length === 0 ? (
                                        <div className="bg-tertiary/5 border border-tertiary/20 p-5 rounded-xl flex items-center justify-between">
                                            <div>
                                                <p className="text-tertiary font-extrabold text-2xl tracking-tight leading-none">NOMINAL</p>
                                                <p className="text-tertiary/70 text-[10px] font-bold uppercase tracking-widest mt-1.5">All Systems Operational</p>
                                            </div>
                                            <div className="w-12 h-12 rounded-xl bg-tertiary/20 flex items-center justify-center">
                                                <span className="material-symbols-outlined text-tertiary font-bold">check_circle</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="bg-error/5 border border-error/20 p-5 rounded-xl flex items-center justify-between group transition-all hover:bg-error/10">
                                                <div>
                                                    <p className="text-error font-extrabold text-2xl tracking-tight leading-none">{missedTasks.length} PENDING</p>
                                                    <p className="text-error/70 text-[10px] font-bold uppercase tracking-widest mt-1.5">Action Required Now</p>
                                                </div>
                                                <div className="w-12 h-12 rounded-xl bg-error/20 flex items-center justify-center">
                                                    <span className="material-symbols-outlined text-error font-bold">warning</span>
                                                </div>
                                            </div>
                                            <div className="space-y-3 pt-2 max-h-48 overflow-y-auto">
                                                {missedTasks.slice(0, 5).map((task, i) => (
                                                    <button key={i} className="w-full flex items-center justify-between p-4 bg-white/[0.03] hover:bg-white/[0.06] rounded-xl border border-white/5 transition-all text-left group">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-error group-hover:shadow-[0_0_8px_rgba(255,107,107,0.8)]"></div>
                                                            <div>
                                                                <p className="text-sm font-bold text-white truncate">{task.title || task.task}</p>
                                                                <p className="text-[10px] text-zinc-500 font-medium">Missed Task</p>
                                                            </div>
                                                        </div>
                                                        <span className="material-symbols-outlined text-zinc-600 text-lg group-hover:text-white transition-colors">chevron_right</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </div>
                            </section>

                            {/* Edit Questionnaire Section */}
                            <section 
                                onClick={() => navigate("/setup", { state: { edit: true } })}
                                className="glass-panel rounded-2xl p-7 relative overflow-hidden transition-all duration-300 group cursor-pointer border-l-4 border-l-primary/40"
                            >
                                <div className="relative z-10">
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 group-hover:bg-primary/20 transition-colors">
                                            <span className="material-symbols-outlined text-primary">psychology</span>
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-extrabold font-headline text-white tracking-tight">PROTOCOL UPDATE</h3>
                                            <p className="text-[10px] text-primary font-bold uppercase tracking-[0.2em]">Parameter Matrix</p>
                                        </div>
                                    </div>
                                    <p className="text-sm text-zinc-400 font-medium mb-8 leading-relaxed">Adjust baseline neural profiles and protocol execution weights to optimize predictive accuracy.</p>
                                    <div className="flex items-center justify-between w-full pt-4 border-t border-white/5 group-hover:border-primary/20 transition-colors">
                                        <span className="text-[11px] font-bold text-white uppercase tracking-widest group-hover:text-primary transition-colors">Configure System Matrix</span>
                                        <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
                                            <span className="material-symbols-outlined text-lg">arrow_forward</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="absolute -right-12 -bottom-12 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity pointer-events-none">
                                    <span className="material-symbols-outlined text-[12rem]">settings_suggest</span>
                                </div>
                            </section>
                        </div>
                    </div>

                    {/* Bottom Status Bar */}
                    <footer className="mt-16 flex justify-between items-center border-t border-white/5 pt-10 text-zinc-500 font-medium text-[10px] uppercase tracking-[0.3em]">
                        <div className="flex items-center gap-10">
                            <div className="flex items-center gap-2">
                                <span className="text-white/30">USER:</span>
                                <span className="text-white font-bold">{currentUser?.displayName?.toUpperCase() || 'OPERATOR'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-white/30">PLAN ID:</span>
                                <span className="text-white font-bold">VIPER-{currentUser?.uid?.slice(0, 6).toUpperCase() || '001'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-white/30">TASKS TODAY:</span>
                                <span className="text-tertiary font-bold">{missedTasks.length === 0 ? 'ALL CLEAR' : missedTasks.length + ' PENDING'}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-tertiary shadow-[0_0_10px_rgba(78,222,163,0.5)]"></div>
                        </div>
                    </footer>
                </div>
            </div>
        </AppLayout>
    );
};

export default Dashboard;
