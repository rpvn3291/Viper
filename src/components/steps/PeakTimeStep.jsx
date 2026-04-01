import Layout from "../Layout";

const options = [
    { label: "Morning", id: "morning", icon: "wb_sunny", desc: "First light focus (6AM - 11AM)" },
    { label: "Afternoon", id: "afternoon", icon: "wb_twilight", desc: "Mid-day momentum (12PM - 5PM)" },
    { label: "Night", id: "night", icon: "dark_mode", desc: "Quiet evening flow (7PM - 12AM)" },
];

export default function PeakTimeStep({ form, setForm, next, back }) {
    return (
        <Layout step={2} onNext={next} onBack={back}>
            {/* Hero Content */}
            <div className="mb-10">
                <h2 className="font-headline text-[2.75rem] leading-[1.1] font-extrabold tracking-tight text-on-surface mb-3">
                    When are you most productive?
                </h2>
                <p className="text-on-surface-variant text-lg leading-relaxed font-medium">
                    Help us schedule your deep work sessions at times that match your natural energy.
                </p>
            </div>

            {/* Selection Grid */}
            <div className="space-y-4">
                {options.map((opt) => {
                    const isSelected = form?.peakTime === opt.id;
                    return (
                        <button
                            key={opt.id}
                            onClick={(e) => {
                                e.preventDefault();
                                setForm({ ...form, peakTime: opt.id });
                            }}
                            className={`w-full text-left bg-surface-container-lowest rounded-lg p-6 border transition-all duration-200 group active:scale-[0.98] ${
                                isSelected 
                                ? "border-outline-variant/20 shadow-[0_10px_30px_rgba(45,42,81,0.06)] ring-2 ring-primary ring-offset-4 ring-offset-background" 
                                : "border-outline-variant/10 hover:border-outline-variant/30"
                            }`}
                        >
                            <div className="flex items-center gap-5">
                                <div className={`w-16 h-16 flex-shrink-0 rounded-full flex items-center justify-center transition-colors ${
                                    isSelected 
                                    ? "bg-primary-container/20" 
                                    : "bg-surface-container group-hover:bg-secondary-container/30"
                                }`}>
                                    <span 
                                        className={`material-symbols-outlined text-3xl transition-colors ${
                                            isSelected 
                                            ? "text-primary" 
                                            : "text-on-surface-variant group-hover:text-secondary"
                                        }`}
                                        style={isSelected ? { fontVariationSettings: "'FILL' 1" } : {}}
                                    >
                                        {opt.icon}
                                    </span>
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-headline font-bold text-xl text-on-surface">{opt.label}</h3>
                                    <p className="font-label text-sm text-on-surface-variant mt-1">{opt.desc}</p>
                                </div>
                                {isSelected && (
                                    <div className="ml-auto">
                                        <span className="material-symbols-outlined text-primary">check_circle</span>
                                    </div>
                                )}
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* Decorative Element */}
            <div className="mt-12 opacity-40">
                <div className="w-full h-48 rounded-lg overflow-hidden relative">
                    <img 
                        alt="Desk setup" 
                        className="w-full h-full object-cover grayscale"
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuCF2pNKXfdVvVL6Du4q1jOYqPctD3hN435H5ORdiC6UtToVl7n_tob_fyxquTZt_DuGUcBWUX25ingw5oKXIYjDaCKBYrNgkpmFwwkOHKPSHW4DFirXLYjSqfAS9puV777kysw4s3OA0E5KP-siOC0FgokdbRXvzuI7xX-j6iAWXD-8Ls1IDiGM6RVzX7O-fwYORBfxL214_eXn3qNQdKK40F8eiGtZOgyBwe3d8PFYvWeAfwbJRz8EXR7d-6qpO1EsxNk0zWMFfnM" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent"></div>
                </div>
            </div>
        </Layout>
    );
}