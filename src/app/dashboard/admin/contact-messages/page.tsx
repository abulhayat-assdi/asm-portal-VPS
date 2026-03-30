"use client";

import { useState, useEffect } from "react";
import {
    getAllContactMessages,
    markMessageAsRead,
    markMessageAsResolved,
    deleteContactMessage,
    ContactMessage
} from "@/services/contactService";

const statusColors = {
    unread: "bg-red-100 text-red-700 border-red-200",
    read: "bg-yellow-100 text-yellow-700 border-yellow-200",
    resolved: "bg-green-100 text-green-700 border-green-200",
};

const statusLabels = {
    unread: "🔴 Unread",
    read: "🟡 Read",
    resolved: "✅ Resolved",
};

export default function ContactManagementPage() {
    const [messages, setMessages] = useState<ContactMessage[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<"all" | "unread" | "read" | "resolved">("all");
    const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
    const [isDeleting, setIsDeleting] = useState<string | null>(null);

    const fetchMessages = async () => {
        setLoading(true);
        try {
            const data = await getAllContactMessages();
            setMessages(data);
        } catch (err) {
            console.error("Failed to fetch contact messages:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMessages();
    }, []);

    const handleView = async (msg: ContactMessage) => {
        setSelectedMessage(msg);
        if (msg.status === "unread") {
            await markMessageAsRead(msg.id);
            setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, status: "read" } : m));
        }
    };

    const handleResolve = async (id: string) => {
        await markMessageAsResolved(id);
        setMessages(prev => prev.map(m => m.id === id ? { ...m, status: "resolved" } : m));
        if (selectedMessage?.id === id) {
            setSelectedMessage(prev => prev ? { ...prev, status: "resolved" } : null);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this message?")) return;
        setIsDeleting(id);
        try {
            await deleteContactMessage(id);
            setMessages(prev => prev.filter(m => m.id !== id));
            if (selectedMessage?.id === id) setSelectedMessage(null);
        } catch (err) {
            console.error("Delete error:", err);
        } finally {
            setIsDeleting(null);
        }
    };

    const filtered = filter === "all" ? messages : messages.filter(m => m.status === filter);

    const counts = {
        all: messages.length,
        unread: messages.filter(m => m.status === "unread").length,
        read: messages.filter(m => m.status === "read").length,
        resolved: messages.filter(m => m.status === "resolved").length,
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="w-1 h-10 bg-[#059669] rounded-full"></div>
                <div>
                    <h1 className="text-3xl font-bold text-[#1f2937]">Contact Management</h1>
                    <p className="text-[#6b7280] mt-0.5">Messages sent by students from the Student Portal</p>
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex flex-wrap gap-2">
                {(["all", "unread", "read", "resolved"] as const).map(tab => (
                    <button
                        key={tab}
                        onClick={() => setFilter(tab)}
                        className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${
                            filter === tab
                                ? "bg-[#059669] text-white border-[#059669]"
                                : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                        }`}
                    >
                        {tab === "all" ? "All" : statusLabels[tab]} &nbsp;
                        <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold ${
                            filter === tab ? "bg-white/30 text-white" : "bg-gray-100 text-gray-600"
                        }`}>{counts[tab]}</span>
                    </button>
                ))}
                <button
                    onClick={fetchMessages}
                    className="ml-auto px-4 py-2 rounded-xl text-sm font-semibold border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 transition-all flex items-center gap-2"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Refresh
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* Message List */}
                <div className="lg:col-span-2 space-y-3">
                    {loading ? (
                        <div className="text-center py-16">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#059669] mx-auto"></div>
                            <p className="text-gray-500 mt-3 text-sm">Loading messages...</p>
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200">
                            <div className="text-4xl mb-3">📭</div>
                            <p className="text-gray-500 font-medium">No messages found</p>
                        </div>
                    ) : (
                        filtered.map(msg => (
                            <div
                                key={msg.id}
                                onClick={() => handleView(msg)}
                                className={`bg-white rounded-2xl p-4 border cursor-pointer hover:shadow-md transition-all ${
                                    selectedMessage?.id === msg.id
                                        ? "border-[#059669] shadow-md ring-1 ring-[#059669]/30"
                                        : msg.status === "unread"
                                        ? "border-red-200 shadow-sm"
                                        : "border-gray-100"
                                }`}
                            >
                                <div className="flex items-start justify-between gap-2 mb-2">
                                    <h4 className={`font-bold text-sm truncate ${msg.status === "unread" ? "text-gray-900" : "text-gray-600"}`}>
                                        {msg.status === "unread" && <span className="inline-block w-2 h-2 bg-red-500 rounded-full mr-2 mb-0.5"></span>}
                                        {msg.subject}
                                    </h4>
                                    <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold shrink-0 ${statusColors[msg.status]}`}>
                                        {msg.status}
                                    </span>
                                </div>
                                <p className="text-xs text-gray-500 line-clamp-2">{msg.message}</p>
                                <div className="mt-3 flex items-center justify-between text-xs text-gray-400">
                                    <span className="font-medium text-gray-600">👤 {msg.studentName}</span>
                                    <span>{msg.date}</span>
                                </div>
                                <div className="mt-1 text-xs text-gray-400">
                                    Batch: <strong>{msg.studentBatchName}</strong> | Roll: <strong>{msg.studentRoll}</strong>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Message Detail */}
                <div className="lg:col-span-3">
                    {selectedMessage ? (
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden sticky top-6">
                            {/* Detail Header */}
                            <div className="bg-gradient-to-r from-[#1e3a5f] to-[#2d5484] p-6 text-white">
                                <div className="flex justify-between items-start gap-4">
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-xl font-bold">{selectedMessage.subject}</h3>
                                        <p className="text-blue-200 text-sm mt-1">{selectedMessage.date}</p>
                                    </div>
                                    <span className={`text-xs px-3 py-1.5 rounded-full border font-bold shrink-0 ${statusColors[selectedMessage.status]}`}>
                                        {statusLabels[selectedMessage.status]}
                                    </span>
                                </div>

                                {/* Student Info Box */}
                                <div className="mt-4 bg-white/15 rounded-xl p-4 grid grid-cols-2 gap-y-2 text-sm">
                                    <div>
                                        <p className="text-blue-200 text-xs uppercase tracking-wider">Name</p>
                                        <p className="font-bold">{selectedMessage.studentName}</p>
                                    </div>
                                    <div>
                                        <p className="text-blue-200 text-xs uppercase tracking-wider">Email</p>
                                        <p className="font-bold truncate">{selectedMessage.studentEmail}</p>
                                    </div>
                                    <div>
                                        <p className="text-blue-200 text-xs uppercase tracking-wider">Batch</p>
                                        <p className="font-bold">{selectedMessage.studentBatchName}</p>
                                    </div>
                                    <div>
                                        <p className="text-blue-200 text-xs uppercase tracking-wider">Roll</p>
                                        <p className="font-bold">{selectedMessage.studentRoll}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Message Body */}
                            <div className="p-6">
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Message</h4>
                                <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                                    <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">{selectedMessage.message}</p>
                                </div>

                                {/* Action Buttons */}
                                <div className="mt-6 flex flex-wrap gap-3">
                                    {selectedMessage.status !== "resolved" && (
                                        <button
                                            onClick={() => handleResolve(selectedMessage.id)}
                                            className="flex-1 px-4 py-2.5 bg-[#059669] text-white font-bold rounded-xl hover:bg-[#047857] transition-colors text-sm flex items-center justify-center gap-2"
                                        >
                                            ✅ Mark as Resolved
                                        </button>
                                    )}
                                    <button
                                        onClick={() => handleDelete(selectedMessage.id)}
                                        disabled={isDeleting === selectedMessage.id}
                                        className="flex-1 px-4 py-2.5 bg-red-50 text-red-600 font-bold rounded-xl hover:bg-red-100 transition-colors text-sm flex items-center justify-center gap-2 border border-red-100"
                                    >
                                        {isDeleting === selectedMessage.id ? "Deleting..." : "🗑️ Delete"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white rounded-2xl border border-dashed border-gray-200 h-64 flex flex-col items-center justify-center text-center p-8">
                            <div className="text-5xl mb-4">💬</div>
                            <h3 className="text-lg font-bold text-gray-700">Select a message</h3>
                            <p className="text-gray-400 text-sm mt-1">Click any message from the list to view its details</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
