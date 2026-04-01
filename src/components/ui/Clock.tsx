"use client";

import { useState, useEffect } from "react";

export default function Clock() {
    const [currentTime, setCurrentTime] = useState<Date | null>(null);

    useEffect(() => {
        // Set initial time
        setCurrentTime(new Date());
        
        // Update time every second
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    if (!currentTime) return null; // Prevent hydration mismatch by returning null initially on server

    const formatDateTime = (date: Date) => {
        return date.toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric"
        });
    };

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit"
        });
    };

    return (
        <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-6 mt-8">
            <div className="glassmorphic-pill flex items-center gap-3 px-6 py-3 min-w-full md:min-w-[280px] justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 md:w-8 h-8">
                    <path fillRule="evenodd" d="M6.75 2.25A.75.75 0 017.5 3v1.5h9V3A.75.75 0 0118 2.25h.75a3 3 0 013 3v11.25a3 3 0 01-3 3H5.25a3 3 0 01-3-3V5.25a3 3 0 013-3h.75zM5.25 9h13.5v9.75a1.5 1.5 0 01-1.5 1.5H6.75a1.5 1.5 0 01-1.5-1.5V9zm1.5 2.25a.75.75 0 00-1.5 0v1.5a.75.75 0 001.5 0v-1.5zm3 0a.75.75 0 00-1.5 0v1.5a.75.75 0 001.5 0v-1.5zm3 0a.75.75 0 00-1.5 0v1.5a.75.75 0 001.5 0v-1.5zm3 0a.75.75 0 00-1.5 0v1.5a.75.75 0 001.5 0v-1.5zm-9 3a.75.75 0 00-1.5 0v1.5a.75.75 0 001.5 0v-1.5zm3 0a.75.75 0 00-1.5 0v1.5a.75.75 0 001.5 0v-1.5zm3 0a.75.75 0 00-1.5 0v1.5a.75.75 0 001.5 0v-1.5zm3 0a.75.75 0 00-1.5 0v1.5a.75.75 0 001.5 0v-1.5z" clipRule="evenodd" />
                </svg>
                <span className="text-lg md:text-xl font-bold tracking-wide">
                    {formatDateTime(currentTime)}
                </span>
            </div>
            <div className="glassmorphic-pill flex items-center gap-3 px-6 py-3 min-w-full md:min-w-[200px] justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 md:w-8 h-8">
                    <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25ZM12.75 6a.75.75 0 0 0-1.5 0v6c0 .414.336.75.75.75h4.5a.75.75 0 0 0 0-1.5h-3.75V6Z" clipRule="evenodd" />
                </svg>
                <span className="text-lg md:text-xl font-bold tracking-wide">
                    {formatTime(currentTime)}
                </span>
            </div>
        </div>
    );
}
