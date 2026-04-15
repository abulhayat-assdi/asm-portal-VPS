"use client";

import { useState, useRef, useEffect } from "react";
import { generateAIResponse } from "@/lib/mock-ai-service";
import { cn } from "@/lib/utils";

type Message = {
    id: string;
    role: 'user' | 'ai';
    text: string;
};

export default function AIFAQSection() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Suggested quick questions
    const quickQuestions = [
        "Who is this course for?",
        "Is this course suitable for beginners?",
        "What skills will I gain?",
    ];

    const scrollToBottom = () => {
        if (chatContainerRef.current) {
            const { scrollHeight, clientHeight } = chatContainerRef.current;
            chatContainerRef.current.scrollTo({
                top: scrollHeight - clientHeight,
                behavior: 'smooth'
            });
        }
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isLoading]);

    const handleSend = async (text: string) => {
        if (!text.trim()) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            text: text
        };

        setMessages(prev => [...prev, userMsg]);
        setInput("");
        setIsLoading(true);

        try {
            const aiText = await generateAIResponse(text);
            const aiMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: 'ai',
                text: aiText
            };
            setMessages(prev => [...prev, aiMsg]);
        } catch (error) {
            console.error("AI Error:", error);
            const errorMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: 'ai',
                text: "Sorry, I'm having trouble connecting right now. Please try again later."
            };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleQuickQuestion = (question: string) => {
        handleSend(question);
    };

    return (
        <section className="w-full bg-[#f9fafb] border-t border-gray-100 py-[15px]">
            <div className="max-w-4xl mx-auto px-4 md:px-6 lg:px-8">

                {/* 1. Section Header */}
                <div className="text-center mb-6">
                    <h2 className="text-3xl md:text-3xl font-semibold text-[#1f2937] mb-3">
                        Ask Our AI Assistant
                    </h2>
                    <p className="text-transparent bg-clip-text bg-gradient-to-r from-[#374151] to-[#059669] text-lg max-w-2xl mx-auto font-medium">
                        Get instant answers about the course, modules, eligibility, and learning approach.
                    </p>
                </div>

                {/* 2. Main AI Chat Box */}
                <div className="bg-white max-w-3xl mx-auto rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-[#e5e7eb] overflow-hidden flex flex-col h-[600px] max-h-[70vh]">

                    {/* Chat History Area */}
                    <div
                        ref={chatContainerRef}
                        className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth"
                    >
                        {messages.length === 0 && (
                            <div className="h-full flex flex-col items-center justify-center text-center px-4 opacity-100 transition-opacity duration-300">
                                <div className="w-16 h-16 bg-[#059669]/10 rounded-full flex items-center justify-center text-[#059669] mb-4">
                                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-medium text-[#374151] mb-2">How can I help you today?</h3>
                                <p className="text-[#9ca3af] text-sm max-w-xs">
                                    Ask me anything about the Sales & Marketing course curriculum, pricing, or schedule.
                                </p>

                                <div className="mt-8 flex flex-wrap justify-center gap-2">
                                    {quickQuestions.map((q, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => handleQuickQuestion(q)}
                                            className="px-4 py-2 rounded-full text-sm bg-white border border-[#e5e7eb] text-[#4b5563] hover:border-[#059669] hover:text-[#059669] transition-colors shadow-sm"
                                        >
                                            {q}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={cn(
                                    "flex w-full",
                                    msg.role === 'user' ? "justify-end" : "justify-start"
                                )}
                            >
                                <div
                                    className={cn(
                                        "max-w-[85%] md:max-w-[75%] rounded-2xl px-5 py-3.5 text-[15px] leading-relaxed shadow-sm",
                                        msg.role === 'user'
                                            ? "bg-[#f3f4f6] text-[#1f2937] rounded-tr-none"
                                            : "bg-[#f0fdf4] text-[#1f2937] rounded-tl-none border border-[#059669]/10"
                                    )}
                                >
                                    {msg.role === 'ai' && (
                                        <div className="flex items-center gap-2 mb-2 pb-2 border-b border-[#059669]/10">
                                            <div className="w-5 h-5 rounded-full bg-[#059669] flex items-center justify-center">
                                                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                                </svg>
                                            </div>
                                            <span className="text-xs font-semibold text-[#059669] uppercase tracking-wide">AI Assistant</span>
                                        </div>
                                    )}
                                    <div dangerouslySetInnerHTML={{ __html: msg.text.replace(/\n/g, '<br/>') }} />
                                </div>
                            </div>
                        ))}

                        {isLoading && (
                            <div className="flex justify-start w-full">
                                <div className="bg-[#f0fdf4] text-[#1f2937] rounded-2xl rounded-tl-none border border-[#059669]/10 px-5 py-4 shadow-sm">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-5 h-5 rounded-full bg-[#059669] flex items-center justify-center">
                                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                            </svg>
                                        </div>
                                        <span className="text-xs font-semibold text-[#059669] uppercase tracking-wide">AI Assistant</span>
                                    </div>
                                    <div className="flex space-x-1.5 pl-1">
                                        <span className="w-1.5 h-1.5 bg-[#059669]/40 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                        <span className="w-1.5 h-1.5 bg-[#059669]/40 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                        <span className="w-1.5 h-1.5 bg-[#059669]/40 rounded-full animate-bounce"></span>
                                    </div>
                                </div>
                            </div>
                        )}
                        {/* Removed messagesEndRef div since we scroll container */}
                    </div>

                    {/* Input Area */}
                    <div className="p-4 bg-white border-t border-[#e5e7eb]">

                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                handleSend(input);
                            }}
                            className="relative flex items-center"
                        >
                            <input
                                ref={inputRef}
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Ask anything about the course..."
                                disabled={isLoading}
                                className="w-full pl-5 pr-14 py-3.5 bg-[#f9fafb] border border-[#e5e7eb] rounded-full text-[#1f2937] placeholder-[#9ca3af] focus:outline-none focus:ring-2 focus:ring-[#059669]/20 focus:border-[#059669] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                            />
                            <button
                                type="submit"
                                disabled={!input.trim() || isLoading}
                                className="absolute right-2 p-2 bg-[#059669] text-white rounded-full hover:bg-[#047857] disabled:opacity-50 disabled:hover:bg-[#059669] transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
                                </svg>
                            </button>
                        </form>
                        <p className="text-center text-xs text-[#9ca3af] mt-3">
                            AI responses are generated based on course materials.
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
}
