"use client";

import { useState, useEffect, useRef } from "react";
import { 
    subscribeToAllChatThreads, 
    subscribeToChatMessages, 
    sendChatMessage, 
    deleteChatThread,
    markChatAsRead,
    AdminChatThread, 
    ChatMessage, 
    ChatAttachment
} from "@/services/contactService";
import { auth } from "@/lib/firebase";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

export default function ContactManagementPage() {
    const { userProfile } = useAuth();
    const [threads, setThreads] = useState<AdminChatThread[]>([]);
    const [selectedThread, setSelectedThread] = useState<AdminChatThread | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    
    // Chat inputs
    const [text, setText] = useState("");
    const [files, setFiles] = useState<File[]>([]);
    const [isSending, setIsSending] = useState(false);
    
    // Deletion Modal
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    // 1. Load threads
    useEffect(() => {
        const unsubscribe = subscribeToAllChatThreads((data) => {
            setThreads(data);
            // Re-sync selected thread from live list (for unread counts & latest msg sync)
            if (selectedThread) {
                const updated = data.find(t => t.studentUid === selectedThread.studentUid);
                if (updated && updated.unreadCountAdmin > 0) {
                    markChatAsRead(updated.studentUid, "admin");
                }
            }
        });
        return () => unsubscribe();
    }, [selectedThread?.studentUid]);

    // 2. Load messages when thread selected
    useEffect(() => {
        if (!selectedThread) {
            setMessages([]);
            return;
        }
        
        const unsubscribe = subscribeToChatMessages(selectedThread.studentUid, (msgs) => {
            setMessages(msgs);
            markChatAsRead(selectedThread.studentUid, "admin");
        });
        return () => unsubscribe();
    }, [selectedThread?.studentUid]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const selected = Array.from(e.target.files);
            const valid = selected.filter(f => f.size <= 10 * 1024 * 1024);
            if (valid.length < selected.length) {
                alert("Some files were removed due to 10MB limit.");
            }
            setFiles(prev => [...prev, ...valid]);
            e.target.value = "";
        }
    };

    const removeFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    const formatTimeShort = (timestamp: any) => {
        if (!timestamp) return "";
        const d = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const formatDateTime = (timestamp: any) => {
        if (!timestamp) return "";
        const d = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return d.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    const handleSend = async () => {
        if (!selectedThread) return;
        if (!text.trim() && files.length === 0) return;

        setIsSending(true);
        try {
            const uploadedAttachments: ChatAttachment[] = [];

            for (const file of files) {
                const formData = new FormData();
                formData.append("file", file);
                formData.append("category", "chat_files");
                formData.append("path", selectedThread.studentUid);

                // Ensure fresh auth token
                const currentUser = auth.currentUser;
                if (!currentUser) throw new Error("Not authenticated");
                const token = await currentUser.getIdToken(true);

                const response = await fetch("/api/storage/upload", {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${token}`
                    },
                    body: formData
                });

                if (!response.ok) {
                    throw new Error("Failed to upload file to local storage");
                }

                const data = await response.json();

                uploadedAttachments.push({
                    url: data.fileUrl,
                    name: file.name,
                    path: data.storagePath,
                    size: file.size,
                    type: file.type
                });
            }

            await sendChatMessage(
                selectedThread.studentUid,
                "admin",
                text,
                uploadedAttachments
            );

            setText("");
            setFiles([]);
        } catch (error) {
            console.error("Failed to send:", error);
            alert("Failed to send message.");
        } finally {
            setIsSending(false);
        }
    };

    const confirmDelete = async () => {
        if (!selectedThread) return;
        setIsDeleting(true);
        try {
            await deleteChatThread(selectedThread.studentUid);
            setSelectedThread(null);
            setShowDeleteModal(false);
        } catch (err) {
            alert("Failed to delete chat: " + (err as any).message);
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="h-[calc(100vh-5.5rem)] md:h-[calc(100vh-7.5rem)] flex flex-col animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6 shrink-0">
                <div className="w-1 h-10 bg-[#059669] rounded-full"></div>
                <div>
                    <h1 className="text-3xl font-bold text-[#1f2937]">Live Support</h1>
                    <p className="text-[#6b7280] mt-0.5">Real-time messaging with students</p>
                </div>
            </div>

            <div className="flex-1 bg-white border border-gray-200 rounded-2xl shadow-sm flex overflow-hidden">
                
                {/* Left Sidebar: Threads List */}
                <div className="w-80 border-r border-gray-200 flex flex-col bg-gray-50 shrink-0">
                    <div className="p-4 border-b border-gray-200 bg-white">
                        <h2 className="font-bold text-gray-700">Chats</h2>
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        {threads.length === 0 ? (
                            <div className="p-6 text-center text-gray-400 text-sm">No active chats</div>
                        ) : (
                            threads.map(thread => (
                                <div 
                                    key={thread.studentUid}
                                    onClick={() => setSelectedThread(thread)}
                                    className={`p-4 border-b border-gray-100 cursor-pointer transition-colors relative ${
                                        selectedThread?.studentUid === thread.studentUid 
                                        ? 'bg-[#059669]/10' 
                                        : 'hover:bg-white bg-transparent'
                                    }`}
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <h4 className="font-bold text-sm text-gray-800 truncate pr-2">
                                            {thread.studentName}
                                        </h4>
                                        <span className="text-[10px] text-gray-400 whitespace-nowrap">
                                            {formatTimeShort(thread.lastMessageTime)}
                                        </span>
                                    </div>
                                    <div className="text-xs text-gray-500 truncate pr-6 font-medium">
                                        {thread.lastMessageText || "Sent an attachment"}
                                    </div>
                                    {thread.unreadCountAdmin > 0 && (
                                        <div className="absolute right-4 top-1/2 mt-1 w-2.5 h-2.5 bg-red-500 rounded-full shadow-sm shadow-red-500/40"></div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Right Area: Chat Window */}
                <div className="flex-1 flex flex-col bg-white">
                    {selectedThread ? (
                        <>
                            {/* Chat Header */}
                            <div className="h-16 border-b border-gray-200 flex items-center justify-between px-6 bg-white shrink-0">
                                <div>
                                    <h3 className="font-bold text-gray-800 text-lg leading-tight">{selectedThread.studentName}</h3>
                                    <p className="text-xs font-semibold text-[#059669]">
                                        Roll: {selectedThread.studentRoll} &nbsp;|&nbsp; Batch: {selectedThread.studentBatchName}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setShowDeleteModal(true)}
                                    className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                    title="Delete Chat"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </button>
                            </div>

                            {/* Chat Messages */}
                            <div className="flex-1 overflow-y-auto p-6 bg-[#f4f7f6] flex flex-col gap-4">
                                {messages.map((msg, idx) => {
                                    const isAdmin = msg.sender === "admin";
                                    return (
                                        <div key={msg.id || idx} className={`flex max-w-[70%] ${isAdmin ? 'self-end' : 'self-start'}`}>
                                            <div className={`p-4 rounded-2xl shadow-sm relative ${
                                                isAdmin 
                                                    ? 'bg-[#1e3a5f] text-white rounded-tr-sm' 
                                                    : 'bg-white text-gray-800 rounded-tl-sm border border-gray-100'
                                            }`}>
                                                {msg.text && (
                                                    <p className="whitespace-pre-wrap text-sm leading-relaxed mb-2">{msg.text}</p>
                                                )}

                                                {msg.attachments && msg.attachments.length > 0 && (
                                                    <div className="grid grid-cols-1 gap-2">
                                                        {msg.attachments.map((file, i) => (
                                                            <Link 
                                                                href={file.url} 
                                                                target="_blank" 
                                                                key={i}
                                                                className={`flex items-center gap-3 p-2 rounded-xl border transition-colors ${
                                                                    isAdmin ? 'bg-white/10 border-white/20 hover:bg-white/20' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                                                                }`}
                                                            >
                                                                <span className="text-xl">
                                                                    {file.type.includes('image') ? '🖼️' : '📄'}
                                                                </span>
                                                                <span className="text-xs font-semibold truncate max-w-[200px]" title={file.name}>
                                                                    {file.name}
                                                                </span>
                                                            </Link>
                                                        ))}
                                                    </div>
                                                )}

                                                <div className={`text-[10px] mt-1 text-right ${isAdmin ? 'text-blue-200' : 'text-gray-400'}`}>
                                                    {formatTimeShort(msg.createdAt)}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Chat Input */}
                            <div className="bg-white border-t border-gray-100 p-4 shrink-0">
                                {files.length > 0 && (
                                    <div className="flex gap-2 mb-3 overflow-x-auto pb-2 custom-scrollbar">
                                        {files.map((file, idx) => (
                                            <div key={idx} className="relative bg-gray-50 border border-gray-200 rounded-xl p-2 pr-8 flex items-center gap-2 shrink-0">
                                                <span className="text-lg">{file.type.includes('image') ? '🖼️' : '📄'}</span>
                                                <span className="text-xs font-medium truncate max-w-[100px]">{file.name}</span>
                                                <button 
                                                    onClick={() => removeFile(idx)}
                                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500"
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div className="flex items-end gap-3">
                                    <div className="relative flex-1">
                                        <textarea
                                            value={text}
                                            onChange={(e) => setText(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && !e.shiftKey) {
                                                    e.preventDefault();
                                                    handleSend();
                                                }
                                            }}
                                            placeholder="Write your reply..."
                                            className="w-full bg-gray-50 border border-gray-200 rounded-2xl pl-4 pr-12 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#059669]/50 focus:border-[#059669] resize-none overflow-hidden max-h-32"
                                            rows={Math.min(4, text.split('\n').length || 1)}
                                            disabled={isSending}
                                        />
                                        <label className="absolute right-3 top-3 cursor-pointer text-gray-400 hover:text-[#059669] transition-colors">
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                            </svg>
                                            <input type="file" multiple className="hidden" onChange={handleFileChange} disabled={isSending} />
                                        </label>
                                    </div>

                                    <button
                                        onClick={handleSend}
                                        disabled={isSending || (!text.trim() && files.length === 0)}
                                        className="bg-[#1e3a5f] text-white p-3.5 rounded-2xl hover:bg-[#152e4d] transition-all disabled:opacity-50 flex items-center justify-center h-[46px] w-[46px] shrink-0"
                                    >
                                        {isSending ? (
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        ) : (
                                            <svg className="w-5 h-5 translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-center opacity-40 bg-gray-50/50">
                            <div className="text-6xl mb-4">💬</div>
                            <h3 className="font-bold text-gray-700 text-xl">No chat selected</h3>
                            <p className="text-sm mt-1 max-w-sm">Select a student from the sidebar to view their messages or reply.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Deletion Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowDeleteModal(false)}>
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
                        <div className="p-8 text-center">
                            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                <span className="text-4xl">⚠️</span>
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">Delete Conversation?</h2>
                            <p className="text-gray-500 mb-8 leading-relaxed">
                                Are you totally sure? This will <strong>permanently cross-delete</strong> all chat history and storage files for both you and the student. This cannot be undone.
                            </p>
                            <div className="flex gap-4">
                                <button 
                                    onClick={() => setShowDeleteModal(false)}
                                    className="flex-1 py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-2xl transition-colors cursor-pointer"
                                >
                                    No, Keep it
                                </button>
                                <button 
                                    onClick={confirmDelete}
                                    disabled={isDeleting}
                                    className="flex-1 py-3 px-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-2xl transition-colors disabled:opacity-50 cursor-pointer flex items-center justify-center"
                                >
                                    {isDeleting ? "Deleting..." : "Yes, Delete"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
