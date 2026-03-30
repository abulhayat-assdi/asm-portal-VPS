"use client";

import { useState, useEffect } from "react";
import { getAllResources, Resource } from "@/services/resourceService";
import { getModuleResourcesByTitle, ModuleResource } from "@/services/moduleResourceService";
import { useAuth } from "@/contexts/AuthContext";

const FolderIcon = ({ className }: { className: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v8.25m19.5 0v5.25a2.25 2.25 0 0 1-2.25 2.25H4.5A2.25 2.25 0 0 1 2.25 19.5V6" />
    </svg>
);
const EyeIcon = ({ className }: { className: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
);
const DocumentArrowDownIcon = ({ className }: { className: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
    </svg>
);

const resourceTypeIcon: Record<string, string> = {
    Presentation: "📊", Notes: "📝", Assignment: "📋", Practice: "🎯", Other: "📎",
};

const fileTypeIcon = (ft: string) => {
    if (ft === "pdf") return "📄";
    if (["pptx", "ppt"].includes(ft)) return "📊";
    if (["docx", "doc"].includes(ft)) return "📃";
    if (ft === "image") return "🖼️";
    return "📎";
};

export default function StudentResourcePage() {
    const { userProfile } = useAuth();
    const studentBatch = userProfile?.studentBatchName || "";

    const [courseModules, setCourseModules] = useState<Resource[]>([]);
    const [loading, setLoading] = useState(true);

    // Active folder state
    const [activeModule, setActiveModule] = useState<Resource | null>(null);
    const [moduleResources, setModuleResources] = useState<ModuleResource[]>([]);
    const [resourcesLoading, setResourcesLoading] = useState(false);

    useEffect(() => {
        const fetch = async () => {
            try {
                const data = await getAllResources();
                setCourseModules(data.filter(r => r.category === "Course Module"));
            } catch (error) {
                console.error("Failed to fetch resources:", error);
            } finally {
                setLoading(false);
            }
        };
        fetch();
    }, []);

    const handleFolderClick = async (module: Resource) => {
        setActiveModule(module);
        setResourcesLoading(true);
        try {
            const all = await getModuleResourcesByTitle(module.title);
            // Filter: not hidden AND (batch matches OR visible for all)
            const filtered = all.filter(r => {
                if (r.isHidden) return false;
                if (r.visibleForBatches.includes("all")) return true;
                if (studentBatch && r.visibleForBatches.includes(studentBatch)) return true;
                return false;
            });
            setModuleResources(filtered);
        } catch (err) {
            console.error("Failed to fetch module resources:", err);
            setModuleResources([]);
        } finally {
            setResourcesLoading(false);
        }
    };

    // Group filtered resources by resourceType
    const groupedByType = moduleResources.reduce((acc, r) => {
        if (!acc[r.resourceType]) acc[r.resourceType] = [];
        acc[r.resourceType].push(r);
        return acc;
    }, {} as Record<string, ModuleResource[]>);

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#059669]"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto pb-12">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-1 h-10 bg-[#059669] rounded-full"></div>
                    <div>
                        <h1 className="text-3xl font-bold text-[#1f2937]">Course Resources</h1>
                        <p className="text-[#6b7280] mt-1">
                            Browse and download your study materials categorized by subject and topics.
                        </p>
                    </div>
                </div>
            </div>

            {/* Subject Folders */}
            {!activeModule ? (
                courseModules.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200">
                        <div className="text-4xl mb-3">📂</div>
                        <h3 className="text-lg font-bold text-gray-700">No Course Modules yet</h3>
                        <p className="text-gray-400 text-sm mt-1">Teacher portal এ Course Module যোগ করলে এখানে দেখা যাবে।</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {courseModules.map((module, idx) => (
                            <div
                                key={idx}
                                onClick={() => handleFolderClick(module)}
                                className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md hover:border-[#059669]/30 transition-all duration-300 cursor-pointer group flex items-start gap-4"
                            >
                                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:scale-110 transition-transform">
                                    <FolderIcon className="w-8 h-8" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 group-hover:text-[#059669] transition-colors">{module.title}</h3>
                                    <p className="text-sm text-gray-500 mt-1">👤 {module.teacherName || module.uploadedByName}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )
            ) : (
                <div className="space-y-6">
                    {/* Back Button and Active Module Header */}
                    <div className="flex items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                        <button
                            onClick={() => { setActiveModule(null); setModuleResources([]); }}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600 flex items-center gap-2 font-medium text-sm"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            Back to Subjects
                        </button>
                        <div className="h-6 w-px bg-gray-200"></div>
                        <h2 className="text-lg font-bold text-[#059669] flex flex-wrap items-center gap-2">
                            <FolderIcon className="w-5 h-5" />
                            {activeModule.title}
                        </h2>
                        <span className="ml-auto text-xs text-gray-400 hidden sm:block">
                            👤 {activeModule.teacherName || activeModule.uploadedByName}
                        </span>
                    </div>

                    {resourcesLoading ? (
                        <div className="text-center py-16">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#059669] mx-auto"></div>
                            <p className="text-gray-500 mt-3 text-sm">Loading materials...</p>
                        </div>
                    ) : moduleResources.length === 0 ? (
                        <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-50 mb-4">
                                <DocumentArrowDownIcon className="w-8 h-8 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">No materials available</h3>
                            <p className="text-gray-500 mt-1 text-sm">This module has no resources for your batch yet. Check back later.</p>
                        </div>
                    ) : (
                        Object.keys(groupedByType).map(type => (
                            <div key={type} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
                                <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                                    <h3 className="text-md font-bold text-gray-800 flex items-center gap-2">
                                        <span>{resourceTypeIcon[type] || "📎"}</span>
                                        <span className="uppercase tracking-widest">{type}</span>
                                    </h3>
                                    <span className="text-xs font-semibold bg-white px-3 py-1 rounded-full border border-gray-200 text-gray-500">
                                        {groupedByType[type].length} Items
                                    </span>
                                </div>
                                <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {groupedByType[type].map(resource => (
                                        <div key={resource.id} className="border border-gray-100 hover:border-[#059669]/30 rounded-xl p-5 hover:shadow-md transition-all flex flex-col justify-between bg-white group">
                                            <div>
                                                <div className="flex justify-between items-start gap-2 mb-3">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xl">{fileTypeIcon(resource.fileType)}</span>
                                                        <h4 className="font-bold text-gray-900 group-hover:text-[#059669] transition-colors leading-tight">
                                                            {resource.title}
                                                        </h4>
                                                    </div>
                                                </div>
                                                {resource.description && (
                                                    <p className="text-sm text-gray-500 line-clamp-2 mb-3">
                                                        {resource.description}
                                                    </p>
                                                )}
                                                <p className="text-xs text-gray-400">{resource.fileSize}</p>
                                            </div>

                                            <div className="pt-4 border-t border-gray-50 flex items-center justify-between mt-auto">
                                                <div className="text-xs text-gray-400 font-medium">
                                                    {resource.teacherName}
                                                </div>
                                                <div className="flex gap-2">
                                                    <a
                                                        href={resource.fileUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="p-2 text-[#059669] bg-emerald-50 hover:bg-[#059669] hover:text-white rounded-lg transition-colors shrink-0"
                                                        title="View"
                                                    >
                                                        <EyeIcon className="w-5 h-5" />
                                                    </a>
                                                    <a
                                                        href={resource.fileUrl}
                                                        download
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="px-3 py-2 text-sm font-semibold text-[#059669] bg-emerald-50 hover:bg-[#059669] hover:text-white rounded-lg transition-colors shrink-0 flex items-center gap-1.5"
                                                    >
                                                        <DocumentArrowDownIcon className="w-4 h-4" />
                                                        Download
                                                    </a>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
