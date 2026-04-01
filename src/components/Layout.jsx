export default function Layout({ step, children, onNext, onBack }) {
    const percent = (step / 5) * 100;

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#f5f6fb]">
            <div className="w-[360px] bg-white rounded-3xl shadow-lg p-5 flex flex-col justify-between h-[640px]">

                {/* Header */}
                <div>
                    <div className="flex justify-between items-center text-sm text-gray-500">
                        <span>Onboarding</span>
                        <span>Step {step} of 5</span>
                    </div>

                    {/* Progress */}
                    <div className="w-full h-1 bg-gray-200 rounded mt-2">
                        <div
                            className="h-1 bg-indigo-500 rounded"
                            style={{ width: `${percent}%` }}
                        />
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 flex flex-col justify-center">
                    {children}
                </div>

                {/* Footer */}
                <div className="flex justify-between items-center mt-4">
                    <button onClick={onBack} className="text-gray-400">
                        ←
                    </button>

                    <button
                        onClick={onNext}
                        className="bg-indigo-500 text-white px-5 py-2 rounded-xl shadow"
                    >
                        Next →
                    </button>
                </div>
            </div>
        </div>
    );
}