"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import Reveal from "./Reveal";
import Image from "next/image";
import Link from "next/link";
import { getImageUrl } from "@/lib/getImageUrl";

interface HeroSectionProps {
    badge?: string;
    heading?: string;
    subheading?: string;
    primaryButtonText?: string;
    secondaryButtonText?: string;
    primaryButtonHref?: string;
    secondaryButtonHref?: string;
    onPrimaryClick?: () => void;
    onSecondaryClick?: () => void;
    className?: string;
}

export default function HeroSection({
    badge,
    heading = "The Art of Sales & Marketing",
    subheading = "Sell with Skill. Market with Ethics. Win in Real Life.",
    primaryButtonText = "Learn About the Course",
    secondaryButtonText = "View Modules",
    primaryButtonHref,
    secondaryButtonHref,
    onPrimaryClick,
    onSecondaryClick,
    className = "",
}: HeroSectionProps) {
    const backgroundImages = [
        getImageUrl("home/hero-slide-1.jpg"),
        getImageUrl("home/hero-slide-2.jpg"),
        getImageUrl("home/audience-bg.jpg"),
    ];

    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentIndex((prevIndex) => (prevIndex + 1) % backgroundImages.length);
        }, 5000); // Change every 5 seconds

        return () => clearInterval(interval);
    }, [backgroundImages.length]);

    return (
        <section
            className={cn(
                "relative w-full min-h-screen flex items-center justify-center overflow-hidden bg-gray-900",
                className
            )}
        >
            {/* Background Images Slider */}
            <div className="absolute inset-0 z-0">
                {backgroundImages.map((image, index) => (
                    <div
                        key={index}
                        className={cn(
                            "absolute inset-0 transition-opacity duration-1000 ease-in-out",
                            index === currentIndex ? "opacity-100" : "opacity-0"
                        )}
                    >
                        <Image
                            src={image}
                            alt={`Background ${index + 1}`}
                            fill
                            priority={index === 0}
                            className="object-cover"
                            sizes="100vw"
                        />
                        {/* Overlay per image to ensure consistent readability */}
                        <div className="absolute inset-0 bg-slate-900/50" />
                    </div>
                ))}
            </div>

            <div className="relative z-10 w-full max-w-5xl mx-auto px-6 lg:px-8 flex flex-col items-center text-center">

                {/* Optional Badge / Top Tagline */}
                {badge && (
                    <Reveal delay={200} className="mb-6">
                        <span className="text-sm md:text-base font-bold text-white uppercase tracking-wider">
                            {badge}
                        </span>
                    </Reveal>
                )}

                {/* Heading */}
                <Reveal delay={400}>
                    <h1 className="no-gradient text-4xl md:text-6xl lg:text-7xl font-bold text-white leading-tight mb-6">
                        {heading}
                    </h1>
                </Reveal>

                {/* Tagline */}
                <Reveal delay={600}>
                    <p className="no-gradient text-xl md:text-2xl font-semibold text-white tracking-wide mb-10">
                        {subheading}
                    </p>
                </Reveal>

                <Reveal delay={800}>
                    <div className="flex flex-col sm:flex-row justify-center gap-4">
                        {primaryButtonHref ? (
                            <Link
                                href={primaryButtonHref}
                                prefetch={true}
                                className="px-8 py-3.5 bg-[#4CAF50] text-white font-bold text-lg rounded-full 
                                    transition-all duration-300 ease-out transform hover:scale-105 active:scale-95
                                    hover:bg-[#43A047] hover:shadow-lg text-center
                                    focus:outline-none focus:ring-2 focus:ring-[#4CAF50] focus:ring-offset-2 focus:ring-offset-gray-900"
                            >
                                {primaryButtonText}
                            </Link>
                        ) : (
                            <button
                                onClick={onPrimaryClick}
                                className="px-8 py-3.5 bg-[#4CAF50] text-white font-bold text-lg rounded-full 
                                    transition-all duration-300 ease-out transform hover:scale-105 active:scale-95
                                    hover:bg-[#43A047] hover:shadow-lg
                                    focus:outline-none focus:ring-2 focus:ring-[#4CAF50] focus:ring-offset-2 focus:ring-offset-gray-900"
                            >
                                {primaryButtonText}
                            </button>
                        )}
                        {secondaryButtonHref ? (
                            <Link
                                href={secondaryButtonHref}
                                prefetch={true}
                                className="px-8 py-3.5 bg-transparent text-white font-bold text-lg rounded-full 
                                    border-2 border-white text-center
                                    transition-all duration-300 ease-out transform hover:scale-105 active:scale-95
                                    hover:bg-white hover:text-gray-900
                                    focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-900"
                            >
                                {secondaryButtonText}
                            </Link>
                        ) : (
                            <button
                                onClick={onSecondaryClick}
                                className="px-8 py-3.5 bg-transparent text-white font-bold text-lg rounded-full 
                                    border-2 border-white
                                    transition-all duration-300 ease-out transform hover:scale-105 active:scale-95
                                    hover:bg-white hover:text-gray-900
                                    focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-900"
                            >
                                {secondaryButtonText}
                            </button>
                        )}
                    </div>
                </Reveal>

            </div>
        </section>
    );
}
