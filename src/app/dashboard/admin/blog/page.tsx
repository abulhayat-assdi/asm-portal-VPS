"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Card, { CardBody } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import AdminRoute from "@/components/auth/AdminRoute";
import * as blogService from "@/services/blogService";
import { formatDateShort } from "@/lib/utils";

export default function BlogAdminPage() {
    const [posts, setPosts] = useState<blogService.BlogPost[]>([]);
    const [loading, setLoading] = useState(true);

    const loadPosts = async () => {
        setLoading(true);
        try {
            const data = await blogService.getPosts();
            setPosts(data);
        } catch (error) {
            console.error("Failed to load posts", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadPosts();
    }, []);

    const handlePublish = async (post: blogService.BlogPost) => {
        if (!confirm(`Are you sure you want to publish "${post.title}"?`)) return;

        try {
            await blogService.publishPost(post.id);
            await loadPosts();
        } catch (error) {
            alert("Failed to publish post");
        }
    };

    const handleDelete = async (post: blogService.BlogPost) => {
        if (!confirm(`Are you sure you want to delete "${post.title}"?`)) return;

        try {
            await blogService.deletePost(post.id);
            await loadPosts();
        } catch (error) {
            alert("Failed to delete post");
        }
    };

    return (
        <AdminRoute>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-[#1f2937]">
                            Blog Management
                        </h1>
                        <p className="text-[#6b7280] mt-1">
                            Create and manage blog posts
                        </p>
                    </div>
                    <Link href="/dashboard/admin/blog/create">
                        <Button>
                            Create New Post
                        </Button>
                    </Link>
                </div>

                {/* Posts Table */}
                <Card>
                    <CardBody className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm text-gray-600">
                                <thead className="bg-[#1e3a5f] text-white uppercase font-semibold">
                                    <tr>
                                        <th className="px-6 py-4 border border-[#2d5278]">Title</th>
                                        <th className="px-6 py-4 border border-[#2d5278] text-center w-32">Status</th>
                                        <th className="px-6 py-4 border border-[#2d5278] text-center w-40">Created Date</th>
                                        <th className="px-6 py-4 border border-[#2d5278] text-right w-48">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                                                Loading posts...
                                            </td>
                                        </tr>
                                    ) : posts.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                                                No blog posts found. Create one to get started.
                                            </td>
                                        </tr>
                                    ) : (
                                        posts.map((post, index) => (
                                            <tr key={post.id} className={index % 2 === 0 ? "bg-white" : "bg-[#f9fafb]"}>
                                                <td className="px-6 py-4 font-medium text-gray-900 border border-[#e5e7eb]">
                                                    {post.title}
                                                </td>
                                                <td className="px-6 py-4 text-center border border-[#e5e7eb]">
                                                    <Badge variant={post.status === 'published' ? 'success' : 'default'}>
                                                        {post.status === 'published' ? 'Published' : 'Draft'}
                                                    </Badge>
                                                </td>
                                                <td className="px-6 py-4 text-center border border-[#e5e7eb]">
                                                    {formatDateShort(post.createdAt)}
                                                </td>
                                                <td className="px-6 py-4 text-right border border-[#e5e7eb]">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Link href={`/dashboard/admin/blog/edit?id=${post.id}`}>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                            >
                                                                Edit
                                                            </Button>
                                                        </Link>
                                                        {post.status === 'draft' && (
                                                            <Button
                                                                size="sm"
                                                                variant="primary" // Re-using primary green for publish action
                                                                className="bg-blue-600 hover:bg-blue-700 focus:ring-blue-600 border-transparent text-white"
                                                                onClick={() => handlePublish(post)}
                                                            >
                                                                Publish
                                                            </Button>
                                                        )}
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            className="text-red-600 hover:bg-red-50 hover:text-red-700"
                                                            onClick={() => handleDelete(post)}
                                                        >
                                                            Delete
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardBody>
                </Card>
            </div>
        </AdminRoute>
    );
}
