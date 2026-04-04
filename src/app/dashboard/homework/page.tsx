"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getAllTeachers, Teacher } from "@/services/teacherService";
import {
    getAllHomework,
    getHomeworkByTeacher,
    deleteHomework,
    cleanupCompletedBatchHomework,
    HomeworkSubmission
} from "@/services/homeworkService";
import { getAllBatchInfo } from "@/services/batchInfoService";

export default function HomeworkViewPage() {
    const { userProfile, loading: authLoading } = useAuth();

    const [homework, setHomework] = useState<HomeworkSubmission[]>([]);
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [filterTeacher, setFilterTeacher] = useState("all");
    const [filterBatch, setFilterBatch] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");

    // Detail modal
    const [viewingSubmission, setViewingSubmission] = useState<HomeworkSubmission | null>(null);

    // Delete state
    const [deletingId, setDeletingId] = useState<string | null>(null);

    // Cleanup info
    const [cleanupCount, setCleanupCount] = useState(0);

    const isAdmin = userProfile?.role === "admin";
    const isTeacher = userProfile?.role === "teacher";

    useEffect(() => {
        const fetchData = async () => {
            if (!userProfile) return;
            setLoading(true);
            try {
                let batchData: any[] = [];
                
                if (isAdmin) {
                    batchData = await getAllBatchInfo();
                }

                const [teacherData] = await Promise.all([
                    getAllTeachers()
                ]);
                setTeachers(teacherData);

                // Auto-cleanup: check completed batches (Admin only)
                if (isAdmin) {
                    const completedBatches: { batchName: string; completedAt: Date }[] = [];
                    const batchMap = new Map<string, { batchType?: string; createdAt?: Date }>();
                    batchData.forEach(s => {
                        if (!batchMap.has(s.batchName)) {
                            batchMap.set(s.batchName, { batchType: s.batchType, createdAt: s.createdAt });
                        }
                    });
                    batchMap.forEach((info, batchName) => {
                        if (info.batchType === "Completed" && info.createdAt) {
                            completedBatches.push({ batchName, completedAt: info.createdAt });
                        }
                    });

                    if (completedBatches.length > 0) {
                        const deleted = await cleanupCompletedBatchHomework(completedBatches);
                        if (deleted > 0) setCleanupCount(deleted);
                    }
                }

                // Fetch homework based on role
                let homeworkData: HomeworkSubmission[];
                if (isAdmin) {
                    homeworkData = await getAllHomework();
                } else if (isTeacher && userProfile.displayName) {
                    homeworkData = await getHomeworkByTeacher(userProfile.displayName);
                } else {
                    homeworkData = [];
                }
                setHomework(homeworkData);
            } catch (err) {
                console.error("Error fetching homework data:", err);
            } finally {
                setLoading(false);
            }
        };

        if (!authLoading && userProfile) {
            fetchData();
        }
    }, [userProfile, authLoading, isAdmin, isTeacher]);

    // Filtered results
    const filteredHomework = homework.filter(hw => {
        const matchesTeacher = filterTeacher === "all" || hw.teacherName === filterTeacher;
        const matchesBatch = filterBatch === "all" || hw.studentBatchName === filterBatch;
        const q = searchQuery.toLowerCase();
        const matchesSearch = !q ||
            hw.studentName?.toLowerCase().includes(q) ||
            hw.studentRoll?.toLowerCase().includes(q) ||
            hw.subject?.toLowerCase().includes(q);
        return matchesTeacher && matchesBatch && matchesSearch;
    });

    // Unique batches from homework
    const uniqueBatches = Array.from(new Set(homework.map(hw => hw.studentBatchName))).sort();
    const uniqueTeachers = Array.from(new Set(homework.map(hw => hw.teacherName))).sort();

    const handleDelete = async (hw: HomeworkSubmission) => {
        if (!confirm(`Delete homework "${hw.subject}" by ${hw.studentName}?`)) return;
        setDeletingId(hw.id);
        try {
            await deleteHomework(hw.id, hw.storagePath);
            setHomework(prev => prev.filter(h => h.id !== hw.id));
            if (viewingSubmission?.id === hw.id) setViewingSubmission(null);
        } catch (err) {
            console.error("Delete failed:", err);
            alert("Failed to delete homework.");
        } finally {
            setDeletingId(null);
        }
    };

    if (authLoading || loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#059669]"></div>
                <span className="ml-3 text-gray-500">Loading homework submissions...</span>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-1 h-10 bg-[#059669] rounded-full"></div>
                    <div>
                        <h1 className="text-3xl font-bold text-[#1f2937]">Homework Submissions</h1>
                        <p className="text-[#6b7280] mt-1">
                            {isAdmin
                                ? "View all student homework submissions"
                                : `Homework submitted to you (${userProfile?.displayName})`}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="bg-white rounded-xl px-4 py-2.5 border border-gray-100 shadow-sm">
                        <span className="text-sm text-gray-500">Total: </span>
                        <span className="text-lg font-bold text-[#059669]">{filteredHomework.length}</span>
                    </div>
                </div>
            </div>

            {/* Cleanup Banner */}
            {cleanupCount > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-3 flex items-center gap-3">
                    <span className="text-xl">🗑️</span>
                    <p className="text-amber-800 text-sm">
                        <strong>{cleanupCount}</strong> expired homework submission(s) were auto-deleted (batch completed 3+ days ago).
                    </p>
                </div>
            )}

            {/* Filters */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex flex-col md:flex-row gap-4 items-center">
                {/* Search */}
                <div className="relative flex-1 w-full">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                        </svg>
                    </div>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search by student name, roll, or subject..."
                        className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl leading-5 bg-gray-50 placeholder-gray-500 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#059669] focus:border-[#059669] sm:text-sm transition-colors"
                    />
                </div>

                {/* Teacher Filter (admin only) */}
                {isAdmin && (
                    <div className="w-full md:w-52 shrink-0">
                        <select
                            value={filterTeacher}
                            onChange={(e) => setFilterTeacher(e.target.value)}
                            className="block w-full py-2.5 px-3 border border-gray-200 bg-gray-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#059669] focus:border-[#059669] sm:text-sm transition-colors"
                        >
                            <option value="all">👤 All Teachers</option>
                            {uniqueTeachers.map(t => (
                                <option key={t} value={t}>{t}</option>
                            ))}
                        </select>
                    </div>
                )}

                {/* Batch Filter */}
                <div className="w-full md:w-52 shrink-0">
                    <select
                        value={filterBatch}
                        onChange={(e) => setFilterBatch(e.target.value)}
                        className="block w-full py-2.5 px-3 border border-gray-200 bg-gray-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#059669] focus:border-[#059669] sm:text-sm transition-colors"
                    >
                        <option value="all">💳 All Batches</option>
                        {uniqueBatches.map(b => (
                            <option key={b} value={b}>{b}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Homework List */}
            {filteredHomework.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
                    <div className="text-5xl mb-3">📭</div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1">No Homework Found</h3>
                    <p className="text-gray-500 text-sm">
                        {homework.length === 0
                            ? "No homework has been submitted yet."
                            : "No results match your current filters."}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filteredHomework.map((hw) => (
                        <div
                            key={hw.id}
                            className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 group"
                        >
                            {/* Card Header */}
                            <div className="px-5 py-4 border-b border-gray-50">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-gray-900 text-sm truncate">{hw.subject}</h3>
                                        <p className="text-xs text-gray-400 mt-0.5">{hw.submissionDate}</p>
                                    </div>
                                    {isAdmin && (
                                        <span className="text-xs bg-blue-50 text-blue-700 font-semibold px-2 py-0.5 rounded-full whitespace-nowrap">
                                            {hw.teacherName.split(' ')[0]}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Card Body */}
                            <div className="px-5 py-4 space-y-3">
                                {/* Student Info */}
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-sm shrink-0">
                                        {hw.studentName.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-semibold text-gray-900 text-sm truncate">{hw.studentName}</p>
                                        <p className="text-xs text-gray-500">
                                            Roll: {hw.studentRoll} · {hw.studentBatchName}
                                        </p>
                                    </div>
                                </div>

                                {/* File attachment */}
                                {hw.fileName && (
                                    <a
                                        href={hw.fileUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-lg text-xs text-blue-700 hover:bg-blue-100 transition-colors group/link"
                                    >
                                        <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                        </svg>
                                        <span className="truncate font-medium group-hover/link:underline">{hw.fileName}</span>
                                        <svg className="w-3.5 h-3.5 shrink-0 ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                        </svg>
                                    </a>
                                )}

                                {/* Text preview */}
                                {hw.textContent && (
                                    <p className="text-xs text-gray-600 bg-gray-50 px-3 py-2 rounded-lg border border-gray-100 line-clamp-2">
                                        {hw.textContent}
                                    </p>
                                )}
                            </div>

                            {/* Card Footer */}
                            <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                                <button
                                    onClick={() => setViewingSubmission(hw)}
                                    className="text-xs font-semibold text-[#059669] hover:text-[#047857] transition-colors"
                                >
                                    View Details
                                </button>
                                {isAdmin && (
                                    <button
                                        onClick={() => handleDelete(hw)}
                                        disabled={deletingId === hw.id}
                                        className="text-xs font-semibold text-red-500 hover:text-red-700 transition-colors disabled:opacity-50"
                                    >
                                        {deletingId === hw.id ? "Deleting..." : "Delete"}
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Detail Modal */}
            {viewingSubmission && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                    onClick={() => setViewingSubmission(null)}
                >
                    <div
                        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="bg-gradient-to-r from-[#059669] to-[#10b981] p-5 text-white">
                            <div className="flex justify-between items-start">
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-lg font-bold truncate">{viewingSubmission.subject}</h3>
                                    <p className="text-emerald-100 text-sm mt-0.5">Submitted on {viewingSubmission.submissionDate}</p>
                                </div>
                                <button
                                    onClick={() => setViewingSubmission(null)}
                                    className="text-white/80 hover:text-white text-2xl leading-none ml-3"
                                >✕</button>
                            </div>

                            {/* Student Info */}
                            <div className="mt-3 bg-white/20 rounded-xl px-4 py-2.5 text-sm space-y-0.5">
                                <p><span className="opacity-75">Student:</span> <strong>{viewingSubmission.studentName}</strong></p>
                                <p>
                                    <span className="opacity-75">Roll:</span> <strong>{viewingSubmission.studentRoll}</strong>
                                    &nbsp;|&nbsp;
                                    <span className="opacity-75">Batch:</span> <strong>{viewingSubmission.studentBatchName}</strong>
                                </p>
                                <p><span className="opacity-75">Teacher:</span> <strong>{viewingSubmission.teacherName}</strong></p>
                            </div>
                        </div>

                        {/* Modal Content */}
                        <div className="p-6 space-y-4 max-h-[400px] overflow-y-auto">
                            {/* File */}
                            {viewingSubmission.fileName && (
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Attached File</label>
                                    <a
                                        href={viewingSubmission.fileUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-3 px-4 py-3 bg-blue-50 rounded-xl text-sm text-blue-700 hover:bg-blue-100 transition-colors border border-blue-100"
                                    >
                                        <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                        </svg>
                                        <span className="font-medium truncate">{viewingSubmission.fileName}</span>
                                        <span className="ml-auto text-xs text-blue-500 font-semibold whitespace-nowrap">Open ↗</span>
                                    </a>
                                </div>
                            )}

                            {/* Text Content */}
                            {viewingSubmission.textContent && (
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Written Content</label>
                                    <div className="bg-gray-50 rounded-xl px-4 py-3 text-sm text-gray-700 border border-gray-100 whitespace-pre-wrap leading-relaxed">
                                        {viewingSubmission.textContent}
                                    </div>
                                </div>
                            )}

                            {!viewingSubmission.fileName && !viewingSubmission.textContent && (
                                <p className="text-gray-400 text-sm text-center py-4">No content attached.</p>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
                            {isAdmin && (
                                <button
                                    onClick={() => handleDelete(viewingSubmission)}
                                    disabled={deletingId === viewingSubmission.id}
                                    className="px-4 py-2 bg-red-50 text-red-600 font-semibold rounded-xl hover:bg-red-100 transition-colors text-sm border border-red-100 disabled:opacity-50"
                                >
                                    {deletingId === viewingSubmission.id ? "Deleting..." : "Delete"}
                                </button>
                            )}
                            <button
                                onClick={() => setViewingSubmission(null)}
                                className="px-5 py-2 bg-[#059669] text-white font-semibold rounded-xl hover:bg-[#047857] transition-colors text-sm"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
