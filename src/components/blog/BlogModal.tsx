"use client";

import { useEffect, useRef } from "react";
import { type BlogPost } from "@/services/blogService";
import Image from "next/image";

interface BlogModalProps {
    post: BlogPost | null;
    onClose: () => void;
}

export default function BlogModal({ post, onClose }: BlogModalProps) {
    const modalRef = useRef<HTMLDivElement>(null);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        if (post) {
            document.addEventListener("mousedown", handleClickOutside);
            document.body.style.overflow = "hidden"; // Prevent background scrolling
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.body.style.overflow = "unset";
        };
    }, [post, onClose]);

    // Close on Escape key
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                onClose();
            }
        };

        if (post) {
            document.addEventListener("keydown", handleKeyDown);
        }

        return () => {
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [post, onClose]);

    if (!post) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm transition-opacity duration-300">
            <div
                ref={modalRef}
                className="bg-white w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl overflow-y-auto relative animate-in fade-in zoom-in-95 duration-200"
            >
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 bg-white/80 hover:bg-white text-gray-500 hover:text-gray-900 rounded-full transition-colors z-10 backdrop-blur-sm shadow-sm"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                {/* Content */}
                <div className="flex flex-col">
                    {/* Image Header */}
                    <div className="w-full h-64 sm:h-80 relative bg-gray-100">
                        <Image
                            src={post.featuredImage || "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"}
                            alt={post.title}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 100vw, 896px"
                        />
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6 sm:p-8 pt-24 text-white">
                            <span className="inline-block px-3 py-1 bg-[#059669] text-xs font-semibold uppercase tracking-wider rounded-full mb-3">
                                {post.category || "Article"}
                            </span>
                            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold leading-tight text-white mb-2 shadow-sm">
                                {post.title}
                            </h2>
                            <div className="flex items-center gap-2 text-sm text-gray-200 font-medium">
                                <span>{Math.ceil((post.content?.split(' ').length || 0) / 200)} min read</span>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 sm:p-8 md:p-10">
                        {/* Body */}
                        <div
                            className="prose prose-lg max-w-none prose-headings:text-[#1f2937] prose-p:text-[#4b5563] prose-a:text-[#059669]"
                            dangerouslySetInnerHTML={{ __html: post.content }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
