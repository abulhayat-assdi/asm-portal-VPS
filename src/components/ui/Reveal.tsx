"use client";

import { cn } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";

interface RevealProps {
    children: React.ReactNode;
    width?: "fit-content" | "100%";
    delay?: number; // Delay in ms
    duration?: number; // Duration in ms
    threshold?: number; // Intersection threshold (0-1)
    className?: string;
    trigger?: boolean; // Optional manual trigger override
    fullHeight?: boolean; // If true, forces the component to take full height
}

export default function Reveal({
    children,
    width = "fit-content",
    delay = 0,
    duration = 700,
    threshold = 0.2,
    className = "",
    trigger, // If provided, controls visibility externally
    fullHeight = false,
}: RevealProps) {
    const [isVisible, setIsVisible] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // If external trigger is provided, respect it closely but usually we mix it with intersection
        if (trigger !== undefined) {
            setIsVisible(trigger);
            return;
        }

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.disconnect(); // Animate once
                }
            },
            { threshold }
        );

        if (ref.current) {
            observer.observe(ref.current);
        }

        return () => observer.disconnect();
    }, [threshold, trigger]);

    const transitionStyle = {
        transitionDuration: `${duration}ms`,
        transitionDelay: `${delay}ms`,
        transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)", // Standard "Out" easing
    };

    return (
        <div
            ref={ref}
            style={{ width }}
            className={cn(className, fullHeight && "h-full")}
        >
            <div
                style={transitionStyle}
                className={cn(
                    "transition-all will-change-[transform,opacity]",
                    isVisible
                        ? "opacity-100 translate-y-0"
                        : "opacity-0 translate-y-8", // 2rem / 32px slide up
                    fullHeight && "h-full"
                )}
            >
                {children}
            </div>
        </div>
    );
}
