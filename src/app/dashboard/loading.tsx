export default function DashboardLoading() {
    return (
        <div className="flex min-h-screen bg-gray-50">
            {/* Sidebar Skeleton */}
            <div className="w-64 bg-white border-r border-gray-200 hidden md:flex flex-col p-6 space-y-6">
                {/* Logo area */}
                <div className="h-8 bg-gray-200 rounded-md w-3/4 mb-6 animate-pulse"></div>

                {/* Navigation Links Skeleton */}
                <div className="space-y-4">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="flex items-center gap-3 animate-pulse">
                            <div className="w-5 h-5 rounded bg-gray-200"></div>
                            <div className="h-4 bg-gray-200 rounded w-full"></div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Main Content Skeleton */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Header Skeleton */}
                <header className="h-[73px] bg-white border-b border-gray-200 shrink-0 flex items-center justify-between px-6">
                    <div className="h-6 bg-gray-200 rounded w-48 animate-pulse"></div>
                    <div className="flex items-center gap-4 animate-pulse">
                        <div className="w-8 h-8 rounded-full bg-gray-200"></div>
                        <div className="w-10 h-10 rounded-full bg-gray-200"></div>
                    </div>
                </header>

                {/* Content Skeleton */}
                <div className="flex-1 overflow-x-hidden">
                    <main className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
                        {/* Page Title */}
                        <div className="h-8 bg-gray-200 rounded w-1/4 animate-pulse mb-8"></div>
                        
                        {/* Stat Cards Skeleton */}
                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                            {[...Array(3)].map((_, i) => (
                                <div key={i} className="h-32 bg-white rounded-xl border border-gray-100 shadow-sm animate-pulse p-6 flex flex-col justify-between">
                                    <div className="w-12 h-12 rounded-lg bg-gray-100"></div>
                                    <div className="space-y-2 mt-4">
                                        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                                        <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Recent Activity / Content Block Skeleton */}
                        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-4">
                            <div className="h-6 bg-gray-200 rounded w-1/4 animate-pulse mb-4"></div>
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="flex items-center gap-4 py-3 animate-pulse border-b border-gray-50 last:border-0">
                                    <div className="w-10 h-10 rounded-full bg-gray-100"></div>
                                    <div className="flex-1 space-y-2">
                                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                                        <div className="h-3 bg-gray-100 rounded w-1/2"></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
}
