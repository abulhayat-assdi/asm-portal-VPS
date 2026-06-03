"use client";

import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import { useAuth } from "@/contexts/AuthContext";
import { CvPreview } from "@/components/cv/CvPreview";
import type { CvFormData } from "@/lib/cv/schemas";
import type { TemplateConfig } from "@/lib/cv/constants";

// ─── Types ───────────────────────────────────────────────────────────────────

interface CvDraftAdmin {
    id: string;
    title: string;
    isPublic: boolean;
    downloadCount: number;
    updatedAt: string;
    user: { id: string; displayName: string; email: string };
    template: { id: string; name: string } | null;
}

interface CvTemplate {
    id: string;
    name: string;
    slug: string;
    thumbnail: string | null;
    description: string | null;
    isActive: boolean;
    config: {
        primaryColor: string;
        sidebarColor: string;
        sidebarWidth: number;
        fontFamily: string;
        photoShape: string;
        showPhoto: boolean;
    };
}

const DEFAULT_CONFIG = {
    primaryColor: "#1e3a5f",
    sidebarColor: "#1e3a5f",
    sidebarWidth: 35,
    fontFamily: "Helvetica",
    photoShape: "circle",
    showPhoto: true,
};

// ─── Template Config Modal ────────────────────────────────────────────────────

function TemplateModal({
    template,
    onClose,
    onSaved,
}: {
    template: Partial<CvTemplate> | null;
    onClose: () => void;
    onSaved: (t: CvTemplate) => void;
}) {
    const isNew = !template?.id;
    const [form, setForm] = useState({
        name: template?.name ?? "",
        slug: template?.slug ?? "",
        description: template?.description ?? "",
        isActive: template?.isActive ?? true,
        config: { ...DEFAULT_CONFIG, ...(template?.config ?? {}) },
    });
    const [saving, setSaving] = useState(false);
    const [uploadingThumb, setUploadingThumb] = useState(false);
    const [thumbnail, setThumbnail] = useState(template?.thumbnail ?? "");

    const set = (k: string, v: unknown) => setForm((p) => ({ ...p, [k]: v }));
    const setConf = (k: string, v: unknown) => setForm((p) => ({ ...p, config: { ...p.config, [k]: v } }));

    const handleThumbUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploadingThumb(true);
        const fd = new FormData();
        fd.append("file", file);
        try {
            const res = await fetch("/api/cv/admin/templates/upload", { method: "POST", body: fd });
            const data = await res.json();
            if (res.ok) { setThumbnail(data.url); toast.success("Thumbnail uploaded"); }
            else throw new Error(data.error);
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Upload failed");
        } finally {
            setUploadingThumb(false);
        }
    };

    const handleSave = async () => {
        if (!form.name || !form.slug) { toast.error("Name and slug are required"); return; }
        setSaving(true);
        const method = isNew ? "POST" : "PATCH";
        const body = isNew
            ? { ...form, thumbnail: thumbnail || undefined }
            : { id: template?.id, ...form, thumbnail: thumbnail || undefined };
        try {
            const res = await fetch("/api/cv/admin/templates", {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Save failed");
            toast.success(isNew ? "Template created!" : "Template updated!");
            onSaved(data);
            onClose();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Failed to save");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg my-8">
                <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="font-bold text-gray-900">{isNew ? "New Template" : "Edit Template"}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                <div className="p-5 space-y-4 overflow-y-auto max-h-[65vh]">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Name *</label>
                            <input value={form.name} onChange={(e) => set("name", e.target.value)} className="block w-full py-2.5 px-4 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:border-[#059669] outline-none text-sm" />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Slug *</label>
                            <input value={form.slug} onChange={(e) => set("slug", e.target.value.toLowerCase().replace(/\s+/g, "-"))} className="block w-full py-2.5 px-4 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:border-[#059669] outline-none text-sm" placeholder="my-template" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Description</label>
                        <input value={form.description} onChange={(e) => set("description", e.target.value)} className="block w-full py-2.5 px-4 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:border-[#059669] outline-none text-sm" />
                    </div>

                    <hr className="border-gray-100" />
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Config</p>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Primary Color</label>
                            <div className="flex items-center gap-2">
                                <input type="color" value={form.config.primaryColor} onChange={(e) => setConf("primaryColor", e.target.value)} className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer" />
                                <input value={form.config.primaryColor} onChange={(e) => setConf("primaryColor", e.target.value)} className="flex-1 py-2.5 px-3 border border-gray-200 rounded-xl bg-gray-50 outline-none text-sm" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Sidebar Color</label>
                            <div className="flex items-center gap-2">
                                <input type="color" value={form.config.sidebarColor} onChange={(e) => setConf("sidebarColor", e.target.value)} className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer" />
                                <input value={form.config.sidebarColor} onChange={(e) => setConf("sidebarColor", e.target.value)} className="flex-1 py-2.5 px-3 border border-gray-200 rounded-xl bg-gray-50 outline-none text-sm" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Sidebar Width %</label>
                            <input type="number" min={20} max={50} value={form.config.sidebarWidth} onChange={(e) => setConf("sidebarWidth", Number(e.target.value))} className="block w-full py-2.5 px-4 border border-gray-200 rounded-xl bg-gray-50 outline-none text-sm" />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Font Family</label>
                            <select value={form.config.fontFamily} onChange={(e) => setConf("fontFamily", e.target.value)} className="block w-full py-2.5 px-4 border border-gray-200 rounded-xl bg-gray-50 outline-none text-sm">
                                <option value="Helvetica">Helvetica</option>
                                <option value="Times-Roman">Times New Roman</option>
                                <option value="Courier">Courier</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Photo Shape</label>
                            <select value={form.config.photoShape} onChange={(e) => setConf("photoShape", e.target.value)} className="block w-full py-2.5 px-4 border border-gray-200 rounded-xl bg-gray-50 outline-none text-sm">
                                <option value="circle">Circle</option>
                                <option value="square">Square</option>
                            </select>
                        </div>
                        <div className="flex items-center gap-3 mt-6">
                            <input type="checkbox" checked={form.config.showPhoto} onChange={(e) => setConf("showPhoto", e.target.checked)} id="showPhoto" className="w-4 h-4 accent-[#059669]" />
                            <label htmlFor="showPhoto" className="text-sm font-semibold text-gray-700">Show Photo</label>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Thumbnail</label>
                        {thumbnail && <img src={thumbnail} alt="thumbnail" className="w-32 h-20 object-cover rounded-lg border mb-2" />}
                        <input type="file" accept="image/*" onChange={handleThumbUpload} disabled={uploadingThumb} className="text-sm text-gray-500 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-gray-100 file:text-gray-700 file:font-semibold" />
                        {uploadingThumb && <p className="text-xs text-gray-400 mt-1">Uploading...</p>}
                    </div>

                    <div className="flex items-center gap-3">
                        <input type="checkbox" checked={form.isActive} onChange={(e) => set("isActive", e.target.checked)} id="isActive" className="w-4 h-4 accent-[#059669]" />
                        <label htmlFor="isActive" className="text-sm font-semibold text-gray-700">Active (visible to students)</label>
                    </div>
                </div>
                <div className="p-5 border-t border-gray-100 flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-xl font-medium text-sm hover:bg-gray-50">Cancel</button>
                    <button onClick={handleSave} disabled={saving} className="px-6 py-2 bg-[#059669] text-white rounded-xl font-bold text-sm hover:bg-[#047857] disabled:opacity-50">
                        {saving ? "Saving..." : "Save Template"}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CvManagerPage() {
    const { userProfile } = useAuth();
    const [tab, setTab] = useState<"cvs" | "templates">("cvs");

    // CVs state
    const [drafts, setDrafts] = useState<CvDraftAdmin[]>([]);
    const [totalDrafts, setTotalDrafts] = useState(0);
    const [draftPage, setDraftPage] = useState(1);
    const [draftPages, setDraftPages] = useState(1);
    const [searchQ, setSearchQ] = useState("");
    const [loadingDrafts, setLoadingDrafts] = useState(true);

    // Templates state
    const [templates, setTemplates] = useState<CvTemplate[]>([]);
    const [loadingTemplates, setLoadingTemplates] = useState(false);
    const [editTemplate, setEditTemplate] = useState<Partial<CvTemplate> | null>(null);
    const [showTemplateModal, setShowTemplateModal] = useState(false);
    const [deletingTemplateId, setDeletingTemplateId] = useState<string | null>(null);

    // CV Preview Modal state
    const [previewDraftId, setPreviewDraftId] = useState<string | null>(null);
    const [previewData, setPreviewData] = useState<CvFormData | null>(null);
    const [previewConfig, setPreviewConfig] = useState<TemplateConfig | null>(null);
    const [previewLoading, setPreviewLoading] = useState(false);
    const [previewStudentName, setPreviewStudentName] = useState("");

    const isAdmin = userProfile?.role === "admin" || userProfile?.role === "super_admin";

    const fetchDrafts = useCallback(async (page: number, q: string) => {
        setLoadingDrafts(true);
        try {
            const res = await fetch(`/api/cv/admin?page=${page}&q=${encodeURIComponent(q)}`);
            const data = await res.json();
            setDrafts(data.drafts ?? []);
            setTotalDrafts(data.total ?? 0);
            setDraftPages(data.pages ?? 1);
        } catch {
            toast.error("Failed to load CVs");
        } finally {
            setLoadingDrafts(false);
        }
    }, []);

    const fetchTemplates = useCallback(async () => {
        setLoadingTemplates(true);
        try {
            const res = await fetch("/api/cv/admin/templates");
            const data = await res.json();
            setTemplates(Array.isArray(data) ? data : []);
        } catch {
            toast.error("Failed to load templates");
        } finally {
            setLoadingTemplates(false);
        }
    }, []);

    useEffect(() => { fetchDrafts(draftPage, searchQ); }, [draftPage, searchQ, fetchDrafts]);
    useEffect(() => { if (tab === "templates") fetchTemplates(); }, [tab, fetchTemplates]);

    const handleViewCv = async (draft: CvDraftAdmin) => {
        setPreviewDraftId(draft.id);
        setPreviewStudentName(draft.user.displayName);
        setPreviewLoading(true);
        setPreviewData(null);
        setPreviewConfig(null);
        try {
            const res = await fetch(`/api/cv/${draft.id}`);
            const data = await res.json();
            const defaultConfig: TemplateConfig = {
                primaryColor: "#1e3a5f", sidebarColor: "#1e3a5f",
                sidebarWidth: 38, fontFamily: "Helvetica",
                photoShape: "circle", showPhoto: true,
            };
            const cfg: TemplateConfig = { ...defaultConfig, ...(data.template?.config ?? {}) };
            setPreviewConfig(cfg);
            setPreviewData({
                title: data.title ?? "",
                fullName: data.fullName ?? "",
                profilePhoto: data.profilePhoto ?? "",
                careerObjective: data.careerObjective ?? "",
                phone: data.phone ?? "",
                email: data.email ?? "",
                address: data.address ?? "",
                dateOfBirth: data.dateOfBirth ?? "",
                bloodGroup: data.bloodGroup ?? "",
                religion: data.religion ?? "",
                maritalStatus: data.maritalStatus ?? "",
                nationality: data.nationality ?? "",
                skills: data.skills ?? [],
                languages: data.languages ?? [],
                hobbies: data.hobbies ?? [],
                workExperience: data.workExperience ?? [],
                training: data.training ?? [],
                education: data.education ?? [],
                references: data.references ?? [],
                declaration: data.declaration ?? "",
                signature: data.signature ?? "",
                sectionOrder: data.sectionOrder ?? [],
            });
        } catch {
            toast.error("Failed to load CV");
            setPreviewDraftId(null);
        } finally {
            setPreviewLoading(false);
        }
    };

    const handlePreviewDownload = () => {
        if (!previewDraftId) return;
        window.open(`/api/cv/${previewDraftId}/pdf`, "_blank");
    };

    const handleDeleteDraft = async (id: string) => {
        if (!confirm("Delete this CV permanently?")) return;
        const res = await fetch(`/api/cv/${id}`, { method: "DELETE" });
        if (res.ok) { setDrafts((p) => p.filter((d) => d.id !== id)); toast.success("CV deleted"); }
        else toast.error("Failed to delete");
    };

    const handleDeleteTemplate = async (id: string) => {
        if (!confirm("Delete this template? If it has active drafts, it will be disabled instead.")) return;
        setDeletingTemplateId(id);
        try {
            const res = await fetch(`/api/cv/admin/templates?id=${id}`, { method: "DELETE" });
            const data = await res.json();
            if (res.ok) {
                if (data.softDisabled) { toast.success("Template disabled (has active drafts)"); }
                else { toast.success("Template deleted"); }
                fetchTemplates();
            } else {
                throw new Error(data.error);
            }
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Failed to delete");
        } finally {
            setDeletingTemplateId(null);
        }
    };

    const handleToggleActive = async (tmpl: CvTemplate) => {
        try {
            const res = await fetch("/api/cv/admin/templates", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: tmpl.id, isActive: !tmpl.isActive }),
            });
            if (res.ok) {
                setTemplates((p) => p.map((t) => t.id === tmpl.id ? { ...t, isActive: !t.isActive } : t));
                toast.success(tmpl.isActive ? "Template disabled" : "Template enabled");
            }
        } catch { toast.error("Failed to update template"); }
    };

    if (!isAdmin) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center"><div className="text-6xl mb-4">🔒</div><h2 className="text-2xl font-bold">Access Denied</h2></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-6xl mx-auto pb-12">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="w-1 h-10 bg-[#059669] rounded-full" />
                <div>
                    <h1 className="text-3xl font-bold text-[#1f2937]">CV Manager</h1>
                    <p className="text-[#6b7280] mt-1">Manage student CVs and templates</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 bg-gray-100 rounded-xl p-1 w-fit">
                <button onClick={() => setTab("cvs")} className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${tab === "cvs" ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"}`}>
                    Student CVs {totalDrafts > 0 && <span className="ml-1 bg-gray-200 text-gray-600 text-xs px-1.5 py-0.5 rounded-full">{totalDrafts}</span>}
                </button>
                <button onClick={() => setTab("templates")} className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${tab === "templates" ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"}`}>
                    Templates
                </button>
            </div>

            {/* CVs Tab */}
            {tab === "cvs" && (
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <input
                            type="text"
                            placeholder="Search by student name or email..."
                            value={searchQ}
                            onChange={(e) => { setSearchQ(e.target.value); setDraftPage(1); }}
                            className="flex-1 px-4 py-3 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#059669] text-sm"
                        />
                    </div>

                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-gray-50 border-b border-gray-100">
                                        <th className="text-left px-4 py-3 font-semibold text-gray-600">Student</th>
                                        <th className="text-left px-4 py-3 font-semibold text-gray-600">CV Title</th>
                                        <th className="text-left px-4 py-3 font-semibold text-gray-600">Template</th>
                                        <th className="text-center px-4 py-3 font-semibold text-gray-600">Downloads</th>
                                        <th className="text-center px-4 py-3 font-semibold text-gray-600">Public</th>
                                        <th className="text-left px-4 py-3 font-semibold text-gray-600">Updated</th>
                                        <th className="text-right px-4 py-3 font-semibold text-gray-600">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loadingDrafts && (
                                        <tr><td colSpan={7} className="text-center py-12 text-gray-400">Loading...</td></tr>
                                    )}
                                    {!loadingDrafts && drafts.length === 0 && (
                                        <tr><td colSpan={7} className="text-center py-12 text-gray-400">No CVs found</td></tr>
                                    )}
                                    {drafts.map((draft) => (
                                        <tr key={draft.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                                            <td className="px-4 py-3">
                                                <p className="font-semibold text-gray-900">{draft.user.displayName}</p>
                                                <p className="text-xs text-gray-400">{draft.user.email}</p>
                                            </td>
                                            <td className="px-4 py-3 font-medium text-gray-800">{draft.title}</td>
                                            <td className="px-4 py-3 text-gray-500">{draft.template?.name ?? "—"}</td>
                                            <td className="px-4 py-3 text-center">{draft.downloadCount}</td>
                                            <td className="px-4 py-3 text-center">
                                                {draft.isPublic ? <span className="text-green-600 font-bold">Yes</span> : <span className="text-gray-300">No</span>}
                                            </td>
                                            <td className="px-4 py-3 text-gray-500 text-xs">{new Date(draft.updatedAt).toLocaleDateString()}</td>
                                            <td className="px-4 py-3 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => handleViewCv(draft)}
                                                        className="px-3 py-1.5 bg-[#059669] text-white text-xs font-bold rounded-lg hover:bg-[#047857]"
                                                    >
                                                        View
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteDraft(draft.id)}
                                                        className="px-3 py-1.5 bg-red-50 text-red-600 text-xs font-bold rounded-lg hover:bg-red-100"
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {draftPages > 1 && (
                            <div className="flex items-center justify-center gap-2 p-4 border-t border-gray-50">
                                <button onClick={() => setDraftPage((p) => Math.max(1, p - 1))} disabled={draftPage === 1} className="px-3 py-1.5 rounded-lg text-sm font-medium border border-gray-200 disabled:opacity-40 hover:bg-gray-50">Prev</button>
                                <span className="text-sm text-gray-500">Page {draftPage} of {draftPages}</span>
                                <button onClick={() => setDraftPage((p) => Math.min(draftPages, p + 1))} disabled={draftPage === draftPages} className="px-3 py-1.5 rounded-lg text-sm font-medium border border-gray-200 disabled:opacity-40 hover:bg-gray-50">Next</button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Templates Tab */}
            {tab === "templates" && (
                <div className="space-y-4">
                    <div className="flex justify-end">
                        <button
                            onClick={() => { setEditTemplate({}); setShowTemplateModal(true); }}
                            className="flex items-center gap-2 px-5 py-3 bg-[#059669] text-white rounded-xl font-bold text-sm hover:bg-[#047857] shadow-sm"
                        >
                            + New Template
                        </button>
                    </div>

                    {loadingTemplates && <p className="text-center text-gray-400 py-8">Loading templates...</p>}

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {templates.map((tmpl) => (
                            <div key={tmpl.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                                {/* Preview */}
                                <div className="h-32 relative overflow-hidden bg-gray-50">
                                    {tmpl.thumbnail ? (
                                        <img src={tmpl.thumbnail} alt={tmpl.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="flex h-full">
                                            <div className="flex-shrink-0" style={{ width: `${tmpl.config.sidebarWidth}%`, backgroundColor: tmpl.config.sidebarColor }} />
                                            <div className="flex-1 bg-white" />
                                        </div>
                                    )}
                                    {!tmpl.isActive && (
                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                            <span className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full">Disabled</span>
                                        </div>
                                    )}
                                </div>
                                <div className="p-4">
                                    <div className="flex items-center justify-between mb-1">
                                        <p className="font-bold text-gray-900">{tmpl.name}</p>
                                        <span className="text-xs text-gray-400">{tmpl.slug}</span>
                                    </div>
                                    {tmpl.description && <p className="text-xs text-gray-500 mb-3 line-clamp-2">{tmpl.description}</p>}
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => { setEditTemplate(tmpl); setShowTemplateModal(true); }}
                                            className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 text-xs font-bold rounded-lg hover:bg-gray-200"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleToggleActive(tmpl)}
                                            className={`px-3 py-2 text-xs font-bold rounded-lg ${tmpl.isActive ? "bg-orange-50 text-orange-600 hover:bg-orange-100" : "bg-green-50 text-green-600 hover:bg-green-100"}`}
                                        >
                                            {tmpl.isActive ? "Disable" : "Enable"}
                                        </button>
                                        <button
                                            onClick={() => handleDeleteTemplate(tmpl.id)}
                                            disabled={deletingTemplateId === tmpl.id}
                                            className="px-3 py-2 bg-red-50 text-red-600 text-xs font-bold rounded-lg hover:bg-red-100 disabled:opacity-50"
                                        >
                                            Del
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* CV Preview Modal */}
            {previewDraftId && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]">
                        {/* Header */}
                        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
                            <div>
                                <h3 className="no-gradient font-bold text-gray-900 text-base">{previewStudentName} — CV Preview</h3>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handlePreviewDownload}
                                    disabled={previewLoading}
                                    className="flex items-center gap-1.5 px-4 py-2 bg-[#1e3a5f] text-white text-sm font-bold rounded-xl hover:bg-[#152d4a] disabled:opacity-50"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg> Download PDF
                                </button>
                                <button
                                    onClick={() => { setPreviewDraftId(null); setPreviewData(null); setPreviewConfig(null); }}
                                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>
                        </div>

                        {/* CV Preview area — A4 proportioned */}
                        <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
                            {previewLoading && (
                                <div className="flex items-center justify-center h-64">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#059669]" />
                                </div>
                            )}
                            {!previewLoading && previewData && previewConfig && (
                                <div className="mx-auto rounded-xl border border-gray-200 shadow overflow-hidden" style={{ aspectRatio: "210/297", maxWidth: 560 }}>
                                    <CvPreview data={previewData} config={previewConfig} />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Template Modal */}
            {showTemplateModal && (
                <TemplateModal
                    template={editTemplate}
                    onClose={() => { setShowTemplateModal(false); setEditTemplate(null); }}
                    onSaved={(t) => {
                        setTemplates((prev) => {
                            const exists = prev.find((p) => p.id === t.id);
                            return exists ? prev.map((p) => p.id === t.id ? t : p) : [...prev, t];
                        });
                    }}
                />
            )}
        </div>
    );
}
