export default function Loading() {
    return (
        <div className="fixed inset-0 min-h-screen bg-slate-50 flex flex-col items-center justify-center z-[9999]">
            <div className="relative flex flex-col items-center">
                {/* Elegant pulsing spinner/circle sequence */}
                <div className="w-16 h-16 border-4 border-gray-100 border-t-[#059669] rounded-full animate-spin shadow-sm"></div>
                <div className="mt-6">
                    <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-[#059669] rounded-full animate-pulse w-full"></div>
                    </div>
                </div>
                <p className="mt-4 text-sm font-medium text-gray-400 tracking-wide animate-pulse">Loading...</p>
            </div>
        </div>
    );
}
