import Layout from "../components/Layout";

export default function AvailableHoursStep({ form, setForm, next, back }) {
    const hours = form?.availableHours ?? 4;

    return (
        <Layout step={4} onNext={next} onBack={back}>
            <div className="w-full bg-surface-container-lowest rounded-lg p-6 shadow-[0_10px_30px_rgba(45,42,81,0.06)] border border-outline-variant/10 text-center relative overflow-hidden mb-6 mt-4">
                {/* Decorative background glow */}
                <div className="absolute -top-16 -right-16 w-32 h-32 bg-primary/5 rounded-full blur-2xl"></div>
                <div className="absolute -bottom-16 -left-16 w-32 h-32 bg-secondary/5 rounded-full blur-2xl"></div>
                
                <div className="relative z-10">
                    <h2 className="font-headline font-extrabold text-xl tracking-tight text-on-surface mb-2">
                        How many hours can you dedicate?
                    </h2>
                    <p className="font-body text-xs text-on-surface-variant mb-8">
                        Tell us your daily target for productive work.
                    </p>
                    
                    {/* Value Display */}
                    <div className="flex flex-col items-center justify-center mb-8">
                        <div className="relative">
                            <span className="text-6xl font-headline font-extrabold text-primary tracking-tighter">{hours}</span>
                            <span className="text-lg font-headline font-bold text-on-surface-variant ml-1">hrs</span>
                        </div>
                    </div>
                    
                    {/* Custom Slider */}
                    <div className="px-2 mb-6">
                        <input
                            className="w-full h-2 bg-surface-container-highest rounded-full appearance-none cursor-pointer slider-thumb"
                            max="12" min="1" type="range" 
                            value={hours}
                            onChange={(e) => setForm({ ...form, availableHours: Number(e.target.value) })}
                        />
                        <div className="flex justify-between mt-4 px-1 text-[10px] font-label font-semibold text-outline">
                            <span>1 hr</span>
                            <span>4 hrs</span>
                            <span>8 hrs</span>
                            <span>12 hrs</span>
                        </div>
                    </div>
                    
                    {/* Contextual Hint */}
                    <div className="bg-surface-container-low rounded-xl p-3 flex items-start gap-2 text-left">
                        <span className="material-symbols-outlined text-primary text-lg mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>info</span>
                        <p className="text-xs font-body text-on-surface-variant leading-relaxed">
                            Most high-performers find that <strong className="text-on-surface">4-6 hours</strong> of deep work is the ideal daily threshold for flow state.
                        </p>
                    </div>
                </div>
            </div>
            {/* Aesthetic Imagery */}
            <div className="w-full h-24 rounded-lg overflow-hidden relative">
                <img 
                    alt="Calm workspace with natural light" 
                    className="w-full h-full object-cover grayscale-[20%] opacity-80"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuAjUWGjbgXNdGym3EtIhB9T3w87RpBSlB4Hy7LUovdfY4Fn2vtBruiH5x-LQ-NY1ta87HgBTSP-ZSYXdLoHx8-L21ZnrvPiBEh48oKfe0YoKyN8sUB1XWVDXdd3fPQ6DiwIvdq-jRU90w90bdpeexAWxPbxI4Pp75p2SysSxU7atd99cki9YDP-IqjZOOVAEWXyEufSRhREt23VxiF54bDhvSo0T_Yf1P_kmJRrcJEa_qWR2_A5KYOBiXEeYGvVjr0heAM2MWkXe3A" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent"></div>
            </div>
        </Layout>
    );
}