"use client";

import { getInitials } from "@/lib/utils";
import { useEffect, useState } from "react";

import { useAuth } from "@/contexts/AuthContext";

// Hijri date conversion helper
function getHijriDate(date: Date): string {
    const hijriMonths = [
        "Muharram", "Safar", "Rabi al-Awwal", "Rabi al-Thani",
        "Jumada al-Awwal", "Jumada al-Thani", "Rajab", "Shaban",
        "Ramadan", "Shawwal", "Dhul Qadah", "Dhul Hijjah"
    ];

    // Use Intl API for Hijri calendar conversion
    const hijriFormatter = new Intl.DateTimeFormat('en-u-ca-islamic', {
        day: 'numeric',
        month: 'numeric',
        year: 'numeric'
    });

    const parts = hijriFormatter.formatToParts(date);
    const day = parts.find(p => p.type === 'day')?.value || '1';
    const month = parts.find(p => p.type === 'month')?.value || '1';
    const year = parts.find(p => p.type === 'year')?.value || '1447';

    const monthIndex = parseInt(month) - 1;
    const monthName = hijriMonths[monthIndex] || hijriMonths[0];

    return `${monthName} ${day}, ${year} AH`;
}

// English date & time formatter
function getEnglishDateTime(date: Date): string {
    return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    }) + ' · ' + date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });
}

// Helper to get direct image URL from Google Drive link
const getImageUrl = (url: string) => {
    if (url && url.includes("drive.google.com") && url.includes("/d/")) {
        const id = url.split("/d/")[1].split("/")[0];
        return `https://drive.google.com/thumbnail?id=${id}&sz=w1000`;
    }
    return url;
};

export default function Navbar() {
    const [currentDateTime, setCurrentDateTime] = useState({ hijri: '', english: '' });
    const { userProfile } = useAuth();

    useEffect(() => {
        const updateDateTime = () => {
            const now = new Date();
            setCurrentDateTime({
                hijri: getHijriDate(now),
                english: getEnglishDateTime(now)
            });
        };

        // Set initial time
        updateDateTime();

        // Update every minute
        const interval = setInterval(updateDateTime, 60000);

        return () => clearInterval(interval);
    }, []);

    // Fallbacks if userProfile is still loading
    const displayName = userProfile?.displayName || "User";
    const roleCapitalized = userProfile?.role ? userProfile.role.charAt(0).toUpperCase() + userProfile.role.slice(1) : "Loading...";

    return (
        <nav className="h-16 bg-white border-b border-[#e5e7eb] fixed top-0 left-0 lg:left-64 right-0 z-30">
            <div className="h-full px-4 md:px-6 flex items-center justify-between">
                {/* Page Title / Breadcrumb */}
                <div className="ml-12 lg:ml-0">
                    <h2 className="text-lg md:text-xl font-semibold text-[#1f2937]">
                        {userProfile?.role === "student" ? "Student Portal" : "Internal Portal"}
                    </h2>
                </div>

                {/* Right Section */}
                <div className="flex items-center gap-6">
                    {/* Date & Time */}
                    <div className="text-sm text-[#6b7280] hidden md:flex items-center gap-3">
                        <span className="text-[#059669] font-medium">{currentDateTime.hijri}</span>
                        <span className="text-[#d1d5db]">|</span>
                        <span>{currentDateTime.english}</span>
                    </div>

                    {/* Notification Icon */}
                    <button className="relative p-2 text-[#6b7280] hover:text-[#1f2937] transition-colors">
                        <span className="text-xl">🔔</span>
                        <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                    </button>

                    {/* User Profile */}
                    <div className="flex items-center gap-3">
                        <div className="text-right hidden sm:block">
                            <p className="text-sm font-medium text-[#1f2937]">
                                {displayName}
                            </p>
                            <p className="text-xs text-[#6b7280]">{roleCapitalized}</p>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#059669] to-[#10b981] flex items-center justify-center text-white font-bold text-sm overflow-hidden relative border border-gray-100">
                            {userProfile?.profileImageUrl ? (
                                <img
                                    src={getImageUrl(userProfile.profileImageUrl)}
                                    alt={displayName}
                                    referrerPolicy="no-referrer"
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <span>{getInitials(displayName)}</span>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    );
}
