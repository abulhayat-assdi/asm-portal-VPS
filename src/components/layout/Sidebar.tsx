"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import BrandLogo from "@/components/ui/BrandLogo";
import { useSidebarNotifications } from "@/hooks/useSidebarNotifications";

const teacherAdminNavItems = [
    { href: "/dashboard", label: "Dashboard", icon: "🏠", adminOnly: false },
    { href: "/dashboard/teachers", label: "Teacher Directory", icon: "👥", adminOnly: false },
    { href: "/dashboard/schedule", label: "Class Schedule", icon: "📅", adminOnly: false },
    { href: "/dashboard/manage-routine", label: "Manage Routine", icon: "📆", adminOnly: false },
    { href: "/dashboard/all-batch-info", label: "All Batch Info", icon: "📊", adminOnly: false },
    { href: "/dashboard/resources", label: "Resource Management", icon: "🗂️", adminOnly: false },
    { href: "/dashboard/course-modules", label: "Course Modules", icon: "📚", adminOnly: false },
    { href: "/dashboard/policies", label: "Policy & Minutes", icon: "📋", adminOnly: false },
    { href: "/dashboard/feedback", label: "Feedback", icon: "💬", adminOnly: false },
    { href: "/dashboard/tracker", label: "Daily Tracker", icon: "📋", adminOnly: false },
    { href: "/dashboard/homework", label: "Homework", icon: "📝", adminOnly: false },
    { href: "/dashboard/admin", label: "Admin Panel", icon: "⚙️", adminOnly: true },
    { href: "/dashboard/admin/manage-homework", label: "Manage Homework", icon: "📁", adminOnly: true },
    { href: "/dashboard/admin/manage-results", label: "Manage Results", icon: "📝", adminOnly: false },
    { href: "/dashboard/admin/student-updates", label: "Student Updates", icon: "🔔", adminOnly: true },
    { href: "/dashboard/admin/contact-messages", label: "Contact Messages", icon: "📩", adminOnly: true },
    { href: "/dashboard/admin/resource-management", label: "Admin: Resources", icon: "🗂️", adminOnly: true },
    { href: "/dashboard/admin/blog", label: "Blog Management", icon: "📝", adminOnly: true },
    { href: "/dashboard/admin/home-video-testimonials", label: "Home Videos", icon: "🎥", adminOnly: true },
    { href: "/dashboard/admin/success-stories", label: "Success Stories", icon: "🎬", adminOnly: true },
];

const studentNavItems = [
    { href: "/student-dashboard", label: "Dashboard", icon: "🏠", adminOnly: false },
    { href: "/student-dashboard/routine", label: "Class Routine", icon: "🗓️", adminOnly: false },
    { href: "/student-dashboard/resource", label: "Resource", icon: "📚", adminOnly: false },
    { href: "/student-dashboard/course-outline", label: "Course Outline", icon: "📋", adminOnly: false },
    { href: "/student-dashboard/homework", label: "Homework", icon: "📝", adminOnly: false },
    { href: "/student-dashboard/results", label: "Results", icon: "🎓", adminOnly: false },
    { href: "/student-dashboard/profile", label: "Profile", icon: "👤", adminOnly: false },
];

export default function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const { userProfile, logout, loading } = useAuth();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    
    // Notifications hook
    const { counts, markPageAsVisited } = useSidebarNotifications();

    // Mark current path as visited
    useEffect(() => {
        if (pathname && !loading) {
            markPageAsVisited(pathname);
        }
    }, [pathname, loading, markPageAsVisited]);

    const isStudent = userProfile?.role === "student";
    const activeNavItems = isStudent ? studentNavItems : teacherAdminNavItems;

    // Filter nav items based on user role
    // Show all items while loading, then filter based on role
    const filteredNavItems = activeNavItems.filter(item => {
        if (item.adminOnly) {
            // Only show admin items if user is loaded and is admin
            return !loading && userProfile?.role === "admin";
        }
        return true;
    });

    // Handle logout: clear Firebase session and redirect to login
    const handleLogout = async () => {
        try {
            const redirectPath = isStudent ? "/student-login" : "/login";
            await logout();
            router.push(redirectPath);
        } catch (error) {
            console.error("Logout error:", error);
        }
    };

    return (
        <>
            {/* Mobile Menu Button */}
            <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-md border border-[#e5e7eb]"
                aria-label="Toggle menu"
            >
                <svg className="w-6 h-6 text-[#1f2937]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {isMobileMenuOpen ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    )}
                </svg>
            </button>

            {/* Overlay for mobile */}
            {isMobileMenuOpen && (
                <div
                    className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={cn(
                "w-64 bg-white border-r border-[#e5e7eb] text-[#1f2937] h-[100dvh] fixed left-0 top-0 flex flex-col z-40 transition-transform duration-300",
                // Mobile: slide in/out
                isMobileMenuOpen ? "translate-x-0" : "-translate-x-full",
                // Desktop: always visible
                "lg:translate-x-0"
            )}>
                {/* Logo/Brand */}
                <div className="p-6 border-b border-[#e5e7eb] flex items-center justify-center">
                    <Link
                        href={isStudent ? "/student-dashboard" : "/dashboard"}
                        prefetch={true}
                        className="cursor-pointer group"
                        onClick={() => setIsMobileMenuOpen(false)}
                    >
                        <div suppressHydrationWarning className="bg-[#0D1B2A] rounded-xl px-4 py-3 flex items-center gap-3 shadow-sm transition-all duration-300 ease-in-out group-hover:shadow-md group-hover:-translate-y-0.5">
                            {/* New Brand Logo */}
                            <BrandLogo size={36} primaryColor="#FFFFFF" arrowColor="#4CAF50" />

                            {/* Text */}
                            <div suppressHydrationWarning className="text-white font-bold text-sm leading-tight tracking-wide">
                                SALES <br />MARKETING
                            </div>
                        </div>
                    </Link>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-4 overflow-y-auto">
                    <ul className="space-y-2">
                        {filteredNavItems.map((item) => {
                            const isActive = pathname === item.href;
                            const badgeCount = counts[item.href] || 0;
                            return (
                                <li key={item.href}>
                                    <Link
                                        href={item.href}
                                        prefetch={true}
                                        onClick={() => {
                                            setIsMobileMenuOpen(false);
                                            markPageAsVisited(item.href);
                                        }}
                                        className={cn(
                                            "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors duration-200",
                                            isActive
                                                ? "bg-[#059669] text-white font-medium rounded-full"
                                                : "text-[#6b7280] hover:bg-[#d1fae5] hover:text-[#1f2937] rounded-full"
                                        )}
                                    >
                                        <span className="text-xl">{item.icon}</span>
                                        <span className="text-sm font-semibold">{item.label}</span>
                                        {badgeCount > 0 && (
                                            <span className="ml-auto bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full animate-in fade-in zoom-in">
                                                {badgeCount > 99 ? '99+' : badgeCount}
                                            </span>
                                        )}
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </nav>

                {/* Bottom Actions */}
                <div className="p-4 border-t border-[#e5e7eb] space-y-2">
                    {/* Contact Button - Students Only */}
                    {isStudent && (
                        <Link
                            href="/student-dashboard/contact-admin"
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-[#059669] text-white rounded-lg hover:bg-[#047857] transition-all duration-200 cursor-pointer"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                            </svg>
                            <span className="text-sm font-bold">Contact Admin</span>
                        </Link>
                    )}

                    {/* Logout Button */}
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 w-full p-2 bg-[#fee2e2] text-[#dc2626] rounded-xl hover:bg-[#fecaca] transition-all duration-200 cursor-pointer"
                    >
                        <div className="w-10 h-10 rounded-full bg-[#1f2937] flex items-center justify-center text-white font-medium text-lg flex-shrink-0 shadow-inner">
                            {userProfile?.displayName ? userProfile.displayName.charAt(0).toUpperCase() : "U"}
                        </div>
                        <div className="flex items-center gap-2 flex-1 justify-center pr-6">
                            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            <span className="text-base font-bold whitespace-nowrap">Logout</span>
                        </div>
                    </button>
                </div>
            </aside>
        </>
    );
}
