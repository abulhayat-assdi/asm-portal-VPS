"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { 
    subscribeToChatMessages, 
    sendChatMessage, 
    ChatMessage, 
    ChatAttachment, 
    markChatAsRead 
} from "@/services/contactService";
import { auth } from "@/lib/firebase";
import Link from "next/link";

export default function ContactAdminStudent() {
    const { userProfile } = useAuth();
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [text, setText] = useState("");
    const [files, setFiles] = useState<File[]>([]);
    const [isSending, setIsSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!userProfile?.uid) return;
        const unsubscribe = subscribeToChatMessages(userProfile.uid, (msgs) => {
            setMessages(msgs);
            markChatAsRead(userProfile.uid, "student");
        });
        return () => unsubscribe();
    }, [userProfile?.uid]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const selected = Array.from(e.target.files);
            const valid = selected.filter(f => f.size <= 10 * 1024 * 1024);
            if (valid.length < selected.length) {
                alert("Some files were removed because they exceed the 10MB size limit.");
            }
            setFiles(prev => [...prev, ...valid]);
            // Reset input so the same files can be chosen again if previously removed
            e.target.value = "";
        }
    };

    const removeFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    const formatTime = (timestamp: any) => {
        if (!timestamp) return "";
        const d = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const handleSend = async () => {
        if (!userProfile?.uid) return;
        if (!text.trim() && files.length === 0) return;

        setIsSending(true);
        try {
            const uploadedAttachments: ChatAttachment[] = [];

            // Upload files
            for (const file of files) {
                const formData = new FormData();
                formData.append("file", file);
                formData.append("category", "chat_files");
                formData.append("path", userProfile.uid); // Store inside student's UID folder

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

            // Student profile payload
            const profileInfo = {
                name: userProfile.displayName || "Unknown",
                email: userProfile.email || "Unknown",
                batch: userProfile.studentBatchName || "N/A",
                roll: userProfile.studentRoll || "N/A"
            };

            await sendChatMessage(
                userProfile.uid,
                "student",
                text,
                uploadedAttachments,
                profileInfo
            );

            setText("");
            setFiles([]);
        } catch (error) {
            console.error("Failed to send:", error);
            alert("Failed to send message. Please try again.");
        } finally {
            setIsSending(false);
        }
    };

    if (!userProfile) return null;

    return (
        <div className="flex flex-col h-[calc(100vh-6rem)] max-w-4xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Header */}
            <div className="bg-[#1f2937] p-4 flex items-center gap-4 text-white">
                <div className="w-12 h-12 bg-[#059669] rounded-full flex items-center justify-center text-xl shadow-inner font-bold border-2 border-white/20 !text-white no-gradient">
                    A
                </div>
                <div>
                    <h2 className="text-lg font-bold !text-white no-gradient">Admin</h2>
                    <p className="text-xs !text-white/90 no-gradient flex items-center gap-1">
                        <span className="w-2 h-2 bg-green-400 rounded-full inline-block"></span> 
                        Online Support
                    </p>
                </div>
            </div>

            {/* Chat Body */}
            <div className="flex-1 bg-[#f4f7f6] p-4 overflow-y-auto flex flex-col gap-4">
                {messages.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center opacity-50">
                        <div className="text-5xl mb-3">💬</div>
                        <h3 className="font-bold text-gray-600">Start the conversation</h3>
                        <p className="text-sm text-gray-500 max-w-sm mt-1">Send a message to the admin. You can attach images, PDFs, and files up to 10MB.</p>
                    </div>
                ) : (
                    messages.map((msg, idx) => {
                        const isStudent = msg.sender === "student";
                        return (
                            <div key={msg.id || idx} className={`flex max-w-[80%] ${isStudent ? 'self-end' : 'self-start'}`}>
                                <div className={`relative p-3 rounded-2xl shadow-sm ${
                                    isStudent 
                                        ? 'bg-[#059669] text-white rounded-tr-sm' 
                                        : 'bg-white text-gray-800 rounded-tl-sm border border-gray-100'
                                }`}>
                                    {/* Text Content */}
                                    {msg.text && (
                                        <p className="whitespace-pre-wrap text-sm leading-relaxed mb-1">{msg.text}</p>
                                    )}

                                    {/* Attachments */}
                                    {msg.attachments && msg.attachments.length > 0 && (
                                        <div className="grid grid-cols-1 gap-2 mt-2">
                                            {msg.attachments.map((file, i) => (
                                                <Link 
                                                    href={file.url} 
                                                    target="_blank" 
                                                    key={i}
                                                    className={`flex items-center gap-2 p-2 rounded-xl border transition-colors ${
                                                        isStudent ? 'bg-white/10 border-white/20 hover:bg-white/20' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                                                    }`}
                                                >
                                                    <span className="text-xl">
                                                        {file.type.includes('image') ? '🖼️' : '📄'}
                                                    </span>
                                                    <span className="text-xs font-semibold truncate max-w-[150px]" title={file.name}>
                                                        {file.name}
                                                    </span>
                                                </Link>
                                            ))}
                                        </div>
                                    )}

                                    {/* Time */}
                                    <div className={`text-[10px] mt-1 text-right ${isStudent ? 'text-green-100' : 'text-gray-400'}`}>
                                        {formatTime(msg.createdAt)}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="bg-white border-t border-gray-100 p-4">
                {/* File Previews */}
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
                            autoFocus
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSend();
                                }
                            }}
                            placeholder="Type a message..."
                            className="w-full bg-gray-50 border border-gray-200 rounded-2xl pl-4 pr-12 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#059669]/50 focus:border-[#059669] resize-none overflow-hidden max-h-32"
                            rows={Math.min(4, text.split('\n').length || 1)}
                            disabled={isSending}
                        />
                        {/* Attachment Button */}
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
                        className="bg-[#059669] text-white p-3.5 rounded-2xl hover:bg-[#047857] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center h-[46px] w-[46px] shrink-0"
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
                <div className="text-[10px] text-gray-400 mt-2 flex justify-between">
                    <span>Press Enter to send, Shift+Enter for new line</span>
                    <span>Max file size: 10MB</span>
                </div>
            </div>
        </div>
    );
}
