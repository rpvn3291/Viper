import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { isBefore, startOfToday, parseISO, isValid } from "date-fns";

const Dashboard = () => {
    const { currentUser } = useAuth();
    const navigate = useNavigate();

    const [missedTasks, setMissedTasks] = useState([]);
    const [loading, setLoading] = useState(true);

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
                    // ✅ safer date parsing (important fix)
                    const date = parseISO(docSnap.id);

                    if (!isValid(date)) return; // skip invalid docs

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

        fetchMissedTasks();
    }, [currentUser]);

    return (
        <div className="p-6 bg-slate-50 min-h-screen">
            {/* 🔹 Header */}
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <p className="text-sm text-gray-500 mt-1">
                Overview of your productivity
            </p>

            {/* 🔹 Questionnaire Section */}
            <div className="mt-6 bg-white p-5 rounded-xl shadow">
                <h2 className="font-semibold text-lg">Your Preferences</h2>
                <p className="text-sm text-gray-500 mt-1">
                    Modify your AI planner setup anytime
                </p>

                <button
                    onClick={() => navigate("/setup", { state: { edit: true } })} // ✅ FIXED
                    className="mt-3 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition"
                >
                    Edit Questionnaire
                </button>
            </div>

            {/* 🔹 Missed Tasks */}
            <div className="mt-6 bg-white p-5 rounded-xl shadow">
                <h2 className="font-semibold text-lg">Missed Tasks</h2>

                {loading ? (
                    <p className="mt-2 text-gray-500">Loading...</p>
                ) : missedTasks.length === 0 ? (
                    <p className="mt-2 text-green-600 font-medium">
                        No missed tasks 🎉
                    </p>
                ) : (
                    <div className="mt-3 space-y-2 max-h-64 overflow-y-auto">
                        {missedTasks.map((task, i) => (
                            <div
                                key={i}
                                className="bg-red-100 px-3 py-2 rounded-lg text-sm flex justify-between items-center"
                            >
                                <span>{task.title}</span>
                                <span className="text-xs text-red-600">
                                    Missed
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* 🔹 Navigation */}
            <div className="mt-6 flex gap-3 flex-wrap">
                <button
                    onClick={() => navigate("/tasks")}
                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition"
                >
                    Go to Tasks
                </button>

                <button
                    onClick={() => navigate("/calendar")}
                    className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg transition"
                >
                    View Calendar
                </button>
            </div>
        </div>
    );
};

export default Dashboard;