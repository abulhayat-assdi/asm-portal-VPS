"use client";

import { useState } from "react";
import { type BlogPost } from "@/services/blogService";
import Link from "next/link";
import Image from "next/image";

interface BlogListProps {
    posts: BlogPost[];
}

// Separate component to manage per-card image error state
function BlogCard({ post, priority = false }: { post: BlogPost; priority?: boolean }) {
    const [imgError, setImgError] = useState(false);

    const handleShare = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        const url = `${window.location.origin}/blog/${post.slug}`;
        if (navigator.share) {
            try {
                await navigator.share({
                    title: post.title,
                    text: post.excerpt,
                    url: url,
                });
            } catch (err) {
                console.error("Error sharing", err);
            }
        } else {
            navigator.clipboard.writeText(url);
            alert("Link copied to clipboard!");
        }
    };

    return (
        <Link
            href={`/blog/${post.slug}`}
            className="bg-white rounded-2xl overflow-hidden border border-[#e5e7eb] shadow-sm hover:shadow-md transition-shadow duration-200 cursor-pointer group flex flex-col"
        >
            {/* Featured Image */}
            <div className="w-full h-48 bg-gray-100 relative overflow-hidden shrink-0">
                {!imgError && post.featuredImage ? (
                    <Image
                        src={post.featuredImage}
                        alt={post.title}
                        fill
                        priority={priority}
                        placeholder="blur"
                        blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAGCAYAAAD68A/GAAAApElEQVQoU2NkYGD4z8BQz0AJYAQqVGdk+M9AJWBkZPxPjUJGRkZGKioqjIyMTExMtLS0tLCwsLCwsLCwsLAwMDAwMDAwMjIyMjIyMjKysrK0tLS0tbW1tbW1taurq6urq6urq8vLy8vLy8vLy8vr6+vr6+vr6+tHR0dHR0dHR0dLS0tLS0tLCwsLCwsLCk5OTk5OTk5OTjIyMjIyMjIyMgA"
                        className="object-cover transform group-hover:scale-105 transition-transform duration-300"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        onError={() => setImgError(true)}
                    />
                ) : (
                    // Elegant fallback placeholder
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 to-teal-100 flex flex-col items-center justify-center gap-2">
                        <svg className="w-10 h-10 text-emerald-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="text-xs text-emerald-400 font-medium">{post.category || "Article"}</span>
                    </div>
                )}
            </div>
            <div className="p-6 flex flex-col flex-1">
                <span className="text-xs font-medium text-[#059669] uppercase tracking-wide">
                    {post.category || "Article"}
                </span>
                <h3 className="text-lg font-semibold text-[#1f2937] mt-2 mb-3 line-clamp-2 group-hover:text-[#059669] transition-colors">
                    {post.title}
                </h3>
                <p className="text-sm text-[#6b7280] leading-relaxed line-clamp-3 mb-6 flex-1">
                    {post.excerpt}
                </p>

                {/* Footer inside the card */}
                <div className="flex items-center justify-between border-t border-gray-100 pt-4 mt-auto">
                    <span className="text-sm font-medium text-[#059669] inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                        Read Article <span>→</span>
                    </span>

                    <button
                        onClick={(e) => handleShare(e)}
                        className="p-2 text-gray-400 hover:text-[#059669] hover:bg-emerald-50 rounded-full transition-colors z-10"
                        title="Share this article"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                        </svg>
                    </button>
                </div>
            </div>
        </Link>
    );
}

export default function BlogList({ posts }: BlogListProps) {
    const [activeCategory, setActiveCategory] = useState<string>("All");

    const categories = ["All", "Article", "Project Presentation", "Practical Learning"];

    const filteredPosts = posts.filter(post => {
        if (activeCategory === "All") return true;
        const postCategory = post.category || "Article";
        return postCategory === activeCategory;
    });

    return (
        <>
            {/* Category Menubar */}
            <div className="flex flex-wrap justify-center gap-2 md:gap-4 mb-10">
                {categories.map((category) => (
                    <button
                        key={category}
                        onClick={() => setActiveCategory(category)}
                        className={`px-5 py-2.5 rounded-full text-sm md:text-base font-medium transition-all duration-200 ${activeCategory === category
                            ? "bg-[#059669] text-white shadow-md transform scale-105"
                            : "bg-white text-[#4b5563] hover:bg-gray-100 hover:text-[#1f2937] border border-gray-200"
                            }`}
                    >
                        {category}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredPosts.map((post, index) => (
                    <BlogCard key={index} post={post} priority={index === 0} />
                ))}
            </div>
        </>
    );
}

