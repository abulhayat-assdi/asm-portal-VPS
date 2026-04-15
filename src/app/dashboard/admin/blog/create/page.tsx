"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Card, { CardBody } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import AdminRoute from "@/components/auth/AdminRoute";
import * as blogService from "@/services/blogService";
import { uploadImage } from "@/lib/uploadImage";
import Image from "next/image";
import RichTextEditor from "@/components/blog/RichTextEditor";

const CATEGORIES = ["Article", "Project Presentation", "Practical Learning"];

export default function CreateBlogPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<number | null>(null);
    const [contentMode, setContentMode] = useState<"general" | "html">("general");
    const [formData, setFormData] = useState({
        title: "",
        slug: "",
        excerpt: "",
        featuredImage: "",
        content: "",
        category: "Article",
        metaTitle: "",
        metaDescription: "",
        keywords: ""
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;

        if (name === 'title') {
            const slug = value
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/(^-|-$)+/g, '');

            setFormData(prev => ({ ...prev, [name]: value, slug }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleContentChange = (html: string) => {
        setFormData(prev => ({ ...prev, content: html }));
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setLoading(true);
        setUploadProgress(0);
        try {
            const url = await uploadImage(file, 'images/blog', (progress) => {
                setUploadProgress(progress);
            });
            setFormData(prev => ({ ...prev, featuredImage: url }));
        } catch (error) {
            console.error("Upload failed", error);
            alert("Failed to upload image.");
        } finally {
            setLoading(false);
            setUploadProgress(null);
        }
    };

    const handleSave = async (status: 'draft' | 'published') => {
        if (!formData.title || !formData.content) {
            alert("Title and Content are required");
            return;
        }

        if (status === 'published' && !confirm("Are you sure you want to publish this post?")) {
            return;
        }

        setLoading(true);
        try {
            await blogService.createPost({
                ...formData,
                status,
            });
            router.push('/dashboard/admin/blog');
        } catch (error) {
            console.error(error);
            alert("Failed to save post");
        } finally {
            setLoading(false);
        }
    };

    return (
        <AdminRoute>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-[#1f2937]">Create New Post</h1>
                        <p className="text-[#6b7280] mt-1">Draft a new blog post</p>
                    </div>
                    <div className="flex gap-2">
                        <Link href="/dashboard/admin/blog">
                            <Button variant="outline" disabled={loading}>Cancel</Button>
                        </Link>
                        <Button
                            variant="secondary"
                            onClick={() => handleSave('draft')}
                            disabled={loading}
                        >
                            Save Draft
                        </Button>
                        <Button
                            onClick={() => handleSave('published')}
                            disabled={loading}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                            Publish Post
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        <Card>
                            <CardBody className="space-y-4">
                                <Input
                                    label="Post Title"
                                    name="title"
                                    placeholder="Enter post title"
                                    value={formData.title}
                                    onChange={handleChange}
                                    required
                                />

                                {/* Rich Text Editor with Mode Toggle */}
                                <RichTextEditor
                                    value={formData.content}
                                    onChange={handleContentChange}
                                    mode={contentMode}
                                    onModeChange={setContentMode}
                                />
                            </CardBody>
                        </Card>
                    </div>

                    {/* Sidebar Settings */}
                    <div className="space-y-6">
                        {/* Post Settings */}
                        <Card>
                            <CardBody className="space-y-4">
                                <h3 className="font-semibold text-gray-900 border-b pb-2">Post Settings</h3>

                                {/* Category Dropdown */}
                                <div className="w-full">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                                    <select
                                        name="category"
                                        value={formData.category}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 border-gray-300 bg-white"
                                    >
                                        {CATEGORIES.map(cat => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                </div>

                                <Input
                                    label="Slug"
                                    name="slug"
                                    value={formData.slug}
                                    onChange={handleChange}
                                    helperText="Auto-generated from title"
                                />

                                <Textarea
                                    label="Excerpt"
                                    name="excerpt"
                                    rows={3}
                                    placeholder="Short summary of the post"
                                    value={formData.excerpt}
                                    onChange={handleChange}
                                />

                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-700">Featured Image</label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                        disabled={loading}
                                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                    />
                                    {uploadProgress !== null && (
                                        <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 mt-2">
                                            <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${uploadProgress}%` }}></div>
                                        </div>
                                    )}
                                    {formData.featuredImage && (
                                        <div className="mt-4 relative w-full h-48">
                                            <p className="text-sm text-gray-500 mb-2">Current Image:</p>
                                            <div className="relative w-full h-full">
                                                <Image src={formData.featuredImage} alt="Featured" fill className="rounded-md object-cover" />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </CardBody>
                        </Card>

                        {/* SEO Settings */}
                        <Card>
                            <CardBody className="space-y-4">
                                <h3 className="font-semibold text-gray-900 border-b pb-2">🔍 SEO Settings</h3>

                                <Input
                                    label="Meta Title"
                                    name="metaTitle"
                                    placeholder="Custom title for search engines"
                                    value={formData.metaTitle}
                                    onChange={handleChange}
                                    helperText="Leave empty to use post title"
                                />

                                <div className="w-full">
                                    <Textarea
                                        label="Meta Description"
                                        name="metaDescription"
                                        rows={3}
                                        placeholder="Short description for search engines (150-160 chars recommended)"
                                        value={formData.metaDescription}
                                        onChange={handleChange}
                                    />
                                    <p className={`mt-1 text-xs ${formData.metaDescription.length > 160 ? "text-red-500" :
                                            formData.metaDescription.length > 140 ? "text-yellow-600" : "text-gray-400"
                                        }`}>
                                        {formData.metaDescription.length}/160 characters
                                    </p>
                                </div>

                                <Input
                                    label="Keywords"
                                    name="keywords"
                                    placeholder="keyword1, keyword2, keyword3"
                                    value={formData.keywords}
                                    onChange={handleChange}
                                    helperText="Comma-separated keywords for SEO"
                                />
                            </CardBody>
                        </Card>
                    </div>
                </div>
            </div>
        </AdminRoute>
    );
}
