import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div suppressHydrationWarning className="min-h-screen bg-slate-50">
            {/* Sidebar */}
            <Sidebar />

            {/* Main Content Area */}
            <div className="lg:ml-64">
                {/* Navbar */}
                <Navbar />

                {/* Page Content */}
                <main className="pt-16 min-h-screen">
                    <div className="p-4 md:p-6">
                        <ProtectedRoute>
                            {children}
                        </ProtectedRoute>
                    </div>
                </main>
            </div>
        </div>
    );
}
