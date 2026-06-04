"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Card, { CardBody } from "@/components/ui/Card";
import { formatDateShort } from "@/lib/utils";
import { getClassesByTeacherId, requestClassCompletion, ClassSchedule, getAllClassesSchedules, syncBatchClassSchedules, markClassAsCompleted, getBatchClassCounts, getBatches, addBatch, toggleBatchStatus, deleteBatch, getCompletedClassesByBatch, BatchItem } from "@/services/scheduleService";
import { useAuth } from "@/contexts/AuthContext";
import Button from "@/components/ui/Button";
import { useConfirm } from "@/contexts/ConfirmContext";
import { getRoutinesByBatch, BatchRoutineEntry } from "@/services/routineManagerService";
import { getRoutineConfig, RoutineConfig, CustomCategory, DEFAULT_CATEGORIES } from "@/services/routineConfigService";

const ROUTINE_DAYS_ORDER = ["Saturday", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const ROUTINE_BREAK_KEYWORDS = ["prayer", "break", "lunch", "jumu", "tiffin", "rest"];

const parseRoutineTimeToMinutes = (timeStr: string): number => {
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

const toRoutineOrdinal = (n: number): string => {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
};

type RoutineColorTheme = { id: string; keywords: string[]; bg: string; border: string; text: string; dot: string; label: string; };

const ROUTINE_COLOR_THEMES: RoutineColorTheme[] = [
    { id: "sales",   keywords: ["sales", "mkt", "marketing", "lab"],    bg: "#EFF6FF", border: "#2563EB", text: "#1E40AF", dot: "#2563EB", label: "Sales & Mkt. / Lab" },
    { id: "dawah",   keywords: ["dawah"],                                 bg: "#F0FDF4", border: "#16A34A", text: "#14532D", dot: "#16A34A", label: "Dawah Class" },
    { id: "content", keywords: ["content"],                               bg: "#FFF0F3", border: "#EC4899", text: "#9D174D", dot: "#EC4899", label: "Content Mkt." },
    { id: "office",  keywords: ["ms office", "office"],                  bg: "#FFFBEB", border: "#D97706", text: "#92400E", dot: "#D97706", label: "MS Office" },
    { id: "study",   keywords: ["study practice", "study"],              bg: "#F5F3FF", border: "#7C3AED", text: "#4C1D95", dot: "#7C3AED", label: "Study Practice" },
    { id: "english", keywords: ["english"],                               bg: "#F0F9FF", border: "#0284C7", text: "#075985", dot: "#0284C7", label: "English Class" },
    { id: "landing", keywords: ["landing page", "landing"],              bg: "#ECFEFF", border: "#0891B2", text: "#164E63", dot: "#0891B2", label: "Landing Page" },
    { id: "guest",   keywords: ["guest session", "guest", "expert"],     bg: "#EEF2FF", border: "#4338CA", text: "#312E81", dot: "#4338CA", label: "Guest Session" },
    { id: "brand",   keywords: ["branding"],                              bg: "#FDF4FF", border: "#9333EA", text: "#581C87", dot: "#9333EA", label: "Branding" },
    { id: "sports",  keywords: ["sports", "rec", "recreational"],        bg: "#FFF1F2", border: "#DC2626", text: "#991B1B", dot: "#DC2626", label: "Sports & Rec." },
    { id: "field",   keywords: ["field practical", "field"],             bg: "#FFFBEB", border: "#F59E0B", text: "#78350F", dot: "#F59E0B", label: "Field Practical" },
    { id: "quran",   keywords: ["quran", "qur"],                         bg: "#F0FDF4", border: "#10B981", text: "#064E3B", dot: "#10B981", label: "Quran Class" },
];

const isRoutineBreak = (subject: string): boolean =>
    ROUTINE_BREAK_KEYWORDS.some(k => subject.toLowerCase().trim().includes(k));

const getRoutineColorTheme = (subject: string): RoutineColorTheme | null => {
    const s = subject.toLowerCase().trim();
    for (const theme of ROUTINE_COLOR_THEMES) {
        for (const kw of theme.keywords) {
            if (s.includes(kw)) return theme;
        }
    }
    return null;
};

const buildRoutineThemeFromCustom = (cat: CustomCategory): RoutineColorTheme => ({
    id: cat.id, keywords: cat.keywords.split(",").map(k => k.trim().toLowerCase()).filter(Boolean),
    bg: cat.color + "18", border: cat.color, text: cat.color, dot: cat.color, label: cat.label,
});

const getRoutineColorThemeFromCustom = (subject: string, customs: CustomCategory[]): RoutineColorTheme | null => {
    const s = subject.toLowerCase().trim();
    for (const cat of customs) {
        const kws = cat.keywords.split(",").map(k => k.trim().toLowerCase()).filter(Boolean);
        for (const kw of kws) {
            if (kw && s.includes(kw)) return buildRoutineThemeFromCustom(cat);
        }
    }
    return null;
};

const normalizeRoutineDay = (day: string): string =>
    ROUTINE_DAYS_ORDER.find(d => d.toLowerCase() === day?.toLowerCase().trim()) ?? day;

type RoutineEntryWithMeta = BatchRoutineEntry & { classNum: string };

const enrichRoutineEntries = (entries: BatchRoutineEntry[]): RoutineEntryWithMeta[] => {
    const indexed = entries.map((e, i) => ({ e, i }));
    const sorted = [...indexed].sort((a, b) => {
        const dA = ROUTINE_DAYS_ORDER.indexOf(normalizeRoutineDay(a.e.dayOfWeek));
        const dB = ROUTINE_DAYS_ORDER.indexOf(normalizeRoutineDay(b.e.dayOfWeek));
        if (dA !== dB) return dA - dB;
        return parseRoutineTimeToMinutes(a.e.startTime) - parseRoutineTimeToMinutes(b.e.startTime);
    });
    const counters: Record<string, number> = {};
    const nums: string[] = new Array(entries.length).fill("");
    sorted.forEach(({ e, i }) => {
        if (isRoutineBreak(e.subject) || e.subject.includes("(")) return;
        const key = e.subject.toLowerCase().trim();
        counters[key] = (counters[key] || 0) + 1;
        nums[i] = toRoutineOrdinal(counters[key]);
    });
    return entries.map((e, i) => ({ ...e, classNum: nums[i] }));
};

export default function SchedulePage() {
    const confirm = useConfirm();
    const [scheduleData, setScheduleData] = useState<ClassSchedule[]>([]);
    // Batch Stats State
    const [batchStats, setBatchStats] = useState<Record<string, { subjectName: string; classCount: number }[]>>({});
    const [batchStatsLoading, setBatchStatsLoading] = useState(true);

    const [loading, setLoading] = useState(true);
    const [showAll, setShowAll] = useState(false);
    const [expandedPending, setExpandedPending] = useState<string | null>(null);
    const { userProfile, loading: authLoading } = useAuth();
    const isAdmin = userProfile?.role === "admin" || userProfile?.role === "super_admin";
    const [processingId, setProcessingId] = useState<string | null>(null);

    // Add Schedule Modal State
    const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
    const [isBatchSelectionModalOpen, setIsBatchSelectionModalOpen] = useState(false);
    const [selectedBatchForGrid, setSelectedBatchForGrid] = useState<string | null>(null);
    const [uniqueBatchesForSelection, setUniqueBatchesForSelection] = useState<{name: string, count: number}[]>([]);
    const [isAddingSchedule, setIsAddingSchedule] = useState(false);
    const [gridRenderKey, setGridRenderKey] = useState(0); // Used only to force re-render on clear

    // View All Schedules State
    const [isViewAllModalOpen, setIsViewAllModalOpen] = useState(false);
    const [allSchedules, setAllSchedules] = useState<ClassSchedule[]>([]);
    const [allSchedulesLoading, setAllSchedulesLoading] = useState(false);
    
    // Manage Batches State
    const [isManageBatchesOpen, setIsManageBatchesOpen] = useState(false);
    const [managedBatches, setManagedBatches] = useState<BatchItem[]>([]);
    const [newBatchName, setNewBatchName] = useState("");
    const [isSubmittingBatch, setIsSubmittingBatch] = useState(false);
    const [isExportingCsv, setIsExportingCsv] = useState<string | null>(null);
    const [isDeletingBatch, setIsDeletingBatch] = useState<string | null>(null);

    const [columns, setColumns] = useState(["date", "day", "batch", "subject", "time", "status", "teacherId", "teacherName", "extra1", "extra2"]);
    const [maxRows, setMaxRows] = useState(500);

    // Class Routine Viewer State
    const [selectedRoutineBatch, setSelectedRoutineBatch] = useState<string>("");
    const [routineEntries, setRoutineEntries] = useState<RoutineEntryWithMeta[]>([]);
    const [routineViewerConfig, setRoutineViewerConfig] = useState<RoutineConfig | null>(null);
    const [routineEntriesLoading, setRoutineEntriesLoading] = useState(false);
    const [availableRoutineBatches, setAvailableRoutineBatches] = useState<string[]>([]);

    // Store grid data in a ref — avoids triggering re-render on every cell edit
    const rowDataRef = useRef<Record<string, string>[]>([]);
    const gridRef = useRef<HTMLTableElement>(null);

    const initializeEmptyRows = (cols: string[] = columns, numRows: number = maxRows, batchVal: string | null = selectedBatchForGrid) => {
        return Array.from({ length: numRows }).map(() => {
            const row = Object.fromEntries([...cols, "id"].map(c => [c, ""]));
            if (batchVal) row.batch = batchVal;
            return row;
        });
    };

    const handleOpenBatchSelection = async () => {
        setIsBatchSelectionModalOpen(true);
        setIsAddingSchedule(true);
        try {
            const data = await getAllClassesSchedules(false);
            const batches = data.reduce((acc, curr) => {
                const bName = curr.batch || "Unassigned";
                acc[bName] = (acc[bName] || 0) + 1;
                return acc;
            }, {} as Record<string, number>);
            
            setUniqueBatchesForSelection(
                Object.entries(batches)
                    .map(([name, count]) => ({ name, count }))
                    .sort((a, b) => a.name.localeCompare(b.name))
            );
            setAllSchedules(data); // Cache all for filtering later
        } catch (error) {
            console.error(error);
        } finally {
            setIsAddingSchedule(false);
        }
    };

    const handleSelectBatchForGrid = (batchName: string | null) => {
        setSelectedBatchForGrid(batchName);
        setIsBatchSelectionModalOpen(false);
        handleOpenScheduleModal(batchName);
    };

    const handleOpenScheduleModal = async (batchFilter: string | null = null) => {
        setIsScheduleModalOpen(true);
        setIsAddingSchedule(true);
        try {
            // Use cached schedules if available, or fetch
            let data = allSchedules.length > 0 ? allSchedules : await getAllClassesSchedules(false);
            
            if (batchFilter) {
                data = data.filter(s => s.batch === batchFilter);
            }

            const formattedData = data.map(schedule => {
                const item: any = { ...schedule };
                if (!item.status) item.status = "Scheduled";
                if (!item.id) item.id = "";
                return item;
            });
            
            // Re-compute columns dynamically based on saved data
            const keys = new Set(columns);
            formattedData.forEach(item => {
                Object.keys(item).forEach(k => {
                    if (k !== 'id' && k !== 'createdAt') keys.add(k);
                });
            });
            const newCols = Array.from(keys);
            setColumns(newCols);
            
            // If data is larger than maxRows, we expand maxRows to accommodate
            const neededRows = Math.max(maxRows, formattedData.length + 100);
            if (neededRows > maxRows) setMaxRows(neededRows);

            const rows = initializeEmptyRows(newCols, neededRows);
            formattedData.forEach((item, index) => {
                if (index < neededRows) {
                    // Populate existing keys, ensuring no missing keys from object break things
                    Object.keys(item).forEach(k => {
                        if (k !== 'createdAt') {
                            if (!rows[index]) rows[index] = {};
                            rows[index][k] = (item as any)[k] || "";
                        }
                    });
                }
            });
            
            rowDataRef.current = rows;
            setGridRenderKey(k => k + 1);
        } catch (error) {
            console.error(error);
        } finally {
            setIsAddingSchedule(false);
        }
    };

    // Fetch Class Schedule (Google Sheet & Firestore)
    const fetchScheduleData = useCallback(async () => {
        if (authLoading || !userProfile) return;

        setLoading(true);
        try {
            if (userProfile.teacherId) {
                // BOTH admin and teacher: if teacherId is set, show their personal schedule
                // filterCurrentWeek=false so page-level visibleSchedule filter handles week filtering
                const data = await getClassesByTeacherId(userProfile.teacherId, userProfile.uid, false);
                setScheduleData(data);
            } else if (isAdmin) {
                // Admin without teacherId: show all classes
                const data = await getAllClassesSchedules();
                setScheduleData(data);
            }
        } catch (error) {
            console.error("Error fetching schedule:", error);
        } finally {
            setLoading(false);
        }
    }, [authLoading, userProfile]);

    useEffect(() => {
        fetchScheduleData();
    }, [fetchScheduleData]);

    // Fetch Batch Stats dynamically from Firestore
    useEffect(() => {
        const fetchBatchStats = async () => {
            setBatchStatsLoading(true);
            try {
                const data = await getBatchClassCounts();
                setBatchStats(data);
            } catch (error) {
                console.error("Failed to fetch batch stats", error);
            } finally {
                setBatchStatsLoading(false);
            }
        };
        fetchBatchStats();
    }, []);

    // Fetch batch names: prefer active batches from Batch table, fallback to BatchRoutineEntry
    useEffect(() => {
        Promise.all([
            getBatches().catch(() => [] as BatchItem[]),
            fetch("/api/routine-manager", { cache: "no-store" }).then(r => r.ok ? r.json() : []).catch(() => [] as BatchRoutineEntry[]),
        ]).then(([batches, entries]: [BatchItem[], BatchRoutineEntry[]]) => {
            const activeBatchNames = batches.filter(b => b.status === "active").map(b => b.name).sort();
            if (activeBatchNames.length > 0) {
                setAvailableRoutineBatches(activeBatchNames);
                setSelectedRoutineBatch(activeBatchNames[activeBatchNames.length - 1]);
            } else {
                // Fallback: batches that have routine entries
                const fromEntries = [...new Set(entries.map((e: BatchRoutineEntry) => e.batch).filter(Boolean))].sort();
                setAvailableRoutineBatches(fromEntries);
                if (fromEntries.length > 0) setSelectedRoutineBatch(fromEntries[fromEntries.length - 1]);
            }
        }).catch(console.error);
    }, []);

    // Load routine entries when selected batch changes
    useEffect(() => {
        if (!selectedRoutineBatch) return;
        setRoutineEntriesLoading(true);
        Promise.all([
            getRoutinesByBatch(selectedRoutineBatch),
            getRoutineConfig(selectedRoutineBatch),
        ]).then(([raw, cfg]) => {
            setRoutineEntries(enrichRoutineEntries(raw));
            setRoutineViewerConfig(cfg);
        }).catch(console.error)
        .finally(() => setRoutineEntriesLoading(false));
    }, [selectedRoutineBatch]);

    // For admin: filter current week. For teacher: show last 7 days + all future schedules.
    const getTeacherDateBoundary = () => {
        const past = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Dhaka" }));
        past.setDate(past.getDate() - 7); // 7 days ago
        const y = past.getFullYear();
        const m = String(past.getMonth() + 1).padStart(2, '0');
        const day = String(past.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
    };

    const getWeekBoundaries = () => {
        const today = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Dhaka" }));
        const dayOfWeek = today.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
        const diffToFriday = (dayOfWeek + 2) % 7;
        
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - diffToFriday);
        
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);

        const format = (d: Date) => {
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return `${y}-${m}-${day}`;
        };

        return {
            start: format(startOfWeek),
            end: format(endOfWeek)
        };
    };

    const weekBounds = getWeekBoundaries();
    const teacherPastBoundary = getTeacherDateBoundary();

    const visibleSchedule = scheduleData.filter(schedule => {
        // Normalize date format to YYYY-MM-DD
        let compareDate = schedule.date;
        const dmyMatch = schedule.date.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
        if (dmyMatch) {
             const [, d, m, y] = dmyMatch;
             compareDate = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
        } else {
             try {
                 const d = new Date(schedule.date);
                 if (!isNaN(d.getTime())) {
                     // Get local date string instead of ISO to avoid timezone mismatch
                     const y = d.getFullYear();
                     const m = String(d.getMonth() + 1).padStart(2, '0');
                     const day = String(d.getDate()).padStart(2, '0');
                     compareDate = `${y}-${m}-${day}`;
                 }
             } catch {}
        }

        // Apply filtering logic based on role AND teacherId
        if (userProfile?.teacherId) {
            // Teacher (even if they also have admin role): last 7 days + all future
            if (compareDate < teacherPastBoundary) {
                return false;
            }
        } else if (isAdmin) {
            // Admin (without a teacher ID): current week only
            if (compareDate < weekBounds.start || compareDate > weekBounds.end) {
                return false;
            }
        } else {
            // Fallback for regular teachers
            if (compareDate < teacherPastBoundary) {
                return false;
            }
        }

        return true;
    });

    const displayedSchedule = showAll ? visibleSchedule : visibleSchedule.slice(0, 10);


    const handleDoneClick = async (index: number) => {
        // Optimistic Update
        const targetSchedule = displayedSchedule[index];
        if (!targetSchedule) return;

        // Visual feedback immediately
        const updatedSchedule = [...scheduleData];
        // Find the correct item in full list (displayedSchedule is a slice)
        const realIndex = scheduleData.findIndex(s =>
            s.date === targetSchedule.date &&
            s.time === targetSchedule.time &&
            s.batch === targetSchedule.batch &&
            s.subject === targetSchedule.subject
        );

        if (realIndex === -1) return;

        // Optimistically set to completed
        const previousStatus = updatedSchedule[realIndex].status;
        updatedSchedule[realIndex] = { ...updatedSchedule[realIndex], status: "Completed" };
        setScheduleData(updatedSchedule);

        try {
            await markClassAsCompleted(
                userProfile?.uid || "admin",
                userProfile?.displayName || "Admin",
                targetSchedule
            );
            
            // Re-fetch batch stats so the UI immediately shows the incremented count
            const updatedStats = await getBatchClassCounts();
            setBatchStats(updatedStats);

        } catch (error) {
            console.error("Error marking done:", error);
            alert("Failed to update status. Please try again.");
            updatedSchedule[realIndex] = { ...updatedSchedule[realIndex], status: previousStatus };
            setScheduleData([...updatedSchedule]);
        }
    };

    const handleRequestToComplete = async (schedule: ClassSchedule) => {
        setExpandedPending(null);
        if (!userProfile?.uid) return;

        const uniqueKey = `${schedule.date}-${schedule.time}-${schedule.batch}`;
        setProcessingId(uniqueKey);

        try {
            await requestClassCompletion(
                userProfile.uid,
                userProfile.displayName || "Teacher",
                schedule
            );

            // Optimistic update
            setScheduleData(prev => prev.map(s => {
                if (s.date === schedule.date && s.time === schedule.time && s.batch === schedule.batch) {
                    return { ...s, status: "Requested" as any };
                }
                return s;
            }));
        } catch (error) {
            console.error(error);
            alert("Failed to send request.");
        } finally {
            setProcessingId(null);
        }
    };

    // --- Batch Management Handlers ---

    const handleOpenManageBatches = async () => {
        setIsManageBatchesOpen(true);
        const data = await getBatches();
        setManagedBatches(data);
    };

    const handleAddBatch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newBatchName.trim()) return;
        
        setIsSubmittingBatch(true);
        try {
            await addBatch(newBatchName);
            setNewBatchName("");
            
            // Refresh modal list
            const data = await getBatches();
            setManagedBatches(data);
            
            // Refresh dashboard view
            const stats = await getBatchClassCounts();
            setBatchStats(stats);
        } catch (error) {
            console.error(error);
            alert("Failed to add batch");
        } finally {
            setIsSubmittingBatch(false);
        }
    };

    const handleToggleBatchStatus = async (batchId: string, currentStatus: "active" | "archived") => {
        try {
            await toggleBatchStatus(batchId, currentStatus);
            // Refresh modal list immediately
            const data = await getBatches();
            setManagedBatches(data);
            
            // Refresh dashboard view
            const stats = await getBatchClassCounts();
            setBatchStats(stats);
        } catch (error) {
            console.error("Failed to toggle batch", error);
            alert("Failed to update status");
        }
    };

    const handleDeleteBatch = async (batchId: string, batchName: string) => {
        const ok = await confirm({ message: `"${batchName}" batch কি Batch-wise Class Count section থেকে সরিয়ে দেবেন?\n\nব্যাচের ছাত্র ও অন্য সব ডেটা অক্ষুণ্ণ থাকবে।`, variant: "danger" });
        if (!ok) return;
        setIsDeletingBatch(batchId);
        try {
            await toggleBatchStatus(batchId, "active"); // archive করে দাও, delete নয়
            const data = await getBatches();
            setManagedBatches(data);
            const stats = await getBatchClassCounts();
            setBatchStats(stats);
        } catch (error) {
            console.error("Failed to remove batch from section", error);
            alert("Batch সরাতে সমস্যা হয়েছে।");
        } finally {
            setIsDeletingBatch(null);
        }
    };

    const handleDownloadCsv = async (batchName: string) => {
        setIsExportingCsv(batchName);
        try {
            const classes = await getCompletedClassesByBatch(batchName);
            
            if (classes.length === 0) {
                alert(`No completed classes found yet for ${batchName}.`);
                return;
            }

            // Prepare CSV text
            const headers = ["Class Date", "Day", "Time", "Batch", "Subject", "Teacher Name", "Status"];
            const rows = classes.map(c => {
                const dateObj = new Date(c.date);
                const dayStr = isNaN(dateObj.getTime()) ? "" : dateObj.toLocaleDateString('en-US', { weekday: 'long' });
                return [
                    `"${c.date || ""}"`,
                    `"${dayStr}"`,
                    `"${c.startTime || ""} - ${c.endTime || ""}"`,
                    `"${c.batch || ""}"`,
                    `"${c.subject || ""}"`,
                    `"${c.teacherName || ""}"`,
                    `"${c.status || ""}"`
                ];
            });
            
            const csvContent = [
                headers.join(","),
                ...rows.map(r => r.join(","))
            ].join("\n");

            // Trigger download via Blob
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement("a");
            const url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", `${batchName.replace(/ /g, "_")}_classes_report.csv`);
            link.style.visibility = 'hidden';
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error("Error downloading CSV", error);
            alert("An error occurred generating the report.");
        } finally {
            setIsExportingCsv(null);
        }
    };

    // --- End Batch Management ---

    // Add Schedule Handlers
    // onBlur handler — updates ref without re-rendering
    const handleCellBlur = useCallback((rowIndex: number, field: string, value: string) => {
        if (rowDataRef.current[rowIndex]) {
            const updatedRow = { ...rowDataRef.current[rowIndex], [field]: value };
            // Ensure batch is set if we have a selection
            if (selectedBatchForGrid && !updatedRow.batch) {
                updatedRow.batch = selectedBatchForGrid;
            }
            rowDataRef.current[rowIndex] = updatedRow;
        }
    }, [selectedBatchForGrid]);

    const handleClearScheduleRows = async () => {
        const ok = await confirm({ message: "Are you sure you want to clear all data in the table?", variant: "warning" });
        if (ok) {
            // Preserve the IDs so the backend knows to delete existing records
            const emptyRowsWithIds = rowDataRef.current.map(row => {
                const emptyRow: Record<string, string> = Object.fromEntries([...columns, "id"].map(c => [c, ""]));
                emptyRow.id = row.id || "";
                if (selectedBatchForGrid) emptyRow.batch = selectedBatchForGrid;
                return emptyRow;
            });
            
            // Fill the rest with completely empty rows up to maxRows
            while (emptyRowsWithIds.length < maxRows) {
                const emptyRow = Object.fromEntries([...columns, "id"].map(c => [c, ""]));
                if (selectedBatchForGrid) emptyRow.batch = selectedBatchForGrid;
                emptyRowsWithIds.push(emptyRow);
            }
            rowDataRef.current = emptyRowsWithIds;
            setGridRenderKey(k => k + 1);

            // Clear all DOM inputs directly for instant feedback (backup)
            if (gridRef.current) {
                gridRef.current.querySelectorAll('input[data-row], select[data-row]').forEach((el) => {
                    const elem = el as HTMLInputElement | HTMLSelectElement;
                    if (elem.tagName === 'SELECT' && elem.getAttribute('data-col') === 'status') {
                        elem.value = 'Scheduled';
                    } else if (elem.tagName === 'INPUT') {
                        elem.value = '';
                    }
                });
            }
        }
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>, startRowIndex: number, startColKey: string) => {
        e.preventDefault();
        
        const clipboardData = e.clipboardData.getData('Text');
        if (!clipboardData) return;

        // Excel/Sheets copies as Tab-Separated Values (TSV)
        const pastedLines = clipboardData.split(/\r?\n/).filter(line => line.length > 0);
        
        const startColIndex = columns.indexOf(startColKey);
        if (startColIndex === -1) return;

        pastedLines.forEach((line, lineIndex) => {
            const cells = line.split('\t');
            const targetRowIndex = startRowIndex + lineIndex;
            
            if (targetRowIndex >= maxRows) return;

            cells.forEach((cellValue, cellIndex) => {
                const targetColIndex = startColIndex + cellIndex;
                if (targetColIndex < columns.length) {
                    const fieldKey = columns[targetColIndex];
                    
                    // 1. Update ref (source of truth for Save)
                    if (rowDataRef.current[targetRowIndex]) {
                        const updatedRow = {
                            ...rowDataRef.current[targetRowIndex],
                            [fieldKey]: cellValue
                        };
                        if (selectedBatchForGrid && !updatedRow.batch) {
                            updatedRow.batch = selectedBatchForGrid;
                        }
                        rowDataRef.current[targetRowIndex] = updatedRow;
                    }

                    // 2. Update DOM directly (instant visual feedback, no re-render)
                    const input = gridRef.current?.querySelector<HTMLInputElement | HTMLSelectElement>(
                        `[data-row="${targetRowIndex}"][data-col="${fieldKey}"]`
                    );
                    if (input) {
                        input.value = cellValue;
                    }
                    
                    // If we just pasted into a row, ensure its batch input is also updated if it was empty
                    if (selectedBatchForGrid) {
                        const batchInput = gridRef.current?.querySelector<HTMLInputElement>(
                            `input[data-row="${targetRowIndex}"][data-col="batch"]`
                        );
                        if (batchInput && !batchInput.value) {
                            batchInput.value = selectedBatchForGrid;
                        }
                    }
                }
            });
        });
    };

    const handleSaveSchedule = async () => {
        setIsAddingSchedule(true);
        try {
            // Read from ref (contains all current data regardless of re-renders) including IDs
            await syncBatchClassSchedules(rowDataRef.current as any[]);
            
            // Refresh schedule list
            await fetchScheduleData();
            setIsScheduleModalOpen(false);
        } catch (error) {
            console.error(error);
            alert("Failed to save schedules. Please try again.");
        } finally {
            setIsAddingSchedule(false);
        }
    };

    // Routine Viewer computed values
    const routineHiddenByConfig = useMemo(
        () => new Set(routineViewerConfig?.hiddenCategories ?? []),
        [routineViewerConfig]
    );
    const routineActiveCategories = useMemo(
        () => (routineViewerConfig?.customCategories?.length ? routineViewerConfig.customCategories : DEFAULT_CATEGORIES),
        [routineViewerConfig]
    );
    const resolveRoutineTheme = useCallback(
        (subject: string): RoutineColorTheme | null =>
            getRoutineColorThemeFromCustom(subject, routineActiveCategories) ?? getRoutineColorTheme(subject),
        [routineActiveCategories]
    );
    const visibleRoutineEntries = useMemo(() => {
        if (routineHiddenByConfig.size === 0) return routineEntries;
        return routineEntries.filter(e => {
            if (isRoutineBreak(e.subject)) return true;
            const theme = resolveRoutineTheme(e.subject);
            return !theme || !routineHiddenByConfig.has(theme.id);
        });
    }, [routineEntries, routineHiddenByConfig, resolveRoutineTheme]);
    const { uniqueRoutineTimeSlots, routineLookup } = useMemo(() => {
        const slotSet = new Set<string>();
        const map: Record<string, Record<string, RoutineEntryWithMeta>> = {};
        visibleRoutineEntries.forEach(entry => {
            if (!entry.startTime) return;
            const key = `${entry.startTime}|||${entry.endTime ?? ""}`;
            slotSet.add(key);
            if (!map[key]) map[key] = {};
            map[key][normalizeRoutineDay(entry.dayOfWeek)] = entry;
        });
        const sorted = Array.from(slotSet).sort((a, b) =>
            parseRoutineTimeToMinutes(a.split("|||")[0]) - parseRoutineTimeToMinutes(b.split("|||")[0])
        );
        return { uniqueRoutineTimeSlots: sorted, routineLookup: map };
    }, [visibleRoutineEntries]);
    const routineLegendItems = useMemo(() => {
        const seen: Record<string, { id: string; label: string; dot: string; count: number }> = {};
        visibleRoutineEntries.forEach(e => {
            if (isRoutineBreak(e.subject)) return;
            const theme = resolveRoutineTheme(e.subject);
            if (!theme) return;
            if (!seen[theme.id]) seen[theme.id] = { id: theme.id, label: theme.label, dot: theme.dot, count: 0 };
            seen[theme.id].count++;
        });
        return Object.values(seen);
    }, [visibleRoutineEntries, resolveRoutineTheme]);

    const getStatusBadge = (schedule: ClassSchedule, index: number) => {
        if (schedule.status === "Today") {
            return (
                <button
                    onClick={() => handleDoneClick(index)}
                    className="px-4 py-1.5 bg-[#059669] text-white text-sm font-medium rounded-full hover:bg-[#10b981] transition-colors"
                >
                    Done
                </button>
            );
        }

        if (schedule.status === "Pending") {
            // Include subject in uniqueKey to avoid expanding multiple rows with same date/time/batch
            const uniqueKey = `${schedule.date}-${schedule.time}-${schedule.batch}-${schedule.subject}-${schedule.id || ''}`;
            const isProcessing = processingId === uniqueKey;

            return (
                <div className="inline-block relative">
                    {/* Show Request Button Above when expanded */}
                    {expandedPending === uniqueKey && (
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 animate-fadeIn z-10">
                            <button
                                onClick={() => handleRequestToComplete(schedule)}
                                disabled={isProcessing}
                                className="px-4 py-2 bg-[#059669] text-white text-sm font-semibold rounded-lg hover:bg-[#10b981] transition-colors whitespace-nowrap shadow-md"
                            >
                                {isProcessing ? "Sending..." : "Request to Complete"}
                            </button>
                        </div>
                    )}

                    {/* Pending Pill with Arrow */}
                    <button
                        onClick={() => setExpandedPending(expandedPending === uniqueKey ? null : uniqueKey)}
                        className="px-4 py-1.5 bg-[#f59e0b] text-white text-sm font-medium rounded-full hover:bg-[#fb923c] transition-colors inline-flex items-center gap-2"
                    >
                        Pending
                        <svg
                            className={`w-3 h-3 transition-transform ${expandedPending === uniqueKey ? 'rotate-180' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>
                </div>
            );
        }

        // Scheduled (future class)
        if (schedule.status === "Scheduled" || schedule.status === "Upcoming") {
            return (
                <span className="px-4 py-1.5 bg-[#3b82f6] text-white text-sm font-medium rounded-full">
                    Scheduled
                </span>
            );
        }

        // New 'Requested' State
        if ((schedule.status as any) === "Requested") {
            return (
                <span className="px-4 py-1.5 bg-[#fcd34d] text-yellow-800 text-sm font-medium rounded-full cursor-not-allowed opacity-80">
                    Requested
                </span>
            );
        }

        if (schedule.status === "Completed") {
            return (
                <span className="px-4 py-1.5 bg-[#10b981] text-white text-sm font-medium rounded-full">
                    Completed
                </span>
            );
        }

        // Upcoming
        return (
            <span className="px-4 py-1.5 bg-[#6b7280] text-white text-sm font-medium rounded-full">
                Upcoming
            </span>
        );
    };

    if (authLoading) {
        return <div className="p-8 text-center text-[#6b7280]">Loading profile...</div>;
    }

    if (!userProfile?.uid || (userProfile?.role === "teacher" && !userProfile?.teacherId)) {
        // Teacher without teacherId cannot see schedule
        if (userProfile?.role === "teacher") {
            return (
                <div className="flex flex-col items-center justify-center p-12 text-center text-[#6b7280] bg-white rounded-lg shadow-sm border border-gray-100">
                    <div className="p-3 bg-yellow-100 rounded-full mb-4">
                        <svg className="w-8 h-8 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-bold text-[#1f2937] mb-2">Teacher ID Not Linked</h2>
                    <p className="max-w-md mx-auto">Your account is missing a Teacher ID (e.g., 101, 102). Please contact the administrator to link your Teacher ID to your account.</p>
                </div>
            );
        }
    }

    return (
        <div className="space-y-6">
            {/* Header with Green Accent */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-1 h-10 bg-[#059669] rounded-full"></div>
                    <div>
                        <h1 className="text-3xl font-bold text-[#1f2937]">
                            Class Schedule
                        </h1>
                        <p className="text-[#6b7280] mt-1">
                            {userProfile?.teacherId
                                ? `Viewing schedule for Teacher ID: ${userProfile.teacherId} (Last 7 Days & Upcoming)`
                                : isAdmin
                                    ? "Viewing all teacher schedules (Current Week)"
                                    : "No Teacher ID linked to this account"}
                        </p>
                        {!userProfile?.teacherId && userProfile?.role !== "admin" && (
                            <p className="text-xs text-red-500 font-medium mt-1">
                                ⚠️ Warning: Your profile is missing a Teacher ID. Classes from the grid will not appear.
                            </p>
                        )}
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    {isAdmin && (
                        <button
                            onClick={handleOpenBatchSelection}
                            className="px-4 py-2.5 bg-[#059669] text-white text-sm font-semibold rounded-lg hover:bg-[#10b981] transition-colors shadow-sm flex items-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Manage Schedules (Grid)
                        </button>
                    )}
                </div>
            </div>

            {/* Schedule Table */}
            <Card>
                <CardBody className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="bg-[#1e3a5f]">
                                    <th className="px-6 py-4 text-center text-sm font-semibold text-white border border-[#2d5278]">
                                        Date
                                    </th>
                                    <th className="hidden md:table-cell px-6 py-4 text-center text-sm font-semibold text-white border border-[#2d5278]">
                                        Day
                                    </th>
                                    <th className="px-6 py-4 text-center text-sm font-semibold text-white border border-[#2d5278]">
                                        Batch
                                    </th>
                                    <th className="hidden md:table-cell px-6 py-4 text-center text-sm font-semibold text-white border border-[#2d5278]">
                                        Subject
                                    </th>
                                    <th className="px-6 py-4 text-center text-sm font-semibold text-white border border-[#2d5278]">
                                        Time
                                    </th>
                                    <th className="hidden md:table-cell px-6 py-4 text-center text-sm font-semibold text-white border border-[#2d5278]">
                                        Status
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan={6} className="py-12 text-center text-[#6b7280]">
                                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#059669] mb-2"></div>
                                            <p>Loading schedule from Sheet...</p>
                                        </td>
                                    </tr>
                                ) : displayedSchedule.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="py-12 text-center text-[#6b7280]">
                                            <p className="text-lg font-medium text-gray-900">No classes found</p>
                                            <p className="text-sm mt-1">No scheduled classes found for the current week.</p>
                                        </td>
                                    </tr>
                                ) : displayedSchedule.map((schedule, index) => (
                                    <tr
                                        key={index}
                                        className={schedule.status === "Today" ? "bg-[#d1fae5]/30" : index % 2 === 0 ? "bg-white" : "bg-[#f9fafb]"}
                                    >
                                        <td className="px-6 py-4 text-sm text-[#1f2937] font-medium border border-[#e5e7eb] text-center">
                                            {formatDateShort(schedule.date)}
                                        </td>
                                        <td className="hidden md:table-cell px-6 py-4 text-sm text-[#1f2937] border border-[#e5e7eb] text-center">
                                            {schedule.day}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-[#1f2937] font-medium border border-[#e5e7eb] text-center">
                                            {schedule.batch}
                                        </td>
                                        <td className="hidden md:table-cell px-6 py-4 text-sm text-[#1f2937] border border-[#e5e7eb] text-center">
                                            {schedule.subject}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-[#374151] border border-[#e5e7eb] text-center">
                                            {schedule.time}
                                        </td>
                                        <td className="hidden md:table-cell px-6 py-4 border border-[#e5e7eb] text-center">
                                            {getStatusBadge(schedule, index)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardBody>
            </Card>

            {/* See More / See Less Button */}
            {!loading && visibleSchedule.length > 5 && (
                <div className="flex justify-center">
                    <button
                        onClick={() => setShowAll(!showAll)}
                        className="px-8 py-3 bg-[#059669] text-white font-semibold rounded-lg hover:bg-[#10b981] transition-colors text-base shadow-sm"
                    >
                        {showAll ? "See Less ↑" : `See More (${visibleSchedule.length - 5} more classes) →`}
                    </button>
                </div>
            )}

            {/* View All Schedules Button */}
            {!loading && (
                <div className="flex justify-center mt-2">
                    <button
                        onClick={async () => {
                            setIsViewAllModalOpen(true);
                            setAllSchedulesLoading(true);
                            try {
                                // Fetch all schedules for this teacher (admin sees all)
                                let data: ClassSchedule[] = [];
                                if (isAdmin) {
                                    data = await getAllClassesSchedules(false);
                                } else if (userProfile?.teacherId) {
                                    data = await getClassesByTeacherId(userProfile.teacherId, undefined, false);
                                }
                                // No week filter — show all
                                setAllSchedules(data.sort((a, b) => a.date > b.date ? -1 : 1));
                            } catch (e) {
                                console.error(e);
                            } finally {
                                setAllSchedulesLoading(false);
                            }
                        }}
                        className="px-6 py-2.5 bg-white text-[#1e3a5f] border border-[#1e3a5f] text-sm font-semibold rounded-lg hover:bg-[#f0f4ff] transition-colors shadow-sm flex items-center gap-2"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                        View All Your Class Schedules
                    </button>
                </div>
            )}

            {/* Class Routine Section */}
            <div className="mt-12">
                {/* Section Header */}
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-1 h-10 bg-[#059669] rounded-full"></div>
                    <div>
                        <h2 className="text-3xl font-bold text-[#1f2937]">Class Routine</h2>
                        <p className="text-[#6b7280] mt-1">View full class routine</p>
                    </div>
                </div>

                {/* Batch Selector Tabs */}
                {availableRoutineBatches.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-6">
                        {availableRoutineBatches.map(batch => (
                            <button
                                key={batch}
                                onClick={() => setSelectedRoutineBatch(batch)}
                                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                                    selectedRoutineBatch === batch
                                        ? "bg-[#1e3a5f] text-white shadow-sm"
                                        : "bg-white text-[#1e3a5f] border border-[#1e3a5f] hover:bg-[#f0f4ff]"
                                }`}
                            >
                                {batch}
                            </button>
                        ))}
                    </div>
                )}

                {/* Routine Display */}
                {routineEntriesLoading ? (
                    <div className="flex items-center justify-center py-16">
                        <div className="text-center">
                            <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-[#059669] mb-3"></div>
                            <p className="text-gray-500 font-medium">Loading routine...</p>
                        </div>
                    </div>
                ) : !selectedRoutineBatch ? (
                    <div className="py-8 text-center text-[#6b7280] bg-white rounded-lg border border-gray-100 italic">
                        No batch selected.
                    </div>
                ) : visibleRoutineEntries.length === 0 ? (
                    <div className="py-8 text-center text-[#6b7280] bg-white rounded-lg border border-gray-100 italic">
                        No class routines uploaded yet for {selectedRoutineBatch}.
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                        {/* Title Header */}
                        <div style={{ backgroundColor: "#0D1B4A", textAlign: "center", padding: "10px 24px" }}>
                            <div style={{ color: "#FFFFFF", fontSize: "clamp(0.95rem, 1.4vw, 1.25rem)", fontWeight: 800, letterSpacing: "0.02em", lineHeight: 1.2 }}>
                                {routineViewerConfig?.title || selectedRoutineBatch}
                            </div>
                            {routineViewerConfig?.subtitle && (
                                <div style={{ color: "#93C5FD", fontSize: "0.75rem", fontWeight: 500, marginTop: 3 }}>
                                    {routineViewerConfig.subtitle}
                                </div>
                            )}
                        </div>

                        {/* Routine Table */}
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse" style={{ minWidth: 900 }}>
                                <colgroup>
                                    <col style={{ width: 150 }} />
                                    {ROUTINE_DAYS_ORDER.map(d => <col key={d} style={{ minWidth: 140 }} />)}
                                </colgroup>
                                <thead>
                                    <tr>
                                        {["Time", ...ROUTINE_DAYS_ORDER].map(h => (
                                            <th key={h} style={{ backgroundColor: "#1E3A8A", color: "#FFFFFF", border: "1px solid #2D4FA0", padding: "14px 12px", fontSize: 13, fontWeight: 700, textAlign: "center" }}>
                                                {h}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {uniqueRoutineTimeSlots.map(slot => {
                                        const [startTime, endTime] = slot.split("|||");
                                        const dayEntries = routineLookup[slot] ?? {};
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
                                                    <td colSpan={ROUTINE_DAYS_ORDER.length} style={{ border: "1px solid #E2E8F0", backgroundColor: "#F1F5F9", padding: "14px 20px", textAlign: "center", verticalAlign: "middle" }}>
                                                        <span style={{ fontSize: 13, fontWeight: 600, color: "#475569", fontStyle: "italic" }}>{entry.subject}</span>
                                                    </td>
                                                </tr>
                                            );
                                        }

                                        return (
                                            <tr key={slot}>
                                                {timeCell}
                                                {ROUTINE_DAYS_ORDER.map(day => {
                                                    const entry = dayEntries[day];
                                                    if (!entry) {
                                                        return (
                                                            <td key={day} style={{ border: "1px solid #E2E8F0", backgroundColor: "#FAFAFA", textAlign: "center", color: "#CBD5E1", fontSize: 16, verticalAlign: "middle" }}>—</td>
                                                        );
                                                    }
                                                    const theme = resolveRoutineTheme(entry.subject);
                                                    if (isRoutineBreak(entry.subject)) {
                                                        return (
                                                            <td key={day} style={{ border: "1px solid #E2E8F0", backgroundColor: "#F1F5F9", padding: "12px 10px", textAlign: "center", verticalAlign: "middle" }}>
                                                                <span style={{ fontSize: 12, color: "#64748B", fontStyle: "italic", fontWeight: 500 }}>{entry.subject}</span>
                                                            </td>
                                                        );
                                                    }
                                                    return (
                                                        <td key={day} style={{ border: "1px solid #E2E8F0", padding: 0, verticalAlign: "middle" }}>
                                                            <div style={{ minHeight: 84, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: "12px 10px", borderLeft: `4px solid ${theme?.border ?? "#CBD5E1"}`, backgroundColor: theme?.bg ?? "#FFFFFF", textAlign: "center" }}>
                                                                <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A", lineHeight: 1.4 }}>{entry.subject}</div>
                                                                {entry.classNum && (
                                                                    <div style={{ fontSize: 12, fontWeight: 600, marginTop: 4, color: theme?.text ?? "#64748B" }}>({entry.classNum} Class)</div>
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

                        {/* Legend */}
                        {routineLegendItems.length > 0 && (
                            <div style={{ padding: "20px 24px", borderTop: "1px solid #E5E7EB" }}>
                                <div style={{ display: "flex", flexWrap: "wrap", gap: "16px 24px", justifyContent: "center" }}>
                                    {routineLegendItems.map(item => (
                                        <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                            <div style={{ width: 12, height: 12, borderRadius: "50%", backgroundColor: item.dot, flexShrink: 0 }} />
                                            <span style={{ fontSize: 13, color: "#374151", fontWeight: 500 }}>{item.label}</span>
                                            <span style={{ fontSize: 12, color: "#9CA3AF" }}>({item.count} {item.count === 1 ? "Session" : "Classes"})</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Footer */}
                        {routineViewerConfig?.footerText && (
                            <div style={{ padding: "0 24px 24px", textAlign: "center" }}>
                                <div style={{ height: 1, backgroundColor: "#E5E7EB", margin: "0 16px 16px" }} />
                                <span style={{ fontSize: 13, color: "#6B7280", fontStyle: "italic", fontWeight: 500 }}>— {routineViewerConfig.footerText} —</span>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Batch-wise Class Count Section */}
            <div className="mt-12">
                {/* Section Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-1 h-10 bg-[#059669] rounded-full"></div>
                        <div>
                            <h2 className="text-3xl font-bold text-[#1f2937]">
                                Batch-wise Class Count
                            </h2>
                            <p className="text-[#6b7280] mt-1">
                                Track classes taken per subject for each active batch
                            </p>
                        </div>
                    </div>
                    
                    {isAdmin && (
                        <button
                            onClick={handleOpenManageBatches}
                            className="px-4 py-2 bg-white text-[#1f2937] border border-[#d1d5db] font-semibold rounded-lg hover:bg-gray-50 transition-colors shadow-sm flex items-center gap-2"
                        >
                            <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            Manage Batches
                        </button>
                    )}
                </div>

                {/* Dynamic Batch Tables */}
                {Object.keys(batchStats).length === 0 && !loading && !batchStatsLoading ? (
                    <div className="text-center py-8 text-gray-500 bg-white rounded-lg border border-gray-100 italic">
                        No batch data found. Please ensure tabs are named &apos;Batch_06&apos;, etc.
                    </div>
                ) : (
                    Object.keys(batchStats).sort().map(batchName => {
                        const subjects = batchStats[batchName];

                        return (
                            <div key={batchName} className="mb-8">
                                <h3 className="text-xl font-semibold text-[#1f2937] mb-3">{batchName}</h3>
                                <Card>
                                    <CardBody className="p-0">
                                        <div className="overflow-x-auto">
                                            <table className="w-full border-collapse">
                                                <thead>
                                                    <tr className="bg-[#1e3a5f]">
                                                        <th className="px-6 py-4 text-center text-sm font-semibold text-white border border-[#2d5278] w-20">
                                                            #
                                                        </th>
                                                        <th className="px-6 py-4 text-start text-sm font-semibold text-white border border-[#2d5278]">
                                                            Subject Name
                                                        </th>
                                                        <th className="px-6 py-4 text-center text-sm font-semibold text-white border border-[#2d5278] w-48">
                                                            Classes Taken
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {batchStatsLoading ? (
                                                        [1, 2, 3].map(i => (
                                                            <tr key={i} className="animate-pulse bg-white">
                                                                <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-8 mx-auto"></div></td>
                                                                <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-32"></div></td>
                                                                <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-12 mx-auto"></div></td>
                                                            </tr>
                                                        ))
                                                    ) : subjects.length === 0 ? (
                                                        <tr>
                                                            <td colSpan={3} className="px-6 py-8 text-center text-gray-500 italic">
                                                                No classes found for this batch.
                                                            </td>
                                                        </tr>
                                                    ) : (
                                                        subjects.map((subject, idx) => (
                                                            <tr
                                                                key={subject.subjectName}
                                                                className={idx % 2 === 0 ? "bg-white" : "bg-[#f9fafb]"}
                                                            >
                                                                <td className="px-6 py-3 text-sm text-[#1f2937] font-medium border border-[#e5e7eb] text-center">
                                                                    {idx + 1}
                                                                </td>
                                                                <td className="px-6 py-3 text-sm text-[#1f2937] border border-[#e5e7eb]">
                                                                    {subject.subjectName}
                                                                </td>
                                                                <td className="px-6 py-3 text-sm text-[#1f2937] font-semibold border border-[#e5e7eb] text-center">
                                                                    {subject.classCount}
                                                                </td>
                                                            </tr>
                                                        ))
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </CardBody>
                                </Card>
                            </div>
                        );
                    })
                )}
            </div>

            {/* View All Schedules Modal */}
            {isViewAllModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setIsViewAllModalOpen(false)}>
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-[95vw] h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                        <div className="p-5 border-b border-gray-100 flex justify-between items-center shrink-0 bg-[#1e3a5f] rounded-t-xl">
                            <div>
                                <h3 className="text-xl font-bold text-white">
                                    {isAdmin ? 'All Class Schedules' : 'Your Full Class Schedule'}
                                </h3>
                                <p className="text-blue-200 text-sm mt-0.5">
                                    {isAdmin ? 'Read-only view of all schedules' : `All classes for Teacher ID: ${userProfile?.uid}`}
                                </p>
                            </div>
                            <button onClick={() => setIsViewAllModalOpen(false)} className="text-blue-200 hover:text-white transition-colors">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="flex-1 overflow-auto">
                            {allSchedulesLoading ? (
                                <div className="flex items-center justify-center h-full">
                                    <div className="text-center text-gray-500">
                                        <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-[#059669] mb-3"></div>
                                        <p className="font-medium">Loading all schedules...</p>
                                    </div>
                                </div>
                            ) : allSchedules.length === 0 ? (
                                <div className="flex items-center justify-center h-full text-gray-500">
                                    <div className="text-center">
                                        <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                        </svg>
                                        <p className="font-medium text-gray-700">No schedules found</p>
                                        <p className="text-sm mt-1">No class schedules have been added yet.</p>
                                    </div>
                                </div>
                            ) : (
                                <table className="w-full border-collapse">
                                    <thead className="sticky top-0 z-10">
                                        <tr className="bg-[#1e3a5f]">
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-white border border-[#2d5278]">#</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-white border border-[#2d5278] min-w-[100px]">Date</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-white border border-[#2d5278] min-w-[90px]">Day</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-white border border-[#2d5278] min-w-[100px]">Batch</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-white border border-[#2d5278] min-w-[130px]">Subject</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-white border border-[#2d5278] min-w-[100px]">Time</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-white border border-[#2d5278] min-w-[100px]">Status</th>
                                            {isAdmin && (
                                                <>
                                                    <th className="px-4 py-3 text-left text-xs font-semibold text-white border border-[#2d5278] min-w-[100px]">Teacher ID</th>
                                                    <th className="px-4 py-3 text-left text-xs font-semibold text-white border border-[#2d5278] min-w-[130px]">Teacher Name</th>
                                                </>
                                            )}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {allSchedules.map((sch, idx) => (
                                            <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                                <td className="px-4 py-2.5 text-xs text-gray-400 border border-gray-200 select-none">{idx + 1}</td>
                                                <td className="px-4 py-2.5 text-sm text-gray-800 border border-gray-200 font-medium">{formatDateShort(sch.date)}</td>
                                                <td className="px-4 py-2.5 text-sm text-gray-700 border border-gray-200">{sch.day}</td>
                                                <td className="px-4 py-2.5 text-sm text-gray-800 border border-gray-200 font-medium">{sch.batch}</td>
                                                <td className="px-4 py-2.5 text-sm text-gray-700 border border-gray-200">{sch.subject}</td>
                                                <td className="px-4 py-2.5 text-sm text-gray-700 border border-gray-200">{sch.time}</td>
                                                <td className="px-4 py-2.5 border border-gray-200">
                                                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                                                        sch.status === 'Completed' ? 'bg-green-100 text-green-800' :
                                                        sch.status === 'Today' ? 'bg-blue-100 text-blue-800' :
                                                        sch.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                                                        'bg-gray-100 text-gray-600'
                                                    }`}>
                                                        {sch.status}
                                                    </span>
                                                </td>
                                                {isAdmin && (
                                                    <>
                                                        <td className="px-4 py-2.5 text-sm text-[#059669] border border-gray-200 font-mono">{sch.teacherId}</td>
                                                        <td className="px-4 py-2.5 text-sm text-gray-700 border border-gray-200">{sch.teacherName}</td>
                                                    </>
                                                )}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>

                        <div className="p-4 border-t border-gray-100 flex justify-between items-center shrink-0 bg-gray-50 rounded-b-xl">
                            <span className="text-sm text-gray-500">{allSchedules.length} total schedule entries</span>
                            <Button variant="outline" onClick={() => setIsViewAllModalOpen(false)}>Close</Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Batch Selection Modal */}
            {isBatchSelectionModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setIsBatchSelectionModalOpen(false)}>
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[80vh] animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
                        <div className="p-5 border-b border-gray-100 flex justify-between items-center shrink-0">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">Manage Batch Schedules</h3>
                                <p className="text-sm text-gray-500 mt-1">Select an existing batch to edit its schedule, or add a completely new batch.</p>
                            </div>
                            <button onClick={() => setIsBatchSelectionModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-2">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto flex-1">
                            {isAddingSchedule && uniqueBatchesForSelection.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#059669] mb-3"></div>
                                    <p className="text-gray-500">Loading batches...</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                                    <button
                                        onClick={() => {
                                            const name = prompt("Enter new batch name (e.g. Batch_08):");
                                            if (name && name.trim()) {
                                                handleSelectBatchForGrid(name.trim());
                                            }
                                        }}
                                        className="h-28 border-2 border-dashed border-[#059669] rounded-xl flex flex-col items-center justify-center gap-2 text-[#059669] hover:bg-[#059669]/5 transition-colors group"
                                    >
                                        <svg className="w-8 h-8 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                        </svg>
                                        <span className="font-semibold text-sm">Add New Batch</span>
                                    </button>

                                    {uniqueBatchesForSelection.map((batch) => (
                                        <button
                                            key={batch.name}
                                            onClick={() => handleSelectBatchForGrid(batch.name)}
                                            className="h-28 border border-gray-200 rounded-xl flex flex-col items-center justify-center gap-2 hover:border-[#059669] hover:shadow-md transition-all group bg-white"
                                        >
                                            <div className="bg-blue-50 text-blue-600 p-2 rounded-lg group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                </svg>
                                            </div>
                                            <div className="text-center px-2">
                                                <span className="font-semibold text-gray-800 text-sm block truncate w-full">{batch.name}</span>
                                                <span className="text-xs text-gray-500 mt-0.5">{batch.count} Classes</span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Manage Schedules Grid Modal */}
            {isScheduleModalOpen && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto" onClick={() => setIsScheduleModalOpen(false)}>
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-[95vw] h-[90vh] flex flex-col my-8" onClick={e => e.stopPropagation()}>
                        <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center bg-white z-20 rounded-t-xl shrink-0 gap-4">
                            <div className="w-full md:w-auto flex-1">
                                <div className="flex items-center gap-2">
                                    <h3 className="text-xl font-bold text-gray-900">Manage Schedule Grid</h3>
                                    {selectedBatchForGrid && (
                                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-sm font-bold rounded">
                                            {selectedBatchForGrid}
                                        </span>
                                    )}
                                </div>
                                <p className="text-sm text-gray-500 mt-1">Schedules are loaded live. Edit, overwrite, paste from Excel, or clear cells completely to delete records globally.</p>
                            </div>
                            <div className="flex gap-4 items-center">
                                <button onClick={() => {
                                    const colName = prompt("Enter new column name (e.g. 'Zoom Link'):");
                                    if (colName && colName.trim()) {
                                        const cleanName = colName.trim();
                                        if (!columns.includes(cleanName)) {
                                            setColumns([...columns, cleanName]);
                                        }
                                    }
                                }} className="text-[#1e3a5f] hover:bg-gray-100 text-sm font-medium px-3 py-1.5 border border-gray-200 rounded transition-colors">
                                    + Add Column
                                </button>
                                <button onClick={() => {
                                    setMaxRows(prev => prev + 100);
                                }} className="text-[#1e3a5f] hover:bg-gray-100 text-sm font-medium px-3 py-1.5 border border-gray-200 rounded transition-colors">
                                    + Add 100 Rows
                                </button>
                                <button onClick={handleClearScheduleRows} className="text-red-500 hover:text-red-700 text-sm font-medium px-3 py-1.5 border border-red-200 rounded">
                                    Clear Grid
                                </button>
                                <button onClick={() => setIsScheduleModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                        
                        <div className="p-3 bg-white border-b border-gray-200 flex justify-end px-4 shadow-sm z-10">
                            <Button 
                                onClick={handleSaveSchedule} 
                                disabled={isAddingSchedule}
                                className="bg-[#059669] hover:bg-[#10b981] text-white px-8 font-semibold shadow-md"
                            >
                                {isAddingSchedule ? "Saving..." : "Save All Changes"}
                            </Button>
                        </div>

                        <div className="flex-1 overflow-auto bg-gray-50">
                            <table ref={gridRef} className="w-full border-collapse bg-white shadow-sm">
                                <thead className="sticky top-0 z-20 shadow-sm">
                                    <tr className="bg-[#1e3a5f]">
                                        <th className="w-12 px-2 py-2 text-center text-xs font-semibold text-white border border-[#2d5278]">#</th>
                                        {columns.map(col => (
                                            <th key={col} className="px-3 py-2 text-left text-xs font-semibold text-white border border-[#2d5278] min-w-[110px] capitalize">
                                                {col.replace(/([A-Z])/g, ' $1').trim()}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {Array.from({ length: maxRows }).map((_, idx) => (
                                        <tr key={`${idx}-${gridRenderKey}`} className="bg-white hover:bg-gray-50 transition-colors group">
                                            <td className="p-1 border border-gray-200 text-center text-xs text-gray-400 bg-gray-50 select-none">
                                                {idx + 1}
                                            </td>
                                            {columns.map(col => (
                                                <td key={col} className={`p-0 border border-gray-200 ${col === 'extra1' || col === 'extra2' ? 'bg-gray-50/50' : ''}`}>
                                                    {col === 'status' ? (
                                                        <select
                                                            defaultValue={rowDataRef.current[idx]?.[col] ?? "Scheduled"}
                                                            data-row={idx}
                                                            data-col={col}
                                                            onBlur={e => handleCellBlur(idx, col, e.target.value)}
                                                            className="w-full p-2 bg-transparent text-sm focus:bg-blue-50 focus:ring-1 focus:ring-blue-400 outline-none h-[38px]"
                                                        >
                                                            <option value="Scheduled">Scheduled</option>
                                                            <option value="Today">Today (Needs Done)</option>
                                                            <option value="Completed">Completed</option>
                                                            <option value="Requested">Requested</option>
                                                            <option value="Upcoming">Upcoming</option>
                                                            <option value="Pending">Pending</option>
                                                        </select>
                                                    ) : (
                                                        <input
                                                            type="text"
                                                            defaultValue={rowDataRef.current[idx]?.[col] ?? ""}
                                                            data-row={idx}
                                                            data-col={col}
                                                            disabled={col === 'batch' && !!selectedBatchForGrid}
                                                            onBlur={e => handleCellBlur(idx, col, e.target.value)}
                                                            onPaste={(e) => handlePaste(e, idx, col)}
                                                            className={`w-full p-2 bg-transparent text-sm focus:bg-blue-50 focus:ring-1 focus:ring-blue-400 outline-none placeholder:text-gray-300 h-[38px] ${col === 'teacherId' ? 'font-mono text-[#059669]' : ''} ${col === 'batch' && selectedBatchForGrid ? 'bg-gray-50 text-emerald-700 font-bold' : ''}`}
                                                        />
                                                    )}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="p-4 border-t border-gray-100 flex justify-end gap-3 rounded-b-xl bg-white sticky bottom-0 z-10 shrink-0 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                            <Button variant="outline" onClick={() => setIsScheduleModalOpen(false)}>Cancel</Button>
                            <Button onClick={handleSaveSchedule} disabled={isAddingSchedule} className="bg-[#059669] hover:bg-[#047857] text-white px-8">
                                {isAddingSchedule ? "Saving Data..." : "Save Schedules"}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Manage Batches Modal */}
            {isManageBatchesOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setIsManageBatchesOpen(false)}>
                    <div className="bg-[#f9fafb] rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-white shrink-0">
                            <div>
                                <h3 className="text-xl font-bold text-[#1f2937]">Manage Batches</h3>
                                <p className="text-sm text-gray-500 mt-1">Add new batches or hide archived batches from the public tracking view.</p>
                            </div>
                            <button onClick={() => setIsManageBatchesOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        
                        <div className="p-6 overflow-y-auto space-y-8 flex-1">
                            
                            {/* Add Batch Form */}
                            <div className="bg-white p-5 rounded-lg border border-green-100 shadow-sm">
                                <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                    <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Add New Batch
                                </h4>
                                <form onSubmit={handleAddBatch} className="flex gap-3">
                                    <input
                                        type="text"
                                        required
                                        value={newBatchName}
                                        onChange={(e) => setNewBatchName(e.target.value)}
                                        placeholder="e.g. Batch_08"
                                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#059669] focus:border-transparent outline-none"
                                    />
                                    <button
                                        type="submit"
                                        disabled={isSubmittingBatch || !newBatchName.trim()}
                                        className="px-6 py-2 bg-[#059669] text-white font-semibold rounded-lg hover:bg-[#10b981] disabled:opacity-50 transition-colors whitespace-nowrap"
                                    >
                                        {isSubmittingBatch ? "Adding..." : "Add Batch"}
                                    </button>
                                </form>
                            </div>

                            {/* Batches List */}
                            <div>
                                <h4 className="font-semibold text-gray-800 mb-4 border-b pb-2">Existing Batches</h4>
                                
                                {managedBatches.length === 0 ? (
                                    <p className="text-sm text-gray-500 italic">No batches found in the system. Add one above.</p>
                                ) : (
                                    <div className="space-y-3">
                                        {managedBatches.map(batch => (
                                            <div key={batch.id} className="bg-white p-4 rounded-lg border border-gray-200 flex flex-col md:flex-row md:items-center justify-between shadow-sm hover:border-gray-300 transition-colors gap-4">
                                                <div className="flex flex-col">
                                                    <div className="flex items-center gap-3">
                                                        <span className="font-bold text-gray-900">{batch.name}</span>
                                                        <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full ${batch.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                                                            {batch.status === 'active' ? 'Active Tracking' : 'Archived / Hidden'}
                                                        </span>
                                                    </div>
                                                </div>
                                                
                                                <div className="flex items-center gap-4">
                                                    {/* Download CSV Action */}
                                                    <button 
                                                        onClick={() => handleDownloadCsv(batch.name)}
                                                        disabled={isExportingCsv === batch.name}
                                                        className="text-sm text-[#1e3a5f] hover:text-blue-700 font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
                                                        title="Download Excel Document of Completed Classes"
                                                    >
                                                        {isExportingCsv === batch.name ? (
                                                            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                                        ) : (
                                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                                            </svg>
                                                        )}
                                                        Download Data
                                                    </button>
                                                    
                                                    {/* Toggle Visibility */}
                                                    <button
                                                        onClick={() => handleToggleBatchStatus(batch.id!, batch.status)}
                                                        className={`text-sm font-semibold px-3 py-1.5 rounded-md transition-colors ${
                                                            batch.status === 'active'
                                                                ? 'text-yellow-700 bg-yellow-50 hover:bg-yellow-100 border border-yellow-200'
                                                                : 'text-green-700 bg-green-50 hover:bg-green-100 border border-green-200'
                                                        }`}
                                                    >
                                                        {batch.status === 'active' ? 'Hide Batch' : 'Keep Active'}
                                                    </button>

                                                    {/* Remove from Class Count Section */}
                                                    {batch.status === 'active' && (
                                                        <button
                                                            onClick={() => handleDeleteBatch(batch.id!, batch.name)}
                                                            disabled={isDeletingBatch === batch.id}
                                                            className="text-sm font-semibold px-3 py-1.5 rounded-md transition-colors text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 disabled:opacity-50"
                                                            title="Class Count section থেকে সরান (ডেটা মুছবে না)"
                                                        >
                                                            {isDeletingBatch === batch.id ? (
                                                                <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                                                            ) : (
                                                                'Remove'
                                                            )}
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            
                        </div>
                    </div>
                </div>
            )}

            {/* Animation Styles */}
            <style jsx>{`
                @keyframes fadeIn {
                    from {
                        opacity: 0;
                        transform: translateX(-50%) translateY(-5px);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(-50%) translateY(0);
                    }
                }
                .animate-fadeIn {
                    animation: fadeIn 0.2s ease-out;
                }
            `}</style>
        </div>
    );
}