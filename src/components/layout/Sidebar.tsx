"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import BrandLogo from "@/components/ui/BrandLogo";
import { submitContactMessage } from "@/services/contactService";
import { serverTimestamp } from "firebase/firestore";
import { useSidebarNotifications } from "@/hooks/useSidebarNotifications";

const teacherAdminNavItems = [
    { href: "/dashboard", label: "Dashboard", icon: "🏠", adminOnly: false },
    { href: "/dashboard/teachers", label: "Teacher Directory", icon: "👥", adminOnly: false },
    { href: "/dashboard/schedule", label: "Class Schedule", icon: "📅", adminOnly: false },
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
    { href: "/dashboard/admin/success-stories", label: "Success Stories", icon: "🎬", adminOnly: true },
];

const studentNavItems = [
    { href: "/student-dashboard", label: "Dashboard", icon: "🏠", adminOnly: false },
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

    // Contact Modal State
    const [isContactOpen, setIsContactOpen] = useState(false);
    const [contactSubject, setContactSubject] = useState("");
    const [contactMessage, setContactMessage] = useState("");
    const [isSending, setIsSending] = useState(false);
    const [contactSuccess, setContactSuccess] = useState(false);
    const [contactError, setContactError] = useState("");

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

    const handleContactSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!contactSubject.trim() || !contactMessage.trim()) return;
        setIsSending(true);
        setContactError("");
        try {
            await submitContactMessage({
                subject: contactSubject,
                message: contactMessage,
                studentUid: userProfile?.uid || "",
                studentName: userProfile?.displayName || "Unknown",
                studentEmail: userProfile?.email || "",
                studentBatchName: userProfile?.studentBatchName || "N/A",
                studentRoll: userProfile?.studentRoll || "N/A",
                status: "unread",
                date: new Date().toISOString().split('T')[0],
                createdAt: serverTimestamp()
            });
            setContactSuccess(true);
            setContactSubject("");
            setContactMessage("");
            setTimeout(() => {
                setIsContactOpen(false);
                setContactSuccess(false);
            }, 2000);
        } catch (err) {
            console.error(err);
            setContactError("Failed to send. Please try again.");
        } finally {
            setIsSending(false);
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
                        <button
                            onClick={() => setIsContactOpen(true)}
                            className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-[#059669] text-white rounded-lg hover:bg-[#047857] transition-all duration-200 cursor-pointer"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                            </svg>
                            <span className="text-sm font-bold">Contact Admin</span>
                        </button>
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

            {/* Contact Modal */}
            {isContactOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setIsContactOpen(false)}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
                        {/* Modal Header */}
                        <div className="bg-gradient-to-r from-[#059669] to-[#10b981] p-5 text-white">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h3 className="text-xl font-bold">Contact Admin</h3>
                                    <p className="text-emerald-100 text-sm mt-0.5">আপনার সমস্যা জানান, আমরা সাহায্য করব।</p>
                                </div>
                                <button onClick={() => setIsContactOpen(false)} className="text-white/80 hover:text-white text-2xl leading-none">✕</button>
                            </div>
                            {/* Auto-filled student info */}
                            <div className="mt-3 bg-white/20 rounded-xl px-4 py-2 text-xs space-y-0.5">
                                <p><span className="opacity-75">Name:</span> <strong>{userProfile?.displayName}</strong></p>
                                <p><span className="opacity-75">Batch:</span> <strong>{userProfile?.studentBatchName || 'N/A'}</strong> &nbsp;|&nbsp; <span className="opacity-75">Roll:</span> <strong>{userProfile?.studentRoll || 'N/A'}</strong></p>
                            </div>
                        </div>

                        {contactSuccess ? (
                            <div className="p-10 text-center">
                                <div className="text-5xl mb-3">✅</div>
                                <h4 className="text-lg font-bold text-gray-900">Message Sent!</h4>
                                <p className="text-gray-500 text-sm mt-1">Admin will get back to you soon.</p>
                            </div>
                        ) : (
                            <form onSubmit={handleContactSubmit} className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Subject / বিষয়</label>
                                    <input
                                        type="text"
                                        value={contactSubject}
                                        onChange={e => setContactSubject(e.target.value)}
                                        placeholder="e.g. Result issue, Login problem..."
                                        required
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[#059669] focus:border-[#059669] outline-none transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Message / বার্তা</label>
                                    <textarea
                                        value={contactMessage}
                                        onChange={e => setContactMessage(e.target.value)}
                                        placeholder="আপনার সমস্যা বিস্তারিত লিখুন..."
                                        required
                                        rows={5}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[#059669] focus:border-[#059669] outline-none transition-all resize-none"
                                    />
                                </div>
                                {contactError && <p className="text-red-500 text-sm">{contactError}</p>}
                                <div className="flex gap-3 pt-1">
                                    <button type="button" onClick={() => setIsContactOpen(false)} className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors text-sm">Cancel</button>
                                    <button type="submit" disabled={isSending} className="flex-1 px-4 py-2.5 bg-[#059669] text-white font-bold rounded-xl hover:bg-[#047857] transition-colors disabled:opacity-60 text-sm">
                                        {isSending ? "Sending..." : "Send Message"}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}
