import Layout from "../components/Layout";

export default function StartTimeStep({ form, setForm, next, back }) {
    const minutes = form?.startTime !== undefined ? form?.startTime : 420;
    const hrs = Math.floor(minutes / 60).toString().padStart(2, '0');
    const mins = (minutes % 60).toString().padStart(2, '0');

    return (
        <Layout step={1} onNext={next} onBack={back}>
            <div className="px-2 py-6 text-center">
                <div className="mb-8">
                    <h1 className="font-headline text-3xl font-extrabold leading-tight tracking-tight text-on-surface mb-2">
                        What time do you usually start your day?
                    </h1>
                    <p className="font-body text-on-surface-variant text-sm leading-relaxed max-w-[280px] mx-auto">
                        We'll tailor your peak focus hours to your unique routine.
                    </p>
                </div>
                {/* Time Display Card */}
                <div className="relative bg-surface-container-lowest rounded-lg p-6 mb-10 ambient-glow border border-outline-variant/5">
                    <div className="flex flex-col items-center">
                        <span className="font-label text-[0.7rem] font-bold text-primary uppercase tracking-[0.2em] mb-2">
                            Morning Routine
                        </span>
                        <div className="font-headline text-5xl font-extrabold text-on-surface flex items-baseline gap-1">
                            {hrs}<span className="text-primary-dim opacity-40">:</span>{mins}
                        </div>
                        <div className="mt-8 w-full px-2">
                            <input
                                className="time-slider w-full h-2 bg-surface-container-highest rounded-full appearance-none cursor-pointer"
                                max="1440" min="0" type="range" 
                                value={minutes}
                                onChange={(e) => setForm({ ...form, startTime: Number(e.target.value) })}
                            />
                            <div className="flex justify-between mt-4 px-1">
                                <span className="font-label text-[10px] font-semibold text-on-surface-variant/50">12:00 AM</span>
                                <span className="font-label text-[10px] font-semibold text-on-surface-variant/50">11:59 PM</span>
                            </div>
                        </div>
                    </div>
                </div>
                {/* Tips / Contextual Info */}
                <div className="flex items-center justify-center gap-2 text-on-surface-variant/70 mb-2">
                    <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>light_mode</span>
                    <span className="font-label text-xs font-medium italic">Early birds often peak before noon</span>
                </div>
            </div>
        </Layout>
    );
}


