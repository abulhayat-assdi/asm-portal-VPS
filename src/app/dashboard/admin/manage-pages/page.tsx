"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getPageContent } from "@/services/cmsService";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";

const PAGES = [
    { id: "home_page", label: "Home Page" },
    { id: "about_page", label: "About Page" },
    { id: "contact_page", label: "Contact & Q&A" },
    { id: "modules_page", label: "Modules Page" },
    { id: "instructors_page", label: "Instructors Page" },
    { id: "success_stories_page", label: "Success Stories" },
    { id: "blog_page", label: "Blog Page" },
    { id: "site_settings", label: "Site Settings (Logo)" },
];

interface SocialLink {
    platform: string;
    label: string;
    url: string;
    displayText: string;
}

interface SocialGroup {
    id: string;
    title: string;
    links: SocialLink[];
}

interface PageContent {
    header?: { title?: string; subtitle?: string };
    hero?: { heading?: string; subheading?: string; primaryButtonText?: string; secondaryButtonText?: string };
    targetAudience?: { title?: string; subtitle?: string };
    learningOutcomes?: { title?: string; subtitle?: string };
    aboutSection?: { title?: string; description1?: string; description2?: string; description3?: string };
    whySection?: { title?: string };
    ctaSection?: { text?: string; buttonText?: string };
    socialHeader?: { title?: string; subtitle?: string };
    contactInfo?: {
        email?: string;
        emailDescription?: string;
        phone?: string;
        phoneDescription?: string;
        locationName?: string;
        locationAddress?: string;
    };
    socialGroups?: SocialGroup[];
    logoUrl?: string;
    logoStoragePath?: string;
    siteName?: string;
}

export default function ManagePages() {
    const { user } = useAuth();
    const [selectedPage, setSelectedPage] = useState(PAGES[0].id);
    const [content, setContent] = useState<PageContent | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploadingLogo, setUploadingLogo] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
    const logoInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const fetchContent = async () => {
            setLoading(true);
            setContent(null);
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
            const response = await fetch("/api/admin/cms", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ pageId: selectedPage, content }),
            });
            const result = await response.json();
            if (response.ok) {
                setMessage({ type: "success", text: "Page content updated successfully!" });
            } else {
                throw new Error(result.error || "Failed to update content");
            }
        } catch (error) {
            setMessage({ type: "error", text: error instanceof Error ? error.message : "An error occurred" });
        } finally {
            setSaving(false);
        }
    };

    const saveSiteSettings = async (updated: PageContent) => {
        await fetch("/api/admin/cms", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ pageId: "site_settings", content: updated }),
        });
        // Notify Sidebar to re-fetch
        window.dispatchEvent(new Event("site-settings-changed"));
    };

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const ALLOWED = new Set(["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"]);
        if (!ALLOWED.has(file.type)) {
            setMessage({ type: "error", text: "শুধুমাত্র JPG, PNG, GIF, WebP বা SVG ফাইল আপলোড করা যাবে" });
            if (logoInputRef.current) logoInputRef.current.value = "";
            return;
        }
        if (file.size > 2 * 1024 * 1024) {
            setMessage({ type: "error", text: "লোগো ফাইল সর্বোচ্চ 2MB হতে হবে" });
            if (logoInputRef.current) logoInputRef.current.value = "";
            return;
        }

        setUploadingLogo(true);
        setMessage(null);
        try {
            // Delete old logo file if it exists (resources/logo/ path)
            const oldPath = content?.logoStoragePath || "";
            if (oldPath && oldPath.startsWith("resources/logo/")) {
                await fetch(`/api/storage/delete?path=${encodeURIComponent(oldPath)}`, {
                    method: "DELETE",
                }).catch(() => {});
            }

            // Upload new logo
            const formData = new FormData();
            formData.append("file", file);
            formData.append("category", "resource");
            formData.append("path", "logo");

            const res = await fetch("/api/storage/upload", { method: "POST", body: formData });
            const data = await res.json();

            if (res.ok && data.fileUrl) {
                const updated: PageContent = {
                    ...content,
                    logoUrl: data.fileUrl,
                    logoStoragePath: data.storagePath,
                };
                setContent(updated);
                await saveSiteSettings(updated);
                setMessage({ type: "success", text: "লোগো আপলোড ও সেভ সম্পন্ন! সাইডবারে এখনই দেখা যাবে।" });
            } else {
                setMessage({ type: "error", text: data.error || "আপলোড ব্যর্থ হয়েছে" });
            }
        } catch {
            setMessage({ type: "error", text: "লোগো আপলোড ব্যর্থ হয়েছে" });
        } finally {
            setUploadingLogo(false);
            if (logoInputRef.current) logoInputRef.current.value = "";
        }
    };

    const handleRemoveLogo = async () => {
        if (!confirm("লোগো রিমুভ করলে ডিফল্ট SVG লোগো দেখাবে। নিশ্চিত?")) return;

        // Delete file from disk
        const oldPath = content?.logoStoragePath || "";
        if (oldPath && oldPath.startsWith("resources/logo/")) {
            await fetch(`/api/storage/delete?path=${encodeURIComponent(oldPath)}`, {
                method: "DELETE",
            }).catch(() => {});
        }

        const updated: PageContent = { ...content, logoUrl: "", logoStoragePath: "" };
        setContent(updated);
        await saveSiteSettings(updated);
        setMessage({ type: "success", text: "লোগো রিমুভ করা হয়েছে। ডিফল্ট SVG লোগো দেখাবে।" });
    };

    const handleSaveSiteName = async () => {
        const updated: PageContent = { ...content };
        await saveSiteSettings(updated);
        setMessage({ type: "success", text: "সাইটের নাম সেভ হয়েছে!" });
    };

    const updateSocialLink = (groupId: string, linkIdx: number, field: keyof SocialLink, value: string) => {
        setContent(prev => {
            if (!prev) return prev;
            const groups = (prev.socialGroups || []).map(g => {
                if (g.id !== groupId) return g;
                const links = g.links.map((l, i) => i === linkIdx ? { ...l, [field]: value } : l);
                return { ...g, links };
            });
            return { ...prev, socialGroups: groups };
        });
    };

    const updateGroupTitle = (groupId: string, title: string) => {
        setContent(prev => {
            if (!prev) return prev;
            const groups = (prev.socialGroups || []).map(g => g.id === groupId ? { ...g, title } : g);
            return { ...prev, socialGroups: groups };
        });
    };

    if (loading) {
        return (
            <div className="p-8 text-center text-gray-500">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#059669] mx-auto mb-4"></div>
                Loading content...
            </div>
        );
    }

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
                <select
                    value={selectedPage}
                    onChange={(e) => setSelectedPage(e.target.value)}
                    className="px-4 py-2 border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#059669] font-bold text-gray-700 shadow-sm transition-all cursor-pointer hover:border-[#059669]"
                >
                    {PAGES.map((page) => (
                        <option key={page.id} value={page.id}>{page.label}</option>
                    ))}
                </select>
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

                {/* ═══ HOME PAGE ═══ */}
                {selectedPage === "home_page" && (
                    <>
                        <Card className="p-6">
                            <div className="flex items-center gap-2 mb-4 border-b pb-2">
                                <div className="w-2 h-6 bg-[#059669] rounded-full"></div>
                                <h2 className="text-xl font-bold text-gray-800">Hero Section</h2>
                            </div>
                            <div className="space-y-4">
                                <Input label="Heading" value={content?.hero?.heading || ""} onChange={(e) => setContent({ ...content!, hero: { ...content!.hero, heading: e.target.value } })} />
                                <Input label="Subheading" value={content?.hero?.subheading || ""} onChange={(e) => setContent({ ...content!, hero: { ...content!.hero, subheading: e.target.value } })} />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Input label="Primary Button Text" value={content?.hero?.primaryButtonText || ""} onChange={(e) => setContent({ ...content!, hero: { ...content!.hero, primaryButtonText: e.target.value } })} />
                                    <Input label="Secondary Button Text" value={content?.hero?.secondaryButtonText || ""} onChange={(e) => setContent({ ...content!, hero: { ...content!.hero, secondaryButtonText: e.target.value } })} />
                                </div>
                            </div>
                        </Card>
                        <Card className="p-6">
                            <div className="flex items-center gap-2 mb-4 border-b pb-2">
                                <div className="w-2 h-6 bg-[#059669] rounded-full"></div>
                                <h2 className="text-xl font-bold text-gray-800">Target Audience Section</h2>
                            </div>
                            <div className="space-y-4">
                                <Input label="Title" value={content?.targetAudience?.title || ""} onChange={(e) => setContent({ ...content!, targetAudience: { ...content!.targetAudience, title: e.target.value } })} />
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-gray-700">Subtitle</label>
                                    <textarea rows={3} value={content?.targetAudience?.subtitle || ""} onChange={(e) => setContent({ ...content!, targetAudience: { ...content!.targetAudience, subtitle: e.target.value } })} className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#059669] text-gray-700" />
                                </div>
                            </div>
                        </Card>
                        <Card className="p-6">
                            <div className="flex items-center gap-2 mb-4 border-b pb-2">
                                <div className="w-2 h-6 bg-[#059669] rounded-full"></div>
                                <h2 className="text-xl font-bold text-gray-800">Learning Outcomes Section</h2>
                            </div>
                            <div className="space-y-4">
                                <Input label="Title" value={content?.learningOutcomes?.title || ""} onChange={(e) => setContent({ ...content!, learningOutcomes: { ...content!.learningOutcomes, title: e.target.value } })} />
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-gray-700">Subtitle</label>
                                    <textarea rows={3} value={content?.learningOutcomes?.subtitle || ""} onChange={(e) => setContent({ ...content!, learningOutcomes: { ...content!.learningOutcomes, subtitle: e.target.value } })} className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#059669] text-gray-700" />
                                </div>
                            </div>
                        </Card>
                    </>
                )}

                {/* ═══ ABOUT PAGE ═══ */}
                {selectedPage === "about_page" && (
                    <>
                        {renderPageHeaderEditor()}
                        <Card className="p-6">
                            <div className="flex items-center gap-2 mb-4 border-b pb-2">
                                <div className="w-2 h-6 bg-[#059669] rounded-full"></div>
                                <h2 className="text-xl font-bold text-gray-800">What Is This Course?</h2>
                            </div>
                            <div className="space-y-4">
                                <Input label="Section Title" value={content?.aboutSection?.title || ""} onChange={(e) => setContent({ ...content!, aboutSection: { ...content!.aboutSection, title: e.target.value } })} />
                                {["description1", "description2", "description3"].map((field, i) => (
                                    <div key={field} className="space-y-1">
                                        <label className="text-sm font-medium text-gray-700">Description Paragraph {i + 1}</label>
                                        <textarea rows={4} value={(content?.aboutSection as Record<string, string> | undefined)?.[field] || ""} onChange={(e) => setContent({ ...content!, aboutSection: { ...content!.aboutSection, [field]: e.target.value } })} className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#059669] text-gray-700" />
                                    </div>
                                ))}
                            </div>
                        </Card>
                        <Card className="p-6">
                            <div className="flex items-center gap-2 mb-4 border-b pb-2">
                                <div className="w-2 h-6 bg-[#059669] rounded-full"></div>
                                <h2 className="text-xl font-bold text-gray-800">Why Section</h2>
                            </div>
                            <Input label="Why Section Title" value={content?.whySection?.title || ""} onChange={(e) => setContent({ ...content!, whySection: { ...content!.whySection, title: e.target.value } })} />
                        </Card>
                        <Card className="p-6">
                            <div className="flex items-center gap-2 mb-4 border-b pb-2">
                                <div className="w-2 h-6 bg-[#059669] rounded-full"></div>
                                <h2 className="text-xl font-bold text-gray-800">CTA Section</h2>
                            </div>
                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-gray-700">CTA Main Text</label>
                                    <textarea rows={2} value={content?.ctaSection?.text || ""} onChange={(e) => setContent({ ...content!, ctaSection: { ...content!.ctaSection, text: e.target.value } })} className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#059669] text-gray-700" />
                                </div>
                                <Input label="Button Text" value={content?.ctaSection?.buttonText || ""} onChange={(e) => setContent({ ...content!, ctaSection: { ...content!.ctaSection, buttonText: e.target.value } })} />
                            </div>
                        </Card>
                    </>
                )}

                {/* ═══ CONTACT PAGE ═══ */}
                {selectedPage === "contact_page" && (
                    <>
                        {renderPageHeaderEditor()}

                        {/* Contact Info */}
                        <Card className="p-6">
                            <div className="flex items-center gap-2 mb-4 border-b pb-2">
                                <div className="w-2 h-6 bg-[#059669] rounded-full"></div>
                                <h2 className="text-xl font-bold text-gray-800">যোগাযোগের তথ্য</h2>
                            </div>
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Input
                                        label="Email Address"
                                        value={content?.contactInfo?.email || ""}
                                        onChange={(e) => setContent({ ...content!, contactInfo: { ...content!.contactInfo, email: e.target.value } })}
                                    />
                                    <Input
                                        label="Email Description"
                                        value={content?.contactInfo?.emailDescription || ""}
                                        onChange={(e) => setContent({ ...content!, contactInfo: { ...content!.contactInfo, emailDescription: e.target.value } })}
                                    />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Input
                                        label="Phone Number"
                                        value={content?.contactInfo?.phone || ""}
                                        onChange={(e) => setContent({ ...content!, contactInfo: { ...content!.contactInfo, phone: e.target.value } })}
                                    />
                                    <Input
                                        label="Phone Description (Available Hours)"
                                        value={content?.contactInfo?.phoneDescription || ""}
                                        onChange={(e) => setContent({ ...content!, contactInfo: { ...content!.contactInfo, phoneDescription: e.target.value } })}
                                    />
                                </div>
                                <Input
                                    label="Training Location Name"
                                    value={content?.contactInfo?.locationName || ""}
                                    onChange={(e) => setContent({ ...content!, contactInfo: { ...content!.contactInfo, locationName: e.target.value } })}
                                />
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-gray-700">Location Address</label>
                                    <textarea
                                        rows={2}
                                        value={content?.contactInfo?.locationAddress || ""}
                                        onChange={(e) => setContent({ ...content!, contactInfo: { ...content!.contactInfo, locationAddress: e.target.value } })}
                                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#059669] text-gray-700"
                                    />
                                </div>
                            </div>
                        </Card>

                        {/* Social Header */}
                        <Card className="p-6">
                            <div className="flex items-center gap-2 mb-4 border-b pb-2">
                                <div className="w-2 h-6 bg-[#059669] rounded-full"></div>
                                <h2 className="text-xl font-bold text-gray-800">Social Presence Header</h2>
                            </div>
                            <div className="space-y-4">
                                <Input label="Section Title" value={content?.socialHeader?.title || ""} onChange={(e) => setContent({ ...content!, socialHeader: { ...content!.socialHeader, title: e.target.value } })} />
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-gray-700">Section Subtitle</label>
                                    <textarea rows={2} value={content?.socialHeader?.subtitle || ""} onChange={(e) => setContent({ ...content!, socialHeader: { ...content!.socialHeader, subtitle: e.target.value } })} className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#059669] text-gray-700" />
                                </div>
                            </div>
                        </Card>

                        {/* Social Links Groups */}
                        {(content?.socialGroups || []).map((group) => (
                            <Card key={group.id} className="p-6">
                                <div className="flex items-center gap-2 mb-4 border-b pb-2">
                                    <div className="w-2 h-6 bg-blue-500 rounded-full"></div>
                                    <h2 className="text-lg font-bold text-gray-800">সোশ্যাল লিঙ্ক গ্রুপ</h2>
                                </div>
                                <div className="space-y-4">
                                    <Input
                                        label="Group Title"
                                        value={group.title}
                                        onChange={(e) => updateGroupTitle(group.id, e.target.value)}
                                    />
                                    {group.links.map((link, linkIdx) => (
                                        <div key={linkIdx} className="bg-gray-50 rounded-xl p-4 border border-gray-100 space-y-3">
                                            <div className="flex items-center gap-2">
                                                <span className="text-lg">
                                                    {link.platform === "facebook" ? "📘" : link.platform === "youtube" ? "📺" : "🌐"}
                                                </span>
                                                <span className="text-sm font-bold text-gray-600 capitalize">{link.platform}</span>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                <Input
                                                    label="Link Label"
                                                    value={link.label}
                                                    onChange={(e) => updateSocialLink(group.id, linkIdx, "label", e.target.value)}
                                                />
                                                <Input
                                                    label="Display Text"
                                                    value={link.displayText}
                                                    onChange={(e) => updateSocialLink(group.id, linkIdx, "displayText", e.target.value)}
                                                />
                                            </div>
                                            <Input
                                                label="URL"
                                                value={link.url}
                                                onChange={(e) => updateSocialLink(group.id, linkIdx, "url", e.target.value)}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        ))}
                    </>
                )}

                {/* ═══ OTHER PAGES (Modules, Instructors, Success Stories, Blog) ═══ */}
                {["modules_page", "instructors_page", "success_stories_page", "blog_page"].includes(selectedPage) && renderPageHeaderEditor()}

                {/* ═══ SITE SETTINGS (Logo + Site Name) ═══ */}
                {selectedPage === "site_settings" && (
                    <>
                        {/* Site Name Card */}
                        <Card className="p-6">
                            <div className="flex items-center gap-2 mb-4 border-b pb-2">
                                <div className="w-2 h-6 bg-purple-500 rounded-full"></div>
                                <h2 className="text-xl font-bold text-gray-800">সাইটের নাম</h2>
                            </div>
                            <p className="text-sm text-gray-500 mb-4">
                                সাইডবারে লোগোর পাশে যে নাম দেখায় সেটা পরিবর্তন করুন। খালি রাখলে ডিফল্ট &ldquo;SALES MARKETING&rdquo; দেখাবে।
                            </p>
                            <div className="flex gap-3 items-end">
                                <div className="flex-1">
                                    <Input
                                        label="সাইটের নাম (ঐচ্ছিক)"
                                        placeholder="যেমন: Sales & Marketing"
                                        value={content?.siteName || ""}
                                        onChange={(e) => setContent({ ...content!, siteName: e.target.value })}
                                    />
                                </div>
                                <Button
                                    onClick={handleSaveSiteName}
                                    className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold mb-0.5"
                                >
                                    সেভ করুন
                                </Button>
                            </div>
                            <p className="text-xs text-gray-400 mt-2">
                                দীর্ঘ নাম হলে সাইডবারে দুই লাইনে দেখাবে। সর্বোচ্চ ২০-২৫ অক্ষর প্রস্তাবিত।
                            </p>
                        </Card>

                        {/* Logo Card */}
                        <Card className="p-6">
                            <div className="flex items-center gap-2 mb-4 border-b pb-2">
                                <div className="w-2 h-6 bg-purple-500 rounded-full"></div>
                                <h2 className="text-xl font-bold text-gray-800">সাইট লোগো</h2>
                            </div>

                            {/* Current Logo Preview */}
                            <div className="mb-6">
                                <p className="text-sm font-medium text-gray-700 mb-3">বর্তমান লোগো</p>
                                <div className="flex items-center gap-5">
                                    <div className="w-36 h-20 bg-[#0D1B2A] rounded-xl flex items-center justify-center p-3 flex-shrink-0 border border-gray-700">
                                        {content?.logoUrl ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img
                                                src={content.logoUrl}
                                                alt="Site Logo"
                                                style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
                                            />
                                        ) : (
                                            <div className="text-white text-xs font-bold text-center">
                                                <div className="text-2xl mb-1">🎓</div>
                                                <div className="leading-tight">SALES<br />MARKETING</div>
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        {content?.logoUrl ? (
                                            <>
                                                <p className="text-sm font-semibold text-green-600 mb-1">✓ কাস্টম লোগো সক্রিয়</p>
                                                <p className="text-xs text-gray-400 mb-3 break-all">{content.logoUrl}</p>
                                                <button
                                                    onClick={handleRemoveLogo}
                                                    className="text-sm text-red-500 hover:text-red-700 hover:underline font-medium"
                                                >
                                                    লোগো রিমুভ করুন (ডিফল্ট SVG-তে ফিরে যাবে)
                                                </button>
                                            </>
                                        ) : (
                                            <p className="text-sm text-gray-500">ডিফল্ট SVG লোগো ব্যবহৃত হচ্ছে</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Upload New Logo */}
                            <div className="border-t pt-5">
                                <p className="text-sm font-semibold text-gray-700 mb-1">
                                    {content?.logoUrl ? "লোগো রিপ্লেস করুন" : "নতুন লোগো আপলোড করুন"}
                                </p>
                                <p className="text-xs text-gray-400 mb-3">
                                    JPG, PNG, WebP বা SVG — সর্বোচ্চ 2MB।
                                    প্রস্তাবিত: transparent background PNG, ন্যূনতম 200×200px।
                                    {content?.logoUrl && " নতুন আপলোড করলে পুরনো স্বয়ংক্রিয়ভাবে মুছে যাবে।"}
                                </p>
                                <input
                                    ref={logoInputRef}
                                    type="file"
                                    accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
                                    onChange={handleLogoUpload}
                                    disabled={uploadingLogo}
                                    className="w-full px-4 py-2.5 border-2 border-dashed border-gray-200 rounded-lg text-sm text-gray-600 cursor-pointer hover:border-purple-300 hover:bg-purple-50/30 transition-colors file:mr-4 file:py-1.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                />
                                {uploadingLogo && (
                                    <div className="flex items-center gap-2 text-purple-600 mt-3">
                                        <div className="w-4 h-4 border-2 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
                                        <span className="text-sm font-semibold">আপলোড হচ্ছে...</span>
                                    </div>
                                )}
                            </div>
                        </Card>
                    </>
                )}
            </div>

            {/* Save Button — not shown for site_settings (auto-saves) */}
            {selectedPage !== "site_settings" && (
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
            )}
        </div>
    );
}
