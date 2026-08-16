"use client";

import { useState, useEffect } from "react";

type LeaveRequest = {
    id: string;
    studentName: string;
    studentRoll: string;
    studentBatchName: string;
    startDate: string;
    endDate: string;
    reason: string;
    status: "PENDING" | "APPROVED" | "REJECTED";
    createdAt: string;
    reviewNote?: string;
};

export default function AdminStudentLeavesPage() {
    const [requests, setRequests] = useState<LeaveRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [noteText, setNoteText] = useState("");
    const [activeNoteId, setActiveNoteId] = useState<string | null>(null);

    useEffect(() => {
        fetchLeaves();
    }, []);

    const fetchLeaves = async () => {
        try {
            const res = await fetch("/api/admin/student-leaves");
            if (res.ok) {
                const data = await res.json();
                setRequests(data);
            }
        } catch (err) {
            console.error("Failed to fetch student leaves", err);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (id: string, newStatus: "APPROVED" | "REJECTED") => {
        setProcessingId(id);
        try {
            const res = await fetch("/api/admin/student-leaves", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id,
                    status: newStatus,
                    reviewNote: activeNoteId === id ? noteText : undefined,
                }),
            });

            if (res.ok) {
                const updatedRequest = await res.json();
                setRequests(requests.map(req => req.id === id ? updatedRequest : req));
                setActiveNoteId(null);
                setNoteText("");
            }
        } catch (err) {
            console.error("Failed to update status", err);
        } finally {
            setProcessingId(null);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 p-4 md:p-8">
            <div className="max-w-6xl mx-auto">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 md:p-8 mb-8">
                    <h1 className="text-2xl font-bold text-slate-800 mb-2">Student Leave Requests</h1>
                    <p className="text-slate-500">Manage and review leave applications submitted by students.</p>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-100 text-slate-600 text-sm">
                                    <th className="p-4 font-semibold">Student Details</th>
                                    <th className="p-4 font-semibold">Date Range</th>
                                    <th className="p-4 font-semibold">Reason</th>
                                    <th className="p-4 font-semibold">Status</th>
                                    <th className="p-4 font-semibold">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {requests.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="p-8 text-center text-slate-500">
                                            No student leave requests found.
                                        </td>
                                    </tr>
                                ) : (
                                    requests.map((req) => (
                                        <tr key={req.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="p-4 align-top">
                                                <div className="font-medium text-slate-800">{req.studentName}</div>
                                                <div className="text-sm text-slate-500">Roll: {req.studentRoll}</div>
                                                <div className="text-xs px-2 py-1 bg-slate-100 text-slate-600 rounded-md inline-block mt-1">
                                                    {req.studentBatchName}
                                                </div>
                                            </td>
                                            <td className="p-4 align-top">
                                                <div className="text-sm text-slate-700 whitespace-nowrap">
                                                    {new Date(req.startDate).toLocaleDateString()} <br />
                                                    <span className="text-slate-400">to</span> <br />
                                                    {new Date(req.endDate).toLocaleDateString()}
                                                </div>
                                            </td>
                                            <td className="p-4 align-top max-w-xs">
                                                <div className="text-sm text-slate-600 bg-white p-2 rounded border border-slate-100">
                                                    {req.reason}
                                                </div>
                                                {req.reviewNote && (
                                                    <div className="mt-2 text-xs bg-blue-50 text-blue-800 p-2 rounded border border-blue-100">
                                                        <strong>Note:</strong> {req.reviewNote}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="p-4 align-top">
                                                <span className={`px-3 py-1 text-xs font-semibold rounded-full inline-block ${
                                                    req.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                                                    req.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                                                    'bg-yellow-100 text-yellow-700'
                                                }`}>
                                                    {req.status}
                                                </span>
                                                <div className="text-[11px] text-slate-400 mt-2">
                                                    Submitted:<br />
                                                    {new Date(req.createdAt).toLocaleDateString()}
                                                </div>
                                            </td>
                                            <td className="p-4 align-top min-w-[200px]">
                                                {req.status === "PENDING" && (
                                                    <div className="space-y-2">
                                                        {activeNoteId === req.id ? (
                                                            <div className="space-y-2">
                                                                <input 
                                                                    type="text" 
                                                                    value={noteText}
                                                                    onChange={(e) => setNoteText(e.target.value)}
                                                                    placeholder="Add a note (optional)"
                                                                    className="w-full text-sm p-1.5 border border-slate-200 rounded"
                                                                />
                                                                <div className="flex gap-2">
                                                                    <button
                                                                        onClick={() => handleUpdateStatus(req.id, "APPROVED")}
                                                                        disabled={processingId === req.id}
                                                                        className="flex-1 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded transition-colors disabled:opacity-50"
                                                                    >
                                                                        Approve
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleUpdateStatus(req.id, "REJECTED")}
                                                                        disabled={processingId === req.id}
                                                                        className="flex-1 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded transition-colors disabled:opacity-50"
                                                                    >
                                                                        Reject
                                                                    </button>
                                                                    <button
                                                                        onClick={() => setActiveNoteId(null)}
                                                                        className="px-2 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-medium rounded transition-colors"
                                                                    >
                                                                        X
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="flex gap-2">
                                                                <button
                                                                    onClick={() => { setActiveNoteId(req.id); setNoteText(""); }}
                                                                    className="flex-1 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-colors"
                                                                >
                                                                    Action
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
