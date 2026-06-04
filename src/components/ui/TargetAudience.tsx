"use client";

import { cn } from "@/lib/utils";
import { useRef, useEffect, useState } from "react";
import Reveal from "./Reveal";
import { getImageUrl } from "@/lib/getImageUrl";
import Image from "next/image";

interface AudienceCard {
    id?: string;
    icon?: React.ReactNode;
    iconKey?: string;
    title: string;
    description: string;
}

interface TargetAudienceProps {
    title: string;
    subtitle: string;
    audiences?: AudienceCard[];
    className?: string;
}

// Icon map — add new keys here to make them available in the admin icon picker
const defaultAudienceIcons: Record<string, React.ReactNode> = {
    students: (
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 10V6C22 4.89543 21.1046 4 20 4H4C2.89543 4 2 4.89543 2 6V10" />
            <path d="M12 12L22 6" />
            <path d="M12 12L2 6" />
            <path d="M12 12V21" />
            <path d="M8 21H16" />
        </svg>
    ),
    jobSeekers: (
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="7" width="20" height="14" rx="2" />
            <path d="M16 7V5C16 3.89543 15.1046 3 14 3H10C8.89543 3 8 3.89543 8 5V7" />
            <path d="M12 12V14" />
            <circle cx="12" cy="14" r="2" />
        </svg>
    ),
    entrepreneurs: (
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
        </svg>
    ),
    ethicalLearners: (
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" />
            <path d="M12 6V12L16 14" />
        </svg>
    ),
    target: (
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <circle cx="12" cy="12" r="6" />
            <circle cx="12" cy="12" r="2" />
        </svg>
    ),
    chart: (
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="20" x2="18" y2="10" />
            <line x1="12" y1="20" x2="12" y2="4" />
            <line x1="6" y1="20" x2="6" y2="14" />
            <line x1="2" y1="20" x2="22" y2="20" />
        </svg>
    ),
    heart: (
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
    ),
    shield: (
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
    ),
    lightbulb: (
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="9" y1="18" x2="15" y2="18" />
            <line x1="10" y1="22" x2="14" y2="22" />
            <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14" />
        </svg>
    ),
    users: (
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
    ),
    rocket: (
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
            <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
            <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
            <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
        </svg>
    ),
    award: (
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="8" r="6" />
            <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
        </svg>
    ),
    check: (
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
    ),
    globe: (
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="2" y1="12" x2="22" y2="12" />
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
    ),
};

export { defaultAudienceIcons };

export default function TargetAudience({
    title,
    subtitle,
    audiences = [],
    className = "",
}: TargetAudienceProps) {
    const [scrollY, setScrollY] = useState(0);
    const sectionRef = useRef<HTMLElement>(null);

    useEffect(() => {
        let ticking = false;
        const handleScroll = () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    if (window.innerWidth > 640 && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
                        setScrollY(window.scrollY);
                    }
                    ticking = false;
                });
                ticking = true;
            }
        };

        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <section
            ref={sectionRef}
            className={cn(
                "relative w-full py-[15px] md:py-[15px] overflow-hidden bg-gradient-to-b from-white to-slate-50",
                className
            )}
        >
            {/* Storytelling Background Layer with Parallax */}
            <div className="absolute inset-0 z-0 select-none pointer-events-none overflow-hidden">
                <div
                    className="absolute inset-0 w-full h-full"
                    style={{ transform: `translateY(${scrollY * 0.05}px)` }}
                >
                    <Image
                        src={getImageUrl("home/audience-bg.jpg")}
                        alt="Professional team collaboration"
                        fill
                        className="object-cover opacity-[0.15]"
                        sizes="100vw"
                    />
                </div>
                <div className="absolute inset-0 bg-gradient-to-b from-white/80 via-transparent to-slate-50/90" />
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8">
                {/* Section Header */}
                <Reveal width="100%">
                    <div className="text-center max-w-3xl mx-auto mb-16 md:mb-20">
                        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-6 tracking-tight">
                            {title}
                        </h2>
                        <p className="text-lg md:text-xl text-transparent bg-clip-text bg-gradient-to-r from-[#374151] to-[#059669] leading-relaxed font-medium">
                            {subtitle}
                        </p>
                    </div>
                </Reveal>

                {/* Cinematic Card Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
                    {audiences.map((card, index) => (
                        <Reveal
                            key={card.id || index}
                            delay={index * 120}
                            fullHeight
                        >
                            <div
                                className={cn(
                                    "group relative bg-white rounded-[2rem] p-8 border border-gray-100 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.05)] overflow-hidden h-full flex flex-col items-center text-center",
                                    "transition-all duration-300 ease-out",
                                    "hover:-translate-y-[6px]"
                                )}
                            >
                                <div className="absolute inset-0 w-full h-full transition-all duration-200 ease-out group-hover:shadow-[0_20px_40px_-5px_rgba(76,175,80,0.15)] rounded-[2rem]" />
                                <div className="absolute top-0 left-0 w-full h-1.5 bg-[#4CAF50] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                                <div className="w-16 h-16 rounded-2xl bg-green-50 flex items-center justify-center text-[#4CAF50] mb-8
                                    transition-transform duration-250 ease-out group-hover:scale-105 group-hover:rotate-2 shadow-sm border border-green-100">
                                    {card.icon || (card.iconKey && defaultAudienceIcons[card.iconKey]) || defaultAudienceIcons["students"]}
                                </div>

                                <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-[#4CAF50] transition-colors duration-250">
                                    {card.title}
                                </h3>

                                <p className="text-gray-500 leading-relaxed group-hover:text-gray-600 transition-colors duration-250">
                                    {card.description}
                                </p>

                                <div className="absolute bottom-0 right-0 w-24 h-24 bg-green-50 rounded-full blur-2xl opacity-0 group-hover:opacity-40 transition-opacity duration-500 translate-x-1/2 translate-y-1/2" />
                            </div>
                        </Reveal>
                    ))}
                </div>
            </div>
        </section>
    );
}
