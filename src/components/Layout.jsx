export default function Layout({ step, children, onNext, onBack, isLastStep = false }) {
    const percent = (step / 5) * 100;

    return (
        <div className="min-h-screen bg-background font-body text-on-surface flex flex-col items-center">
            {/* TopAppBar */}
            <header className="fixed top-0 w-full z-50 bg-[#f9f5ff]">
                <div className="flex justify-between items-center px-6 py-4 w-full max-w-md mx-auto">
                    <div className="flex items-center gap-4">
                        {onBack && step > 1 && (
                            <button
                                onClick={onBack}
                                className="hover:bg-[#e9e5ff] rounded-full transition-all p-2 active:scale-95 duration-200 text-primary"
                            >
                                <span className="material-symbols-outlined">arrow_back</span>
                            </button>
                        )}
                        {!onBack || step === 1 && <div className="w-10"></div>}
                        <h1 className="font-['Manrope'] font-bold tracking-tight text-xl text-[#2d2a51]">
                            Onboarding
                        </h1>
                    </div>
                    <div className="flex flex-col items-end">
                        <span className="text-xs font-label font-semibold text-on-surface-variant uppercase tracking-wider">
                            Step {step} of 5
                        </span>
                    </div>
                </div>
                {/* Progress Bar */}
                <div className="w-full bg-surface-container-highest h-[0.7rem]">
                    <div
                        className="bg-gradient-to-r from-primary to-inverse-primary h-full rounded-r-full transition-all duration-1000"
                        style={{ width: `${percent}%` }}
                    />
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 w-full max-w-md px-6 pt-28 pb-32 flex flex-col">
                {children}
            </main>

            {/* BottomNavBar */}
            <footer className="fixed bottom-0 w-full z-50 pb-8 px-6 bg-transparent">
                <div className="flex justify-between items-center w-full max-w-md mx-auto">
                    <button
                        onClick={onBack}
                        disabled={!onBack || step === 1}
                        className={`font-['Plus_Jakarta_Sans'] font-medium px-6 py-4 transition-opacity active:scale-98 flex items-center gap-2 ${
                            !onBack || step === 1
                                ? 'text-on-surface-variant/40 cursor-not-allowed'
                                : 'text-[#5a5781] hover:opacity-90'
                        }`}
                    >
                        <span className="material-symbols-outlined">chevron_left</span>
                        Back
                    </button>
                    <button
                        onClick={onNext}
                        className="bg-gradient-to-br from-[#4353b2] to-[#8999fd] text-white font-['Plus_Jakarta_Sans'] font-semibold text-sm rounded-full px-10 py-4 shadow-lg shadow-[#2d2a51]/10 hover:opacity-90 transition-opacity active:scale-98 flex items-center gap-2"
                    >
                        {isLastStep ? 'Get Started' : 'Next'}
                        <span className="material-symbols-outlined">chevron_right</span>
                    </button>
                </div>
            </footer>

            {/* Abstract Background */}
            <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
                <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] bg-primary-container/10 blur-[120px] rounded-full"></div>
                <div className="absolute -bottom-[10%] -right-[10%] w-[50%] h-[50%] bg-secondary-container/10 blur-[120px] rounded-full"></div>
            </div>
        </div>
    );
}