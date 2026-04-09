"use client";

import { cn } from "@/lib/utils";
import { useRef } from "react";

import Reveal from "./Reveal";

interface LearningOutcomesProps {
    title: string;
    subtitle: string;
    outcomes: string[];
    className?: string;
}

export default function LearningOutcomes({
    title,
    subtitle,
    outcomes,
    className = "",
}: LearningOutcomesProps) {
    const sectionRef = useRef<HTMLElement>(null);

    return (
        <section
            ref={sectionRef}
            className={cn(
                "w-full bg-white py-24 md:py-32 overflow-hidden",
                className
            )}
        >
            <div className="max-w-7xl mx-auto px-6 lg:px-8">
                <div className="flex flex-col gap-20 lg:gap-24">

                    {/* TOP: Narrative Content */}
                    <div className="flex flex-col items-center text-center space-y-12">
                        <Reveal width="100%">
                            <div className="max-w-3xl mx-auto space-y-6">
                                <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 tracking-tight leading-tight">
                                    {title}
                                </h2>
                                <p className="text-lg md:text-xl text-gray-500 leading-relaxed font-medium">
                                    {subtitle}
                                </p>
                            </div>
                        </Reveal>

                        {/* Outcomes Checklist - 4x2 Grid */}
                        <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-6 max-w-7xl mx-auto text-left items-stretch">
                            {outcomes.map((outcome, index) => (
                                <Reveal key={index} delay={index * 80} width="100%">
                                    <li className="flex items-start gap-4 p-4 rounded-2xl bg-gray-50/50 hover:bg-gray-50 transition-colors duration-300 h-full">
                                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white border border-gray-100 flex items-center justify-center mt-0.5 text-[#4CAF50] shadow-sm">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                                                <path d="M5 12l5 5L20 7" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                        </div>
                                        <span className="text-gray-700 font-medium leading-relaxed">
                                            {outcome}
                                        </span>
                                    </li>
                                </Reveal>
                            ))}
                        </ul>
                    </div>



                </div>
            </div>

            {/* Global style for custom animations if needed, though Tailwind handles most */}
            <style jsx>{`
                .animate-spin-slow {
                    animation: spin 10s linear infinite;
                }
                @keyframes spin {
                    from { transform: rotate(0deg); transform-origin: 340px 60px; }
                    to { transform: rotate(360deg); transform-origin: 340px 60px; }
                }
                .animate-bounce-slow {
                    animation: float 3s ease-in-out infinite;
                }
                @keyframes float {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-5px); }
                }
            `}</style>
        </section>
    );
}
