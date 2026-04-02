import Layout from "../Layout";

export default function StartTimeStep({ form, setForm, next, back }) {
    // Convert from hours (0-24) to minutes (0-1440) for the slider
    const hoursValue = form?.startTime !== undefined ? form.startTime : 9;
    const minutes = hoursValue * 60;
    const hrs = Math.floor(minutes / 60).toString().padStart(2, '0');
    const mins = (minutes % 60).toString().padStart(2, '0');

    const handleSliderChange = (e) => {
        const minsValue = Number(e.target.value);
        const hoursValue = Math.round(minsValue / 60 * 2) / 2; // Round to nearest 0.5
        setForm({ ...form, startTime: hoursValue });
    };

    return (
        <Layout step={1} onNext={next} onBack={back}>
            {/* Hero Content */}
            <div className="mb-10">
                <h2 className="font-headline text-[2.75rem] leading-[1.1] font-extrabold tracking-tight text-on-surface mb-3">
                    What time do you usually start your day?
                </h2>
                <p className="text-on-surface-variant text-lg leading-relaxed font-medium">
                    We'll tailor your peak focus hours to your unique routine.
                </p>
            </div>

            {/* Time Display Card */}
            <div className="relative bg-surface-container-lowest rounded-lg p-8 mb-10 ambient-glow border border-outline-variant/10">
                {/* Decorative background glow */}
                <div className="absolute -top-16 -right-16 w-32 h-32 bg-primary/5 rounded-full blur-2xl"></div>
                <div className="absolute -bottom-16 -left-16 w-32 h-32 bg-secondary/5 rounded-full blur-2xl"></div>
                
                <div className="relative z-10 flex flex-col items-center">
                    <span className="font-label text-[0.7rem] font-bold text-primary uppercase tracking-[0.2em] mb-3">
                        Morning Routine
                    </span>
                    <div className="font-headline text-6xl font-extrabold text-on-surface flex items-baseline gap-1">
                        {hrs}<span className="text-primary-dim opacity-40">:</span>{mins}
                    </div>
                    <div className="mt-8 w-full px-2">
                        <input
                            className="time-slider w-full h-2 bg-surface-container-highest rounded-full appearance-none cursor-pointer"
                            max="1440" 
                            min="0" 
                            step="30"
                            type="range" 
                            value={minutes}
                            onChange={handleSliderChange}
                        />
                        <div className="flex justify-between mt-4 px-1">
                            <span className="font-label text-[10px] font-semibold text-on-surface-variant/50">12:00 AM</span>
                            <span className="font-label text-[10px] font-semibold text-on-surface-variant/50">11:59 PM</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tips / Contextual Info */}
            <div className="flex items-center justify-center gap-2 text-on-surface-variant/70">
                <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>light_mode</span>
                <span className="font-label text-xs font-medium italic">Early birds often peak before noon</span>
            </div>

            {/* Decorative Element */}
            <div className="mt-12 flex-1 flex items-end justify-center opacity-40">
                <div className="w-24 h-1 bg-surface-container-highest rounded-full"></div>
            </div>
        </Layout>
    );
}


