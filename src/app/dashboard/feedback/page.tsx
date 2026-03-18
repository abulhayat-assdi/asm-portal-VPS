"use client";

import { useState, useEffect } from "react";
import Card, { CardBody } from "@/components/ui/Card";
import { useAuth } from "@/contexts/AuthContext";
import * as feedbackService from "@/services/feedbackService";
import { formatDateShort } from "@/lib/utils";

export default function FeedbackPage() {
    const { userProfile, user } = useAuth();
    const [feedbackList, setFeedbackList] = useState<feedbackService.Feedback[]>([]);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
    const [deleting, setDeleting] = useState(false);

    const feedbackFormUrl = typeof window !== 'undefined' ? `${window.location.origin}/student-feedback` : '/student-feedback';

    const handleCopy = () => {
        navigator.clipboard.writeText(feedbackFormUrl).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    const isAdmin = userProfile?.role === "admin";

    // Fetch Feedback
    useEffect(() => {
        // Wait until userProfile is loaded before fetching (avoids initial fetch as non-admin if admin)
        if (userProfile === null) return;
        
        const loadFeedback = async () => {
            setLoading(true);
            const data = await feedbackService.getFeedbackList(userProfile.role === "admin");
            setFeedbackList(data);
            setLoading(false);
        };
        loadFeedback();
    }, [userProfile]); // Reload if profile changes

    // Data is already filtered by the service based on role
    const visibleFeedback = feedbackList;

    const handleApprove = async (id: string) => {
        if (!user) return;
        try {
            await feedbackService.approveFeedback(id, user.uid);
            // Optimistic update
            setFeedbackList((prev) =>
                prev.map((f) => (f.id === id ? { ...f, status: "APPROVED" } : f))
            );
        } catch (error) {
            alert("Failed to approve feedback");
        }
    };

    const handleDelete = async (id: string) => {
        if (!user) return;
        setDeleting(true);
        try {
            await feedbackService.deleteFeedback(id, user.uid);
            setFeedbackList((prev) => prev.filter((f) => f.id !== id));
            setConfirmDeleteId(null);
        } catch (error) {
            alert("Failed to delete feedback");
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div className="space-y-8">
            {/* Page Header */}
            <div className="flex items-center gap-3">
                <div className="w-1 h-10 bg-[#059669] rounded-full"></div>
                <div>
                    <h1 className="text-3xl font-bold text-[#1f2937]">
                        Feedback & Suggestions
                    </h1>
                    <p className="text-[#6b7280] mt-1">
                        View student feedback and suggestions
                    </p>
                </div>
            </div>

            {/* Student Feedback Form Link (Info Box) */}
            <div className="bg-[#d1fae5] border-l-4 border-[#059669] p-4 rounded-lg">
                <div className="flex items-start gap-3">
                    <svg
                        className="w-5 h-5 text-[#059669] mt-0.5 flex-shrink-0"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                    >
                        <path
                            fillRule="evenodd"
                            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                            clipRule="evenodd"
                        />
                    </svg>
                    <div className="flex-1">
                        <p className="text-[#059669] font-semibold mb-1">
                            Student Feedback Form Link:
                        </p>
                        <p className="text-[#047857] text-sm mb-2">
                            Share this link with students to collect feedback
                        </p>
                        <div className="flex items-center gap-2">
                            <input
                                type="text"
                                readOnly
                                value={feedbackFormUrl}
                                className="flex-1 px-3 py-2 bg-white border border-[#059669] rounded text-sm text-[#1f2937]"
                            />
                            <button
                                onClick={handleCopy}
                                className={`px-4 py-2 text-white text-sm font-medium rounded transition-colors ${copied ? 'bg-[#047857]' : 'bg-[#059669] hover:bg-[#10b981]'}`}
                            >
                                {copied ? '✅ Copied!' : '📋 Copy'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Feedback List */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-[#1f2937]">
                        {isAdmin ? "All Feedback" : "Approved Feedback"}
                    </h2>
                    <span className="text-sm text-[#6b7280]">
                        {visibleFeedback.length} feedback
                        {visibleFeedback.length !== 1 ? "s" : ""}
                    </span>
                </div>

                {loading ? (
                    <div className="text-center py-12 text-gray-500">
                        Loading feedback...
                    </div>
                ) : visibleFeedback.length > 0 ? (
                    <div className="space-y-4">
                        {visibleFeedback.map((feedback) => (
                            <Card
                                key={feedback.id}
                                className="hover:shadow-lg transition-shadow"
                            >
                                <CardBody className="p-6">
                                    <div className="flex items-start gap-4">
                                        {/* Quote Icon */}
                                        <div className="flex-shrink-0">
                                            <svg
                                                className="w-8 h-8 text-[#d1d5db]"
                                                fill="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                                            </svg>
                                        </div>

                                        {/* Feedback Content */}
                                        <div className="flex-1">
                                            {/* Header with Batch and Date */}
                                            <div className="flex items-center gap-3 mb-3 flex-wrap">
                                                <span className="px-3 py-1 bg-[#059669] text-white text-sm font-semibold rounded-full">
                                                    {feedback.batch}
                                                </span>
                                                <span className="text-sm text-[#6b7280]">
                                                    📅 {feedback.createdAt ? formatDateShort(feedback.createdAt.toDate().toISOString()) : "N/A"}
                                                </span>
                                                <span
                                                    className={`px-3 py-1 text-xs font-semibold rounded-full ${feedback.status === "APPROVED"
                                                        ? "bg-[#d1fae5] text-[#059669]"
                                                        : "bg-[#fed7aa] text-[#c2410c]"
                                                        }`}
                                                >
                                                    {feedback.status === "APPROVED" ? "Approved" : "Pending"}
                                                </span>
                                            </div>

                                            {/* Feedback Message */}
                                            <p className="text-[#1f2937] leading-relaxed mb-4">
                                                {feedback.message}
                                            </p>

                                            {/* Admin Controls */}
                                            {isAdmin && (
                                                <div className="flex items-center gap-3">
                                                    {feedback.status === "PENDING" && (
                                                        <button
                                                            onClick={() =>
                                                                handleApprove(feedback.id)
                                                            }
                                                            className="px-4 py-2 bg-[#059669] text-white text-sm font-semibold rounded-lg hover:bg-[#10b981] transition-colors"
                                                        >
                                                            ✓ Approve
                                                        </button>
                                                    )}
                                                    {confirmDeleteId === feedback.id ? (
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-sm text-red-600 font-medium">মুছে ফেলবেন?</span>
                                                            <button
                                                                onClick={() => handleDelete(feedback.id)}
                                                                disabled={deleting}
                                                                className="px-3 py-1.5 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 disabled:opacity-60 transition-colors"
                                                            >
                                                                {deleting ? '...' : '✓ হ্যাঁ'}
                                                            </button>
                                                            <button
                                                                onClick={() => setConfirmDeleteId(null)}
                                                                disabled={deleting}
                                                                className="px-3 py-1.5 bg-gray-100 text-gray-600 text-sm font-semibold rounded-lg hover:bg-gray-200 transition-colors"
                                                            >
                                                                ✕ না
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <button
                                                            onClick={() => setConfirmDeleteId(feedback.id)}
                                                            className="px-4 py-2 bg-red-50 text-red-600 text-sm font-semibold rounded-lg hover:bg-red-100 transition-colors"
                                                        >
                                                            🗑️ Delete
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </CardBody>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16">
                        <svg
                            className="w-16 h-16 mx-auto text-[#d1d5db] mb-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1.5}
                                d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                            />
                        </svg>
                        <p className="text-[#6b7280] text-lg">
                            No feedback available yet
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
