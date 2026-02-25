"use client";

import { cn } from "@/lib/utils";
import { useRef, useEffect, useState } from "react";
import Reveal from "./Reveal";

interface AudienceCard {
    icon: React.ReactNode;
    title: string;
    description: string;
}

interface TargetAudienceProps {
    title: string;
    subtitle: string;
    audiences: AudienceCard[];
    className?: string;
}

// Default icons for audience cards
const defaultAudienceIcons = {
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
};

export default function TargetAudience({
    title,
    subtitle,
    audiences,
    className = "",
}: TargetAudienceProps) {
    const [scrollY, setScrollY] = useState(0);
    const sectionRef = useRef<HTMLElement>(null);

    useEffect(() => {
        // Parallax logic - disable on mobile/reduced motion
        const handleScroll = () => {
            if (window.innerWidth > 640 && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
                setScrollY(window.scrollY);
            }
        };

        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <section
            ref={sectionRef}
            className={cn(
                "relative w-full py-24 md:py-32 overflow-hidden bg-gradient-to-b from-white to-slate-50",
                className
            )}
        >
            {/* Storytelling Background Layer with Parallax */}
            <div className="absolute inset-0 z-0 select-none pointer-events-none overflow-hidden">
                <div
                    className="absolute inset-0 w-full h-full"
                    style={{ transform: `translateY(${scrollY * 0.05}px)` }} // Slow parallax
                >
                    <img
                        src="/images/home/audience-bg.jpg"
                        alt="Professional team collaboration"
                        className="w-full h-[120%] object-cover opacity-[0.15]"
                    />
                </div>
                {/* Gradient overlay blended with section background */}
                <div className="absolute inset-0 bg-gradient-to-b from-white/80 via-transparent to-slate-50/90" />
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8">
                {/* Section Header */}
                <Reveal width="100%">
                    <div className="text-center max-w-3xl mx-auto mb-16 md:mb-20">
                        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-6 tracking-tight">
                            {title}
                        </h2>
                        <p className="text-lg md:text-xl text-gray-600 leading-relaxed font-medium">
                            {subtitle}
                        </p>
                    </div>
                </Reveal>

                {/* Cinematic Card Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
                    {audiences.map((card, index) => (
                        <Reveal
                            key={index}
                            delay={index * 120} // Staggered delay
                            fullHeight
                        >
                            <div
                                className={cn(
                                    "group relative bg-white rounded-[2rem] p-8 border border-gray-100 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.05)] overflow-hidden h-full flex flex-col items-center text-center",
                                    "transition-all duration-300 ease-out", // Hover transition only
                                    "hover:-translate-y-[6px]" // Hover lift
                                )}
                            >
                                {/* Hover Interaction Layer (Separate from entrance transition) */}
                                <div className="absolute inset-0 w-full h-full transition-all duration-200 ease-out group-hover:shadow-[0_20px_40px_-5px_rgba(76,175,80,0.15)] rounded-[2rem]" />

                                {/* Top Green Accent Line */}
                                <div className="absolute top-0 left-0 w-full h-1.5 bg-[#4CAF50] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                                {/* Icon Container */}
                                <div className="w-16 h-16 rounded-2xl bg-green-50 flex items-center justify-center text-[#4CAF50] mb-8
                                    transition-transform duration-250 ease-out group-hover:scale-105 group-hover:rotate-2 shadow-sm border border-green-100">
                                    {card.icon}
                                </div>

                                {/* Content */}
                                <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-[#4CAF50] transition-colors duration-250">
                                    {card.title}
                                </h3>

                                <p className="text-gray-500 leading-relaxed group-hover:text-gray-600 transition-colors duration-250">
                                    {card.description}
                                </p>

                                {/* Subtle Decor at bottom of card */}
                                <div className="absolute bottom-0 right-0 w-24 h-24 bg-green-50 rounded-full blur-2xl opacity-0 group-hover:opacity-40 transition-opacity duration-500 translate-x-1/2 translate-y-1/2" />
                            </div>
                        </Reveal>
                    ))}
                </div>
            </div>
        </section>
    );
}

// Export default icons for easy usage
export { defaultAudienceIcons };
