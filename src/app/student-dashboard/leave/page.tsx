"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

type LeaveRequest = {
    id: string;
    startDate: string;
    endDate: string;
    reason: string;
    status: "PENDING" | "APPROVED" | "REJECTED";
    createdAt: string;
    reviewNote?: string;
};

export default function StudentLeavePage() {
    const { userProfile, loading: authLoading } = useAuth();
    const [requests, setRequests] = useState<LeaveRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [reason, setReason] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    useEffect(() => {
        const fetchLeaves = async () => {
            try {
                const res = await fetch("/api/student/leave");
                if (res.ok) {
                    const data = await res.json();
                    setRequests(data);
                }
            } catch (err) {
                console.error("Failed to fetch leaves", err);
            } finally {
                setLoading(false);
            }
        };

        if (!authLoading && userProfile) {
            fetchLeaves();
        }
    }, [authLoading, userProfile]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        if (!startDate || !endDate || !reason) {
            setError("All fields are required");
            return;
        }

        setSubmitting(true);
        try {
            const res = await fetch("/api/student/leave", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ startDate, endDate, reason }),
            });

            if (res.ok) {
                const newRequest = await res.json();
                setRequests([newRequest, ...requests]);
                setSuccess("Leave request submitted successfully!");
                setStartDate("");
                setEndDate("");
                setReason("");
            } else {
                const data = await res.json();
                setError(data.error || "Failed to submit leave request");
            }
        } catch (err) {
            setError("An error occurred. Please try again later.");
        } finally {
            setSubmitting(false);
        }
    };

    if (authLoading) {
        return (
            <div className="flex justify-center items-center h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 p-4 md:p-8">
            <div className="max-w-4xl mx-auto space-y-8">
                
                {/* Header Section */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 md:p-8">
                    <h1 className="text-2xl font-bold text-slate-800 mb-2">Leave Request</h1>
                    <p className="text-slate-500">Submit a new leave request or view your past requests.</p>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    
                    {/* Form Section */}
                    <div className="md:col-span-1">
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 sticky top-6">
                            <h2 className="text-lg font-semibold text-slate-800 mb-6">New Request</h2>
                            
                            {error && <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">{error}</div>}
                            {success && <div className="mb-4 p-3 bg-green-50 text-green-600 text-sm rounded-lg border border-green-100">{success}</div>}
                            
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Start Date</label>
                                    <input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">End Date</label>
                                    <input
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Reason</label>
                                    <textarea
                                        value={reason}
                                        onChange={(e) => setReason(e.target.value)}
                                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
                                        rows={4}
                                        placeholder="Briefly explain your reason for leave..."
                                        required
                                    ></textarea>
                                </div>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                    {submitting ? "Submitting..." : "Submit Request"}
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* History Section */}
                    <div className="md:col-span-2">
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                            <h2 className="text-lg font-semibold text-slate-800 mb-6">Request History</h2>
                            
                            {loading ? (
                                <div className="flex justify-center py-12">
                                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
                                </div>
                            ) : requests.length === 0 ? (
                                <div className="text-center py-12 bg-slate-50 rounded-xl border border-slate-100 border-dashed">
                                    <div className="text-4xl mb-3">📝</div>
                                    <h3 className="text-slate-700 font-medium mb-1">No leave requests yet</h3>
                                    <p className="text-slate-500 text-sm">When you submit a leave request, it will appear here.</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {requests.map((req) => (
                                        <div key={req.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50 hover:bg-slate-100/50 transition-colors">
                                            <div className="flex justify-between items-start mb-3">
                                                <div>
                                                    <div className="text-sm text-slate-500 mb-1">
                                                        {new Date(req.createdAt).toLocaleDateString()}
                                                    </div>
                                                    <div className="font-medium text-slate-800">
                                                        {new Date(req.startDate).toLocaleDateString()} to {new Date(req.endDate).toLocaleDateString()}
                                                    </div>
                                                </div>
                                                <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                                                    req.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                                                    req.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                                                    'bg-yellow-100 text-yellow-700'
                                                }`}>
                                                    {req.status}
                                                </span>
                                            </div>
                                            <p className="text-slate-600 text-sm mb-3 bg-white p-3 rounded-lg border border-slate-100">{req.reason}</p>
                                            {req.reviewNote && (
                                                <div className="text-sm bg-blue-50 text-blue-800 p-3 rounded-lg border border-blue-100">
                                                    <strong>Admin Note:</strong> {req.reviewNote}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
