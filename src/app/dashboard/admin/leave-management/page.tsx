"use client";

import { useState, useEffect, useCallback } from "react";
import { getAllTeachers, Teacher } from "@/services/teacherService";
import { useConfirm } from "@/contexts/ConfirmContext";
import {
    getLeaveSettings,
    saveLeaveSettings,
    getLeavesByTeacher,
    addLeave,
    updateLeave,
    deleteLeave,
    Leave,
    TeacherLeaveSettings,
    syncAutoWeeklyLeaves,
    cleanDuplicateWeeklyLeaves,
} from "@/services/leaveService";

// ---------- Helpers ----------
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const WEEKDAYS_FULL = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function todayStr() {
    const d = new Date();
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}

function getMonthYear(dateStr: string) {
    return dateStr.slice(0, 7);
}

const emptyForm = {
    id: "",
    startDate: todayStr(),
    endDate: todayStr(),
    days: 1,
    type: "Casual" as Leave["type"],
    reason: "",
};

const TYPE_COLORS: Record<string, string> = {
    "Weekly Holiday": "bg-indigo-100 text-indigo-700",
    Sick: "bg-amber-100 text-amber-700",
    Casual: "bg-emerald-100 text-emerald-700",
    Other: "bg-slate-100 text-slate-600",
};

// ---------- Teacher Settings Row Component ----------
function TeacherSettingsRow({ teacher, onSaved }: { teacher: Teacher; onSaved: () => void }) {
    const [settings, setSettings] = useState<{ weeklyHolidays: number[]; joinDate: string }>({
        weeklyHolidays: [],
        joinDate: "",
    });
    const [loaded, setLoaded] = useState(false);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        getLeaveSettings(teacher.teacherId).then((s) => {
            if (s) {
                setSettings({ weeklyHolidays: (s.weeklyHolidays || []).map(Number), joinDate: s.joinDate || "" });
            }
            setLoaded(true);
        });
    }, [teacher.teacherId]);

    const toggle = (i: number) => {
        setSettings((prev) => ({
            ...prev,
            weeklyHolidays: prev.weeklyHolidays.includes(i)
                ? prev.weeklyHolidays.filter((d) => d !== i)
                : [...prev.weeklyHolidays, i],
        }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await saveLeaveSettings({
                teacherId: teacher.teacherId,
                teacherName: teacher.name,
                weeklyHolidays: settings.weeklyHolidays.map(String),
                joinDate: settings.joinDate,
            });
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
            onSaved();
        } catch {
            alert("Failed to save settings for " + teacher.name);
        } finally {
            setSaving(false);
        }
    };

    if (!loaded) {
        return (
            <div className="bg-white rounded-2xl border border-slate-100 p-5 animate-pulse">
                <div className="h-4 bg-slate-100 rounded w-1/3 mb-4"></div>
                <div className="h-8 bg-slate-100 rounded"></div>
            </div>
        );
    }

    const hasHolidays = settings.weeklyHolidays.length > 0;

    return (
        <div className={`bg-white rounded-2xl border-2 transition-colors ${hasHolidays ? "border-emerald-200" : "border-slate-100"} p-5 space-y-4`}>
            {/* Teacher Name */}
            <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                    <div className="font-bold text-slate-800">{teacher.name}</div>
                    <div className="text-xs text-slate-400">{teacher.designation}</div>
                </div>
                {hasHolidays ? (
                    <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-full font-semibold">
                        {settings.weeklyHolidays.map((d) => WEEKDAYS[d]).join(", ")} off
                    </span>
                ) : (
                    <span className="text-xs bg-slate-50 text-slate-400 border border-slate-200 px-2.5 py-1 rounded-full font-medium">
                        No weekly off set
                    </span>
                )}
            </div>

            {/* Day selector */}
            <div className="flex flex-wrap gap-2">
                {WEEKDAYS_FULL.map((day, i) => (
                    <button
                        key={day}
                        type="button"
                        onClick={() => toggle(i)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                            settings.weeklyHolidays.includes(i)
                                ? "bg-emerald-500 text-white border-emerald-500 shadow-sm"
                                : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100"
                        }`}
                    >
                        {day}
                    </button>
                ))}
            </div>

            {/* Join Date + Save */}
            <div className="flex flex-wrap items-end gap-3">
                <div className="flex-1 min-w-[180px]">
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Join Date (auto-count starts from)</label>
                    <input
                        type="date"
                        value={settings.joinDate}
                        onChange={(e) => setSettings((p) => ({ ...p, joinDate: e.target.value }))}
                        className="w-full px-3 py-2 border border-slate-200 bg-slate-50 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-400"
                    />
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className={`px-5 py-2 rounded-lg font-bold text-sm transition-all ${
                        saved
                            ? "bg-emerald-100 text-emerald-700 border border-emerald-300"
                            : "bg-emerald-600 hover:bg-emerald-700 text-white"
                    } disabled:opacity-50`}
                >
                    {saving ? "Saving…" : saved ? "✓ Saved!" : "Save"}
                </button>
            </div>
        </div>
    );
}

// ---------- Main Component ----------
export default function AdminLeaveManagementPage() {
    const confirm = useConfirm();
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [selectedId, setSelectedId] = useState("");
    const [activeTab, setActiveTab] = useState<"records" | "settings">("records");

    const [leaves, setLeaves] = useState<Leave[]>([]);
    const [formData, setFormData] = useState({ ...emptyForm });
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
    const [settingsRefreshKey, setSettingsRefreshKey] = useState(0);

    const showToast = (msg: string, ok = true) => {
        setToast({ msg, ok });
        setTimeout(() => setToast(null), 3500);
    };

    useEffect(() => {
        getAllTeachers().then(setTeachers);
    }, []);

    const fetchLeaves = useCallback(async () => {
        if (!selectedId) return;
        setLoading(true);
        try {
            const teacher = teachers.find((t) => t.id === selectedId);
            if (!teacher) return;
            await syncAutoWeeklyLeaves(teacher.teacherId).catch(() => {});
            const data = await getLeavesByTeacher(teacher.teacherId);
            setLeaves(data);
        } finally {
            setLoading(false);
        }
    }, [selectedId, teachers]);

    useEffect(() => {
        if (!selectedId) {
            setLeaves([]);
            return;
        }
        fetchLeaves();
    }, [selectedId, fetchLeaves]);


    const handleSubmitLeave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedId) return;
        setSubmitting(true);
        try {
            const teacher = teachers.find((t) => t.id === selectedId);
            const monthYear = getMonthYear(formData.startDate);
            const payload = {
                teacherId: teacher?.teacherId || selectedId,
                teacherName: teacher?.name || "",
                startDate: formData.startDate,
                endDate: formData.endDate,
                days: Number(formData.days),
                type: formData.type,
                reason: formData.reason,
                monthYear,
            };

            if (formData.id) {
                await updateLeave(formData.id, payload);
                showToast("Leave updated successfully.");
            } else {
                await addLeave(payload);
                showToast("Leave added successfully.");
            }
            setFormData({ ...emptyForm });
            fetchLeaves();
        } catch {
            showToast("Could not save leave record.", false);
        } finally {
            setSubmitting(false);
        }
    };

    const handleEdit = (leave: Leave) => {
        setFormData({
            id: leave.id!,
            startDate: leave.startDate,
            endDate: leave.endDate,
            days: leave.days,
            type: leave.type,
            reason: leave.reason || "",
        });
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const handleDelete = async (id: string) => {
        const ok = await confirm({ message: "Delete this leave record?", variant: "danger" });
        if (!ok) return;
        try {
            await deleteLeave(id);
            showToast("Leave deleted.");
            fetchLeaves();
        } catch {
            showToast("Delete failed.", false);
        }
    };

    const handleCleanDuplicates = async () => {
        if (!selectedId) return;
        const ok = await confirm({ message: "This will remove duplicate weekly holiday entries (keeping one per date). Continue?", variant: "warning" });
        if (!ok) return;
        const count = await cleanDuplicateWeeklyLeaves(selectedId);
        if (count > 0) {
            showToast(`Removed ${count} duplicate entries successfully.`);
        } else {
            showToast("No duplicates found.");
        }
        fetchLeaves();
    };

    const totalDays = leaves.reduce((s, l) => s + l.days, 0);

    return (
        <div className="max-w-6xl mx-auto space-y-6 pb-10">
            {/* Toast */}
            {toast && (
                <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl shadow-lg font-medium text-sm ${toast.ok ? "bg-emerald-600 text-white" : "bg-red-600 text-white"}`}>
                    {toast.ok ? "✅ " : "❌ "}{toast.msg}
                </div>
            )}

            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-800">⚙️ Leave Management</h1>
                <p className="text-sm text-slate-500 mt-1">Admin panel to manage teacher leaves, weekly holidays and settings.</p>
            </div>

            {/* Tabs at top level */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="flex border-b border-slate-100">
                    {(["records", "settings"] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`flex-1 py-4 text-sm font-bold transition-colors border-b-2 ${
                                activeTab === tab
                                    ? "border-emerald-500 text-emerald-600 bg-emerald-50"
                                    : "border-transparent text-slate-500 hover:bg-slate-50"
                            }`}
                        >
                            {tab === "records" ? "📋 Leave Records" : "⚙️ Teacher Settings"}
                        </button>
                    ))}
                </div>

                <div className="p-6">
                    {/* ====== SETTINGS TAB — shows ALL teachers ====== */}
                    {activeTab === "settings" && (
                        <div className="space-y-5">
                            <div className="flex items-start justify-between flex-wrap gap-3">
                                <div>
                                    <h2 className="text-base font-bold text-slate-800">Weekly Off Configuration</h2>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        Set weekly off days and join date for each teacher individually. Teachers with no days selected will not have automatic weekly leaves counted.
                                    </p>
                                </div>
                                <span className="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-3 py-1.5 rounded-lg font-medium">
                                    💡 After saving, auto-holidays will sync when teacher is viewed in Leave Tracking
                                </span>
                            </div>

                            {teachers.length === 0 ? (
                                <div className="text-center py-10 text-slate-400">Loading teachers…</div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {teachers.map((t) => (
                                        <TeacherSettingsRow
                                            key={t.id}
                                            teacher={t}
                                            onSaved={() => setSettingsRefreshKey((k) => k + 1)}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* ====== RECORDS TAB ====== */}
                    {activeTab === "records" && (
                        <div className="space-y-6">
                            {/* Teacher selector inside records tab */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Select Teacher</label>
                                <div className="relative w-full md:w-[380px]">
                                    <select
                                        value={selectedId}
                                        onChange={(e) => { setSelectedId(e.target.value); setFormData({ ...emptyForm }); }}
                                        className="w-full appearance-none bg-slate-50 border border-slate-200 text-slate-800 px-4 py-3 pr-10 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium cursor-pointer"
                                    >
                                        <option value="">— Choose a Teacher —</option>
                                        {teachers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                                    </select>
                                    <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">▼</div>
                                </div>
                            </div>

                            {loading && (
                                <div className="flex justify-center py-8">
                                    <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                                </div>
                            )}

                            {selectedId && !loading && (
                                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                                    {/* Left: Form */}
                                    <div className="lg:col-span-2 bg-slate-50 border border-slate-100 rounded-2xl p-6 space-y-4 h-fit">
                                        <h3 className="font-bold text-slate-800">{formData.id ? "✏️ Edit Leave" : "➕ Add New Leave"}</h3>
                                        <form onSubmit={handleSubmitLeave} className="space-y-4">
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className="text-xs font-semibold text-slate-600 mb-1 block">Start Date</label>
                                                    <input type="date" required value={formData.startDate}
                                                        onChange={(e) => setFormData((p) => ({ ...p, startDate: e.target.value }))}
                                                        className="w-full px-3 py-2 border border-slate-200 bg-white rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-400" />
                                                </div>
                                                <div>
                                                    <label className="text-xs font-semibold text-slate-600 mb-1 block">End Date</label>
                                                    <input type="date" required value={formData.endDate}
                                                        onChange={(e) => setFormData((p) => ({ ...p, endDate: e.target.value }))}
                                                        className="w-full px-3 py-2 border border-slate-200 bg-white rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-400" />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className="text-xs font-semibold text-slate-600 mb-1 block">Total Days</label>
                                                    <input type="number" min={0.5} step={0.5} required value={formData.days}
                                                        onChange={(e) => setFormData((p) => ({ ...p, days: Number(e.target.value) }))}
                                                        className="w-full px-3 py-2 border border-slate-200 bg-white rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-400" />
                                                </div>
                                                <div>
                                                    <label className="text-xs font-semibold text-slate-600 mb-1 block">Leave Type</label>
                                                    <select required value={formData.type}
                                                        onChange={(e) => setFormData((p) => ({ ...p, type: e.target.value as Leave["type"] }))}
                                                        className="w-full px-3 py-2 border border-slate-200 bg-white rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-400">
                                                        <option>Casual</option>
                                                        <option>Sick</option>
                                                        <option>Weekly Holiday</option>
                                                        <option>Other</option>
                                                    </select>
                                                </div>
                                            </div>

                                            <div>
                                                <label className="text-xs font-semibold text-slate-600 mb-1 block">Reason (Optional)</label>
                                                <textarea rows={2} value={formData.reason}
                                                    onChange={(e) => setFormData((p) => ({ ...p, reason: e.target.value }))}
                                                    className="w-full px-3 py-2 border border-slate-200 bg-white rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-400 resize-none" />
                                            </div>

                                            <div className="flex gap-2">
                                                <button type="submit" disabled={submitting}
                                                    className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm disabled:opacity-50">
                                                    {submitting ? "Saving…" : formData.id ? "Update" : "Add Leave"}
                                                </button>
                                                {formData.id && (
                                                    <button type="button" onClick={() => setFormData({ ...emptyForm })}
                                                        className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-bold text-sm">
                                                        Cancel
                                                    </button>
                                                )}
                                            </div>
                                        </form>
                                    </div>

                                    {/* Right: Records Table */}
                                    <div className="lg:col-span-3 space-y-4">
                                        <div className="flex items-center justify-between flex-wrap gap-2">
                                            <div className="flex items-center gap-3">
                                                <h3 className="font-bold text-slate-700">All Records</h3>
                                                <button
                                                    onClick={handleCleanDuplicates}
                                                    className="text-xs text-orange-600 border border-orange-200 bg-orange-50 hover:bg-orange-100 px-3 py-1 rounded-full font-semibold transition-colors"
                                                    title="Remove duplicate weekly holiday entries (keeps one per date)"
                                                >
                                                    🧹 Remove Duplicates
                                                </button>
                                            </div>
                                            <span className="text-sm font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                                                {totalDays} Total Days
                                            </span>
                                        </div>
                                        <div className="overflow-hidden border border-slate-100 rounded-2xl">
                                            <table className="w-full text-sm">
                                                <thead className="bg-slate-800 text-white text-xs">
                                                    <tr>
                                                        <th className="px-4 py-3 text-left font-semibold">Date</th>
                                                        <th className="px-4 py-3 text-center font-semibold">Days</th>
                                                        <th className="px-4 py-3 text-left font-semibold">Type</th>
                                                        <th className="px-4 py-3 text-left font-semibold hidden md:table-cell">Reason</th>
                                                        <th className="px-4 py-3 text-right font-semibold">Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-50 bg-white">
                                                    {leaves.length === 0 ? (
                                                        <tr><td colSpan={5} className="py-10 text-center text-slate-400 text-sm">No leaves found. Add one using the form.</td></tr>
                                                    ) : (
                                                        leaves.map((leave) => (
                                                            <tr key={leave.id} className="hover:bg-slate-50 transition-colors">
                                                                <td className="px-4 py-3 text-slate-700 font-medium whitespace-nowrap">
                                                                    {leave.startDate}{leave.startDate !== leave.endDate && <span className="text-slate-400"> → {leave.endDate}</span>}
                                                                </td>
                                                                <td className="px-4 py-3 text-center font-bold text-slate-800">{leave.days}</td>
                                                                <td className="px-4 py-3">
                                                                    <span className={`px-2 py-1 rounded-md text-xs font-bold ${TYPE_COLORS[leave.type] || TYPE_COLORS["Other"]}`}>
                                                                        {leave.type}
                                                                    </span>
                                                                </td>
                                                                <td className="px-4 py-3 text-slate-400 text-xs max-w-[120px] truncate hidden md:table-cell" title={leave.reason}>
                                                                    {leave.reason || "—"}
                                                                </td>
                                                                <td className="px-4 py-3 text-right">
                                                                    <button onClick={() => handleEdit(leave)} className="text-blue-600 hover:text-blue-800 text-xs font-bold mr-3">Edit</button>
                                                                    <button onClick={() => handleDelete(leave.id!)} className="text-red-500 hover:text-red-700 text-xs font-bold">Delete</button>
                                                                </td>
                                                            </tr>
                                                        ))
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
