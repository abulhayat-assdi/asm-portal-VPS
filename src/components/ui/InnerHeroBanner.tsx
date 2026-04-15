"use client";

import Reveal from "./Reveal";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface InnerHeroBannerProps {
    heading: string;
    subheading?: string;
    bgImageUrl: string;
    className?: string;
    overlayClassName?: string;
}

export default function InnerHeroBanner({
    heading,
    subheading,
    bgImageUrl,
    className = "",
    overlayClassName = "bg-slate-900/70", // darker overlay by default to ensure text readability
}: InnerHeroBannerProps) {
    return (
        <section
            className={cn(
                "relative w-full h-[350px] md:h-[450px] flex items-center justify-center overflow-hidden bg-gray-900 mt-0",
                className
            )}
        >
            {/* Background Image */}
            <div className="absolute inset-0 z-0">
                <Image
                    src={bgImageUrl}
                    alt={heading}
                    fill
                    priority
                    className="object-cover"
                    sizes="100vw"
                />
                {/* Overlay */}
                <div className={cn("absolute inset-0", overlayClassName)} />
            </div>

            <div className="relative z-10 w-full max-w-5xl mx-auto px-6 lg:px-8 flex flex-col items-center text-center mt-12 md:mt-16">
                {/* Heading */}
                <Reveal delay={200}>
                    <h1 className="text-3xl md:text-5xl font-bold text-white leading-tight mb-4 drop-shadow-sm">
                        {heading}
                    </h1>
                </Reveal>

                {/* Optional Subheading */}
                {subheading && (
                    <Reveal delay={400}>
                        <p className="text-lg md:text-xl font-medium text-gray-200 tracking-wide max-w-2xl mx-auto drop-shadow-sm">
                            {subheading}
                        </p>
                    </Reveal>
                )}
            </div>

            {/* Bottom gradient fade into the page background */}
            <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-gray-50 to-transparent z-10 pointer-events-none" />
        </section>
    );
}
