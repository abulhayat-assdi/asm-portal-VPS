"use client";

import { useState, useEffect, useRef } from "react";

interface ImageLightboxProps {
    src: string;
    alt: string;
    onClose: () => void;
}

export default function ImageLightbox({ src, alt, onClose }: ImageLightboxProps) {
    const [scale, setScale] = useState(1);
    const containerRef = useRef<HTMLDivElement>(null);

    // Close on Escape, Zoom on +/-
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                onClose();
            } else if (e.key === "+" || e.key === "=") {
                handleZoomIn();
            } else if (e.key === "-") {
                handleZoomOut();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        // Lock body scroll
        document.body.style.overflow = "hidden";

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
            document.body.style.overflow = "";
        };
    }, [onClose]);

    const handleZoomIn = () => {
        setScale(s => Math.min(s + 0.25, 4));
    };

    const handleZoomOut = () => {
        setScale(s => Math.max(s - 0.25, 0.5));
    };

    const handleReset = () => {
        setScale(1);
    };

    return (
        <div 
            className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4 select-none"
            onClick={onClose}
        >
            {/* Header controls */}
            <div className="absolute top-4 right-4 z-50 flex items-center gap-4">
                <button
                    onClick={onClose}
                    className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all border border-white/10 hover:scale-105 active:scale-95 shadow-lg"
                    title="Close (Esc)"
                >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            {/* Image Container with Scrollbar support */}
            <div 
                ref={containerRef}
                className="w-full max-w-[95vw] max-h-[80vh] overflow-auto flex items-center justify-center p-8 bg-neutral-900/40 rounded-2xl border border-white/5 backdrop-blur-sm"
                onClick={e => e.stopPropagation()}
            >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src={src}
                    alt={alt}
                    style={{
                        transform: `scale(${scale})`,
                        transformOrigin: "center center",
                        transition: "transform 0.15s cubic-bezier(0.4, 0, 0.2, 1)",
                        cursor: scale > 1 ? "grab" : "zoom-in"
                    }}
                    draggable={false}
                    className="max-w-full max-h-[70vh] object-contain shadow-2xl rounded-lg"
                />
            </div>

            {/* Bottom Floating Control Bar */}
            <div 
                className="mt-6 flex items-center gap-4 px-6 py-3 bg-white/10 backdrop-blur-lg rounded-full border border-white/10 shadow-xl z-50"
                onClick={e => e.stopPropagation()}
            >
                <button 
                    onClick={handleZoomOut} 
                    className="text-white hover:text-emerald-400 p-2 transition-colors font-bold text-lg"
                    title="Zoom Out (-)"
                >
                    ➖
                </button>
                <span className="text-white text-sm font-semibold min-w-[60px] text-center">
                    {Math.round(scale * 100)}%
                </span>
                <button 
                    onClick={handleZoomIn} 
                    className="text-white hover:text-emerald-400 p-2 transition-colors font-bold text-lg"
                    title="Zoom In (+)"
                >
                    ➕
                </button>
                <div className="w-[1px] h-5 bg-white/20"></div>
                <button 
                    onClick={handleReset} 
                    className="text-white hover:text-emerald-400 px-3 py-1 text-xs font-semibold rounded bg-white/5 hover:bg-white/15 transition-all"
                    title="Reset Zoom"
                >
                    Reset
                </button>
            </div>
        </div>
    );
}
