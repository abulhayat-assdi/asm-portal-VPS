"use client";

import { useState, useEffect } from "react";
import Card, { CardBody } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import AdminRoute from "@/components/auth/AdminRoute";
import * as service from "@/services/homeVideoTestimonialService";
import Image from "next/image";
import { useConfirm } from "@/contexts/ConfirmContext";

// ──────────────────────────────────────────────
// VIDEO FORM MODAL
// ──────────────────────────────────────────────
function VideoFormModal({
    initial,
    onSave,
    onCancel,
}: {
    initial?: service.HomeVideoTestimonial | null;
    onSave: (data: any) => void;
    onCancel: () => void;
}) {
    const [form, setForm] = useState({
        youtubeUrl: initial?.youtubeUrl || "",
        title: initial?.title || "",
        studentName: initial?.studentName || "",
        order: initial?.order ?? 0,
    });

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onCancel}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                    {initial ? "Edit Home Video" : "Add New Home Video"}
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
                        {form.youtubeUrl && !service.extractVideoId(form.youtubeUrl) && (
                            <p className="text-red-500 text-xs mt-1">Invalid YouTube URL</p>
                        )}
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Title (Quote/Summary) *</label>
                        <input
                            className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#059669] focus:outline-none"
                            placeholder="e.g. My life completely changed!"
                            value={form.title}
                            onChange={(e) => setForm({ ...form, title: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Student Name <span className="text-gray-400 font-normal">(optional)</span></label>
                        <input
                            className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#059669] focus:outline-none"
                            placeholder="e.g. Abul Hayat"
                            value={form.studentName}
                            onChange={(e) => setForm({ ...form, studentName: e.target.value })}
                        />
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
                        disabled={!form.title || !form.youtubeUrl || !service.extractVideoId(form.youtubeUrl)}
                    >
                        {initial ? "Update" : "Add Video"}
                    </Button>
                </div>
            </div>
        </div>
    );
}

// ──────────────────────────────────────────────
// MAIN PAGE
// ──────────────────────────────────────────────
export default function HomeVideoTestimonialsAdminPage() {
    const confirm = useConfirm();
    const [videos, setVideos] = useState<service.HomeVideoTestimonial[]>([]);
    const [loading, setLoading] = useState(true);
    const [editVideo, setEditVideo] = useState<service.HomeVideoTestimonial | null>(null);
    const [showForm, setShowForm] = useState(false);

    const loadVideos = async () => {
        setLoading(true);
        try {
            setVideos(await service.getVideos());
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadVideos();
    }, []);

    const handleSave = async (data: any) => {
        try {
            if (editVideo) {
                await service.updateVideo(editVideo.id, data);
            } else {
                await service.createVideo(data);
            }
            setShowForm(false);
            setEditVideo(null);
            await loadVideos();
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Failed to save video";
            alert(errorMessage);
        }
    };

    const handleDelete = async (v: service.HomeVideoTestimonial) => {
        const ok = await confirm({ message: `Delete video "${v.title}"?`, variant: "danger" });
        if (!ok) return;
        try {
            await service.deleteVideo(v.id);
            await loadVideos();
        } catch {
            alert("Failed to delete video");
        }
    };

    return (
        <AdminRoute>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-[#1f2937]">
                            Homepage Video Testimonials
                        </h1>
                        <p className="text-[#6b7280] mt-1">
                            Manage the video carousel shown on the Home page
                        </p>
                    </div>
                    <Button onClick={() => { setEditVideo(null); setShowForm(true); }}>
                        Add Video
                    </Button>
                </div>

                <Card>
                    <CardBody className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm text-gray-600">
                                <thead className="bg-[#1e3a5f] text-white uppercase font-semibold">
                                    <tr>
                                        <th className="px-4 py-3 border border-[#2d5278] w-12">#</th>
                                        <th className="px-4 py-3 border border-[#2d5278] w-20">Thumb</th>
                                        <th className="px-4 py-3 border border-[#2d5278]">Title</th>
                                        <th className="px-4 py-3 border border-[#2d5278] w-40">Student Name</th>
                                        <th className="px-4 py-3 border border-[#2d5278] text-right w-36">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {loading ? (
                                        <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">Loading videos...</td></tr>
                                    ) : videos.length === 0 ? (
                                        <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">No videos yet. Click "Add Video" to get started.</td></tr>
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
                                                <td className="px-4 py-3 border border-[#e5e7eb] text-xs">{v.studentName || "-"}</td>
                                                <td className="px-4 py-3 border border-[#e5e7eb] text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => { setEditVideo(v); setShowForm(true); }}
                                                        >Edit</Button>
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            className="text-red-600 hover:bg-red-50 hover:text-red-700"
                                                            onClick={() => handleDelete(v)}
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
            </div>

            {showForm && (
                <VideoFormModal
                    initial={editVideo}
                    onSave={handleSave}
                    onCancel={() => { setShowForm(false); setEditVideo(null); }}
                />
            )}
        </AdminRoute>
    );
}
