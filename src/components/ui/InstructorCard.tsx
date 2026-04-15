"use client";

import { useState } from "react";
import Image from "next/image";

interface InstructorCardProps {
    name: string;
    role: string;
    description: string;
    email: string;
    image?: string;
}

export default function InstructorCard({ name, role, description, email, image }: InstructorCardProps) {
    const [expanded, setExpanded] = useState(false);
    const [copied, setCopied] = useState(false);

    const isBioShort = description === "Bio will be updated soon.";
    const cleanRole = role
        .replace(" (Academic)", "")
        .replace(" (Executive)", "")
        .replace(" (Administrative)", "").trim();


    const handleCopy = () => {
        navigator.clipboard.writeText(email);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    };

    // Helper to get direct image URL from Google Drive link
    const getThumbnailUrl = (url: string) => {
        if (url && url.includes("drive.google.com") && url.includes("/d/")) {
            const id = url.split("/d/")[1].split("/")[0];
            return `https://drive.google.com/thumbnail?id=${id}&sz=w1000`;
        }
        return url;
    };

    return (
        <div className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 overflow-hidden flex flex-col">

            {/* Top section */}
            <div className="flex flex-col items-center pt-8 pb-5 px-6">

                {/* Avatar */}
                <div className="mb-5">
                    <div className="relative w-24 h-24 rounded-full border-4 border-white shadow-lg ring-2 ring-emerald-100 group-hover:ring-emerald-200 transition-all duration-300 overflow-hidden flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-100">
                        {image ? (
                            <Image
                                src={getThumbnailUrl(image)}
                                alt={name}
                                fill
                                className="object-cover object-top"
                                sizes="96px"
                            />
                        ) : (
                            <svg className="w-12 h-12 text-[#059669]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                <circle cx="12" cy="7" r="4" />
                            </svg>
                        )}
                    </div>
                </div>

                {/* Name */}
                <h3 className="text-2xl font-extrabold text-[#059669] text-center mt-1 mb-1.5 leading-snug tracking-tight group-hover:text-[#047857] transition-colors duration-200">
                    {name}
                </h3>

                {/* Designation badge */}
                <span className="inline-block text-xs font-bold tracking-widest uppercase px-4 py-1.5 rounded-lg border-2 bg-emerald-50 text-emerald-700 border-emerald-200 text-center mb-1">
                    {cleanRole}
                </span>
            </div>

            {/* Divider */}
            <div className="mx-5 border-t border-gray-100" />

            {/* Bio */}
            <div className="px-6 py-5 flex-1">
                <p className={`text-sm text-gray-500 italic leading-relaxed transition-all duration-300 ${!expanded && !isBioShort ? "line-clamp-4" : ""
                    }`}>
                    &ldquo;{description}&rdquo;
                </p>
                {!isBioShort && (
                    <button
                        onClick={() => setExpanded(!expanded)}
                        className="mt-2.5 text-[#059669] text-sm font-semibold flex items-center gap-1 hover:underline focus:outline-none"
                    >
                        {expanded ? "See Less" : "See More"}
                        <svg
                            className={`w-4 h-4 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
                            fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>
                )}
            </div>

            {/* Divider */}
            <div className="mx-5 border-t border-gray-100" />

            {/* Email row */}
            <div className="px-5 py-4">
                <div className="flex items-center justify-between gap-3 bg-gray-50 rounded-xl px-4 py-3 group/email hover:bg-emerald-50 transition-colors duration-200">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <svg className="w-5 h-5 text-[#059669] flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0l-9.75 6.75L2.25 6.75" />
                        </svg>
                        <a
                            href={`mailto:${email}`}
                            className="text-sm font-medium text-gray-600 hover:text-[#059669] truncate transition-colors duration-200"
                        >
                            {email}
                        </a>
                    </div>
                    <button
                        onClick={handleCopy}
                        title="Copy email"
                        className="flex-shrink-0 text-gray-400 hover:text-[#059669] transition-colors duration-200"
                    >
                        {copied ? (
                            <svg className="w-5 h-5 text-[#059669]" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                        ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.637c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
                            </svg>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
