"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { getAllResources, Resource } from "@/services/resourceService";
import {
    ModuleResource, ResourceType,
    uploadModuleResourceFile, addModuleResource, getModuleResourcesByTeacher,
    updateModuleResource, toggleModuleResourceVisibility, deleteModuleResource,
    getModuleResourcesByFolder,
} from "@/services/moduleResourceService";
import {
    ModuleFolder,
    addModuleFolder, getModuleFoldersByTeacher,
    updateModuleFolder, toggleModuleFolderVisibility, deleteModuleFolder,
} from "@/services/moduleFolderService";
import { getPublicUniqueBatches } from "@/services/batchInfoService";
import { useAuth } from "@/contexts/AuthContext";

// ─── Constants ─────────────────────────────────────────────────────────────
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

// ─── Folder Form State Type ─────────────────────────────────────────────────
interface FolderForm {
    title: string;
    description: string;
    visibleForBatches: string[];
    isHidden: boolean;
}

const defaultFolderForm = (): FolderForm => ({
    title: "", description: "", visibleForBatches: [], isHidden: false,
});

// ─── Upload Form State Type ─────────────────────────────────────────────────
interface UploadForm {
    title: string;
    description: string;
    resourceType: ResourceType;
    visibleForBatches: string[];
    isHidden: boolean;
}

const defaultUploadForm = (): UploadForm => ({
    title: "", description: "", resourceType: "Presentation", visibleForBatches: [], isHidden: false,
});

// ═══════════════════════════════════════════════════════════════════════════
//  Main Component
// ═══════════════════════════════════════════════════════════════════════════
export default function ResourceManagementPage() {
    const { user, userProfile } = useAuth();

    // ─── Data State ──────────────────────────────────────────────────────────
    const [courseModules, setCourseModules] = useState<Resource[]>([]);
    const [myFolders, setMyFolders] = useState<ModuleFolder[]>([]);
    const [myRootResources, setMyRootResources] = useState<ModuleResource[]>([]); // root-level (no folder)
    const [folderResources, setFolderResources] = useState<Record<string, ModuleResource[]>>({}); // folderId → files
    const [batchNames, setBatchNames] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);

    const [expandedFolderIds, setExpandedFolderIds] = useState<string[]>([]);

    // ─── Folder Modal State ──────────────────────────────────────────────────
    const [folderModal, setFolderModal] = useState(false);
    const [editingFolder, setEditingFolder] = useState<ModuleFolder | null>(null);
    const [folderForModule, setFolderForModule] = useState<Resource | null>(null);
    const [folderForm, setFolderForm] = useState<FolderForm>(defaultFolderForm());
    const [isSavingFolder, setIsSavingFolder] = useState(false);

    // ─── Upload Modal State ──────────────────────────────────────────────────
    const [uploadModal, setUploadModal] = useState(false);
    const [uploadingForModule, setUploadingForModule] = useState<Resource | null>(null);
    const [uploadingForFolder, setUploadingForFolder] = useState<ModuleFolder | null>(null); // null = root
    const [editingResource, setEditingResource] = useState<ModuleResource | null>(null);
    const [uploadForm, setUploadForm] = useState<UploadForm>(defaultUploadForm());
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // ─── My Modules: match by teacher name ───────────────────────────────────
    const myModules = courseModules.filter(m => {
        const name = (m.teacherName || "").trim().toLowerCase();
        const me = (userProfile?.displayName || "").trim().toLowerCase();
        return name !== "" && name === me;
    });

    // ─── Data Loading ────────────────────────────────────────────────────────
    const fetchAll = useCallback(async () => {
        if (!user) return;
        try {
            const [resourceData, foldersData, allTeacherFiles] = await Promise.all([
                getAllResources(),
                getModuleFoldersByTeacher(user.uid),
                getModuleResourcesByTeacher(user.uid),
            ]);
            
            setCourseModules(resourceData.filter(r => r.category === "Course Module"));
            setMyFolders(foldersData);
            setExpandedFolderIds(foldersData.map(f => f.id)); // Auto-expand all folders
            
            setMyRootResources(allTeacherFiles.filter(r => !r.folderId));
            
            // Pre-fill folderResources with files that belong to folders
            const fMap: Record<string, ModuleResource[]> = {};
            allTeacherFiles.filter(r => r.folderId).forEach(r => {
                if (!fMap[r.folderId!]) fMap[r.folderId!] = [];
                fMap[r.folderId!].push(r);
            });
            setFolderResources(fMap);
        } catch (error) {
            console.error("Failed to load data", error);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchAll();
        getPublicUniqueBatches().then(setBatchNames);
    }, [fetchAll]);

    // Load files inside a folder dynamically (fallback if needed)
    const loadFolderResources = useCallback(async (folderId: string) => {
        if (folderResources[folderId]) return;
        const files = await getModuleResourcesByFolder(folderId);
        setFolderResources(prev => ({ ...prev, [folderId]: files }));
    }, [folderResources]);

    const refreshFolderResources = async (folderId: string) => {
        const files = await getModuleResourcesByFolder(folderId);
        setFolderResources(prev => ({ ...prev, [folderId]: files }));
    };

    // ─── Folder Handlers ─────────────────────────────────────────────────────
    const openCreateFolder = (moduleData: Resource) => {
        setEditingFolder(null);
        setFolderForModule(moduleData);
        setFolderForm(defaultFolderForm());
        setFolderModal(true);
    };

    const openEditFolder = (folder: ModuleFolder) => {
        const mod = courseModules.find(m => m.id === folder.moduleId) || null;
        setEditingFolder(folder);
        setFolderForModule(mod);
        setFolderForm({
            title: folder.title,
            description: folder.description || "",
            visibleForBatches: folder.visibleForBatches,
            isHidden: folder.isHidden,
        });
        setFolderModal(true);
    };

    const handleSaveFolder = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !folderForModule) return;
        setIsSavingFolder(true);
        try {
            const payload = {
                moduleId: folderForModule.id,
                moduleTitle: folderForModule.title,
                teacherUid: user.uid,
                teacherName: userProfile?.displayName || "",
                title: folderForm.title,
                description: folderForm.description,
                visibleForBatches: folderForm.visibleForBatches.length === 0 ? ["all"] : folderForm.visibleForBatches,
                isHidden: folderForm.isHidden,
            };
            if (editingFolder) {
                await updateModuleFolder(editingFolder.id, payload);
            } else {
                await addModuleFolder(payload);
            }
            await fetchAll();
            setFolderModal(false);
        } catch (err) {
            console.error("Folder save error:", err);
            alert("Failed to save folder.");
        } finally {
            setIsSavingFolder(false);
        }
    };

    const handleToggleFolderVisibility = async (folder: ModuleFolder) => {
        await toggleModuleFolderVisibility(folder.id, !folder.isHidden);
        setMyFolders(prev => prev.map(f => f.id === folder.id ? { ...f, isHidden: !folder.isHidden } : f));
    };

    const handleDeleteFolder = async (folder: ModuleFolder) => {
        if (!confirm(`"${folder.title}" ফোল্ডার এবং এর সব ফাইল মুছে যাবে। নিশ্চিত?`)) return;
        // Delete all files in folder
        const files = folderResources[folder.id] || await getModuleResourcesByFolder(folder.id);
        await Promise.all(files.map(f => deleteModuleResource(f.id, f.storagePath)));
        setMyFolders(prev => prev.filter(f => f.id !== folder.id));
        setExpandedFolderIds(prev => prev.filter(id => id !== folder.id));
        setFolderResources(prev => { const next = { ...prev }; delete next[folder.id]; return next; });
    };

    // ─── Upload Handlers ─────────────────────────────────────────────────────
    const openUploadModal = (moduleData: Resource, folder: ModuleFolder | null) => {
        setUploadingForModule(moduleData);
        setUploadingForFolder(folder);
        setEditingResource(null);
        setUploadForm(defaultUploadForm());
        if (fileInputRef.current) fileInputRef.current.value = "";
        setUploadProgress(0);
        setUploadModal(true);
    };

    const openEditResourceModal = (res: ModuleResource) => {
        const mod = courseModules.find(m => m.id === res.moduleId) || null;
        const folder = res.folderId ? (myFolders.find(f => f.id === res.folderId) || null) : null;
        setUploadingForModule(mod);
        setUploadingForFolder(folder);
        setEditingResource(res);
        setUploadForm({
            title: res.title,
            description: res.description || "",
            resourceType: res.resourceType,
            visibleForBatches: res.visibleForBatches,
            isHidden: res.isHidden,
        });
        if (fileInputRef.current) fileInputRef.current.value = "";
        setUploadProgress(0);
        setUploadModal(true);
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
                const uploadPath = uploadingForFolder
                    ? `${uploadingForModule.title}_${uploadingForFolder.title}`
                    : uploadingForModule.title;
                const result = await uploadModuleResourceFile(file, uploadPath, setUploadProgress);
                fileUrl = result.fileUrl;
                storagePath = result.storagePath;
                fileSize = result.fileSize;
                fileType = result.fileType;
            }

            const batchList = uploadForm.visibleForBatches.length === 0 ? ["all"] : uploadForm.visibleForBatches;

            if (editingResource) {
                await updateModuleResource(editingResource.id, {
                    title: uploadForm.title,
                    description: uploadForm.description,
                    resourceType: uploadForm.resourceType,
                    visibleForBatches: batchList,
                    isHidden: uploadForm.isHidden,
                    ...(file ? { fileUrl, storagePath, fileSize, fileType, fileName: file.name } : {}),
                });
                // Refresh appropriate list
                if (editingResource.folderId) {
                    await refreshFolderResources(editingResource.folderId);
                } else {
                    const rootFiles = await getModuleResourcesByTeacher(user.uid);
                    setMyRootResources(rootFiles.filter(r => !r.folderId));
                }
            } else {
                if (!file) { alert("Please select a file to upload."); setIsUploading(false); return; }
                await addModuleResource({
                    moduleId: uploadingForModule.id,
                    moduleTitle: uploadingForModule.title,
                    teacherName: uploadingForModule.teacherName || uploadingForModule.uploadedByName,
                    teacherUid: user.uid,
                    folderId: uploadingForFolder?.id || null,
                    title: uploadForm.title,
                    description: uploadForm.description,
                    resourceType: uploadForm.resourceType,
                    visibleForBatches: batchList,
                    isHidden: uploadForm.isHidden,
                    fileUrl, storagePath, fileSize, fileType,
                    fileName: file.name,
                });
                // Refresh appropriate list
                if (uploadingForFolder) {
                    await refreshFolderResources(uploadingForFolder.id);
                } else {
                    const rootFiles = await getModuleResourcesByTeacher(user.uid);
                    setMyRootResources(rootFiles.filter(r => !r.folderId));
                }
            }

            setUploadModal(false);
            setUploadProgress(0);
        } catch (err) {
            console.error("Upload error:", err);
            alert("Upload failed. Please try again.");
        } finally {
            setIsUploading(false);
        }
    };

    const handleToggleResourceVisibility = async (res: ModuleResource) => {
        await toggleModuleResourceVisibility(res.id, !res.isHidden);
        if (res.folderId) {
            setFolderResources(prev => ({
                ...prev,
                [res.folderId!]: (prev[res.folderId!] || []).map(r =>
                    r.id === res.id ? { ...r, isHidden: !res.isHidden } : r
                ),
            }));
        } else {
            setMyRootResources(prev => prev.map(r => r.id === res.id ? { ...r, isHidden: !res.isHidden } : r));
        }
    };

    const handleDeleteResource = async (res: ModuleResource) => {
        if (!confirm(`"${res.title}" ফাইলটি মুছে ফেলা হবে। নিশ্চিত?`)) return;
        await deleteModuleResource(res.id, res.storagePath);
        if (res.folderId) {
            setFolderResources(prev => ({
                ...prev,
                [res.folderId!]: (prev[res.folderId!] || []).filter(r => r.id !== res.id),
            }));
        } else {
            setMyRootResources(prev => prev.filter(r => r.id !== res.id));
        }
    };

    // ─── Batch Toggle Helpers ─────────────────────────────────────────────────
    const toggleBatchInForm = (batch: string, form: any, setForm: any) => {
        setForm((prev: any) => ({
            ...prev,
            visibleForBatches: prev.visibleForBatches.includes(batch)
                ? prev.visibleForBatches.filter((b: string) => b !== batch)
                : [...prev.visibleForBatches, batch],
        }));
    };

    // ─── Render helpers ───────────────────────────────────────────────────────
    const renderFileRow = (res: ModuleResource) => (
        <div key={res.id} className={`flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 transition-colors ${res.isHidden ? "opacity-50" : ""}`}>
            <span className="text-2xl flex-shrink-0">{fileTypeIcon(res.fileType)}</span>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-gray-900 text-sm">{res.title}</p>
                    <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full border border-blue-100">{resourceTypeIcon[res.resourceType]} {res.resourceType}</span>
                    {res.isHidden && <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full">Hidden</span>}
                </div>
                <div className="flex gap-3 mt-0.5 text-xs text-gray-400 flex-wrap">
                    <span>{res.fileSize}</span>
                    <span>·</span>
                    <span>Visible: {res.visibleForBatches.includes("all") ? "All Batches" : res.visibleForBatches.join(", ")}</span>
                </div>
            </div>
            <div className="flex gap-1.5 shrink-0">
                <a href={res.fileUrl} target="_blank" rel="noopener noreferrer" className="p-1.5 text-gray-400 hover:text-[#059669] hover:bg-emerald-50 rounded-lg transition-colors" title="View">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                </a>
                <button onClick={() => openEditResourceModal(res)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                </button>
                <button onClick={() => handleToggleResourceVisibility(res)} className={`p-1.5 rounded-lg transition-colors ${res.isHidden ? "text-amber-500 hover:bg-amber-50" : "text-gray-400 hover:text-amber-600 hover:bg-amber-50"}`} title={res.isHidden ? "Show" : "Hide"}>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        {res.isHidden
                            ? <><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></>
                            : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        }
                    </svg>
                </button>
                <button onClick={() => handleDeleteResource(res)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
            </div>
        </div>
    );

    const renderBatchPicker = (form: any, setForm: any) => (
        <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
                Visible for Batches
                <span className="ml-2 text-xs font-normal text-gray-400">(select না করলে সব batch দেখবে)</span>
            </label>
            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto border border-gray-200 rounded-xl p-3">
                {batchNames.length === 0 ? (
                    <p className="text-xs text-gray-400">No batches found</p>
                ) : batchNames.map(batch => (
                    <button key={batch} type="button" onClick={() => toggleBatchInForm(batch, form, setForm)}
                        className={`px-3 py-1 text-xs font-semibold rounded-full border transition-all ${form.visibleForBatches.includes(batch) ? "bg-[#1e3a5f] text-white border-[#1e3a5f]" : "bg-white text-gray-600 border-gray-200 hover:border-[#1e3a5f] hover:text-[#1e3a5f]"}`}>
                        {batch}
                    </button>
                ))}
            </div>
            {form.visibleForBatches.length > 0 && (
                <p className="text-xs text-[#1e3a5f] mt-1 font-medium">Selected: {form.visibleForBatches.join(", ")}</p>
            )}
        </div>
    );

    // ─── Main Render ──────────────────────────────────────────────────────────
    return (
        <div className="space-y-8">
            {/* Page Header */}
            <div className="flex items-center gap-3">
                <div className="w-1 h-10 bg-[#1e3a5f] rounded-full"></div>
                <div>
                    <h1 className="text-3xl font-bold text-[#1f2937]">Resource Management</h1>
                    <p className="text-[#6b7280] mt-1">Upload and manage your topic materials — presentations, notes, assignments</p>
                </div>
            </div>

            {/* Modules */}
            {loading ? (
                <div className="text-center py-16">
                    <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-[#1e3a5f]"></div>
                    <p className="mt-3 text-gray-500">Loading your modules...</p>
                </div>
            ) : myModules.length === 0 ? (
                <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-14 text-center">
                    <div className="text-5xl mb-4">📂</div>
                    <p className="font-bold text-gray-700 text-lg">No modules assigned to you</p>
                    <p className="text-gray-400 text-sm mt-2 max-w-sm mx-auto">Admin assigns Course Modules with teacher names. Once assigned, your modules will appear here.</p>
                </div>
            ) : (
                <div className="space-y-5">
                    {myModules.map(moduleData => {
                        const moduleFolders = myFolders.filter(f => f.moduleId === moduleData.id);
                        const moduleRootFiles = myRootResources.filter(r => r.moduleId === moduleData.id);
                        return (
                            <div key={moduleData.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                                {/* ── Module Header ── */}
                                <div
                                    className="flex items-center justify-between p-5 bg-gray-50 border-b border-gray-100"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="p-2.5 bg-[#1e3a5f]/10 text-[#1e3a5f] rounded-xl text-xl">📁</div>
                                        <div>
                                            <h3 className="font-bold text-gray-900">{moduleData.title}</h3>
                                            <p className="text-xs text-gray-500 mt-0.5">
                                                Teacher: {moduleData.teacherName || moduleData.uploadedByName}
                                                &nbsp;·&nbsp;
                                                {moduleFolders.length} folder{moduleFolders.length !== 1 ? "s" : ""}
                                                &nbsp;·&nbsp;
                                                {moduleRootFiles.length} root file{moduleRootFiles.length !== 1 ? "s" : ""}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {/* Create Folder button */}
                                        <button
                                            onClick={e => { e.stopPropagation(); openCreateFolder(moduleData); }}
                                            className="px-3 py-1.5 bg-purple-600 text-white text-xs font-bold rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-1"
                                        >
                                            <span>📁</span> New Folder
                                        </button>
                                        {/* Upload to root button */}
                                        <button
                                            onClick={e => { e.stopPropagation(); openUploadModal(moduleData, null); }}
                                            className="px-3 py-1.5 bg-[#1e3a5f] text-white text-xs font-bold rounded-lg hover:bg-[#162e4a] transition-colors flex items-center gap-1"
                                        >
                                            <span>+</span> Upload File
                                        </button>
                                        <svg className="w-5 h-5 text-[#059669]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                </div>

                                {/* ── Module Body (Always Expanded) ── */}
                                <div className="border-t border-gray-100">

                                    {/* ── Folders ── */}
                                    {moduleFolders.map(folder => {
                                        const isFolderExpanded = expandedFolderIds.includes(folder.id);
                                        const folderFiles = folderResources[folder.id] || [];

                                        return (
                                            <div key={folder.id} className="border-b border-gray-50 last:border-b-0">
                                                {/* Folder Row */}
                                                <div
                                                    className={`flex items-center gap-3 px-5 py-3.5 bg-white hover:bg-gray-50 transition-colors cursor-pointer ${folder.isHidden ? "opacity-60" : ""}`}
                                                    onClick={async () => {
                                                        setExpandedFolderIds(prev => 
                                                            prev.includes(folder.id) ? prev.filter(id => id !== folder.id) : [...prev, folder.id]
                                                        );
                                                        await loadFolderResources(folder.id);
                                                    }}
                                                >
                                                    <span className="text-xl">{isFolderExpanded ? "📂" : "📁"}</span>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                <span className="font-bold text-gray-800 text-sm">{folder.title}</span>
                                                                {folder.isHidden && <span className="text-xs px-2 py-0.5 bg-gray-200 text-gray-500 rounded-full">Hidden</span>}
                                                                <span className="text-xs text-gray-400">
                                                                    Visible: {folder.visibleForBatches.includes("all") ? "All Batches" : folder.visibleForBatches.join(", ")}
                                                                </span>
                                                            </div>
                                                            {folder.description && <p className="text-xs text-gray-400 mt-0.5 truncate">{folder.description}</p>}
                                                        </div>
                                                        <div className="flex items-center gap-1.5 shrink-0" onClick={e => e.stopPropagation()}>
                                                            {/* Upload to folder */}
                                                            <button onClick={() => openUploadModal(myModules.find(m => m.id === folder.moduleId)!, folder)} className="px-2.5 py-1 bg-[#1e3a5f] text-white text-xs font-bold rounded-lg hover:bg-[#162e4a] transition-colors flex items-center gap-1">
                                                                <span>+</span> Upload
                                                            </button>
                                                            {/* Edit folder */}
                                                            <button onClick={() => openEditFolder(folder)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit Folder">
                                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                                            </button>
                                                            {/* Hide/Show folder */}
                                                            <button onClick={() => handleToggleFolderVisibility(folder)} className={`p-1.5 rounded-lg transition-colors ${folder.isHidden ? "text-amber-500 hover:bg-amber-50" : "text-gray-400 hover:text-amber-600 hover:bg-amber-50"}`} title={folder.isHidden ? "Show Folder" : "Hide Folder"}>
                                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    {folder.isHidden
                                                                        ? <><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></>
                                                                        : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                                                    }
                                                                </svg>
                                                            </button>
                                                            {/* Delete folder */}
                                                            <button onClick={() => handleDeleteFolder(folder)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete Folder">
                                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                            </button>
                                                            <svg className={`w-4 h-4 text-gray-400 transition-transform ${isFolderExpanded ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                            </svg>
                                                        </div>
                                                    </div>

                                                    {/* Folder Files */}
                                                    {isFolderExpanded && (
                                                        <div className="bg-white border-t border-gray-50 pl-8">
                                                            {folderFiles.length === 0 ? (
                                                                <div className="py-5 px-5 text-sm text-gray-400">
                                                                    No files in this folder yet. Click <strong>Upload</strong> to add.
                                                                </div>
                                                            ) : (
                                                                <div className="divide-y divide-gray-50">
                                                                    {folderFiles.map(renderFileRow)}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}

                                        {/* ── Root-level files ── */}
                                        {moduleRootFiles.length > 0 && (
                                            <div className="border-t border-gray-100">
                                                <div className="px-5 py-2 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                                    Root Files (no folder)
                                                </div>
                                                <div className="divide-y divide-gray-50">
                                                    {moduleRootFiles.map(renderFileRow)}
                                                </div>
                                            </div>
                                        )}

                                    {/* Empty state */}
                                    {moduleFolders.length === 0 && moduleRootFiles.length === 0 && (
                                        <div className="py-10 text-center text-sm text-gray-400">
                                            কোনো ফোল্ডার বা ফাইল নেই। উপরের বাটন দিয়ে ফোল্ডার বা ফাইল যোগ করুন।
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ══════════════════════════════════════════════════════════════
                FOLDER CREATE / EDIT MODAL
            ══════════════════════════════════════════════════════════════ */}
            {folderModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => !isSavingFolder && setFolderModal(false)}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <div className="bg-gradient-to-r from-purple-700 to-purple-500 p-5 text-white rounded-t-2xl">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h3 className="no-gradient text-lg font-bold text-white">{editingFolder ? "Edit Folder" : "Create New Folder"}</h3>
                                    <p className="text-purple-200 text-sm mt-0.5">📁 {folderForModule?.title}</p>
                                </div>
                                <button onClick={() => !isSavingFolder && setFolderModal(false)} className="text-white/80 hover:text-white text-2xl">✕</button>
                            </div>
                        </div>
                        <form onSubmit={handleSaveFolder} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Folder Name *</label>
                                <input
                                    type="text" required
                                    value={folderForm.title}
                                    onChange={e => setFolderForm(p => ({ ...p, title: e.target.value }))}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-500"
                                    placeholder="e.g. MS Word, MS Excel, Basic Concepts..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Description (optional)</label>
                                <textarea
                                    value={folderForm.description}
                                    onChange={e => setFolderForm(p => ({ ...p, description: e.target.value }))}
                                    rows={2}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                                    placeholder="Brief description of this folder..."
                                />
                            </div>
                            {renderBatchPicker(folderForm, setFolderForm)}
                            <div className="flex items-center gap-3">
                                <button type="button" onClick={() => setFolderForm(p => ({ ...p, isHidden: !p.isHidden }))} className={`w-10 h-6 rounded-full transition-colors relative ${folderForm.isHidden ? "bg-gray-300" : "bg-purple-600"}`}>
                                    <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${folderForm.isHidden ? "left-1" : "left-5"}`}></span>
                                </button>
                                <label className="text-sm font-medium text-gray-700">
                                    {folderForm.isHidden ? "Hidden (students won't see this folder)" : "Visible to students"}
                                </label>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => !isSavingFolder && setFolderModal(false)} className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors text-sm">Cancel</button>
                                <button type="submit" disabled={isSavingFolder} className="flex-1 px-4 py-2.5 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 transition-colors disabled:opacity-60 text-sm">
                                    {isSavingFolder ? "Saving..." : editingFolder ? "Update Folder" : "Create Folder"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ══════════════════════════════════════════════════════════════
                FILE UPLOAD / EDIT MODAL
            ══════════════════════════════════════════════════════════════ */}
            {uploadModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => !isUploading && setUploadModal(false)}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <div className="bg-gradient-to-r from-[#1e3a5f] to-[#2d5484] p-5 text-white rounded-t-2xl">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h3 className="no-gradient text-lg font-bold text-white">{editingResource ? "Edit Resource" : "Upload File"}</h3>
                                    <p className="text-blue-200 text-sm mt-0.5">
                                        📁 {uploadingForModule?.title}
                                        {uploadingForFolder && <span> → {uploadingForFolder.title}</span>}
                                        {!uploadingForFolder && <span className="text-blue-300"> (Root)</span>}
                                    </p>
                                </div>
                                <button onClick={() => !isUploading && setUploadModal(false)} className="text-white/80 hover:text-white text-2xl">✕</button>
                            </div>
                        </div>
                        <form onSubmit={handleUploadSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Title *</label>
                                <input type="text" required value={uploadForm.title} onChange={e => setUploadForm(p => ({ ...p, title: e.target.value }))} className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#1e3a5f]" placeholder="e.g. Lecture 01 - Introduction" />
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
                                <label className="block text-sm font-semibold text-gray-700 mb-1">
                                    File {editingResource ? "(leave empty to keep existing)" : "*"}
                                </label>
                                <input ref={fileInputRef} type="file" accept=".pdf,.pptx,.ppt,.docx,.doc,.jpg,.jpeg,.png" className="w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:font-semibold file:bg-[#1e3a5f] file:text-white hover:file:bg-[#162e4a] cursor-pointer" />
                                {isUploading && uploadProgress > 0 && (
                                    <div className="mt-2">
                                        <div className="flex justify-between text-xs text-gray-500 mb-1"><span>Uploading...</span><span>{uploadProgress}%</span></div>
                                        <div className="w-full bg-gray-100 rounded-full h-2"><div className="bg-[#1e3a5f] h-2 rounded-full transition-all" style={{ width: `${uploadProgress}%` }}></div></div>
                                    </div>
                                )}
                            </div>
                            {renderBatchPicker(uploadForm, setUploadForm)}
                            <div className="flex items-center gap-3">
                                <button type="button" onClick={() => setUploadForm(p => ({ ...p, isHidden: !p.isHidden }))} className={`w-10 h-6 rounded-full transition-colors relative ${uploadForm.isHidden ? "bg-gray-300" : "bg-[#059669]"}`}>
                                    <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${uploadForm.isHidden ? "left-1" : "left-5"}`}></span>
                                </button>
                                <label className="text-sm font-medium text-gray-700">
                                    {uploadForm.isHidden ? "Hidden (students won't see this)" : "Visible to students"}
                                </label>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => !isUploading && setUploadModal(false)} className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors text-sm">Cancel</button>
                                <button type="submit" disabled={isUploading} className="flex-1 px-4 py-2.5 bg-[#1e3a5f] text-white font-bold rounded-xl hover:bg-[#162e4a] transition-colors disabled:opacity-60 text-sm">
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
