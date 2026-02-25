"use client";

import { cn } from "@/lib/utils";
import Reveal from "./Reveal";

const whyReasons = [
    {
        title: "Bridging the Skill Gap",
        description: "We bridge the gap between traditional education and real-world employment. We replace bookish theory with practical, on-field training to create truly market-ready professionals.",
        icon: (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
            </svg>
        )
    },
    {
        title: "Redefining Sales & Marketing",
        description: "People are tired of deception. We reframe sales as an 'Amanah' (trust) and marketing as truthful communication—replacing forced tricks with genuine value creation.",
        icon: (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
        )
    },
    {
        title: "Building Self-Reliant Youth",
        description: "We eliminate the fear of selling to empower you to take full responsibility for your life. Build the confidence to earn halal sustenance without relying on haram shortcuts.",
        icon: (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 5.523-4.477 10-10 10S1 17.523 1 12 5.477 2 11 2s10 4.477 10 10z" />
            </svg>
        )
    },
    {
        title: "Meeting Real Market Demand",
        description: "SMEs and businesses urgently need professionals who can sell ethically. We produce graduates who build long-term trust, solve customer problems, and drive business growth.",
        icon: (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
            </svg>
        )
    },
];


export default function WhyThisCourseSection() {
    return (
        <section className="relative w-full py-20 md:py-28 bg-white overflow-hidden border-t border-gray-100">
            {/* Background Ambience (Subtle) */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-green-500/5 rounded-full blur-[100px]" />
                <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[100px]" />
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8">
                {/* Section Header */}
                <div className="text-center mb-16">
                    <Reveal>
                        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6 tracking-tight">
                            Why This Course Exists
                        </h2>
                    </Reveal>
                    <Reveal delay={100}>
                        <div className="h-1 w-16 bg-[#4CAF50] mx-auto rounded-full" />
                    </Reveal>
                </div>

                {/* Grid Layout */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 max-w-5xl mx-auto">
                    {whyReasons.map((reason, index) => {
                        const isLeadCard = index === 0;

                        return (
                            <Reveal
                                key={index}
                                delay={index * 100}
                                width="100%"
                                fullHeight
                            >
                                <div
                                    className={cn(
                                        "h-full flex flex-col items-start gap-4 p-6 md:p-8 rounded-2xl transition-all duration-300",
                                        // Base Styles
                                        "hover:-translate-y-[2px] bg-white",
                                        // Visual Priority for Lead Card vs Standard Cards
                                        isLeadCard
                                            ? "border border-green-100 shadow-[0_10px_30px_-10px_rgba(76,175,80,0.15)] hover:shadow-[0_20px_40px_-5px_rgba(76,175,80,0.25)]"
                                            : "border border-gray-100 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.1)]"
                                    )}
                                >
                                    <div
                                        className={cn(
                                            "flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center transition-colors duration-300",
                                            isLeadCard
                                                ? "bg-green-50 text-[#4CAF50]"
                                                : "bg-gray-50 text-gray-400 group-hover:text-[#4CAF50]"
                                        )}
                                    >
                                        {reason.icon}
                                    </div>
                                    <div>
                                        <h3 className={cn(
                                            "text-xl font-bold mb-3",
                                            isLeadCard ? "text-gray-900" : "text-gray-900"
                                        )}>
                                            {reason.title}
                                        </h3>
                                        <p className="text-base text-gray-600 leading-relaxed font-medium">
                                            {reason.description}
                                        </p>
                                    </div>
                                </div>
                            </Reveal>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
