import Header from "@/components/ui/Header";
import Footer from "@/components/ui/Footer";
import Link from "next/link";
import { getPostBySlug, getPosts } from "@/services/blogService";
import { notFound } from "next/navigation";
import Image from "next/image";
import type { Metadata } from "next";
import BlogShare from "@/components/blog/BlogShare";
import BlogComments from "@/components/blog/BlogComments";

// Define Page Props type for Next.js App Router dynamic pages
type Props = {
    params: Promise<{ slug: string }>;
};

export const revalidate = 3600; // revalidate at most every hour

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    const post = await getPostBySlug(slug);

    if (!post) {
        return { title: "Post Not Found" };
    }

    const title = post.metaTitle || post.title;
    const description = post.metaDescription || post.excerpt || "";
    const keywords = post.keywords || "";
    const imageUrl = post.featuredImage || "";

    return {
        title,
        description,
        keywords,
        openGraph: {
            title,
            description,
            images: imageUrl ? [{ url: imageUrl }] : [],
            type: "article",
        },
        twitter: {
            card: "summary_large_image",
            title,
            description,
            images: imageUrl ? [imageUrl] : [],
        },
    };
}

export async function generateStaticParams() {
    const allPosts = await getPosts();
    const publishedPosts = allPosts.filter(p => p.status === 'published');
    return publishedPosts.map((post) => ({
        slug: post.slug,
    }));
}

export default async function BlogPostPage({ params }: Props) {
    const { slug } = await params;
    const post = await getPostBySlug(slug);

    if (!post) {
        notFound();
    }

    const navLinks = [
        { label: "Home", href: "/" },
        { label: "About", href: "/about" },
        { label: "Module", href: "/modules" },
        { label: "Instructors", href: "/instructors" },
        { label: "Success Stories", href: "/success-stories" },
        { label: "Contact & Q&A", href: "/contact" },
        { label: "Blog", href: "/blog", isActive: true },
    ];

    const footerLinkGroups = [
        {
            title: "Navigation",
            links: [
                { label: "Home", href: "/" },
                { label: "About", href: "/about" },
                { label: "Module", href: "/modules" },
                { label: "Instructors", href: "/instructors" },
            ],
        },
        {
            title: "Support",
            links: [
                { label: "Success Stories", href: "/success-stories" },
                { label: "Contact & Q&A", href: "/contact" },
                { label: "Enroll / Learn More", href: "/enroll" },
            ],
        },
    ];

    return (
        <>
            <Header
                brandText="Sales & Marketing"
                navLinks={navLinks}
                ctaText="Enroll"
            />

            <main className="min-h-screen bg-white">
                {/* 1. Article Header Section */}
                <section className="w-full bg-white pt-16 md:pt-20 pb-8">
                    <div className="max-w-3xl mx-auto px-6 lg:px-8">
                        <div className="mb-4">
                            <span className="text-sm font-medium text-[#059669] uppercase tracking-wide">
                                {post.category || "Article"}
                            </span>
                        </div>
                        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#1f2937] mb-4 leading-tight">
                            {post.title}
                        </h1>
                        <p className="text-lg md:text-xl text-[#6b7280] leading-relaxed mb-6">
                            {post.excerpt}
                        </p>
                        <div className="flex items-center gap-2 text-sm text-[#6b7280]">
                            <span>{post.category || "Article"}</span>
                            <span>·</span>
                            <span>{Math.ceil((post.content?.split(' ').length || 0) / 200)} min read</span>
                        </div>
                    </div>
                </section>

                {/* 2. Featured Image Section */}
                <section className="w-full bg-white py-8">
                    <div className="max-w-3xl mx-auto px-6 lg:px-8">
                        <div className="relative w-full h-64 md:h-80 bg-[#f0fdf4] rounded-2xl flex items-center justify-center shadow-sm overflow-hidden">
                            <Image
                                src={post.featuredImage || "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"}
                                alt={post.title}
                                fill
                                priority
                                placeholder="blur"
                                blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAGCAYAAAD68A/GAAAApElEQVQoU2NkYGD4z8BQz0AJYAQqVGdk+M9AJWBkZPxPjUJGRkZGKioqjIyMTExMtLS0tLCwsLCwsLCwsLAwMDAwMDAwMjIyMjIyMjKysrK0tLS0tbW1tbW1taurq6urq6urq8vLy8vLy8vLy8vr6+vr6+vr6+tHR0dHR0dHR0dLS0tLS0tLCwsLCwsLCk5OTk5OTk5OTjIyMjIyMjIyMgA"
                                className="object-cover"
                                sizes="(max-width: 768px) 100vw, 768px"
                            />
                        </div>
                    </div>
                </section>

                {/* 3. Article Content Section */}
                <section className="w-full bg-white py-8 md:py-12">
                    <article className="max-w-3xl mx-auto px-6 lg:px-8">
                        <div
                            className="prose prose-lg max-w-none prose-headings:text-[#1f2937] prose-p:text-[#4b5563]"
                            dangerouslySetInnerHTML={{ __html: post.content }}
                        />

                        {/* 4. Social Share Section */}
                        <BlogShare title={post.title} excerpt={post.excerpt} />

                        {/* 5. Comments Section */}
                        {post.id && <BlogComments blogId={post.id} />}
                    </article>
                </section>

                {/* 6. Article Footer Navigation */}
                <section className="w-full bg-white py-12 md:py-16">
                    <div className="max-w-3xl mx-auto px-6 lg:px-8">
                        <div className="border-t border-[#e5e7eb] pt-8">
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                                <Link
                                    href="/blog"
                                    className="px-6 py-3 border-2 border-[#059669] text-[#059669] font-semibold rounded-full
                                        transition-all duration-200 ease-out
                                        hover:bg-[#f0fdf4]
                                        focus:outline-none focus:ring-2 focus:ring-[#059669] focus:ring-offset-2"
                                >
                                    ← Back to Blog
                                </Link>

                            </div>
                        </div>
                    </div>
                </section>
            </main>

            <Footer
                brandName="Sales & Marketing"
                brandDescription="A professional learning platform focused on practical sales, marketing, and ethical growth."
                linkGroups={footerLinkGroups}
                copyrightText="© 2026 Sales & Marketing. All rights reserved."
            />
        </>
    );
}
