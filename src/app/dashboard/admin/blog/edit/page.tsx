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

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function EditBlogContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const id = searchParams.get('id');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [originalPost, setOriginalPost] = useState<blogService.BlogPost | null>(null);
    const [formData, setFormData] = useState({
        title: "",
        slug: "",
        excerpt: "",
        featuredImage: "",
        content: ""
    });

    useEffect(() => {
        const loadPost = async () => {
            if (!id) {
                // router.push('/dashboard/admin/blog');
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
                    content: post.content || ''
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

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
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
            // Optionally update local state or redirect
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
                                <Textarea
                                    label="Content"
                                    name="content"
                                    placeholder="Write your post content here..."
                                    rows={15}
                                    value={formData.content}
                                    onChange={handleChange}
                                    required
                                />
                            </CardBody>
                        </Card>
                    </div>

                    {/* Sidebar Settings */}
                    <div className="space-y-6">
                        <Card>
                            <CardBody className="space-y-4">
                                <h3 className="font-semibold text-gray-900 border-b pb-2">Post Settings</h3>

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

                                <Input
                                    label="Featured Image URL"
                                    name="featuredImage"
                                    placeholder="https://example.com/image.jpg"
                                    value={formData.featuredImage}
                                    onChange={handleChange}
                                />

                                <div className="pt-4 border-t">
                                    <p className="text-sm text-gray-500">
                                        Status: <span className="font-medium text-gray-900 capitalize">{originalPost?.status}</span>
                                    </p>
                                    <p className="text-sm text-gray-500 mt-1">
                                        Created: {new Date(originalPost?.createdAt).toLocaleDateString()}
                                    </p>
                                </div>
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
