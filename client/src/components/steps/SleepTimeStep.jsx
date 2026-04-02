import Layout from "../Layout";

export default function SleepTimeStep({ form, setForm, next, back }) {
    const formatTimeInput = (value) => {
        const num = parseInt(value);
        if (isNaN(num)) return "";
        if (num < 0) return "00";
        if (num > 23) return "23";
        return num.toString().padStart(2, '0');
    };

    const handleStartChange = (e) => {
        const value = formatTimeInput(e.target.value);
        setForm({
            ...form,
            sleepTime: {
                ...form.sleepTime,
                start: value === "" ? 0 : parseInt(value),
            },
        });
    };

    const handleEndChange = (e) => {
        const value = formatTimeInput(e.target.value);
        setForm({
            ...form,
            sleepTime: {
                ...form.sleepTime,
                end: value === "" ? 0 : parseInt(value),
            },
        });
    };

    const formatDisplay = (val) => val?.toString().padStart(2, '0') + ":00";

    return (
        <Layout step={5} onNext={next} onBack={back} isLastStep={false}>
            {/* Header Text Section */}
            <div className="space-y-3 mb-8">
                <h2 className="text-display-md text-4xl font-extrabold tracking-tight text-on-surface leading-tight">
                    Set your sleep schedule
                </h2>
                <p className="text-on-surface-variant text-lg font-medium leading-relaxed">
                    When do you usually sleep? We'll ensure the AI respects your rest hours.
                </p>
            </div>

            {/* Onboarding Card: Sleep Time */}
            <div className="bg-surface-container-lowest p-8 rounded-lg ambient-glow border border-outline-variant/10 space-y-10">
                {/* Icon */}
                <div className="flex justify-center">
                    <div className="relative w-24 h-24 bg-surface-container rounded-full flex items-center justify-center">
                        <span className="material-symbols-outlined text-4xl text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>bedtime</span>
                        <div className="absolute -top-1 -right-1 w-8 h-8 bg-primary rounded-full flex items-center justify-center shadow-lg">
                            <span className="material-symbols-outlined text-white text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>nightlight</span>
                        </div>
                    </div>
                </div>

                {/* Time Inputs */}
                <div className="space-y-6">
                    {/* Start Time Input */}
                    <div className="space-y-2 group">
                        <label className="block text-sm font-label font-bold text-on-surface-variant/80 ml-1">
                            Bedtime
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                inputMode="numeric"
                                placeholder="--:--"
                                value={formatDisplay(form.sleepTime?.start)}
                                onChange={handleStartChange}
                                className="w-full bg-transparent border-b border-outline-variant/20 py-4 px-1 text-2xl font-semibold text-on-surface focus:outline-none focus:border-primary focus:bg-surface-container/30 transition-all rounded-t-lg"
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-on-surface-variant/40">dark_mode</span>
                        </div>
                    </div>

                    {/* End Time Input */}
                    <div className="space-y-2 group">
                        <label className="block text-sm font-label font-bold text-on-surface-variant/80 ml-1">
                            Wake up time
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                inputMode="numeric"
                                placeholder="--:--"
                                value={formatDisplay(form.sleepTime?.end)}
                                onChange={handleEndChange}
                                className="w-full bg-transparent border-b border-outline-variant/20 py-4 px-1 text-2xl font-semibold text-on-surface focus:outline-none focus:border-primary focus:bg-surface-container/30 transition-all rounded-t-lg"
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-on-surface-variant/40">wb_sunny</span>
                        </div>
                    </div>
                </div>

                {/* Instructional Tip */}
                <div className="bg-surface-container-low p-4 rounded-xl flex items-start gap-3">
                    <span className="material-symbols-outlined text-primary text-xl">info</span>
                    <p className="text-sm text-on-surface-variant leading-snug">
                        Your AI assistant will automatically decline tasks and give you breathing room around these hours.
                    </p>
                </div>
            </div>

            {/* Decorative Image Element */}
            <div className="mt-8 relative w-full aspect-video rounded-lg overflow-hidden shadow-sm">
                <img 
                    alt="Atmospheric night sky"
                    className="w-full h-full object-cover grayscale-[20%] opacity-90"
                    src="https://images.unsplash.com/photo-1505322022379-7c3353ee6291?q=80&w=800&auto=format&fit=crop" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent"></div>
            </div>
        </Layout>
    );
}
