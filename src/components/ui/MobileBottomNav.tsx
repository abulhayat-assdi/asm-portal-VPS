"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
    {
        label: "Module",
        href: "/modules",
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
                <rect x="14" y="14" width="7" height="7" rx="1" />
            </svg>
        ),
    },
    {
        label: "About",
        href: "/about",
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="8.01" strokeWidth="3" />
                <polyline points="11 12 12 12 12 16" />
            </svg>
        ),
    },
    {
        label: "Home",
        href: "/",
        isCenter: true,
        icon: (
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
            </svg>
        ),
    },
    {
        label: "Success Stories",
        href: "/success-stories",
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
        ),
    },
    {
        label: "Contact",
        href: "/contact",
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
            </svg>
        ),
    },
];

const HIDDEN_PATHS = ["/dashboard", "/student-dashboard", "/login", "/student-login", "/reset-password"];

export default function MobileBottomNav() {
    const pathname = usePathname();

    const shouldHide = HIDDEN_PATHS.some((p) => pathname.startsWith(p));
    if (shouldHide) return null;

    return (
        <>
            {/* Spacer so page content isn't hidden behind the nav */}
            <div className="lg:hidden h-20" />

            <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-[0_-2px_12px_rgba(0,0,0,0.08)]">
                <div className="flex items-end justify-around px-2 h-16">
                    {navItems.map((item) => {
                        const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

                        if (item.isCenter) {
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className="flex flex-col items-center -mt-5"
                                >
                                    <span className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all duration-200 ${isActive ? "bg-[#047857]" : "bg-[#059669] hover:bg-[#047857]"}`}>
                                        <span className="text-white">{item.icon}</span>
                                    </span>
                                    <span className={`mt-1 text-[9px] font-semibold transition-colors text-center leading-tight ${isActive ? "text-[#059669]" : "text-gray-500"}`}>
                                        {item.label}
                                    </span>
                                </Link>
                            );
                        }

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className="flex flex-col items-center justify-center gap-0.5 py-2 flex-1 group"
                            >
                                <span className={`transition-colors duration-200 ${isActive ? "text-[#059669]" : "text-gray-400 group-hover:text-[#059669]"}`}>
                                    {item.icon}
                                </span>
                                <span className={`text-[9px] font-semibold transition-colors duration-200 text-center leading-tight ${isActive ? "text-[#059669]" : "text-gray-500 group-hover:text-[#059669]"}`}>
                                    {item.label}
                                </span>
                            </Link>
                        );
                    })}
                </div>
            </nav>
        </>
    );
}
