"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Card, { CardBody } from "@/components/ui/Card";
import { formatDateShort } from "@/lib/utils";
import { useConfirm } from "@/contexts/ConfirmContext";
import {
    getAllResources, addResource, updateResource, deleteResource,
    uploadResourceFile, deleteResourceFile, Resource
} from "@/services/resourceService";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";

const categories: Resource["category"][] = [
    "Course Module",
    "Class Routine",
    "Notes",
    "Assignment",
    "Exam / Practice"
];

const staticCourseModules = [
    {
        title: "Sales Mastery",
        description: "Face-to-Face এবং অনলাইনে কনফিডেন্টলি প্রোডাক্ট সেল করার সাইকোলজি আয়ত্ত করা।",
        teacherName: "Mohammad Abu Zabar Rezvhe",
        publishedDate: "13/04/2026",
        slug: "sales-mastery"
    },
    {
        title: "Career Planning & Branding",
        description: "Winning CV তৈরি করা যা সহজেই ইন্টারভিউ কল নিয়ে আসবে এবং নিজেকে Personal Brand হিসেবে এস্টাবলিশ করা।",
        teacherName: "Golam Kibria",
        publishedDate: "13/04/2026",
        slug: "career-planning-branding"
    },
    {
        title: "Customer Service Excellence",
        description: "রাগান্বিত কাস্টমারকেও আপনার ব্র্যান্ডের লয়্যাল ফ্যানে পরিণত করার সাইকোলজিক্যাল টেকনিক।",
        teacherName: "Maksud Al-Hasan",
        publishedDate: "13/04/2026",
        slug: "customer-service-excellence"
    },
    {
        title: "AI for Digital Marketers",
        description: "লেটেস্ট AI Tools ব্যবহার করে কাজের স্পিড এবং প্রোডাক্টিভিটি 10x বাড়িয়ে ফেলা।",
        teacherName: "Ehasanul Haque",
        publishedDate: "13/04/2026",
        slug: "ai-for-digital-marketers"
    },
    {
        title: "Digital Marketing",
        description: "ম্যাক্সিমাম ROI-এর জন্য Meta Ads (Facebook & Instagram) এর নাড়িভুঁড়ি আয়ত্ত করা।",
        teacherName: "Nazmul Hasan",
        publishedDate: "13/04/2026",
        slug: "digital-marketing"
    },
    {
        title: "Business Management Tools (MS Office)",
        description: "ডেটা ট্র্যাকিং, সেলস রিপোর্ট এবং ফ্ললেস কর্পোরেট ডকুমেন্টেশনের জন্য MS Word/Excel-এ প্রো হয়ে ওঠা।",
        teacherName: "Abul Hayat",
        publishedDate: "13/04/2026",
        slug: "business-management-tools"
    },
    {
        title: "Landing Page & Content Marketing",
        description: "High-Converting Landing Page ডিজাইন করা যা ভিজিটরকে পেইং কাস্টমারে রূপান্তর করবে।",
        teacherName: "Shahidur Rahman",
        publishedDate: "13/04/2026",
        slug: "landing-page-content-marketing"
    },
    {
        title: "Business English",
        description: "উচ্চারণ ও গ্রামারের ভয় কাটিয়ে প্রফেশনাল ইংলিশে স্মার্টলি কমিউনিকেট করা।",
        teacherName: "Ataur Rahman",
        publishedDate: "13/04/2026",
        slug: "business-english"
    },
    {
        title: "Dawah & Business Ethics",
        description: "বিজনেসের প্রতিদিনের ডিসিশনে ইখলাস (Sincerity) এবং শতভাগ সততা অ্যাপ্লাই করা।",
        teacherName: "Talebpur Rahman",
        publishedDate: "13/04/2026",
        slug: "dawah-business-ethics"
    }
];

export default function CourseModulesPage() {
    const confirm = useConfirm();
    const { user, userProfile } = useAuth();
    const isAdmin = userProfile?.role === "admin" || userProfile?.role === "super_admin";

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
        fileUrl: "",
        order: 0,
    });

    const fetchResources = useCallback(async () => {
        try {
            const data = await getAllResources();
            // Filter out 'Course Module' since we use hardcoded ones now
            setResources(data.filter(r => r.category !== "Course Module"));
        } catch (error) {
            console.error("Failed to load resources", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchResources();
    }, [fetchResources]);

    // Group the dynamic resources from DB
    const dynamicGroupedResources = categories
        .filter(c => c !== "Course Module")
        .map(category => ({
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
                const result = await uploadResourceFile(file, newResource.category, setResourceUploadProgress);
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
                uploadedByUid: editingResource ? editingResource.uploadedByUid : user.id,
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
        const ok = await confirm({ message: `Delete "${resource.title}"?`, variant: "danger" });
        if (ok) {
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
        <div className="space-y-8">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-1 h-10 bg-[#059669] rounded-full"></div>
                    <div>
                        <h1 className="text-3xl font-bold text-[#1f2937]">Course Modules</h1>
                        <p className="text-[#6b7280] mt-1">Course modules, class routines, and study materials</p>
                    </div>
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

            {/* Content */}
            {loading ? (
                <div className="text-center py-20">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#059669]"></div>
                    <p className="mt-4 text-[#6b7280]">Loading resources...</p>
                </div>
            ) : (
                <div className="space-y-10">
                    
                    {/* Hardcoded Course Modules Section */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-1 h-8 bg-[#059669] rounded-full"></div>
                            <h2 className="text-xl font-bold text-[#1f2937]">Course Module</h2>
                            <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-100 px-2.5 py-1 rounded-full font-semibold">
                                {staticCourseModules.length} items
                            </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {staticCourseModules.map((module) => (
                                <Card key={module.slug} className="hover:shadow-lg transition-shadow h-full relative group">
                                    <CardBody className="p-6 flex flex-col h-full">
                                        <h3 className="text-lg font-semibold text-[#1f2937] mb-3">{module.title}</h3>
                                        <p className="text-gray-600 text-sm mb-4 leading-relaxed line-clamp-3">
                                            {module.description}
                                        </p>
                                        <div className="space-y-2 mb-4 mt-auto">
                                            <div className="flex items-center gap-2 text-sm text-[#6b7280]">
                                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>
                                                <span>Teacher Name: {module.teacherName}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-[#6b7280]">
                                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" /></svg>
                                                <span>Date: {module.publishedDate}</span>
                                            </div>
                                        </div>
                                        <Link href={`/dashboard/course-modules/${module.slug}`} className="block w-full text-center px-4 py-3 bg-[#059669] text-white font-semibold rounded-lg hover:bg-[#10b981] transition-colors">
                                            View
                                        </Link>
                                    </CardBody>
                                </Card>
                            ))}
                        </div>
                    </div>

                    {/* Dynamic Resources from DB (Filtered) */}
                    {dynamicGroupedResources.map(({ category, resources: categoryResources }) => (
                        categoryResources.length > 0 && (
                            <div key={category} className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-1 h-8 bg-[#059669] rounded-full"></div>
                                    <h2 className="text-xl font-bold text-[#1f2937]">{category}</h2>
                                    <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-100 px-2.5 py-1 rounded-full font-semibold">
                                        {categoryResources.length} item{categoryResources.length !== 1 ? "s" : ""}
                                    </span>
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
                    ))}
                </div>
            )}

            {/* Add/Edit Resource Modal (Admin only) */}
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
                                    {categories.filter(c => c !== "Course Module").map(c => <option key={c} value={c}>{c}</option>)}
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
