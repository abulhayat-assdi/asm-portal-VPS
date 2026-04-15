"use client";

import { cn } from "@/lib/utils";

interface HighlightCard {
    icon: React.ReactNode;
    title: string;
    description: string;
}

interface CourseOverviewProps {
    title: string;
    subtitle: string;
    highlights: HighlightCard[];
    className?: string;
}

// Default icons for the highlight cards
const defaultIcons = {
    sales: (
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2L15 8L22 9L17 14L18 21L12 18L6 21L7 14L2 9L9 8L12 2Z" />
        </svg>
    ),
    marketing: (
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 16V8C21 6.89543 20.1046 6 19 6H5C3.89543 6 3 6.89543 3 8V16C3 17.1046 3.89543 18 5 18H19C20.1046 18 21 17.1046 21 16Z" />
            <path d="M7 10L12 13L17 10" />
        </svg>
    ),
    career: (
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 20V10" />
            <path d="M18 20V4" />
            <path d="M6 20V16" />
        </svg>
    ),
    ethics: (
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" />
            <path d="M9 12L11 14L15 10" />
        </svg>
    ),
};

export default function CourseOverview({
    title,
    subtitle,
    highlights,
    className = "",
}: CourseOverviewProps) {
    return (
        <section
            className={cn(
                "w-full bg-white py-[15px] md:py-[15px]",
                className
            )}
        >
            <div className="max-w-7xl mx-auto px-6 lg:px-8">
                {/* Section Header */}
                <div className="text-center max-w-3xl mx-auto mb-12 md:mb-16">
                    <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-[#1f2937] mb-4">
                        {title}
                    </h2>
                    <p className="text-base md:text-lg text-transparent bg-clip-text bg-gradient-to-r from-[#374151] to-[#059669] leading-relaxed font-medium">
                        {subtitle}
                    </p>
                </div>

                {/* Highlight Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {highlights.map((card, index) => (
                        <div
                            key={index}
                            className="bg-white rounded-2xl p-6 border border-[#e5e7eb] shadow-sm
                                transition-shadow duration-200 ease-out
                                hover:shadow-md"
                        >
                            {/* Icon */}
                            <div className="w-14 h-14 rounded-xl bg-[#f0fdf4] flex items-center justify-center text-[#059669] mb-4">
                                {card.icon}
                            </div>

                            {/* Title */}
                            <h3 className="text-lg font-semibold text-[#1f2937] mb-2">
                                {card.title}
                            </h3>

                            {/* Description */}
                            <p className="text-sm text-[#6b7280] leading-relaxed">
                                {card.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

// Export default icons for easy usage
export { defaultIcons };
