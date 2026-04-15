"use client";

import { useState } from "react";
import Card, { CardBody } from "./Card";
import { Teacher } from "@/services/teacherService";
import Image from "next/image";

interface TeacherCardProps {
    teacher: Teacher;
    onEdit?: (teacher: Teacher) => void;
    onDelete?: (teacher: Teacher) => void;
}

export default function TeacherCard({ teacher, onEdit, onDelete }: TeacherCardProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
    };

    // Helper to get direct image URL from Google Drive link
    const getImageUrl = (url: string) => {
        if (url && url.includes("drive.google.com") && url.includes("/d/")) {
            const id = url.split("/d/")[1].split("/")[0];
            return `https://drive.google.com/thumbnail?id=${id}&sz=w1000`;
        }
        return url;
    };

    return (
        <Card className="h-full relative hover:shadow-lg transition-shadow bg-white rounded-xl border border-gray-100">
            {/* Edit/Delete Buttons - Top Right */}
            {(onEdit || onDelete) && (
                <div className="absolute top-3 right-3 flex gap-1">
                    {onEdit && (
                        <button
                            onClick={() => onEdit(teacher)}
                            className="p-2 text-gray-400 hover:text-[#059669] hover:bg-gray-100 rounded-lg transition-colors"
                            title="Edit Teacher"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                        </button>
                    )}
                    {onDelete && (
                        <button
                            onClick={() => onDelete(teacher)}
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete Teacher"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                    )}
                </div>
            )}

            <CardBody className="flex flex-col items-center text-center p-6">
                {/* Profile Image - Simple Circle with Border */}
                <div className="relative w-24 h-24 rounded-full overflow-hidden shadow-sm mb-4 border-4 border-white ring-1 ring-gray-100">
                    {teacher.profileImageUrl ? (
                        <Image
                            src={getImageUrl(teacher.profileImageUrl)}
                            alt={teacher.name}
                            fill
                            className="object-cover"
                            sizes="96px"
                        />
                    ) : (
                        <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400">
                            <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                            </svg>
                        </div>
                    )}
                </div>

                {/* ID Badge - Dark Pill */}
                <div className="mb-2">
                    <span className="bg-[#1f2937] text-white text-xs font-bold px-3 py-1 rounded-full">
                        ID: {teacher.teacherId}
                    </span>
                </div>

                {/* Name */}
                <h3 className="text-xl font-extrabold text-[#111827] mb-1">
                    {teacher.name}
                </h3>

                {/* Designation */}
                <p className="text-sm font-medium text-[#6b7280] mb-3">
                    {teacher.designation}
                </p>

                {/* Role Badge - Light Blue - shown for everyone as ACADEMIC unless Admin */}
                <div className="mb-6">
                    <span className="bg-[#e0f2fe] text-[#0284c7] text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wide">
                        {teacher.isAdmin ? "ADMIN" : "ACADEMIC"}
                    </span>
                </div>

                {/* About Section - Italicized */}
                <div className="w-full mb-6 border-b border-gray-200 pb-6">
                    <div className="text-sm text-[#4b5563] text-center italic leading-relaxed px-2">
                        <p className={`${!isExpanded ? 'line-clamp-3' : ''}`}>
                            &quot;{teacher.about || "No details available."}&quot;
                        </p>
                        {teacher.about && teacher.about.length > 100 && (
                            <div className="text-center mt-2">
                                <button
                                    onClick={() => setIsExpanded(!isExpanded)}
                                    className="text-[#059669] hover:text-[#047857] text-sm font-bold flex items-center justify-center gap-1 mx-auto"
                                >
                                    {isExpanded ? (
                                        <>See Less <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M14.77 12.79a.75.75 0 01-1.06-.02L10 8.832 6.29 12.77a.75.75 0 11-1.08-1.04l4.25-4.5a.75.75 0 011.08 0l4.25 4.5a.75.75 0 01-.02 1.06z" clipRule="evenodd" /></svg></>
                                    ) : (
                                        <>See More <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" /></svg></>
                                    )}
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Contact Information */}
                <div className="w-full space-y-3">
                    {/* Phone - White box with border */}
                    <div className="flex items-center gap-3 px-4 py-3 bg-white border border-[#e5e7eb] rounded-lg group hover:border-[#059669] transition-colors relative">
                        <div className="flex-shrink-0 text-[#059669]">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                            </svg>
                        </div>
                        <span className="text-sm text-[#111827] flex-1 text-left font-bold">
                            {teacher.phone || 'N/A'}
                        </span>
                        {teacher.phone && (
                            <button
                                onClick={() => copyToClipboard(teacher.phone)}
                                className="text-[#9ca3af] hover:text-[#059669] transition-colors"
                                title="Copy phone"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                            </button>
                        )}
                    </div>

                    {/* Email - White box with border */}
                    <div className="flex items-center gap-3 px-4 py-3 bg-white border border-[#e5e7eb] rounded-lg group hover:border-[#059669] transition-colors relative">
                        <div className="flex-shrink-0 text-[#059669]">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                            </svg>
                        </div>
                        <span className="text-sm text-[#111827] flex-1 text-left truncate font-bold">
                            {teacher.email || 'N/A'}
                        </span>
                        {teacher.email && (
                            <button
                                onClick={() => copyToClipboard(teacher.email)}
                                className="text-[#9ca3af] hover:text-[#059669] transition-colors"
                                title="Copy email"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                            </button>
                        )}
                    </div>
                </div>
            </CardBody>
        </Card>
    );
}
