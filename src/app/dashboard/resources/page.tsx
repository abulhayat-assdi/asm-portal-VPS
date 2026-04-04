"use client";

import { useState, useEffect, useRef } from "react";
import Card, { CardBody } from "@/components/ui/Card";
import { formatDateShort } from "@/lib/utils";
import { getAllResources, addResource, updateResource, deleteResource, uploadResourceFile, deleteResourceFile, Resource } from "@/services/resourceService";
import {
    ModuleResource, ResourceType,
    uploadModuleResourceFile, addModuleResource, getModuleResourcesByTeacher,
    updateModuleResource, toggleModuleResourceVisibility, deleteModuleResource
} from "@/services/moduleResourceService";
import { getPublicUniqueBatches } from "@/services/batchInfoService";
import { useAuth } from "@/contexts/AuthContext";

// Categories definition
const categories: Resource["category"][] = [
    "Course Module",
    "Class Routine",
    "Notes",
    "Assignment",
    "Exam / Practice"
];

const RESOURCE_TYPES: ResourceType[] = ["Presentation", "Notes", "Assignment", "Practice", "Other"];

const resourceTypeIcon: Record<ResourceType, string> = {
    Presentation: "📊",
    Notes: "📝",
    Assignment: "📋",
    Practice: "🎯",
    Other: "📎",
};

const fileTypeIcon = (ft: string) => {
    if (ft === "pdf") return "📄";
    if (["pptx", "ppt"].includes(ft)) return "📊";
    if (["docx", "doc"].includes(ft)) return "📃";
    if (ft === "image") return "🖼️";
    return "📎";
};

export default function ResourcesPage() {
    const { user, userProfile } = useAuth();
    const isAdmin = userProfile?.role === "admin";

    // ─── Teacher Resource Management State ────────────────────────
    const [courseModules, setCourseModules] = useState<Resource[]>([]);
    const [myModuleResources, setMyModuleResources] = useState<ModuleResource[]>([]);
    const [batchNames, setBatchNames] = useState<string[]>([]);
    const [expandedModuleId, setExpandedModuleId] = useState<string | null>(null);
    const [uploadModalOpen, setUploadModalOpen] = useState(false);
    const [uploadingForModule, setUploadingForModule] = useState<Resource | null>(null);
    const [editingModuleResource, setEditingModuleResource] = useState<ModuleResource | null>(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [uploadForm, setUploadForm] = useState({
        title: "",
        description: "",
        resourceType: "Presentation" as ResourceType,
        visibleForBatches: [] as string[],
        isHidden: false,
    });

    // ─── Existing Resource Library State ──────────────────────────
    const [resources, setResources] = useState<Resource[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingResource, setEditingResource] = useState<Resource | null>(null);
    const [resourceUploadProgress, setResourceUploadProgress] = useState(0);
    const resourceFileInputRef = useRef<HTMLInputElement>(null);
    const [newResource, setNewResource] = useState({
        title: "",
        category: "Course Module" as Resource["category"],
        teacherName: "",
        fileUrl: "", // Keep for fallback or editing existing
        order: 0,
    });

    // ─── Initial Data Load ─────────────────────────────────────────
    const fetchResources = async () => {
        try {
            const data = await getAllResources();
            setResources(data);
            setCourseModules(data.filter(r => r.category === "Course Module"));
        } catch (error) {
            console.error("Failed to load resources", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchMyModuleResources = async () => {
        if (!user) return;
        const data = await getModuleResourcesByTeacher(user.uid);
        setMyModuleResources(data);
    };

    useEffect(() => {
        fetchResources();
        fetchMyModuleResources();
        getPublicUniqueBatches().then(setBatchNames);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    // ─── Module Resource Handlers ──────────────────────────────────
    const openUploadModal = (module: Resource) => {
        setUploadingForModule(module);
        setEditingModuleResource(null);
        setUploadForm({ title: "", description: "", resourceType: "Presentation", visibleForBatches: [], isHidden: false });
        if (fileInputRef.current) fileInputRef.current.value = "";
        setUploadModalOpen(true);
    };

    const openEditModal = (resource: ModuleResource) => {
        const module = courseModules.find(m => m.id === resource.moduleId) || null;
        setUploadingForModule(module);
        setEditingModuleResource(resource);
        setUploadForm({
            title: resource.title,
            description: resource.description || "",
            resourceType: resource.resourceType,
            visibleForBatches: resource.visibleForBatches,
            isHidden: resource.isHidden,
        });
        setUploadModalOpen(true);
    };

    const handleUploadSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!uploadingForModule || !user) return;
        setIsUploading(true);
        try {
            const file = fileInputRef.current?.files?.[0];
            let fileUrl = editingModuleResource?.fileUrl || "";
            let storagePath = editingModuleResource?.storagePath || "";
            let fileSize = editingModuleResource?.fileSize || "";
            let fileType = editingModuleResource?.fileType || "other";

            if (file) {
                const result = await uploadModuleResourceFile(
                    file,
                    uploadingForModule.title,
                    setUploadProgress
                );
                fileUrl = result.fileUrl;
                storagePath = result.storagePath;
                fileSize = result.fileSize;
                fileType = result.fileType;
            }

            if (editingModuleResource) {
                await updateModuleResource(editingModuleResource.id, {
                    title: uploadForm.title,
                    description: uploadForm.description,
                    resourceType: uploadForm.resourceType,
                    visibleForBatches: uploadForm.visibleForBatches.length === 0 ? ["all"] : uploadForm.visibleForBatches,
                    isHidden: uploadForm.isHidden,
                    ...(file ? { fileUrl, storagePath, fileSize, fileType, fileName: file.name } : {}),
                });
            } else {
                if (!file) { alert("Please select a file to upload."); setIsUploading(false); return; }
                await addModuleResource({
                    moduleId: uploadingForModule.id,
                    moduleTitle: uploadingForModule.title,
                    teacherName: uploadingForModule.teacherName || uploadingForModule.uploadedByName,
                    teacherUid: user.uid,
                    title: uploadForm.title,
                    description: uploadForm.description,
                    resourceType: uploadForm.resourceType,
                    visibleForBatches: uploadForm.visibleForBatches.length === 0 ? ["all"] : uploadForm.visibleForBatches,
                    isHidden: uploadForm.isHidden,
                    fileUrl, storagePath, fileSize, fileType,
                    fileName: file.name,
                });
            }
            await fetchMyModuleResources();
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
        setMyModuleResources(prev => prev.map(r => r.id === res.id ? { ...r, isHidden: !res.isHidden } : r));
    };

    const handleDeleteModuleResource = async (res: ModuleResource) => {
        if (!confirm(`Delete "${res.title}"?`)) return;
        await deleteModuleResource(res.id, res.storagePath);
        setMyModuleResources(prev => prev.filter(r => r.id !== res.id));
    };

    const toggleBatch = (batch: string) => {
        setUploadForm(prev => ({
            ...prev,
            visibleForBatches: prev.visibleForBatches.includes(batch)
                ? prev.visibleForBatches.filter(b => b !== batch)
                : [...prev.visibleForBatches, batch]
        }));
    };

    // ─── My Modules: match strictly by teacherName only ────────────
    // We exclude uploadedByUid check because admin typically created all modules,
    // which would make all modules appear for admin on this page.
    const myModules = courseModules.filter(m => {
        const name = (m.teacherName || "").trim().toLowerCase();
        const me = (userProfile?.displayName || "").trim().toLowerCase();
        return name !== "" && name === me;
    });

    // ─── Existing Resource Library Handlers ────────────────────────
    const groupedResources = categories.map(category => ({
        category,
        resources: resources.filter(r => r.category === category)
    }));

    const handleAddResource = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setIsSubmitting(true);
        try {
            const file = resourceFileInputRef.current?.files?.[0];
            let fileUrl = editingResource?.fileUrl || newResource.fileUrl;
            let storagePath = editingResource?.storagePath || undefined;
            let fileName = editingResource?.fileName || undefined;

            if (file) {
                const result = await uploadResourceFile(
                    file, 
                    newResource.category, 
                    setResourceUploadProgress
                );
                fileUrl = result.fileUrl;
                storagePath = result.storagePath;
                fileName = result.fileName;
            } else if (!fileUrl) {
                alert("Please select a file to upload.");
                setIsSubmitting(false);
                return;
            }

            const resourceData = {
                title: newResource.title,
                category: newResource.category,
                uploadedByUid: editingResource ? editingResource.uploadedByUid : user.uid,
                uploadedByName: editingResource ? editingResource.uploadedByName : (userProfile?.displayName || user.displayName || "Unknown Teacher"),
                teacherName: newResource.teacherName?.trim() || undefined,
                fileUrl,
                storagePath,
                fileName,
                order: Number(newResource.order) || 0,
            };
            
            if (editingResource) {
                await updateResource(editingResource.id, resourceData);
            } else {
                await addResource(resourceData);
            }
            await fetchResources();
            handleCloseModal();
        } catch (error) {
            console.error("Failed to save resource", error);
            alert("Failed to save resource. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEditClick = (resource: Resource) => {
        setEditingResource(resource);
        setNewResource({ title: resource.title, category: resource.category, teacherName: resource.teacherName || "", fileUrl: resource.fileUrl, order: resource.order || 0 });
        setResourceUploadProgress(0);
        if (resourceFileInputRef.current) resourceFileInputRef.current.value = "";
        setIsModalOpen(true);
    };

    const handleDeleteClick = async (resource: Resource) => {
        if (confirm(`Delete "${resource.title}"?`)) {
            if (resource.storagePath) {
                await deleteResourceFile(resource.storagePath);
            }
            await deleteResource(resource.id);
            await fetchResources();
        }
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingResource(null);
        setNewResource({ title: "", category: "Course Module", teacherName: "", fileUrl: "", order: 0 });
        setResourceUploadProgress(0);
        if (resourceFileInputRef.current) resourceFileInputRef.current.value = "";
    };

    return (
        <div className="space-y-10">
            {/* ═══════════════════════════════════════════════════════
                PAGE HEADING
            ═══════════════════════════════════════════════════════ */}
            <div className="flex items-center gap-3">
                <div className="w-1 h-10 bg-[#059669] rounded-full"></div>
                <div>
                    <h1 className="text-3xl font-bold text-[#1f2937]">Resource Library</h1>
                    <p className="text-[#6b7280] mt-1">Course modules, class routines, and study materials</p>
                </div>
            </div>

            {/* ═══════════════════════════════════════════════════════
                SECTION 1: RESOURCE MANAGEMENT
            ═══════════════════════════════════════════════════════ */}
            <div className="space-y-6">
                {/* Section Header */}
                <div className="flex items-center gap-3">
                    <div className="w-1 h-8 bg-[#1e3a5f] rounded-full"></div>
                    <div>
                        <h2 className="text-xl font-bold text-[#1f2937]">Resource Management</h2>
                        <p className="text-[#6b7280] text-sm mt-0.5">Upload and manage your topic materials — presentations, notes, assignments</p>
                    </div>
                </div>

                {loading ? (
                    <div className="text-center py-10">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#1e3a5f]"></div>
                    </div>
                ) : myModules.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-10 text-center">
                        <div className="text-4xl mb-3">📂</div>
                        <p className="font-bold text-gray-700">No modules assigned to you</p>
                        <p className="text-gray-400 text-sm mt-1">Admin assigns Course Modules with teacher names in the Resource Library below.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {myModules.map(module => {
                            const moduleResources = myModuleResources.filter(r => r.moduleId === module.id);
                            const isExpanded = expandedModuleId === module.id;
                            return (
                                <div key={module.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                                    {/* Module Header */}
                                    <div
                                        className="flex items-center justify-between p-5 cursor-pointer hover:bg-gray-50 transition-colors"
                                        onClick={() => setExpandedModuleId(isExpanded ? null : module.id)}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="p-2.5 bg-[#1e3a5f]/10 text-[#1e3a5f] rounded-xl text-xl">📁</div>
                                            <div>
                                                <h3 className="font-bold text-gray-900">{module.title}</h3>
                                                <p className="text-xs text-gray-500 mt-0.5">Teacher: {module.teacherName || module.uploadedByName} &nbsp;·&nbsp; {moduleResources.length} files</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={e => { e.stopPropagation(); openUploadModal(module); }}
                                                className="px-3 py-1.5 bg-[#1e3a5f] text-white text-xs font-bold rounded-lg hover:bg-[#162e4a] transition-colors flex items-center gap-1"
                                            >
                                                <span>+</span> Upload File
                                            </button>
                                            <svg className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </div>
                                    </div>

                                    {/* Module Resources */}
                                    {isExpanded && (
                                        <div className="border-t border-gray-100">
                                            {moduleResources.length === 0 ? (
                                                <div className="p-6 text-center text-gray-400 text-sm">
                                                    No files uploaded yet. Click <strong>Upload File</strong> to add materials.
                                                </div>
                                            ) : (
                                                <div className="divide-y divide-gray-50">
                                                    {moduleResources.map(res => (
                                                        <div key={res.id} className={`flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors ${res.isHidden ? "opacity-50" : ""}`}>
                                                            <span className="text-2xl">{fileTypeIcon(res.fileType)}</span>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center gap-2 flex-wrap">
                                                                    <p className="font-semibold text-gray-900 text-sm">{res.title}</p>
                                                                    <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full border border-blue-100">{resourceTypeIcon[res.resourceType]} {res.resourceType}</span>
                                                                    {res.isHidden && <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full">Hidden</span>}
                                                                </div>
                                                                <div className="flex gap-3 mt-1 text-xs text-gray-400">
                                                                    <span>{res.fileSize}</span>
                                                                    <span>·</span>
                                                                    <span>Visible: {res.visibleForBatches.includes("all") ? "All Batches" : res.visibleForBatches.join(", ")}</span>
                                                                </div>
                                                            </div>
                                                            <div className="flex gap-2 shrink-0">
                                                                <a href={res.fileUrl} target="_blank" rel="noopener noreferrer" className="p-1.5 text-gray-400 hover:text-[#059669] hover:bg-emerald-50 rounded-lg transition-colors" title="View">
                                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                                                </a>
                                                                <button onClick={() => openEditModal(res)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit">
                                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                                                </button>
                                                                <button onClick={() => handleToggleHide(res)} className={`p-1.5 rounded-lg transition-colors ${res.isHidden ? "text-amber-500 hover:bg-amber-50" : "text-gray-400 hover:text-amber-600 hover:bg-amber-50"}`} title={res.isHidden ? "Show" : "Hide"}>
                                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                        {res.isHidden
                                                                            ? <><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></>
                                                                            : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                                                        }
                                                                    </svg>
                                                                </button>
                                                                <button onClick={() => handleDeleteModuleResource(res)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Divider */}
            <div className="border-t border-gray-200"></div>

            {/* ═══════════════════════════════════════════════════════
                SECTION 2: COURSE MODULE / RESOURCE LIBRARY (existing)
            ═══════════════════════════════════════════════════════ */}
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-1 h-8 bg-[#059669] rounded-full"></div>
                        <h2 className="text-xl font-bold text-[#1f2937]">Course Modules & Materials</h2>
                    </div>
                    {isAdmin && (
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="px-4 py-2 bg-[#059669] text-white font-semibold rounded-lg hover:bg-[#10b981] transition-colors inline-flex items-center gap-2"
                        >
                            <span className="text-lg">+</span> Add Resource
                        </button>
                    )}
                </div>

                {loading ? (
                    <div className="text-center py-20">
                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#059669]"></div>
                        <p className="mt-4 text-[#6b7280]">Loading resources...</p>
                    </div>
                ) : resources.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-lg shadow-sm">
                        <h3 className="text-lg font-medium text-gray-900">No resources yet</h3>
                    </div>
                ) : (
                    groupedResources.map(({ category, resources: categoryResources }) => (
                        categoryResources.length > 0 && (
                            <div key={category} className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-1 h-8 bg-[#059669] rounded-full"></div>
                                    <h3 className="text-xl font-bold text-[#1f2937]">{category}</h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {categoryResources.map((resource) => (
                                        <Card key={resource.id} className="hover:shadow-lg transition-shadow h-full relative group">
                                            <CardBody className="p-6 flex flex-col h-full">
                                                {isAdmin && (
                                                    <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                                        <button onClick={() => handleEditClick(resource)} className="p-1.5 bg-white shadow-sm border border-gray-100 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-all">
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                                        </button>
                                                        <button onClick={() => handleDeleteClick(resource)} className="p-1.5 bg-white shadow-sm border border-gray-100 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-all">
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                        </button>
                                                    </div>
                                                )}
                                                <h3 className="text-lg font-semibold text-[#1f2937] mb-3">{resource.title}</h3>
                                                <div className="space-y-2 mb-4 mt-auto">
                                                    <div className="flex items-center gap-2 text-sm text-[#6b7280]">
                                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>
                                                        <span>Teacher Name: {resource.teacherName || resource.uploadedByName}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-sm text-[#6b7280]">
                                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" /></svg>
                                                        <span>Date: {formatDateShort(resource.uploadDate)}</span>
                                                    </div>
                                                </div>
                                                <a href={resource.fileUrl} target="_blank" rel="noopener noreferrer" className="block w-full text-center px-4 py-3 bg-[#059669] text-white font-semibold rounded-lg hover:bg-[#10b981] transition-colors">
                                                    View / Download
                                                </a>
                                            </CardBody>
                                        </Card>
                                    ))}
                                </div>
                            </div>
                        )
                    ))
                )}
            </div>

            {/* ═══════════════════════════════════════════════════════
                UPLOAD / EDIT MODULE RESOURCE MODAL
            ═══════════════════════════════════════════════════════ */}
            {uploadModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => !isUploading && setUploadModalOpen(false)}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <div className="bg-gradient-to-r from-[#1e3a5f] to-[#2d5484] p-5 text-white rounded-t-2xl">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h3 className="text-lg font-bold">{editingModuleResource ? "Edit Resource" : "Upload Resource"}</h3>
                                    <p className="text-blue-200 text-sm mt-0.5">📁 {uploadingForModule?.title}</p>
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
                                <textarea value={uploadForm.description} onChange={e => setUploadForm(p => ({ ...p, description: e.target.value }))} rows={2} className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#1e3a5f] resize-none" placeholder="Brief description..." />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Resource Type *</label>
                                <select value={uploadForm.resourceType} onChange={e => setUploadForm(p => ({ ...p, resourceType: e.target.value as ResourceType }))} className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#1e3a5f]">
                                    {RESOURCE_TYPES.map(t => <option key={t} value={t}>{resourceTypeIcon[t]} {t}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    File {editingModuleResource ? "(leave empty to keep existing)" : "*"}
                                </label>
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
                                    {batchNames.length === 0 ? (
                                        <p className="text-xs text-gray-400">No batches found from All Batch Info</p>
                                    ) : batchNames.map(batch => (
                                        <button key={batch} type="button" onClick={() => toggleBatch(batch)} className={`px-3 py-1 text-xs font-semibold rounded-full border transition-all ${uploadForm.visibleForBatches.includes(batch) ? "bg-[#1e3a5f] text-white border-[#1e3a5f]" : "bg-white text-gray-600 border-gray-200 hover:border-[#1e3a5f] hover:text-[#1e3a5f]"}`}>
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
                                <label className="text-sm font-medium text-gray-700">
                                    {uploadForm.isHidden ? "Hidden (students won't see this)" : "Visible to students"}
                                </label>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => !isUploading && setUploadModalOpen(false)} className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors text-sm">Cancel</button>
                                <button type="submit" disabled={isUploading} className="flex-1 px-4 py-2.5 bg-[#1e3a5f] text-white font-bold rounded-xl hover:bg-[#162e4a] transition-colors disabled:opacity-60 text-sm">
                                    {isUploading ? "Uploading..." : editingModuleResource ? "Update" : "Upload"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ═══════════════════════════════════════════════════════
                ADD/EDIT RESOURCE LIBRARY ITEM MODAL (Admin only)
            ═══════════════════════════════════════════════════════ */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-[#1f2937]">{editingResource ? "Edit Resource" : "Add Resource"}</h2>
                            <button onClick={handleCloseModal} className="text-[#6b7280] hover:text-[#1f2937]">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <form onSubmit={handleAddResource} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-[#1f2937] mb-2">Resource Title *</label>
                                <input type="text" required value={newResource.title} onChange={e => setNewResource({ ...newResource, title: e.target.value })} className="w-full px-4 py-2 border border-[#e5e7eb] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#059669]" placeholder="Enter resource title" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[#1f2937] mb-2">Category *</label>
                                <select required value={newResource.category} onChange={e => setNewResource({ ...newResource, category: e.target.value as Resource["category"] })} className="w-full px-4 py-2 border border-[#e5e7eb] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#059669]">
                                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[#1f2937] mb-2">Teacher Name *</label>
                                <input type="text" required value={newResource.teacherName} onChange={e => setNewResource({ ...newResource, teacherName: e.target.value })} className="w-full px-4 py-2 border border-[#e5e7eb] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#059669]" placeholder="Enter teacher's name" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[#1f2937] mb-2">Display Order</label>
                                <input type="number" value={newResource.order} onChange={e => setNewResource({ ...newResource, order: parseInt(e.target.value) || 0 })} className="w-full px-4 py-2 border border-[#e5e7eb] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#059669]" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[#1f2937] mb-2">
                                    File {editingResource ? "(leave empty to keep existing)" : "*"}
                                </label>
                                <input 
                                    ref={resourceFileInputRef} 
                                    type="file" 
                                    accept=".pdf,.pptx,.ppt,.docx,.doc,.jpg,.jpeg,.png,.zip,.rar" 
                                    className="w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:font-semibold file:bg-[#059669] file:text-white hover:file:bg-[#10b981] cursor-pointer" 
                                />
                                {isSubmitting && resourceUploadProgress > 0 && (
                                    <div className="mt-2 text-sm text-[#059669] font-medium">
                                        Uploading... {resourceUploadProgress}%
                                    </div>
                                )}
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={handleCloseModal} className="flex-1 px-4 py-2 border border-[#e5e7eb] text-[#6b7280] font-medium rounded-lg hover:bg-[#f9fafb]">Cancel</button>
                                <button type="submit" disabled={isSubmitting} className="flex-1 px-4 py-2 bg-[#059669] text-white font-semibold rounded-lg hover:bg-[#10b981] disabled:opacity-50">
                                    {isSubmitting ? (editingResource ? "Updating..." : "Adding...") : (editingResource ? "Update Resource" : "Add Resource")}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
