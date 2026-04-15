"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getPageContent } from "@/services/cmsService";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";

const PAGES = [
    { id: "home_page", label: "Home Page" },
    { id: "about_page", label: "About Page" },
    { id: "modules_page", label: "Modules Page" },
    { id: "instructors_page", label: "Instructors Page" },
    { id: "success_stories_page", label: "Success Stories" },
    { id: "contact_page", label: "Contact Page" },
    { id: "blog_page", label: "Blog Page" },
];

interface PageContent {
    header?: { title?: string; subtitle?: string };
    hero?: { heading?: string; subheading?: string; primaryButtonText?: string; secondaryButtonText?: string };
    targetAudience?: { title?: string; subtitle?: string };
    learningOutcomes?: { title?: string; subtitle?: string };
    aboutSection?: { title?: string; description1?: string; description2?: string; description3?: string };
    whySection?: { title?: string };
    ctaSection?: { text?: string; buttonText?: string };
    socialHeader?: { title?: string; subtitle?: string };
}

export default function ManagePages() {
    const { user } = useAuth();
    const [selectedPage, setSelectedPage] = useState(PAGES[0].id);
    const [content, setContent] = useState<PageContent | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    useEffect(() => {
        const fetchContent = async () => {
            setLoading(true);
            setContent(null); // Clear previous content to prevent desync edits
            try {
                const data = await getPageContent(selectedPage);
                setContent(data);
            } catch (error) {
                console.error("Failed to fetch page content:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchContent();
    }, [selectedPage]);

    const handleSave = async () => {
        if (!user) return;
        setSaving(true);
        setMessage(null);

        try {
            const freshToken = await user.getIdToken(true);
            const response = await fetch("/api/admin/cms", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${freshToken}`
                },
                body: JSON.stringify({
                    pageId: selectedPage,
                    content: content
                })
            });

            const result = await response.json();
            if (response.ok) {
                setMessage({ type: "success", text: "Page content updated successfully and live cache purged!" });
            } else {
                throw new Error(result.error || "Failed to update content");
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "An error occurred";
            setMessage({ type: "error", text: errorMessage });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="p-8 text-center text-gray-500">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#059669] mx-auto mb-4"></div>
                Loading content...
            </div>
        );
    }

    // Helper for page headers (About, Modules, etc.)
    const renderPageHeaderEditor = () => (
        <Card className="p-6">
            <div className="flex items-center gap-2 mb-4 border-b pb-2">
                <div className="w-2 h-6 bg-[#059669] rounded-full"></div>
                <h2 className="text-xl font-bold text-gray-800">Main Page Header</h2>
            </div>
            <div className="space-y-4">
                <Input
                    label="Page Title"
                    placeholder="Enter main title"
                    value={content?.header?.title || ""}
                    onChange={(e) => setContent({ ...content!, header: { ...content!.header, title: e.target.value } })}
                />
                <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">Page Subtitle / Description</label>
                    <textarea
                        rows={3}
                        placeholder="Enter description text"
                        value={content?.header?.subtitle || ""}
                        onChange={(e) => setContent({ ...content!, header: { ...content!.header, subtitle: e.target.value } })}
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#059669] text-gray-700 transition-all"
                    />
                </div>
            </div>
        </Card>
    );

    return (
        <div className="space-y-6 max-w-4xl mx-auto p-4 md:p-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Manage Public Pages</h1>
                    <p className="text-gray-500 mt-1">Live website content management with instant revalidation</p>
                </div>
                <div className="flex items-center gap-3">
                    <select
                        value={selectedPage}
                        onChange={(e) => setSelectedPage(e.target.value)}
                        className="px-4 py-2 border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#059669] font-bold text-gray-700 shadow-sm transition-all cursor-pointer hover:border-[#059669]"
                    >
                        {PAGES.map((page) => (
                            <option key={page.id} value={page.id}>
                                {page.label}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {message && (
                <div className={`p-4 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300 ${message.type === "success" ? "bg-emerald-50 text-emerald-700 border border-emerald-100 shadow-sm" : "bg-red-50 text-red-700 border border-red-100 shadow-sm"}`}>
                    {message.type === "success" ? (
                        <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                            <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        </div>
                    ) : (
                        <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                            <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </div>
                    )}
                    <p className="font-semibold">{message.text}</p>
                </div>
            )}

            <div className="space-y-8 animate-in fade-in duration-500">
                {selectedPage === "home_page" ? (
                    <>
                        <Card className="p-6">
                            <div className="flex items-center gap-2 mb-4 border-b pb-2">
                                <div className="w-2 h-6 bg-[#059669] rounded-full"></div>
                                <h2 className="text-xl font-bold text-gray-800">Hero Section</h2>
                            </div>
                            <div className="space-y-4">
                                <Input
                                    label="Heading"
                                    value={content?.hero?.heading || ""}
                                    onChange={(e) => setContent({ ...content!, hero: { ...content!.hero, heading: e.target.value } })}
                                />
                                <Input
                                    label="Subheading"
                                    value={content?.hero?.subheading || ""}
                                    onChange={(e) => setContent({ ...content!, hero: { ...content!.hero, subheading: e.target.value } })}
                                />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Input
                                        label="Primary Button Text"
                                        value={content?.hero?.primaryButtonText || ""}
                                        onChange={(e) => setContent({ ...content!, hero: { ...content!.hero, primaryButtonText: e.target.value } })}
                                    />
                                    <Input
                                        label="Secondary Button Text"
                                        value={content?.hero?.secondaryButtonText || ""}
                                        onChange={(e) => setContent({ ...content!, hero: { ...content!.hero, secondaryButtonText: e.target.value } })}
                                    />
                                </div>
                            </div>
                        </Card>

                        <Card className="p-6">
                            <div className="flex items-center gap-2 mb-4 border-b pb-2">
                                <div className="w-2 h-6 bg-[#059669] rounded-full"></div>
                                <h2 className="text-xl font-bold text-gray-800">Target Audience Section</h2>
                            </div>
                            <div className="space-y-4">
                                <Input
                                    label="Title"
                                    value={content?.targetAudience?.title || ""}
                                    onChange={(e) => setContent({ ...content!, targetAudience: { ...content!.targetAudience, title: e.target.value } })}
                                />
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-gray-700">Subtitle</label>
                                    <textarea
                                        rows={3}
                                        value={content?.targetAudience?.subtitle || ""}
                                        onChange={(e) => setContent({ ...content!, targetAudience: { ...content!.targetAudience, subtitle: e.target.value } })}
                                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#059669] text-gray-700"
                                    />
                                </div>
                            </div>
                        </Card>

                        <Card className="p-6">
                            <div className="flex items-center gap-2 mb-4 border-b pb-2">
                                <div className="w-2 h-6 bg-[#059669] rounded-full"></div>
                                <h2 className="text-xl font-bold text-gray-800">Learning Outcomes Section</h2>
                            </div>
                            <div className="space-y-4">
                                <Input
                                    label="Title"
                                    value={content?.learningOutcomes?.title || ""}
                                    onChange={(e) => setContent({ ...content!, learningOutcomes: { ...content!.learningOutcomes, title: e.target.value } })}
                                />
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-gray-700">Subtitle</label>
                                    <textarea
                                        rows={3}
                                        value={content?.learningOutcomes?.subtitle || ""}
                                        onChange={(e) => setContent({ ...content!, learningOutcomes: { ...content!.learningOutcomes, subtitle: e.target.value } })}
                                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#059669] text-gray-700"
                                    />
                                </div>
                            </div>
                        </Card>
                    </>
                ) : (
                    <>
                        {renderPageHeaderEditor()}
                        
                        {selectedPage === "about_page" && (
                            <>
                                <Card className="p-6">
                                    <div className="flex items-center gap-2 mb-4 border-b pb-2">
                                        <div className="w-2 h-6 bg-[#059669] rounded-full"></div>
                                        <h2 className="text-xl font-bold text-gray-800">What Is This Course?</h2>
                                    </div>
                                    <div className="space-y-4">
                                        <Input
                                            label="Section Title"
                                            value={content?.aboutSection?.title || ""}
                                            onChange={(e) => setContent({ ...content!, aboutSection: { ...content!.aboutSection, title: e.target.value } })}
                                        />
                                        <div className="space-y-1">
                                            <label className="text-sm font-medium text-gray-700">Description Paragraph 1</label>
                                            <textarea
                                                rows={4}
                                                value={content?.aboutSection?.description1 || ""}
                                                onChange={(e) => setContent({ ...content!, aboutSection: { ...content!.aboutSection, description1: e.target.value } })}
                                                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#059669] text-gray-700"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-sm font-medium text-gray-700">Description Paragraph 2</label>
                                            <textarea
                                                rows={4}
                                                value={content?.aboutSection?.description2 || ""}
                                                onChange={(e) => setContent({ ...content!, aboutSection: { ...content!.aboutSection, description2: e.target.value } })}
                                                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#059669] text-gray-700"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-sm font-medium text-gray-700">Description Paragraph 3</label>
                                            <textarea
                                                rows={4}
                                                value={content?.aboutSection?.description3 || ""}
                                                onChange={(e) => setContent({ ...content!, aboutSection: { ...content!.aboutSection, description3: e.target.value } })}
                                                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#059669] text-gray-700"
                                            />
                                        </div>
                                    </div>
                                </Card>

                                <Card className="p-6">
                                    <div className="flex items-center gap-2 mb-4 border-b pb-2">
                                        <div className="w-2 h-6 bg-[#059669] rounded-full"></div>
                                        <h2 className="text-xl font-bold text-gray-800">Why Section</h2>
                                    </div>
                                    <div className="space-y-4">
                                        <Input
                                            label="Why Section Title"
                                            value={content?.whySection?.title || ""}
                                            onChange={(e) => setContent({ ...content!, whySection: { ...content!.whySection, title: e.target.value } })}
                                        />
                                    </div>
                                </Card>

                                <Card className="p-6">
                                    <div className="flex items-center gap-2 mb-4 border-b pb-2">
                                        <div className="w-2 h-6 bg-[#059669] rounded-full"></div>
                                        <h2 className="text-xl font-bold text-gray-800">CTA Section</h2>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="space-y-1">
                                            <label className="text-sm font-medium text-gray-700">CTA Main Text</label>
                                            <textarea
                                                rows={2}
                                                value={content?.ctaSection?.text || ""}
                                                onChange={(e) => setContent({ ...content!, ctaSection: { ...content!.ctaSection, text: e.target.value } })}
                                                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#059669] text-gray-700"
                                            />
                                        </div>
                                        <Input
                                            label="Button Text"
                                            value={content?.ctaSection?.buttonText || ""}
                                            onChange={(e) => setContent({ ...content!, ctaSection: { ...content!.ctaSection, buttonText: e.target.value } })}
                                        />
                                    </div>
                                </Card>
                            </>
                        )}

                        {selectedPage === "contact_page" && (
                            <Card className="p-6">
                                <div className="flex items-center gap-2 mb-4 border-b pb-2">
                                    <div className="w-2 h-6 bg-[#059669] rounded-full"></div>
                                    <h2 className="text-xl font-bold text-gray-800">Social Presence Header</h2>
                                </div>
                                <div className="space-y-4">
                                    <Input
                                        label="Social Section Title"
                                        value={content?.socialHeader?.title || ""}
                                        onChange={(e) => setContent({ ...content!, socialHeader: { ...content!.socialHeader, title: e.target.value } })}
                                    />
                                    <div className="space-y-1">
                                        <label className="text-sm font-medium text-gray-700">Social Section Subtitle</label>
                                        <textarea
                                            rows={3}
                                            value={content?.socialHeader?.subtitle || ""}
                                            onChange={(e) => setContent({ ...content!, socialHeader: { ...content!.socialHeader, subtitle: e.target.value } })}
                                            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#059669] text-gray-700"
                                        />
                                    </div>
                                </div>
                            </Card>
                        )}
                    </>
                )}
            </div>

            <div className="flex justify-end pt-8 pb-12 sticky bottom-0 bg-gradient-to-t from-[#fafaf9] via-[#fafaf9] to-transparent">
                <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-12 py-4 bg-[#059669] hover:bg-[#047857] text-white rounded-xl shadow-[0_10px_30px_-10px_rgba(5,150,105,0.5)] transform transition-all active:scale-95 font-bold flex items-center gap-2"
                >
                    {saving ? (
                        <>
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            Saving Changes...
                        </>
                    ) : (
                        <>
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
                            Save All Changes
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
}
