"use client";

import { useState, useEffect } from "react";
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

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

const CATEGORIES = ["Article", "Project Presentation", "Practical Learning"];

function EditBlogContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const id = searchParams.get('id');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<number | null>(null);
    const [originalPost, setOriginalPost] = useState<blogService.BlogPost | null>(null);
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

    useEffect(() => {
        const loadPost = async () => {
            if (!id) {
                return;
            }

            try {
                const post = await blogService.getPost(id);
                if (!post) {
                    alert("Post not found");
                    router.push('/dashboard/admin/blog');
                    return;
                }
                setOriginalPost(post);
                setFormData({
                    title: post.title,
                    slug: post.slug || '',
                    excerpt: post.excerpt || '',
                    featuredImage: post.featuredImage || '',
                    content: post.content || '',
                    category: post.category || 'Article',
                    metaTitle: post.metaTitle || '',
                    metaDescription: post.metaDescription || '',
                    keywords: post.keywords || ''
                });
            } catch (error) {
                console.error("Failed to load post", error);
                alert("Failed to load post");
            } finally {
                setLoading(false);
            }
        };

        loadPost();
    }, [id, router]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleContentChange = (html: string) => {
        setFormData(prev => ({ ...prev, content: html }));
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setSaving(true);
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
            setSaving(false);
            setUploadProgress(null);
        }
    };

    const handleSave = async () => {
        if (!id) return;

        if (!formData.title || !formData.content) {
            alert("Title and Content are required");
            return;
        }

        setSaving(true);
        try {
            await blogService.updatePost(id, formData);
            router.push('/dashboard/admin/blog');
        } catch (error) {
            console.error(error);
            alert("Failed to save changes");
        } finally {
            setSaving(false);
        }
    };

    const handlePublish = async () => {
        if (!id) return;
        if (!confirm("Are you sure you want to publish this post?")) return;

        setSaving(true);
        try {
            await blogService.publishPost(id);
            router.push('/dashboard/admin/blog');
        } catch (error) {
            console.error(error);
            alert("Failed to publish post");
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <AdminRoute>
                <div className="flex items-center justify-center p-12">
                    <p className="text-gray-500">Loading post...</p>
                </div>
            </AdminRoute>
        );
    }

    const isPublished = originalPost?.status === 'published';

    return (
        <AdminRoute>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-[#1f2937]">Edit Post</h1>
                        <p className="text-[#6b7280] mt-1">
                            Editing: <span className="font-semibold">{originalPost?.title}</span>
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Link href="/dashboard/admin/blog">
                            <Button variant="outline" disabled={saving}>Cancel</Button>
                        </Link>

                        {!isPublished && (
                            <Button
                                onClick={handlePublish}
                                disabled={saving}
                                className="bg-green-600 hover:bg-green-700 text-white"
                            >
                                Publish Post
                            </Button>
                        )}

                        <Button
                            variant="primary"
                            onClick={handleSave}
                            disabled={saving}
                        >
                            Save Changes
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
                                    disabled={isPublished}
                                    helperText={isPublished ? "Cannot edit slug of published post" : "SEO friendly URL"}
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
                                        disabled={saving}
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

                                <div className="pt-4 border-t">
                                    <p className="text-sm text-gray-500">
                                        Status: <span className="font-medium text-gray-900 capitalize">{originalPost?.status}</span>
                                    </p>
                                     <p className="text-sm text-gray-500 mt-1">
                                         Created: {originalPost?.createdAt ? new Date(originalPost.createdAt).toLocaleDateString() : "Unknown"}
                                     </p>
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

export default function EditBlogPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <EditBlogContent />
        </Suspense>
    );
}
