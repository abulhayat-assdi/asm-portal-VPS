"use client";

import { useState, useEffect } from "react";
import {
    BlogComment,
    CommentReply,
    getCommentsByBlogId,
    addComment,
    addReply,
    likeComment
} from "@/services/commentService";

interface BlogCommentsProps {
    blogId: string;
}

export default function BlogComments({ blogId }: BlogCommentsProps) {
    const [comments, setComments] = useState<BlogComment[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Main comment form state
    const [name, setName] = useState("");
    const [content, setContent] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Reply form state
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [replyName, setReplyName] = useState("");
    const [replyContent, setReplyContent] = useState("");
    const [isSubmittingReply, setIsSubmittingReply] = useState(false);

    useEffect(() => {
        loadComments();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [blogId]);

    const loadComments = async () => {
        setIsLoading(true);
        try {
            const fetched = await getCommentsByBlogId(blogId);
            setComments(fetched);
        } catch (error) {
            console.error("Failed to load comments", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !content.trim()) return;

        setIsSubmitting(true);
        try {
            const newComment = await addComment(blogId, name.trim(), content.trim());
            setComments(prev => [newComment, ...prev]);
            setName("");
            setContent("");
        } catch (error) {
            console.error("Failed to post comment", error);
            alert("Failed to post comment. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleLike = async (commentId: string) => {
        try {
            // Optimistic UI update
            setComments(prev => prev.map(c =>
                c.id === commentId ? { ...c, likes: c.likes + 1 } : c
            ));
            await likeComment(commentId);
        } catch (error) {
            console.error("Failed to like comment", error);
            // Revert on failure
            setComments(prev => prev.map(c =>
                c.id === commentId ? { ...c, likes: c.likes - 1 } : c
            ));
        }
    };

    const handleAddReply = async (e: React.FormEvent, commentId: string) => {
        e.preventDefault();
        if (!replyName.trim() || !replyContent.trim()) return;

        setIsSubmittingReply(true);
        try {
            const commentToReplyTo = comments.find(c => c.id === commentId);
            if (!commentToReplyTo) return;

            const updatedReplies = await addReply(
                commentId,
                commentToReplyTo.replies || [],
                replyName.trim(),
                replyContent.trim()
            );

            // Update local state
            setComments(prev => prev.map(c =>
                c.id === commentId ? { ...c, replies: updatedReplies } : c
            ));

            // Reset reply form
            setReplyingTo(null);
            setReplyName("");
            setReplyContent("");
        } catch (error) {
            console.error("Failed to post reply", error);
            alert("Failed to post reply. Please try again.");
        } finally {
            setIsSubmittingReply(false);
        }
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return "Just now";
        try {
            const date = new Date(dateString);
            return new Intl.DateTimeFormat("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric"
            }).format(date);
        } catch (e) {
            return "Just now";
        }
    };

    return (
        <div className="w-full mt-10">
            <div className="flex items-center gap-3 mb-8">
                <h3 className="text-2xl font-bold text-[#1f2937]">Comments</h3>
                <span className="bg-gray-100 text-[#6b7280] text-sm font-semibold px-3 py-1 rounded-full">
                    {comments.length}
                </span>
            </div>

            {/* Main Comment Form */}
            <form onSubmit={handleAddComment} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm mb-10">
                <div className="mb-4">
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Your Name</label>
                    <input
                        type="text"
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#059669] focus:border-[#059669] outline-none transition-shadow"
                        placeholder="John Doe"
                        required
                    />
                </div>
                <div className="mb-4">
                    <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">Comment</label>
                    <textarea
                        id="content"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        rows={3}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#059669] focus:border-[#059669] outline-none transition-shadow resize-none"
                        placeholder="Share your thoughts..."
                        required
                    />
                </div>
                <div className="flex justify-end">
                    <button
                        type="submit"
                        disabled={isSubmitting || !name.trim() || !content.trim()}
                        className="px-6 py-2.5 bg-[#059669] text-white font-medium rounded-lg hover:bg-[#047857] focus:ring-4 focus:ring-emerald-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        {isSubmitting ? "Posting..." : "Post Comment"}
                    </button>
                </div>
            </form>

            {/* Comments List */}
            {isLoading ? (
                <div className="text-center py-10 text-gray-500">Loading comments...</div>
            ) : comments.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-2xl border border-gray-100 border-dashed">
                    <p className="text-gray-500">No comments yet. Be the first to share your thoughts!</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {comments.map((comment) => (
                        <div key={comment.id} className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                            <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center flex-shrink-0 text-[#059669] font-bold">
                                        {comment.authorName.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-gray-900">{comment.authorName}</h4>
                                        <p className="text-xs text-gray-500">{formatDate(comment.createdAt)}</p>
                                    </div>
                                </div>
                            </div>

                            <p className="text-gray-700 mt-3 mb-4 leading-relaxed whitespace-pre-wrap">
                                {comment.content}
                            </p>

                            <div className="flex items-center gap-4 text-sm">
                                <button
                                    onClick={() => handleLike(comment.id)}
                                    className="flex items-center gap-1.5 text-gray-500 hover:text-rose-500 transition-colors group"
                                >
                                    <svg className="w-5 h-5 group-hover:fill-rose-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                    </svg>
                                    <span className="font-medium">{comment.likes}</span>
                                </button>

                                <button
                                    onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                                    className="flex items-center gap-1.5 text-gray-500 hover:text-[#059669] transition-colors"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                                    </svg>
                                    <span className="font-medium">Reply</span>
                                </button>
                            </div>

                            {/* Reply Form */}
                            {replyingTo === comment.id && (
                                <form onSubmit={(e) => handleAddReply(e, comment.id)} className="mt-4 pt-4 border-t border-gray-100 pl-4 border-l-2 border-l-emerald-100">
                                    <div className="flex flex-col sm:flex-row gap-3">
                                        <input
                                            type="text"
                                            value={replyName}
                                            onChange={(e) => setReplyName(e.target.value)}
                                            className="w-full sm:w-1/3 px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-[#059669] focus:border-[#059669] outline-none"
                                            placeholder="Your Name"
                                            required
                                        />
                                        <input
                                            type="text"
                                            value={replyContent}
                                            onChange={(e) => setReplyContent(e.target.value)}
                                            className="w-full flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-[#059669] focus:border-[#059669] outline-none"
                                            placeholder="Write a reply..."
                                            required
                                        />
                                        <button
                                            type="submit"
                                            disabled={isSubmittingReply || !replyName.trim() || !replyContent.trim()}
                                            className="px-4 py-2 text-sm bg-gray-900 text-white font-medium rounded-md hover:bg-gray-800 disabled:opacity-50 whitespace-nowrap"
                                        >
                                            {isSubmittingReply ? "..." : "Reply"}
                                        </button>
                                    </div>
                                </form>
                            )}

                            {/* Nested Replies */}
                            {comment.replies && comment.replies.length > 0 && (
                                <div className="mt-5 space-y-4 pl-4 sm:pl-8 border-l-2 border-gray-100">
                                    {comment.replies.map((reply) => (
                                        <div key={reply.id} className="bg-gray-50 p-4 rounded-xl">
                                            <div className="flex items-center gap-2 mb-2">
                                                <div className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center flex-shrink-0 text-gray-600 text-sm font-bold">
                                                    {reply.authorName.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <h5 className="font-semibold text-gray-900 text-sm">{reply.authorName}</h5>
                                                    <span className="text-xs text-gray-500">{formatDate(reply.createdAt)}</span>
                                                </div>
                                            </div>
                                            <p className="text-gray-700 text-sm whitespace-pre-wrap pl-10">
                                                {reply.content}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
