export default function Loading() {
    return (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm">
            <div className="relative flex items-center justify-center">
                {/* Outer pulsing ring */}
                <div className="absolute inset-0 w-20 h-20 bg-[#059669]/20 rounded-full animate-ping"></div>

                {/* Inner spinning circle with brand styling */}
                <div className="w-16 h-16 rounded-full border-4 border-gray-100 border-t-[#059669] border-r-[#059669] animate-spin"></div>
                
                {/* Center dot/icon representation */}
                <div className="absolute w-4 h-4 bg-[#059669] rounded-full"></div>
            </div>
            
            <p className="mt-6 text-[#059669] font-semibold text-sm tracking-widest uppercase animate-pulse">
                Loading
            </p>
        </div>
    );
}
