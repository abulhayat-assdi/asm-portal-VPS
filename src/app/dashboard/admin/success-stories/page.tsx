"use client";

import { useState, useEffect } from "react";
import Card, { CardBody } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import AdminRoute from "@/components/auth/AdminRoute";
import * as ssService from "@/services/successStoryService";
import Image from "next/image";

type Tab = "videos" | "reviews";

// ──────────────────────────────────────────────
// VIDEO FORM MODAL
// ──────────────────────────────────────────────
function VideoFormModal({
    initial,
    onSave,
    onCancel,
}: {
    initial?: ssService.VideoStory | null;
    onSave: (data: any) => void;
    onCancel: () => void;
}) {
    const [form, setForm] = useState({
        youtubeUrl: initial?.youtubeUrl || "",
        title: initial?.title || "",
        label: initial?.label || "",
        studentName: initial?.studentName || "",
        batch: initial?.batch || "",
        order: initial?.order ?? 0,
    });

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onCancel}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                    {initial ? "Edit Video" : "Add New Video"}
                </h3>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">YouTube URL *</label>
                        <input
                            className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#059669] focus:outline-none"
                            placeholder="https://www.youtube.com/watch?v=..."
                            value={form.youtubeUrl}
                            onChange={(e) => setForm({ ...form, youtubeUrl: e.target.value })}
                        />
                        {form.youtubeUrl && !ssService.extractVideoId(form.youtubeUrl) && (
                            <p className="text-red-500 text-xs mt-1">Invalid YouTube URL</p>
                        )}
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Title *</label>
                        <input
                            className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#059669] focus:outline-none"
                            placeholder="e.g. From Zero to Sales Professional"
                            value={form.title}
                            onChange={(e) => setForm({ ...form, title: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Label / Category <span className="text-gray-400 font-normal">(optional)</span></label>
                        <select
                            className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#059669] focus:outline-none"
                            value={form.label}
                            onChange={(e) => setForm({ ...form, label: e.target.value })}
                        >
                            <option value="">— None —</option>
                            <option>Career Placement</option>
                            <option>Student Story</option>
                            <option>Freelance Success</option>
                            <option>Business Growth</option>
                            <option>Course Overview</option>
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Student Name</label>
                            <input
                                className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#059669] focus:outline-none"
                                value={form.studentName}
                                onChange={(e) => setForm({ ...form, studentName: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Batch</label>
                            <input
                                className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#059669] focus:outline-none"
                                placeholder="e.g. Batch 05"
                                value={form.batch}
                                onChange={(e) => setForm({ ...form, batch: e.target.value })}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Display Order</label>
                        <input
                            type="number"
                            className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#059669] focus:outline-none"
                            value={form.order}
                            onChange={(e) => setForm({ ...form, order: parseInt(e.target.value) || 0 })}
                        />
                    </div>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                    <Button variant="ghost" onClick={onCancel}>Cancel</Button>
                    <Button
                        onClick={() => onSave(form)}
                        disabled={!form.title || !form.youtubeUrl || !ssService.extractVideoId(form.youtubeUrl)}
                    >
                        {initial ? "Update" : "Add Video"}
                    </Button>
                </div>
            </div>
        </div>
    );
}

// ──────────────────────────────────────────────
// REVIEW FORM MODAL
// ──────────────────────────────────────────────
function ReviewFormModal({
    initial,
    onSave,
    onCancel,
}: {
    initial?: ssService.WrittenReview | null;
    onSave: (data: any) => void;
    onCancel: () => void;
}) {
    const [form, setForm] = useState({
        studentName: initial?.studentName || "",
        batch: initial?.batch || "",
        role: initial?.role || "",
        company: initial?.company || "",
        quote: initial?.quote || "",
        rating: initial?.rating ?? 5,
        order: initial?.order ?? 0,
    });

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onCancel}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                    {initial ? "Edit Review" : "Add New Review"}
                </h3>
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Student Name *</label>
                            <input
                                className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#059669] focus:outline-none"
                                value={form.studentName}
                                onChange={(e) => setForm({ ...form, studentName: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Batch</label>
                            <input
                                className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#059669] focus:outline-none"
                                placeholder="e.g. Batch 05"
                                value={form.batch}
                                onChange={(e) => setForm({ ...form, batch: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Role / Title</label>
                            <input
                                className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#059669] focus:outline-none"
                                placeholder="e.g. Sales Executive"
                                value={form.role}
                                onChange={(e) => setForm({ ...form, role: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Company</label>
                            <input
                                className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#059669] focus:outline-none"
                                value={form.company}
                                onChange={(e) => setForm({ ...form, company: e.target.value })}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Review Quote *</label>
                        <textarea
                            rows={4}
                            className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#059669] focus:outline-none resize-none"
                            placeholder="What did the student say about the course?"
                            value={form.quote}
                            onChange={(e) => setForm({ ...form, quote: e.target.value })}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Rating (1–5)</label>
                            <div className="flex gap-1 mt-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        type="button"
                                        onClick={() => setForm({ ...form, rating: star })}
                                        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${star <= form.rating ? "text-yellow-400" : "text-gray-300"
                                            }`}
                                    >
                                        <svg className="w-6 h-6 fill-current" viewBox="0 0 20 20">
                                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                        </svg>
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Display Order</label>
                            <input
                                type="number"
                                className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#059669] focus:outline-none"
                                value={form.order}
                                onChange={(e) => setForm({ ...form, order: parseInt(e.target.value) || 0 })}
                            />
                        </div>
                    </div>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                    <Button variant="ghost" onClick={onCancel}>Cancel</Button>
                    <Button
                        onClick={() => onSave(form)}
                        disabled={!form.studentName || !form.quote}
                    >
                        {initial ? "Update" : "Add Review"}
                    </Button>
                </div>
            </div>
        </div>
    );
}


// ──────────────────────────────────────────────
// MAIN PAGE
// ──────────────────────────────────────────────
export default function SuccessStoriesAdminPage() {
    const [tab, setTab] = useState<Tab>("videos");

    // Videos state
    const [videos, setVideos] = useState<ssService.VideoStory[]>([]);
    const [videoLoading, setVideoLoading] = useState(true);
    const [editVideo, setEditVideo] = useState<ssService.VideoStory | null>(null);
    const [showVideoForm, setShowVideoForm] = useState(false);

    // Reviews state
    const [reviews, setReviews] = useState<ssService.WrittenReview[]>([]);
    const [reviewLoading, setReviewLoading] = useState(true);
    const [editReview, setEditReview] = useState<ssService.WrittenReview | null>(null);
    const [showReviewForm, setShowReviewForm] = useState(false);

    const loadVideos = async () => {
        setVideoLoading(true);
        try {
            setVideos(await ssService.getVideos());
        } catch (e) {
            console.error(e);
        } finally {
            setVideoLoading(false);
        }
    };

    const loadReviews = async () => {
        setReviewLoading(true);
        try {
            setReviews(await ssService.getReviews());
        } catch (e) {
            console.error(e);
        } finally {
            setReviewLoading(false);
        }
    };

    useEffect(() => {
        loadVideos();
        loadReviews();
    }, []);

    // ─── Video handlers ───
    const handleSaveVideo = async (data: any) => {
        try {
            if (editVideo) {
                await ssService.updateVideo(editVideo.id, data);
            } else {
                await ssService.createVideo(data);
            }
            setShowVideoForm(false);
            setEditVideo(null);
            await loadVideos();
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Failed to save video";
            alert(errorMessage);
        }
    };

    const handleDeleteVideo = async (v: ssService.VideoStory) => {
        if (!confirm(`Delete video "${v.title}"?`)) return;
        try {
            await ssService.deleteVideo(v.id);
            await loadVideos();
        } catch {
            alert("Failed to delete video");
        }
    };

    // ─── Review handlers ───
    const handleSaveReview = async (data: any) => {
        try {
            if (editReview) {
                await ssService.updateReview(editReview.id, data);
            } else {
                await ssService.createReview(data);
            }
            setShowReviewForm(false);
            setEditReview(null);
            await loadReviews();
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Failed to save review";
            alert(errorMessage);
        }
    };

    const handleDeleteReview = async (r: ssService.WrittenReview) => {
        if (!confirm(`Delete review from "${r.studentName}"?`)) return;
        try {
            await ssService.deleteReview(r.id);
            await loadReviews();
        } catch {
            alert("Failed to delete review");
        }
    };

    return (
        <AdminRoute>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-[#1f2937]">
                            Success Stories
                        </h1>
                        <p className="text-[#6b7280] mt-1">
                            Manage video stories and written reviews
                        </p>
                    </div>
                    <Button onClick={() => {
                        if (tab === "videos") { setEditVideo(null); setShowVideoForm(true); }
                        else { setEditReview(null); setShowReviewForm(true); }
                    }}>
                        {tab === "videos" ? "Add Video" : "Add Review"}
                    </Button>
                </div>

                {/* Tab Switcher */}
                <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
                    <button
                        onClick={() => setTab("videos")}
                        className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${tab === "videos" ? "bg-white text-[#059669] shadow-sm" : "text-gray-500 hover:text-gray-700"
                            }`}
                    >
                        🎬 Videos ({videos.length})
                    </button>
                    <button
                        onClick={() => setTab("reviews")}
                        className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${tab === "reviews" ? "bg-white text-[#059669] shadow-sm" : "text-gray-500 hover:text-gray-700"
                            }`}
                    >
                        ✍️ Reviews ({reviews.length})
                    </button>
                </div>

                {/* ─── VIDEOS TAB ─── */}
                {tab === "videos" && (
                    <Card>
                        <CardBody className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm text-gray-600">
                                    <thead className="bg-[#1e3a5f] text-white uppercase font-semibold">
                                        <tr>
                                            <th className="px-4 py-3 border border-[#2d5278] w-12">#</th>
                                            <th className="px-4 py-3 border border-[#2d5278] w-20">Thumb</th>
                                            <th className="px-4 py-3 border border-[#2d5278]">Title</th>
                                            <th className="px-4 py-3 border border-[#2d5278] w-32">Label</th>
                                            <th className="px-4 py-3 border border-[#2d5278] w-40">Student</th>
                                            <th className="px-4 py-3 border border-[#2d5278] text-right w-36">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {videoLoading ? (
                                            <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">Loading videos...</td></tr>
                                        ) : videos.length === 0 ? (
                                            <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">No videos yet. Click &quot;Add Video&quot; to get started.</td></tr>
                                        ) : (
                                            videos.map((v, i) => (
                                                <tr key={v.id} className={i % 2 === 0 ? "bg-white" : "bg-[#f9fafb]"}>
                                                    <td className="px-4 py-3 border border-[#e5e7eb] text-center font-medium">{v.order}</td>
                                                    <td className="px-4 py-3 border border-[#e5e7eb]">
                                                        <Image
                                                            src={`https://img.youtube.com/vi/${v.videoId}/mqdefault.jpg`}
                                                            alt=""
                                                            width={64}
                                                            height={40}
                                                            className="rounded object-cover"
                                                        />
                                                    </td>
                                                    <td className="px-4 py-3 border border-[#e5e7eb] font-medium text-gray-900">{v.title}</td>
                                                    <td className="px-4 py-3 border border-[#e5e7eb]">
                                                        <span className="text-xs font-semibold bg-emerald-50 text-emerald-700 px-2 py-1 rounded-full">{v.label}</span>
                                                    </td>
                                                    <td className="px-4 py-3 border border-[#e5e7eb] text-xs">{v.studentName}</td>
                                                    <td className="px-4 py-3 border border-[#e5e7eb] text-right">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => { setEditVideo(v); setShowVideoForm(true); }}
                                                            >Edit</Button>
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                className="text-red-600 hover:bg-red-50 hover:text-red-700"
                                                                onClick={() => handleDeleteVideo(v)}
                                                            >Delete</Button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </CardBody>
                    </Card>
                )}

                {/* ─── REVIEWS TAB ─── */}
                {tab === "reviews" && (
                    <Card>
                        <CardBody className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm text-gray-600">
                                    <thead className="bg-[#1e3a5f] text-white uppercase font-semibold">
                                        <tr>
                                            <th className="px-4 py-3 border border-[#2d5278] w-12">#</th>
                                            <th className="px-4 py-3 border border-[#2d5278] w-36">Student</th>
                                            <th className="px-4 py-3 border border-[#2d5278] w-24">Batch</th>
                                            <th className="px-4 py-3 border border-[#2d5278]">Quote</th>
                                            <th className="px-4 py-3 border border-[#2d5278] w-24">Rating</th>
                                            <th className="px-4 py-3 border border-[#2d5278] text-right w-36">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {reviewLoading ? (
                                            <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">Loading reviews...</td></tr>
                                        ) : reviews.length === 0 ? (
                                            <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">No reviews yet. Click &quot;Add Review&quot; to get started.</td></tr>
                                        ) : (
                                            reviews.map((r, i) => (
                                                <tr key={r.id} className={i % 2 === 0 ? "bg-white" : "bg-[#f9fafb]"}>
                                                    <td className="px-4 py-3 border border-[#e5e7eb] text-center font-medium">{r.order}</td>
                                                    <td className="px-4 py-3 border border-[#e5e7eb] font-medium text-gray-900">{r.studentName}</td>
                                                    <td className="px-4 py-3 border border-[#e5e7eb]">{r.batch}</td>
                                                    <td className="px-4 py-3 border border-[#e5e7eb] text-xs text-gray-500 max-w-xs truncate">&quot;{r.quote}&quot;</td>
                                                    <td className="px-4 py-3 border border-[#e5e7eb]">
                                                        <div className="flex text-yellow-400">
                                                            {[...Array(r.rating)].map((_, s) => (
                                                                <svg key={s} className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                                                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                                </svg>
                                                            ))}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 border border-[#e5e7eb] text-right">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => { setEditReview(r); setShowReviewForm(true); }}
                                                            >Edit</Button>
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                className="text-red-600 hover:bg-red-50 hover:text-red-700"
                                                                onClick={() => handleDeleteReview(r)}
                                                            >Delete</Button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </CardBody>
                    </Card>
                )}
            </div>

            {/* Modals */}
            {showVideoForm && (
                <VideoFormModal
                    initial={editVideo}
                    onSave={handleSaveVideo}
                    onCancel={() => { setShowVideoForm(false); setEditVideo(null); }}
                />
            )}
            {showReviewForm && (
                <ReviewFormModal
                    initial={editReview}
                    onSave={handleSaveReview}
                    onCancel={() => { setShowReviewForm(false); setEditReview(null); }}
                />
            )}
        </AdminRoute>
    );
}
