import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import StudentProtectedRoute from "@/components/auth/StudentProtectedRoute";

export default function StudentDashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-[#f8f9fa]">
            {/* Sidebar */}
            <Sidebar />

            {/* Main Content Area */}
            <div className="lg:ml-64">
                {/* Navbar */}
                <Navbar />

                {/* Page Content */}
                <main className="pt-16 min-h-screen">
                    <div className="p-4 md:p-6">
                        <StudentProtectedRoute>
                            {children}
                        </StudentProtectedRoute>
                    </div>
                </main>
            </div>
        </div>
    );
}
