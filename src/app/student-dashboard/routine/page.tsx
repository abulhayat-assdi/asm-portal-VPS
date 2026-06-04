"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getRoutinesByBatch, BatchRoutineEntry } from "@/services/routineManagerService";
import { getRoutineConfig, RoutineConfig, CustomCategory, DEFAULT_CATEGORIES } from "@/services/routineConfigService";

const DAYS_ORDER = ["Saturday", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

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

const toOrdinal = (n: number): string => {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
};

type ColorTheme = {
    id: string;
    keywords: string[];
    bg: string;
    border: string;
    text: string;
    dot: string;
    label: string;
};

const COLOR_THEMES: ColorTheme[] = [
    { id: "sales",   keywords: ["sales", "mkt", "marketing", "lab"],     bg: "#EFF6FF", border: "#2563EB", text: "#1E40AF", dot: "#2563EB", label: "Sales & Mkt. / Lab" },
    { id: "dawah",   keywords: ["dawah"],                                  bg: "#F0FDF4", border: "#16A34A", text: "#14532D", dot: "#16A34A", label: "Dawah Class" },
    { id: "content", keywords: ["content"],                                bg: "#FFF0F3", border: "#EC4899", text: "#9D174D", dot: "#EC4899", label: "Content Mkt." },
    { id: "office",  keywords: ["ms office", "office"],                   bg: "#FFFBEB", border: "#D97706", text: "#92400E", dot: "#D97706", label: "MS Office" },
    { id: "study",   keywords: ["study practice", "study"],               bg: "#F5F3FF", border: "#7C3AED", text: "#4C1D95", dot: "#7C3AED", label: "Study Practice" },
    { id: "english", keywords: ["english"],                                bg: "#F0F9FF", border: "#0284C7", text: "#075985", dot: "#0284C7", label: "English Class" },
    { id: "landing", keywords: ["landing page", "landing"],               bg: "#ECFEFF", border: "#0891B2", text: "#164E63", dot: "#0891B2", label: "Landing Page" },
    { id: "guest",   keywords: ["guest session", "guest", "expert"],      bg: "#EEF2FF", border: "#4338CA", text: "#312E81", dot: "#4338CA", label: "Guest Session" },
    { id: "brand",   keywords: ["branding"],                               bg: "#FDF4FF", border: "#9333EA", text: "#581C87", dot: "#9333EA", label: "Branding" },
    { id: "sports",  keywords: ["sports", "rec", "recreational"],         bg: "#FFF1F2", border: "#DC2626", text: "#991B1B", dot: "#DC2626", label: "Sports & Rec." },
    { id: "field",   keywords: ["field practical", "field"],              bg: "#FFFBEB", border: "#F59E0B", text: "#78350F", dot: "#F59E0B", label: "Field Practical" },
    { id: "quran",   keywords: ["quran", "qur"],                          bg: "#F0FDF4", border: "#10B981", text: "#064E3B", dot: "#10B981", label: "Quran Class" },
];

const BREAK_KEYWORDS = ["prayer", "break", "lunch", "jumu", "tiffin", "rest"];

const isBreakSubject = (subject: string): boolean =>
    BREAK_KEYWORDS.some(k => subject.toLowerCase().trim().includes(k));

const getColorTheme = (subject: string): ColorTheme | null => {
    const s = subject.toLowerCase().trim();
    for (const theme of COLOR_THEMES) {
        for (const kw of theme.keywords) {
            if (s.includes(kw)) return theme;
        }
    }
    return null;
};

// Build ColorTheme from a CustomCategory (single hex color)
const buildThemeFromCustom = (cat: CustomCategory): ColorTheme => ({
    id: cat.id,
    keywords: cat.keywords.split(",").map(k => k.trim().toLowerCase()).filter(Boolean),
    bg: cat.color + "18",
    border: cat.color,
    text: cat.color,
    dot: cat.color,
    label: cat.label,
});

const getColorThemeFromCustom = (subject: string, customs: CustomCategory[]): ColorTheme | null => {
    const s = subject.toLowerCase().trim();
    for (const cat of customs) {
        const kws = cat.keywords.split(",").map(k => k.trim().toLowerCase()).filter(Boolean);
        for (const kw of kws) {
            if (kw && s.includes(kw)) return buildThemeFromCustom(cat);
        }
    }
    return null;
};

const normalizeDay = (day: string): string =>
    DAYS_ORDER.find(d => d.toLowerCase() === day?.toLowerCase().trim()) ?? day;

type EntryWithMeta = BatchRoutineEntry & { classNum: string };

const enrichEntries = (entries: BatchRoutineEntry[]): EntryWithMeta[] => {
    const indexed = entries.map((e, i) => ({ e, i }));
    const sorted = [...indexed].sort((a, b) => {
        const dA = DAYS_ORDER.indexOf(normalizeDay(a.e.dayOfWeek));
        const dB = DAYS_ORDER.indexOf(normalizeDay(b.e.dayOfWeek));
        if (dA !== dB) return dA - dB;
        return parseTimeToMinutes(a.e.startTime) - parseTimeToMinutes(b.e.startTime);
    });
    const counters: Record<string, number> = {};
    const nums: string[] = new Array(entries.length).fill("");
    sorted.forEach(({ e, i }) => {
        if (isBreakSubject(e.subject) || e.subject.includes("(")) return;
        const key = e.subject.toLowerCase().trim();
        counters[key] = (counters[key] || 0) + 1;
        nums[i] = toOrdinal(counters[key]);
    });
    return entries.map((e, i) => ({ ...e, classNum: nums[i] }));
};

export default function StudentRoutinePage() {
    const { userProfile, loading: authLoading } = useAuth();
    const [entries, setEntries] = useState<EntryWithMeta[]>([]);
    const [config, setConfig] = useState<RoutineConfig | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            if (!userProfile?.studentBatchName) { setLoading(false); return; }
            try {
                const [raw, cfg] = await Promise.all([
                    getRoutinesByBatch(userProfile.studentBatchName),
                    getRoutineConfig(userProfile.studentBatchName),
                ]);
                setEntries(enrichEntries(raw));
                setConfig(cfg);
            } catch (err) {
                console.error("Error loading routine:", err);
            } finally {
                setLoading(false);
            }
        };
        if (!authLoading) load();
    }, [userProfile, authLoading]);

    // Admin-configured hidden categories
    const hiddenByConfig = useMemo(
        () => new Set(config?.hiddenCategories ?? []),
        [config]
    );

    // Active categories: custom from config, or fall back to defaults
    const activeCategories = useMemo(
        () => (config?.customCategories?.length ? config.customCategories : DEFAULT_CATEGORIES),
        [config]
    );

    // Resolve color theme — prefers custom categories, then hardcoded fallback
    const resolveTheme = useCallback(
        (subject: string): ColorTheme | null =>
            getColorThemeFromCustom(subject, activeCategories) ?? getColorTheme(subject),
        [activeCategories]
    );

    // Filter entries based on admin config (breaks always visible)
    const visibleEntries = useMemo(() => {
        if (hiddenByConfig.size === 0) return entries;
        return entries.filter(e => {
            if (isBreakSubject(e.subject)) return true;
            const theme = resolveTheme(e.subject);
            if (!theme) return true;
            return !hiddenByConfig.has(theme.id);
        });
    }, [entries, hiddenByConfig, resolveTheme]);

    // Pivot table from visible entries
    const { uniqueTimeSlots, lookup } = useMemo(() => {
        const slotSet = new Set<string>();
        const map: Record<string, Record<string, EntryWithMeta>> = {};
        visibleEntries.forEach(entry => {
            if (!entry.startTime) return;
            const key = `${entry.startTime}|||${entry.endTime ?? ""}`;
            slotSet.add(key);
            if (!map[key]) map[key] = {};
            map[key][normalizeDay(entry.dayOfWeek)] = entry;
        });
        const sorted = Array.from(slotSet).sort((a, b) =>
            parseTimeToMinutes(a.split("|||")[0]) - parseTimeToMinutes(b.split("|||")[0])
        );
        return { uniqueTimeSlots: sorted, lookup: map };
    }, [visibleEntries]);

    // Legend from visible entries only
    const legendItems = useMemo(() => {
        const seen: Record<string, { id: string; label: string; dot: string; count: number }> = {};
        visibleEntries.forEach(e => {
            if (isBreakSubject(e.subject)) return;
            const theme = resolveTheme(e.subject);
            if (!theme) return;
            if (!seen[theme.id]) seen[theme.id] = { id: theme.id, label: theme.label, dot: theme.dot, count: 0 };
            seen[theme.id].count++;
        });
        return Object.values(seen);
    }, [visibleEntries, resolveTheme]);

    if (authLoading || loading) {
        return (
            <div className="flex flex-col justify-center items-center h-[60vh] gap-4">
                <div className="relative w-16 h-16">
                    <div className="absolute inset-0 rounded-full border-4 border-blue-100" />
                    <div className="absolute inset-0 rounded-full border-4 border-t-blue-600 animate-spin" />
                </div>
                <p className="text-sm text-gray-400 font-medium animate-pulse">Loading your routine...</p>
            </div>
        );
    }

    if (!userProfile?.studentBatchName) {
        return (
            <div className="p-8 max-w-lg mx-auto text-center mt-16">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-5 text-4xl">🎓</div>
                <h1 className="no-gradient text-2xl font-bold text-gray-800 mb-2">No Batch Assigned</h1>
                <p className="text-gray-500 text-sm">Please contact the admin to assign you to a batch.</p>
            </div>
        );
    }

    if (entries.length === 0) {
        return (
            <div className="p-8 max-w-lg mx-auto text-center mt-16">
                <div className="text-5xl mb-4">📅</div>
                <h1 className="no-gradient text-2xl font-bold text-gray-800 mb-2">No Routine Yet</h1>
                <p className="text-gray-500 text-sm">Your batch routine hasn&apos;t been posted yet.</p>
            </div>
        );
    }

    const displayTitle = config?.title || userProfile.studentBatchName;

    // Inline styles to fully bypass the global h1/h2 gradient CSS
    const titleStyle: React.CSSProperties = {
        color: "#FFFFFF",
        fontSize: "clamp(0.95rem, 1.4vw, 1.25rem)",
        fontWeight: 800,
        letterSpacing: "0.02em",
        lineHeight: 1.2,
    };
    const subtitleStyle: React.CSSProperties = {
        color: "#93C5FD",
        fontSize: "0.75rem",
        fontWeight: 500,
        marginTop: 3,
    };

    return (
        <div className="min-h-screen bg-slate-100 p-3 md:p-6">
            <div className="max-w-[1400px] mx-auto">
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden">

                    {/* Title Header — use div not h1 to avoid global gradient override */}
                    <div style={{ backgroundColor: "#0D1B4A", textAlign: "center", padding: "10px 24px" }}>
                        <div style={titleStyle}>{displayTitle}</div>
                        {config?.subtitle && <div style={subtitleStyle}>{config.subtitle}</div>}
                    </div>

                    {/* Routine Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse" style={{ minWidth: 900 }}>
                            <colgroup>
                                <col style={{ width: 150 }} />
                                {DAYS_ORDER.map(d => <col key={d} style={{ minWidth: 140 }} />)}
                            </colgroup>
                            <thead>
                                <tr>
                                    {["Time", ...DAYS_ORDER].map(h => (
                                        <th
                                            key={h}
                                            style={{
                                                backgroundColor: "#1E3A8A",
                                                color: "#FFFFFF",
                                                border: "1px solid #2D4FA0",
                                                padding: "14px 12px",
                                                fontSize: 13,
                                                fontWeight: 700,
                                                textAlign: "center",
                                            }}
                                        >
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {uniqueTimeSlots.map(slot => {
                                    const [startTime, endTime] = slot.split("|||");
                                    const dayEntries = lookup[slot] ?? {};
                                    const presentEntries = Object.values(dayEntries);
                                    const uniqueSubjects = new Set(presentEntries.map(e => e.subject.toLowerCase().trim()));
                                    const isSpanning = uniqueSubjects.size === 1 && presentEntries.length >= 4;

                                    const timeCell = (
                                        <td key="time" style={{ border: "1px solid #E2E8F0", backgroundColor: "#F8FAFC", padding: "10px 12px", textAlign: "center", verticalAlign: "middle" }}>
                                            <div style={{ fontSize: 12, fontWeight: 700, color: "#1E293B", whiteSpace: "nowrap" }}>{startTime}</div>
                                            {endTime && <>
                                                <div style={{ fontSize: 11, color: "#94A3B8", margin: "3px 0" }}>—</div>
                                                <div style={{ fontSize: 12, fontWeight: 700, color: "#1E293B", whiteSpace: "nowrap" }}>{endTime}</div>
                                            </>}
                                        </td>
                                    );

                                    if (isSpanning) {
                                        const entry = presentEntries[0];
                                        return (
                                            <tr key={slot}>
                                                {timeCell}
                                                <td colSpan={DAYS_ORDER.length} style={{ border: "1px solid #E2E8F0", backgroundColor: "#F1F5F9", padding: "14px 20px", textAlign: "center", verticalAlign: "middle" }}>
                                                    <span style={{ fontSize: 13, fontWeight: 600, color: "#475569", fontStyle: "italic" }}>
                                                        {entry.subject}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    }

                                    return (
                                        <tr key={slot}>
                                            {timeCell}
                                            {DAYS_ORDER.map(day => {
                                                const entry = dayEntries[day];
                                                if (!entry) {
                                                    return (
                                                        <td key={day} style={{ border: "1px solid #E2E8F0", backgroundColor: "#FAFAFA", textAlign: "center", color: "#CBD5E1", fontSize: 16, verticalAlign: "middle" }}>
                                                            —
                                                        </td>
                                                    );
                                                }
                                                const theme = resolveTheme(entry.subject);
                                                if (isBreakSubject(entry.subject)) {
                                                    return (
                                                        <td key={day} style={{ border: "1px solid #E2E8F0", backgroundColor: "#F1F5F9", padding: "12px 10px", textAlign: "center", verticalAlign: "middle" }}>
                                                            <span style={{ fontSize: 12, color: "#64748B", fontStyle: "italic", fontWeight: 500 }}>{entry.subject}</span>
                                                        </td>
                                                    );
                                                }
                                                return (
                                                    <td key={day} style={{ border: "1px solid #E2E8F0", padding: 0, verticalAlign: "middle" }}>
                                                        <div style={{
                                                            minHeight: 84,
                                                            display: "flex",
                                                            flexDirection: "column",
                                                            justifyContent: "center",
                                                            alignItems: "center",
                                                            padding: "12px 10px",
                                                            borderLeft: `4px solid ${theme?.border ?? "#CBD5E1"}`,
                                                            backgroundColor: theme?.bg ?? "#FFFFFF",
                                                            textAlign: "center",
                                                        }}>
                                                            <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A", lineHeight: 1.4 }}>
                                                                {entry.subject}
                                                            </div>
                                                            {entry.classNum && (
                                                                <div style={{ fontSize: 12, fontWeight: 600, marginTop: 4, color: theme?.text ?? "#64748B" }}>
                                                                    ({entry.classNum} Class)
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Legend — read-only, no checkboxes */}
                    {legendItems.length > 0 && (
                        <div style={{ padding: "20px 24px", borderTop: "1px solid #E5E7EB" }}>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "16px 24px", justifyContent: "center" }}>
                                {legendItems.map(item => (
                                    <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                        <div style={{ width: 12, height: 12, borderRadius: "50%", backgroundColor: item.dot, flexShrink: 0 }} />
                                        <span style={{ fontSize: 13, color: "#374151", fontWeight: 500 }}>
                                            {item.label}
                                        </span>
                                        <span style={{ fontSize: 12, color: "#9CA3AF" }}>
                                            ({item.count} {item.count === 1 ? "Session" : "Classes"})
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Footer */}
                    {config?.footerText && (
                        <div style={{ padding: "0 24px 24px", textAlign: "center" }}>
                            <div style={{ height: 1, backgroundColor: "#E5E7EB", margin: "0 16px 16px" }} />
                            <span style={{ fontSize: 13, color: "#6B7280", fontStyle: "italic", fontWeight: 500 }}>
                                — {config.footerText} —
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
