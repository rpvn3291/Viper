import Layout from "../components/Layout";

export default function BlockedTimeStep({ form, setForm, next, back }) {
    return (
        <Layout step={5} onNext={next} onBack={back}>

            {/* Title */}
            <h2 className="text-xl font-semibold">
                Let’s personalize your day
            </h2>

            <p className="text-gray-400 text-sm mt-1">
                Set your unavailable time
            </p>

            {/* Card */}
            <div className="bg-gray-100 p-6 rounded-2xl mt-6 shadow-sm">

                <p className="text-sm text-gray-500 mb-4 text-center">
                    Example: college / work hours
                </p>

                {/* Inputs */}
                <div className="flex items-center gap-3">

                    {/* Start */}
                    <div className="flex-1">
                        <label className="text-xs text-gray-500">Start</label>
                        <input
                            type="number"
                            min="0"
                            max="23"
                            className="w-full p-3 rounded-xl mt-1 outline-none border border-gray-200 focus:border-indigo-500"
                            value={form.blockedTime.start}
                            onChange={(e) =>
                                setForm({
                                    ...form,
                                    blockedTime: {
                                        ...form.blockedTime,
                                        start: Number(e.target.value),
                                    },
                                })
                            }
                        />
                    </div>

                    {/* Separator */}
                    <span className="text-gray-400 mt-5">→</span>

                    {/* End */}
                    <div className="flex-1">
                        <label className="text-xs text-gray-500">End</label>
                        <input
                            type="number"
                            min="0"
                            max="23"
                            className="w-full p-3 rounded-xl mt-1 outline-none border border-gray-200 focus:border-indigo-500"
                            value={form.blockedTime.end}
                            onChange={(e) =>
                                setForm({
                                    ...form,
                                    blockedTime: {
                                        ...form.blockedTime,
                                        end: Number(e.target.value),
                                    },
                                })
                            }
                        />
                    </div>
                </div>

                {/* Helper */}
                <p className="text-xs text-gray-400 mt-4 text-center">
                    Enter time in 24-hour format (e.g., 13 = 1 PM)
                </p>

            </div>

        </Layout>
    );
}