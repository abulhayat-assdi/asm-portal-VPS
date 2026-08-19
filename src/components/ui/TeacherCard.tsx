"use client";

import { useState } from "react";
import Card, { CardBody } from "./Card";
import { Teacher } from "@/services/teacherService";
import Image from "next/image";

interface TeacherCardProps {
    teacher: Teacher;
    onEdit?: (teacher: Teacher) => void;
    onDelete?: (teacher: Teacher) => void;
    isAdmin?: boolean;
    onPhotoUpdated?: () => void;
}

export default function TeacherCard({ teacher, onEdit, onDelete, isAdmin, onPhotoUpdated }: TeacherCardProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [imgError, setImgError] = useState(false);
    const [photoUploading, setPhotoUploading] = useState(false);
    const [localImageUrl, setLocalImageUrl] = useState<string | null>(null);

    // Position editor state
    const [positionMode, setPositionMode] = useState(false);
    const [localPosition, setLocalPosition] = useState<string>(teacher.imageObjectPosition || "center");
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [dragStartPos, setDragStartPos] = useState({ x: 50, y: 50 });
    const [positionSaving, setPositionSaving] = useState(false);

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
    };

    const parsePosition = (pos: string): { x: number; y: number } => {
        if (!pos || pos === "center") return { x: 50, y: 50 };
        const parts = pos.trim().split(/\s+/);
        const x = parseFloat(parts[0]) || 50;
        const y = parseFloat(parts[1] ?? parts[0]) || 50;
        return { x, y };
    };

    const handleDirectPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setPhotoUploading(true);
        try {
            const fd = new FormData();
            fd.append("file", file);
            const uploadRes = await fetch("/api/upload", { method: "POST", body: fd });
            if (!uploadRes.ok) throw new Error("Upload failed");
            const { url } = await uploadRes.json();

            const patchRes = await fetch("/api/teachers", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: teacher.id, profileImageUrl: url }),
            });
            if (!patchRes.ok) {
                const err = await patchRes.json();
                throw new Error(err.error || "Save failed");
            }
            setLocalImageUrl(url);
            setImgError(false);
            if (onPhotoUpdated) onPhotoUpdated();
        } catch (err) {
            alert(err instanceof Error ? err.message : "Photo update failed");
        } finally {
            setPhotoUploading(false);
        }
    };

    // ── Drag handlers for position editor ──────────────────────
    const handlePosDragStart = (e: React.MouseEvent | React.TouchEvent) => {
        e.preventDefault();
        setIsDragging(true);
        const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
        const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
        setDragStart({ x: clientX, y: clientY });
        setDragStartPos(parsePosition(localPosition));
    };

    const handlePosDragMove = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDragging) return;
        e.preventDefault();
        const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
        const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
        const sensitivity = 0.5; // % per pixel
        // drag-image metaphor: drag down → reveals top (Y decreases)
        const newX = Math.min(100, Math.max(0, dragStartPos.x - (clientX - dragStart.x) * sensitivity));
        const newY = Math.min(100, Math.max(0, dragStartPos.y - (clientY - dragStart.y) * sensitivity));
        setLocalPosition(`${Math.round(newX)}% ${Math.round(newY)}%`);
    };

    const handlePosDragEnd = () => setIsDragging(false);

    const savePosition = async () => {
        setPositionSaving(true);
        try {
            const res = await fetch("/api/teachers", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: teacher.id, imageObjectPosition: localPosition }),
            });
            if (!res.ok) throw new Error((await res.json()).error || "Save failed");
            setPositionMode(false);
            if (onPhotoUpdated) onPhotoUpdated();
        } catch (err) {
            alert(err instanceof Error ? err.message : "Position save failed");
        } finally {
            setPositionSaving(false);
        }
    };

    const openPositionEditor = () => {
        setLocalPosition(teacher.imageObjectPosition || "center");
        setPositionMode(true);
    };

    const getImageUrl = (url: string) => {
        if (!url) return url;
        if (url.startsWith("http") || url.startsWith("data:") || url.startsWith("/api/") || url.startsWith("api/")) {
            return url.startsWith("api/") ? `/${url}` : url;
        }
        if (url.includes("drive.google.com") && url.includes("/d/")) {
            const id = url.split("/d/")[1].split("/")[0];
            return `https://drive.google.com/thumbnail?id=${id}&sz=w1000`;
        }
        // Local upload: serve via API route (same process.cwd() as upload API)
        const p = url.startsWith("/") ? url.slice(1) : url;
        return `/api/serve-image?p=${encodeURIComponent(p)}`;
    };

    return (
        <>
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
                {/* Profile Image - Circle with admin hover-upload overlay */}
                <div className="relative w-24 h-24 mb-4 group/photo">
                    {/* Circle container — needs relative for fill Image */}
                    <div className="relative w-full h-full rounded-full overflow-hidden shadow-sm border-4 border-white ring-1 ring-gray-100">
                        {(localImageUrl || teacher.profileImageUrl) && !imgError ? (
                            <Image
                                src={getImageUrl(localImageUrl || teacher.profileImageUrl!)}
                                alt={teacher.name}
                                fill
                                className="object-cover"
                                sizes="96px"
                                unoptimized
                                style={{ objectPosition: localPosition }}
                                onError={() => setImgError(true)}
                            />
                        ) : (
                            <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400">
                                <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                </svg>
                            </div>
                        )}
                    </div>
                    {/* Hover overlay — camera + position icons (admin only) */}
                    {isAdmin && (
                        <div className="absolute inset-0 rounded-full flex items-center justify-center gap-2 bg-black/50 opacity-0 group-hover/photo:opacity-100 transition-opacity">
                            {photoUploading ? (
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <>
                                    {/* Camera — upload new photo */}
                                    <label className="cursor-pointer" title="নতুন ছবি আপলোড">
                                        <svg className="w-6 h-6 text-white hover:text-emerald-300 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                        <input type="file" accept="image/*" className="hidden" onChange={handleDirectPhotoUpload} disabled={photoUploading} />
                                    </label>
                                    {/* Position adjust icon */}
                                    {(localImageUrl || teacher.profileImageUrl) && (
                                        <button onClick={openPositionEditor} title="অবস্থান ঠিক করুন" className="cursor-pointer">
                                            <svg className="w-6 h-6 text-white hover:text-yellow-300 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                                            </svg>
                                        </button>
                                    )}
                                </>
                            )}
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

        {/* Position editor modal — rendered outside Card so it can use fixed positioning */}
        {/* Position editor modal */}
        {positionMode && (
            <div
                className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
                onClick={(e) => { if (e.target === e.currentTarget) setPositionMode(false); }}
            >
                <div className="bg-white rounded-2xl p-5 shadow-2xl w-72">
                    <h3 className="text-sm font-bold text-gray-800 mb-0.5">ছবির অবস্থান ঠিক করুন</h3>
                    <p className="text-xs text-gray-400 mb-4">ছবিতে drag করে মুখ/মাথা সার্কেলে আনুন</p>

                    {/* Large draggable preview */}
                    <div className="flex justify-center mb-4">
                        <div
                            className={`relative w-48 h-48 rounded-full overflow-hidden border-4 border-emerald-400 select-none ${isDragging ? "cursor-grabbing" : "cursor-grab"}`}
                            onMouseDown={handlePosDragStart}
                            onMouseMove={handlePosDragMove}
                            onMouseUp={handlePosDragEnd}
                            onMouseLeave={handlePosDragEnd}
                            onTouchStart={handlePosDragStart}
                            onTouchMove={handlePosDragMove}
                            onTouchEnd={handlePosDragEnd}
                        >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={getImageUrl(localImageUrl || teacher.profileImageUrl || "")}
                                alt=""
                                className="w-full h-full object-cover pointer-events-none"
                                style={{ objectPosition: localPosition }}
                                draggable={false}
                            />
                            {!isDragging && (
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <svg className="w-10 h-10 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                                    </svg>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 9-position quick preset grid */}
                    <div className="grid grid-cols-3 gap-1.5 mb-4">
                        {([
                            ["↖", "0% 0%"],   ["↑", "50% 0%"],   ["↗", "100% 0%"],
                            ["←", "0% 50%"],  ["•", "50% 50%"],  ["→", "100% 50%"],
                            ["↙", "0% 100%"], ["↓", "50% 100%"], ["↘", "100% 100%"],
                        ] as [string, string][]).map(([label, pos]) => (
                            <button
                                key={pos}
                                onClick={() => setLocalPosition(pos)}
                                className={`py-1.5 text-sm rounded-lg border transition-colors ${localPosition === pos ? "bg-emerald-500 text-white border-emerald-500" : "border-gray-200 hover:border-emerald-300 hover:bg-emerald-50 text-gray-600"}`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={() => setPositionMode(false)}
                            className="flex-1 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
                        >
                            বাতিল
                        </button>
                        <button
                            onClick={savePosition}
                            disabled={positionSaving}
                            className="flex-1 py-2 bg-emerald-500 text-white rounded-lg text-sm font-semibold hover:bg-emerald-600 disabled:opacity-50"
                        >
                            {positionSaving ? "..." : "Save"}
                        </button>
                    </div>
                </div>
            </div>
        )}
        </>
    );
}
