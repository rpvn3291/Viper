import Layout from "../Layout";

const options = [
    {
        key: "hard-first",
        title: "Start with hard tasks",
        desc: "Tackle your biggest challenges while your focus is highest.",
        icon: "bolt",
        isFill: true
    },
    {
        key: "easy-first",
        title: "Start with easy tasks",
        desc: "Build momentum with quick wins to get your day moving.",
        icon: "rocket_launch",
        isFill: false
    },
];

export default function PreferenceStep({ form, setForm, next, back }) {
    return (
        <Layout step={3} onNext={next} onBack={back}>
            {/* Editorial Header Section */}
            <section className="mb-10">
                <h2 className="font-headline text-[2.75rem] leading-[1.1] font-extrabold tracking-tight text-on-surface mb-4">
                    How do you prefer to start your work?
                </h2>
                <p className="font-body text-lg text-on-surface-variant leading-relaxed">
                    We'll suggest tasks based on your energy levels.
                </p>
            </section>

            {/* Preference Cards Container */}
            <div className="space-y-4">
                {options.map((opt) => {
                    const isSelected = form?.preference === opt.key;
                    return (
                        <label key={opt.key} className="relative block cursor-pointer group">
                            <input
                                className="peer sr-only"
                                name="preference"
                                type="radio"
                                checked={isSelected}
                                onChange={() => setForm({ ...form, preference: opt.key })}
                            />
                            <div className={`p-6 rounded-lg border ambient-glow transition-all duration-300 ${isSelected
                                    ? "ring-2 ring-primary bg-surface-container-lowest border-primary/20"
                                    : "bg-surface-container-low border-outline-variant/10 hover:bg-surface-container"
                                }`}>
                                <div className="flex items-start gap-5">
                                    <div className={`w-14 h-14 rounded-full flex items-center justify-center shrink-0 transition-transform group-active:scale-95 ${isSelected
                                            ? "bg-primary-container text-on-primary-container"
                                            : "bg-surface-container-highest text-on-surface-variant"
                                        }`}>
                                        <span 
                                            className="material-symbols-outlined text-[28px]" 
                                            style={opt.isFill && isSelected ? { fontVariationSettings: "'FILL' 1" } : {}}
                                        >
                                            {opt.icon}
                                        </span>
                                    </div>
                                    <div>
                                        <h3 className="font-headline text-xl font-bold text-on-surface mb-2">{opt.title}</h3>
                                        <p className="font-body text-on-surface-variant text-sm leading-relaxed">
                                            {opt.desc}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </label>
                    );
                })}
            </div>

            {/* Decorative Element */}
            <div className="mt-12 flex-1 flex items-end justify-center opacity-40">
                <div className="w-24 h-1 bg-surface-container-highest rounded-full"></div>
            </div>
        </Layout>
    );
}