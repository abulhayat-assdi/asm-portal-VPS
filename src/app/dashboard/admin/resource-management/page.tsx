"use client";

import { useState, useEffect, useRef } from "react";
import {
    ModuleResource, ResourceType,
    uploadModuleResourceFile, addModuleResource, getAllModuleResources,
    updateModuleResource, toggleModuleResourceVisibility, deleteModuleResource
} from "@/services/moduleResourceService";
import { getAllResources, Resource } from "@/services/resourceService";
import { getPublicUniqueBatches } from "@/services/batchInfoService";
import { useAuth } from "@/contexts/AuthContext";
import { useConfirm } from "@/contexts/ConfirmContext";

const RESOURCE_TYPES: ResourceType[] = ["Presentation", "Notes", "Assignment", "Practice", "Other"];
const resourceTypeIcon: Record<ResourceType, string> = {
    Presentation: "📊", Notes: "📝", Assignment: "📋", Practice: "🎯", Other: "📎",
};
const fileTypeIcon = (ft: string) => {
    if (ft === "pdf") return "📄";
    if (["pptx", "ppt"].includes(ft)) return "📊";
    if (["docx", "doc"].includes(ft)) return "📃";
    if (ft === "image") return "🖼️";
    return "📎";
};

export default function AdminResourceManagementPage() {
    const confirm = useConfirm();
    const { user } = useAuth();

    const [courseModules, setCourseModules] = useState<Resource[]>([]);
    const [allResources, setAllResources] = useState<ModuleResource[]>([]);
    const [batchNames, setBatchNames] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedModuleId, setExpandedModuleId] = useState<string | null>(null);
    const [filterTeacher, setFilterTeacher] = useState("all");

    const [uploadModalOpen, setUploadModalOpen] = useState(false);
    const [uploadingForModule, setUploadingForModule] = useState<Resource | null>(null);
    const [editingResource, setEditingResource] = useState<ModuleResource | null>(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [uploadForm, setUploadForm] = useState({
        title: "", description: "", resourceType: "Presentation" as ResourceType,
        visibleForBatches: [] as string[], isHidden: false,
    });

    const fetchAll = async () => {
        setLoading(true);
        try {
            const [mods, resources, batches] = await Promise.all([
                getAllResources(),
                getAllModuleResources(),
                getPublicUniqueBatches(),
            ]);
            setCourseModules(mods.filter(r => r.category === "Course Module"));
            setAllResources(resources);
            setBatchNames(batches);
        } catch (err) {
            console.error("Error loading data:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchAll(); }, []);

    const openUploadModal = (moduleData: Resource) => {
        setUploadingForModule(moduleData);
        setEditingResource(null);
        setUploadForm({ title: "", description: "", resourceType: "Presentation", visibleForBatches: [], isHidden: false });
        if (fileInputRef.current) fileInputRef.current.value = "";
        setUploadModalOpen(true);
    };

    const openEditModal = (res: ModuleResource) => {
        const moduleData = courseModules.find(m => m.id === res.moduleId) || null;
        setUploadingForModule(moduleData);
        setEditingResource(res);
        setUploadForm({ title: res.title, description: res.description || "", resourceType: res.resourceType, visibleForBatches: res.visibleForBatches, isHidden: res.isHidden });
        setUploadModalOpen(true);
    };

    const handleUploadSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!uploadingForModule || !user) return;
        setIsUploading(true);
        try {
            const file = fileInputRef.current?.files?.[0];
            let fileUrl = editingResource?.fileUrl || "";
            let storagePath = editingResource?.storagePath || "";
            let fileSize = editingResource?.fileSize || "";
            let fileType = editingResource?.fileType || "other";

            if (file) {
                const result = await uploadModuleResourceFile(file, uploadingForModule.title, setUploadProgress);
                fileUrl = result.fileUrl; storagePath = result.storagePath;
                fileSize = result.fileSize; fileType = result.fileType;
            }

            const batches = uploadForm.visibleForBatches.length === 0 ? ["all"] : uploadForm.visibleForBatches;

            if (editingResource) {
                await updateModuleResource(editingResource.id, {
                    title: uploadForm.title, description: uploadForm.description,
                    resourceType: uploadForm.resourceType, visibleForBatches: batches,
                    isHidden: uploadForm.isHidden,
                    ...(file ? { fileUrl, storagePath, fileSize, fileType, fileName: file.name } : {}),
                });
            } else {
                if (!file) { alert("Please select a file."); setIsUploading(false); return; }
                await addModuleResource({
                    moduleId: uploadingForModule.id, moduleTitle: uploadingForModule.title,
                    teacherName: uploadingForModule.teacherName || uploadingForModule.uploadedByName,
                    teacherUid: user.id, title: uploadForm.title, description: uploadForm.description,
                    resourceType: uploadForm.resourceType, visibleForBatches: batches,
                    isHidden: uploadForm.isHidden, fileUrl, storagePath, fileSize, fileType, fileName: file.name,
                });
            }
            await fetchAll();
            setUploadModalOpen(false);
            setUploadProgress(0);
        } catch (err) {
            console.error("Upload error:", err);
            alert("Upload failed. Please try again.");
        } finally {
            setIsUploading(false);
        }
    };

    const handleToggleHide = async (res: ModuleResource) => {
        await toggleModuleResourceVisibility(res.id, !res.isHidden);
        setAllResources(prev => prev.map(r => r.id === res.id ? { ...r, isHidden: !res.isHidden } : r));
    };

    const handleDelete = async (res: ModuleResource) => {
        const ok = await confirm({ message: `Delete "${res.title}"?`, variant: "danger" });
        if (!ok) return;
        await deleteModuleResource(res.id, res.storagePath);
        setAllResources(prev => prev.filter(r => r.id !== res.id));
    };

    const toggleBatch = (batch: string) => {
        setUploadForm(prev => ({
            ...prev,
            visibleForBatches: prev.visibleForBatches.includes(batch)
                ? prev.visibleForBatches.filter(b => b !== batch)
                : [...prev.visibleForBatches, batch]
        }));
    };

    // Unique teacher names for filter
    const teacherNames = Array.from(new Set(courseModules.map(m => m.teacherName || m.uploadedByName)));

    const filteredModules = filterTeacher === "all"
        ? courseModules
        : courseModules.filter(m => (m.teacherName || m.uploadedByName) === filterTeacher);

    const statsTotal = allResources.length;
    const statsHidden = allResources.filter(r => r.isHidden).length;
    const statsVisible = statsTotal - statsHidden;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-1 h-10 bg-[#1e3a5f] rounded-full"></div>
                    <div>
                        <h1 className="text-3xl font-bold text-[#1f2937]">Resource Management</h1>
                        <p className="text-[#6b7280] mt-0.5">Manage all teacher module resources — upload, edit, hide, delete</p>
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                    { label: "Total Resources", value: statsTotal, color: "bg-blue-50 text-blue-700", icon: "📦" },
                    { label: "Visible", value: statsVisible, color: "bg-green-50 text-green-700", icon: "👁️" },
                    { label: "Hidden", value: statsHidden, color: "bg-amber-50 text-amber-700", icon: "🙈" },
                ].map(stat => (
                    <div key={stat.label} className={`${stat.color} rounded-2xl p-5 flex items-center gap-4`}>
                        <span className="text-3xl">{stat.icon}</span>
                        <div>
                            <p className="text-2xl font-bold">{stat.value}</p>
                            <p className="text-sm font-medium opacity-80">{stat.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filter by Teacher */}
            <div className="flex flex-wrap gap-2 items-center">
                <span className="text-sm font-semibold text-gray-600">Filter by Teacher:</span>
                <button onClick={() => setFilterTeacher("all")} className={`px-3 py-1.5 text-xs font-bold rounded-full border transition-all ${filterTeacher === "all" ? "bg-[#1e3a5f] text-white border-[#1e3a5f]" : "bg-white text-gray-600 border-gray-200 hover:border-[#1e3a5f]"}`}>All</button>
                {teacherNames.map(name => (
                    <button key={name} onClick={() => setFilterTeacher(name)} className={`px-3 py-1.5 text-xs font-bold rounded-full border transition-all ${filterTeacher === name ? "bg-[#1e3a5f] text-white border-[#1e3a5f]" : "bg-white text-gray-600 border-gray-200 hover:border-[#1e3a5f]"}`}>{name}</button>
                ))}
            </div>

            {/* Module List */}
            {loading ? (
                <div className="text-center py-16">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#1e3a5f] mx-auto"></div>
                    <p className="text-gray-500 mt-3">Loading...</p>
                </div>
            ) : filteredModules.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200">
                    <div className="text-4xl mb-3">📂</div>
                    <p className="font-bold text-gray-700">No Course Modules found</p>
                    <p className="text-gray-400 text-sm mt-1">Add Course Modules in Resource Library first.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredModules.map(moduleData => {
                        const moduleResources = allResources.filter(r => r.moduleId === moduleData.id);
                        const isExpanded = expandedModuleId === moduleData.id;
                        const hiddenCount = moduleResources.filter(r => r.isHidden).length;

                        return (
                            <div key={moduleData.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                                {/* Module Header */}
                                <div
                                    className="flex items-center justify-between p-5 cursor-pointer hover:bg-gray-50 transition-colors"
                                    onClick={() => setExpandedModuleId(isExpanded ? null : moduleData.id)}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="p-2.5 bg-[#1e3a5f]/10 text-[#1e3a5f] rounded-xl text-xl">📁</div>
                                        <div>
                                            <h3 className="font-bold text-gray-900">{moduleData.title}</h3>
                                            <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-500">
                                                <span>👤 {moduleData.teacherName || moduleData.uploadedByName}</span>
                                                <span>·</span>
                                                <span className="text-blue-600 font-semibold">{moduleResources.length} files</span>
                                                {hiddenCount > 0 && <span className="text-amber-500">· {hiddenCount} hidden</span>}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={e => { e.stopPropagation(); openUploadModal(moduleData); }}
                                            className="px-3 py-1.5 bg-[#1e3a5f] text-white text-xs font-bold rounded-lg hover:bg-[#162e4a] transition-colors flex items-center gap-1"
                                        >
                                            <span>+</span> Upload
                                        </button>
                                        <svg className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                </div>

                                {/* Resources Table */}
                                {isExpanded && (
                                    <div className="border-t border-gray-100">
                                        {moduleResources.length === 0 ? (
                                            <div className="p-6 text-center text-gray-400 text-sm">No files yet. Click <strong>Upload</strong> to add materials.</div>
                                        ) : (
                                            <table className="w-full text-sm">
                                                <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                                                    <tr>
                                                        <th className="px-5 py-3 text-left">File</th>
                                                        <th className="px-3 py-3 text-left">Type</th>
                                                        <th className="px-3 py-3 text-left hidden md:table-cell">Visible For</th>
                                                        <th className="px-3 py-3 text-left hidden md:table-cell">Status</th>
                                                        <th className="px-5 py-3 text-right">Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-50">
                                                    {moduleResources.map(res => (
                                                        <tr key={res.id} className={`hover:bg-gray-50 transition-colors ${res.isHidden ? "opacity-60" : ""}`}>
                                                            <td className="px-5 py-4">
                                                                <div className="flex items-center gap-3">
                                                                    <span className="text-xl">{fileTypeIcon(res.fileType)}</span>
                                                                    <div>
                                                                        <p className="font-semibold text-gray-900">{res.title}</p>
                                                                        <p className="text-xs text-gray-400">{res.fileSize} · {res.fileName}</p>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-3 py-4">
                                                                <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full border border-blue-100">{resourceTypeIcon[res.resourceType]} {res.resourceType}</span>
                                                            </td>
                                                            <td className="px-3 py-4 hidden md:table-cell">
                                                                <span className="text-xs text-gray-500">{res.visibleForBatches.includes("all") ? "All Batches" : res.visibleForBatches.join(", ")}</span>
                                                            </td>
                                                            <td className="px-3 py-4 hidden md:table-cell">
                                                                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${res.isHidden ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"}`}>
                                                                    {res.isHidden ? "Hidden" : "Visible"}
                                                                </span>
                                                            </td>
                                                            <td className="px-5 py-4">
                                                                <div className="flex justify-end gap-2">
                                                                    <a href={res.fileUrl} target="_blank" rel="noopener noreferrer" className="p-1.5 text-gray-400 hover:text-[#059669] hover:bg-emerald-50 rounded-lg transition-colors" title="View">
                                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                                                    </a>
                                                                    <button onClick={() => openEditModal(res)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit">
                                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                                                    </button>
                                                                    <button onClick={() => handleToggleHide(res)} className={`p-1.5 rounded-lg transition-colors ${res.isHidden ? "text-amber-500 bg-amber-50 hover:bg-amber-100" : "text-gray-400 hover:text-amber-600 hover:bg-amber-50"}`} title={res.isHidden ? "Show" : "Hide"}>
                                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                            {res.isHidden
                                                                                ? <><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></>
                                                                                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                                                            }
                                                                        </svg>
                                                                    </button>
                                                                    <button onClick={() => handleDelete(res)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Upload Modal */}
            {uploadModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => !isUploading && setUploadModalOpen(false)}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <div className="bg-gradient-to-r from-[#1e3a5f] to-[#2d5484] p-5 text-white rounded-t-2xl">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h3 className="no-gradient text-lg font-bold text-white">{editingResource ? "Edit Resource" : "Upload Resource"}</h3>
                                    <p className="text-blue-200 text-sm mt-0.5">📁 {uploadingForModule?.title}</p>
                                    {uploadingForModule && <p className="text-blue-300 text-xs mt-0.5">👤 {uploadingForModule.teacherName || uploadingForModule.uploadedByName}</p>}
                                </div>
                                <button onClick={() => !isUploading && setUploadModalOpen(false)} className="text-white/80 hover:text-white text-2xl">✕</button>
                            </div>
                        </div>
                        <form onSubmit={handleUploadSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Title *</label>
                                <input type="text" required value={uploadForm.title} onChange={e => setUploadForm(p => ({ ...p, title: e.target.value }))} className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#1e3a5f]" placeholder="e.g. Week 1 Presentation" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Description (optional)</label>
                                <textarea value={uploadForm.description} onChange={e => setUploadForm(p => ({ ...p, description: e.target.value }))} rows={2} className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#1e3a5f] resize-none" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Resource Type *</label>
                                <select value={uploadForm.resourceType} onChange={e => setUploadForm(p => ({ ...p, resourceType: e.target.value as ResourceType }))} className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#1e3a5f]">
                                    {RESOURCE_TYPES.map(t => <option key={t} value={t}>{resourceTypeIcon[t]} {t}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">File {editingResource ? "(leave empty to keep existing)" : "*"}</label>
                                <input ref={fileInputRef} type="file" accept=".pdf,.pptx,.ppt,.docx,.doc,.jpg,.jpeg,.png" className="w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:font-semibold file:bg-[#1e3a5f] file:text-white hover:file:bg-[#162e4a] cursor-pointer" />
                                {isUploading && uploadProgress > 0 && (
                                    <div className="mt-2">
                                        <div className="flex justify-between text-xs text-gray-500 mb-1"><span>Uploading...</span><span>{uploadProgress}%</span></div>
                                        <div className="w-full bg-gray-100 rounded-full h-2"><div className="bg-[#1e3a5f] h-2 rounded-full transition-all" style={{ width: `${uploadProgress}%` }}></div></div>
                                    </div>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Visible for Batches
                                    <span className="ml-2 text-xs font-normal text-gray-400">(কোনো batch select না করলে সব batch দেখতে পাবে)</span>
                                </label>
                                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto border border-gray-200 rounded-xl p-3">
                                    {batchNames.map(batch => (
                                        <button key={batch} type="button" onClick={() => toggleBatch(batch)} className={`px-3 py-1 text-xs font-semibold rounded-full border transition-all ${uploadForm.visibleForBatches.includes(batch) ? "bg-[#1e3a5f] text-white border-[#1e3a5f]" : "bg-white text-gray-600 border-gray-200 hover:border-[#1e3a5f]"}`}>
                                            {batch}
                                        </button>
                                    ))}
                                </div>
                                {uploadForm.visibleForBatches.length > 0 && (
                                    <p className="text-xs text-[#1e3a5f] mt-1 font-medium">Selected: {uploadForm.visibleForBatches.join(", ")}</p>
                                )}
                            </div>
                            <div className="flex items-center gap-3">
                                <button type="button" onClick={() => setUploadForm(p => ({ ...p, isHidden: !p.isHidden }))} className={`w-10 h-6 rounded-full transition-colors relative ${uploadForm.isHidden ? "bg-gray-300" : "bg-[#059669]"}`}>
                                    <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${uploadForm.isHidden ? "left-1" : "left-5"}`}></span>
                                </button>
                                <label className="text-sm font-medium text-gray-700">{uploadForm.isHidden ? "Hidden" : "Visible to students"}</label>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => !isUploading && setUploadModalOpen(false)} className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 text-sm">Cancel</button>
                                <button type="submit" disabled={isUploading} className="flex-1 px-4 py-2.5 bg-[#1e3a5f] text-white font-bold rounded-xl hover:bg-[#162e4a] disabled:opacity-60 text-sm">
                                    {isUploading ? "Uploading..." : editingResource ? "Update" : "Upload"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
