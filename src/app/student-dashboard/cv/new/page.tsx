"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

interface CvTemplate {
    id: string;
    name: string;
    slug: string;
    thumbnail: string | null;
    description: string | null;
    config: {
        primaryColor: string;
        sidebarColor: string;
        sidebarWidth: number;
        photoShape: string;
    };
}

export default function NewCvPage() {
    const router = useRouter();
    const [templates, setTemplates] = useState<CvTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
    const [title, setTitle] = useState("My CV");
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        fetch("/api/cv/admin/templates")
            .then((r) => r.json())
            .then((data) => setTemplates(Array.isArray(data) ? data : []))
            .catch(() => toast.error("Failed to load templates"))
            .finally(() => setLoading(false));
    }, []);

    const handleCreate = async () => {
        if (!selectedTemplate) {
            toast.error("Please select a template");
            return;
        }
        if (!title.trim()) {
            toast.error("Please enter a CV title");
            return;
        }
        setCreating(true);
        try {
            const res = await fetch("/api/cv", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ templateId: selectedTemplate, title: title.trim() }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to create CV");
            toast.success("CV created!");
            router.push(`/student-dashboard/cv/${data.id}/edit`);
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Failed to create CV");
            setCreating(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#059669]" />
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500 max-w-4xl mx-auto pb-12">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="w-1 h-10 bg-[#059669] rounded-full" />
                <div>
                    <h1 className="text-3xl font-bold text-[#1f2937]">Create New CV</h1>
                    <p className="text-[#6b7280] mt-1">Choose a template and name your CV</p>
                </div>
            </div>

            {/* CV Title input */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <label className="block text-sm font-bold text-gray-700 mb-2">CV Title</label>
                <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. My Professional CV, Software Developer CV"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:border-[#059669] focus:ring-1 focus:ring-[#059669] outline-none text-sm transition-all"
                    maxLength={100}
                />
            </div>

            {/* Template selection */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Choose a Template</h2>
                {templates.length === 0 && (
                    <p className="text-gray-400 text-center py-8">No templates available.</p>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {templates.map((tmpl) => {
                        const isSelected = selectedTemplate === tmpl.id;
                        return (
                            <button
                                key={tmpl.id}
                                onClick={() => setSelectedTemplate(tmpl.id)}
                                className={`text-left rounded-xl border-2 overflow-hidden transition-all focus:outline-none ${
                                    isSelected
                                        ? "border-[#059669] ring-2 ring-[#059669]/20 shadow-md"
                                        : "border-gray-200 hover:border-gray-300 hover:shadow-sm"
                                }`}
                            >
                                {/* Template preview */}
                                <div className="relative h-36 overflow-hidden bg-gray-50">
                                    {tmpl.thumbnail ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                            src={tmpl.thumbnail}
                                            alt={tmpl.name}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        /* Visual preview using template colors */
                                        <div className="flex h-full">
                                            <div
                                                className="flex-shrink-0 p-3"
                                                style={{ width: `${tmpl.config.sidebarWidth}%`, backgroundColor: tmpl.config.sidebarColor }}
                                            >
                                                <div className={`mx-auto mb-2 bg-white/20 ${tmpl.config.photoShape === 'circle' ? 'rounded-full' : 'rounded'}`} style={{ width: 28, height: 28 }} />
                                                <div className="bg-white/30 h-1.5 rounded mb-1" />
                                                <div className="bg-white/20 h-1 rounded mb-3 w-4/5" />
                                                {[60, 80, 70].map((w, i) => (
                                                    <div key={i} className="bg-white/25 h-1 rounded mb-1" style={{ width: `${w}%` }} />
                                                ))}
                                            </div>
                                            <div className="flex-1 p-3 bg-white">
                                                <div className="h-2 rounded mb-2" style={{ backgroundColor: tmpl.config.sidebarColor, width: '60%' }} />
                                                <div className="bg-gray-200 h-1 rounded mb-4 w-2/3" />
                                                {[100, 85, 90, 75].map((w, i) => (
                                                    <div key={i} className="bg-gray-100 h-1 rounded mb-1.5" style={{ width: `${w}%` }} />
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    {isSelected && (
                                        <div className="absolute inset-0 bg-[#059669]/10 flex items-center justify-center">
                                            <div className="w-8 h-8 bg-[#059669] rounded-full flex items-center justify-center shadow-lg">
                                                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                </svg>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="p-3">
                                    <p className="font-bold text-gray-900 text-sm">{tmpl.name}</p>
                                    {tmpl.description && (
                                        <p className="text-gray-500 text-xs mt-0.5 line-clamp-2">{tmpl.description}</p>
                                    )}
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Create button */}
            <div className="flex items-center gap-3">
                <button
                    onClick={() => router.back()}
                    className="px-5 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium text-sm hover:bg-gray-50"
                >
                    Cancel
                </button>
                <button
                    onClick={handleCreate}
                    disabled={creating || !selectedTemplate}
                    className="px-8 py-3 bg-[#059669] text-white rounded-xl font-bold text-sm hover:bg-[#047857] transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {creating ? "Creating..." : "Create CV"}
                </button>
            </div>
        </div>
    );
}
