"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getRoutinesByBatch, BatchRoutineEntry } from "@/services/routineManagerService";

const DAYS_ORDER = ["Saturday", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

const CARD_THEMES = [
    { header: "bg-gradient-to-br from-violet-600 to-indigo-500", light: "bg-violet-50", border: "border-violet-100", badge: "bg-violet-100 text-violet-700", timeBg: "bg-violet-600" },
    { header: "bg-gradient-to-br from-rose-500 to-pink-500",     light: "bg-rose-50",   border: "border-rose-100",   badge: "bg-rose-100 text-rose-700",     timeBg: "bg-rose-500"   },
    { header: "bg-gradient-to-br from-emerald-500 to-teal-500",  light: "bg-emerald-50",border: "border-emerald-100",badge: "bg-emerald-100 text-emerald-700", timeBg: "bg-emerald-500"},
    { header: "bg-gradient-to-br from-orange-500 to-amber-400",  light: "bg-orange-50", border: "border-orange-100", badge: "bg-orange-100 text-orange-700",   timeBg: "bg-orange-500" },
    { header: "bg-gradient-to-br from-sky-500 to-cyan-400",      light: "bg-sky-50",    border: "border-sky-100",    badge: "bg-sky-100 text-sky-700",         timeBg: "bg-sky-500"    },
    { header: "bg-gradient-to-br from-fuchsia-600 to-purple-500",light: "bg-fuchsia-50",border: "border-fuchsia-100",badge: "bg-fuchsia-100 text-fuchsia-700", timeBg: "bg-fuchsia-600"},
    { header: "bg-gradient-to-br from-lime-500 to-green-500",    light: "bg-lime-50",   border: "border-lime-100",   badge: "bg-lime-100 text-lime-700",       timeBg: "bg-lime-500"   },
];

// Parse time string to minutes for sorting
const parseTimeToMinutes = (timeStr: string): number => {
    if (!timeStr) return 9999;
    const cleaned = timeStr.trim().toUpperCase();
    const isPM = cleaned.includes("PM");
    const isAM = cleaned.includes("AM");
    const digits = cleaned.replace(/[APM\s]/g, "").replace(".", ":");
    const parts = digits.split(":");
    let hours = parseInt(parts[0] || "0", 10);
    const minutes = parseInt(parts[1] || "0", 10);
    if (isPM && hours !== 12) hours += 12;
    if (isAM && hours === 12) hours = 0;
    return hours * 60 + minutes;
};

export default function StudentRoutinePage() {
    const { userProfile, loading: authLoading } = useAuth();
    const [routines, setRoutines] = useState<BatchRoutineEntry[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRoutine = async () => {
            if (!userProfile?.studentBatchName) { setLoading(false); return; }
            try {
                const data = await getRoutinesByBatch(userProfile.studentBatchName);
                setRoutines(data);
            } catch (error) {
                console.error("Error fetching routine:", error);
            } finally {
                setLoading(false);
            }
        };
        if (!authLoading) fetchRoutine();
    }, [userProfile, authLoading]);

    if (authLoading || loading) {
        return (
            <div className="flex flex-col justify-center items-center h-[60vh] gap-4">
                <div className="relative w-16 h-16">
                    <div className="absolute inset-0 rounded-full border-4 border-emerald-100"></div>
                    <div className="absolute inset-0 rounded-full border-4 border-t-emerald-500 animate-spin"></div>
                </div>
                <p className="text-sm text-gray-400 font-medium animate-pulse">Loading your routine...</p>
            </div>
        );
    }

    if (!userProfile?.studentBatchName) {
        return (
            <div className="p-8 max-w-lg mx-auto text-center mt-16">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-5 text-4xl">🎓</div>
                <h1 className="text-2xl font-bold text-gray-800 mb-2">No Batch Assigned</h1>
                <p className="text-gray-500 text-sm">Please contact the admin to assign you to a batch.</p>
            </div>
        );
    }

    // Group by day
    const groupedRoutines: Record<string, BatchRoutineEntry[]> = {};
    DAYS_ORDER.forEach(day => { groupedRoutines[day] = []; });
    routines.forEach(r => {
        const match = DAYS_ORDER.find(d => d.toLowerCase() === r.dayOfWeek?.toLowerCase().trim());
        const key = match || r.dayOfWeek;
        if (key) {
            if (!groupedRoutines[key]) groupedRoutines[key] = [];
            groupedRoutines[key].push(r);
        }
    });

    // Sort each day's classes by start time ascending
    Object.keys(groupedRoutines).forEach(day => {
        groupedRoutines[day].sort((a, b) =>
            parseTimeToMinutes(a.startTime) - parseTimeToMinutes(b.startTime)
        );
    });

    const availableDays = Object.keys(groupedRoutines)
        .filter(day => groupedRoutines[day].length > 0)
        .sort((a, b) => {
            const iA = DAYS_ORDER.indexOf(a), iB = DAYS_ORDER.indexOf(b);
            if (iA !== -1 && iB !== -1) return iA - iB;
            return iA !== -1 ? -1 : iB !== -1 ? 1 : a.localeCompare(b);
        });

    const totalClasses = routines.length;

    return (
        <div className="min-h-[calc(100vh-80px)] bg-gradient-to-br from-slate-50 via-white to-slate-50 p-4 md:p-6">
            {/* Decorative BG blobs */}
            <div className="fixed top-0 right-0 w-96 h-96 bg-violet-200 opacity-20 rounded-full blur-3xl pointer-events-none -z-0"></div>
            <div className="fixed bottom-0 left-0 w-80 h-80 bg-emerald-200 opacity-20 rounded-full blur-3xl pointer-events-none -z-0"></div>

            <div className="max-w-6xl mx-auto relative z-10">

                {/* Page Header */}
                <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">Class Routine</h1>
                        <p className="text-gray-500 mt-1 flex flex-wrap items-center gap-2 text-sm font-medium">
                            Weekly schedule for
                            <span className="bg-violet-100 text-violet-700 px-2.5 py-0.5 rounded-full font-bold border border-violet-200 text-xs">
                                {userProfile.studentBatchName}
                            </span>
                        </p>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                        <div className="bg-white border border-gray-200 rounded-xl px-4 py-2 text-center shadow-sm">
                            <div className="text-xl font-black text-violet-600">{availableDays.length}</div>
                            <div className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">Days</div>
                        </div>
                        <div className="bg-white border border-gray-200 rounded-xl px-4 py-2 text-center shadow-sm">
                            <div className="text-xl font-black text-emerald-600">{totalClasses}</div>
                            <div className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">Classes</div>
                        </div>
                    </div>
                </div>

                {/* Routine Grid */}
                {availableDays.length === 0 ? (
                    <div className="bg-white rounded-3xl p-16 text-center shadow-lg border border-gray-100">
                        <div className="text-5xl mb-4">📅</div>
                        <h3 className="text-xl font-bold text-gray-800 mb-2">No Routine Yet</h3>
                        <p className="text-gray-400 text-sm">Your batch routine hasn&apos;t been posted yet.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                        {availableDays.map((day, idx) => {
                            const classes = groupedRoutines[day];
                            const theme = CARD_THEMES[idx % CARD_THEMES.length];

                            return (
                                <div
                                    key={day}
                                    className="bg-white rounded-2xl overflow-hidden shadow-md border border-gray-100 hover:-translate-y-1 hover:shadow-xl transition-all duration-300 group"
                                >
                                    {/* Day Header */}
                                    <div className={`${theme.header} px-5 py-4 relative overflow-hidden`}>
                                        <div className="absolute -top-5 -right-5 w-20 h-20 bg-white/10 rounded-full group-hover:scale-125 transition-transform duration-700"></div>
                                        <div className="absolute -bottom-6 -left-3 w-16 h-16 bg-black/10 rounded-full"></div>
                                        <div className="relative z-10 flex items-center justify-between">
                                            <div>
                                                <h2 className="text-xl font-black text-white tracking-tight no-gradient">{day}</h2>
                                                <p className="text-white/70 text-xs font-semibold mt-0.5 uppercase tracking-wider no-gradient">
                                                    {classes.length} {classes.length === 1 ? "class" : "classes"}
                                                </p>
                                            </div>
                                            <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center text-white font-black text-base border border-white/30">
                                                {classes.length}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Classes List */}
                                    <div className="p-3 space-y-2">
                                        {classes.map((cls, cIdx) => (
                                            <div
                                                key={cIdx}
                                                className={`flex items-stretch gap-0 rounded-xl border ${theme.border} overflow-hidden hover:shadow-sm transition-shadow duration-200`}
                                            >
                                                {/* Time column — left accent block */}
                                                <div className={`${theme.timeBg} flex-shrink-0 w-[62px] flex flex-col items-center justify-center py-3 px-1 text-white`}>
                                                    <span className="text-xs font-black leading-tight text-center">{cls.startTime || "—"}</span>
                                                    {cls.endTime && (
                                                        <>
                                                            <span className="text-[10px] opacity-60 leading-none my-0.5">|</span>
                                                            <span className="text-xs font-black leading-tight text-center">{cls.endTime}</span>
                                                        </>
                                                    )}
                                                </div>

                                                {/* Content column */}
                                                <div className={`flex-1 min-w-0 ${theme.light} px-3 py-2.5`}>
                                                    <h3 className="font-bold text-gray-900 text-sm leading-snug truncate">
                                                        {cls.subject || "No Subject"}
                                                    </h3>
                                                    <div className="flex items-center gap-1 mt-1">
                                                        <svg className="w-3 h-3 text-gray-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                                        </svg>
                                                        <span className="text-xs text-gray-500 font-medium truncate">{cls.teacherName || "TBA"}</span>
                                                    </div>
                                                    {cls.room && (
                                                        <div className="flex items-center gap-1 mt-0.5">
                                                            <svg className="w-3 h-3 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                            </svg>
                                                            <span className="text-xs text-gray-400 font-semibold truncate">{cls.room}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
