"use client";

import { cn } from "@/lib/utils";
import Reveal from "./Reveal";

export interface WhyCard {
    id?: string;
    title: string;
    description: string;
}

interface Props {
    title?: string;
    whyCards?: WhyCard[];
}

// SVG icon pool — cycles by card index
const ICON_POOL = [
    (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
        </svg>
    ),
    (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
        </svg>
    ),
    (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 5.523-4.477 10-10 10S1 17.523 1 12 5.477 2 11 2s10 4.477 10 10z" />
        </svg>
    ),
    (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
        </svg>
    ),
    (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
        </svg>
    ),
    (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
        </svg>
    ),
];

export default function WhyThisCourseSection({ title = "Why This Course Exists", whyCards = [] }: Props) {
    return (
        <section className="relative w-full bg-white overflow-hidden border-t border-gray-100 py-[15px]">
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-green-500/5 rounded-full blur-[100px]" />
                <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[100px]" />
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8">
                <div className="text-center mb-10">
                    <Reveal>
                        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6 tracking-tight">
                            {title}
                        </h2>
                    </Reveal>
                    <Reveal delay={100}>
                        <div className="h-1 w-16 bg-[#4CAF50] mx-auto rounded-full" />
                    </Reveal>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 max-w-5xl mx-auto">
                    {whyCards.map((card, index) => {
                        const isLeadCard = index === 0;
                        const icon = ICON_POOL[index % ICON_POOL.length];

                        return (
                            <Reveal key={card.id || index} delay={index * 100} width="100%" fullHeight>
                                <div
                                    className={cn(
                                        "h-full flex flex-col items-start gap-4 p-6 md:p-8 rounded-2xl transition-all duration-300",
                                        "hover:-translate-y-[2px] bg-white",
                                        isLeadCard
                                            ? "border border-green-100 shadow-[0_10px_30px_-10px_rgba(76,175,80,0.15)] hover:shadow-[0_20px_40px_-5px_rgba(76,175,80,0.25)]"
                                            : "border border-gray-100 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.1)]"
                                    )}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={cn(
                                            "flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center transition-colors duration-300",
                                            isLeadCard ? "bg-green-50 text-[#4CAF50]" : "bg-gray-50 text-gray-400"
                                        )}>
                                            {icon}
                                        </div>
                                        <h3 className="text-xl font-bold text-gray-900">{card.title}</h3>
                                    </div>
                                    <p className="text-base text-gray-600 leading-relaxed font-medium">
                                        {card.description}
                                    </p>
                                </div>
                            </Reveal>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
