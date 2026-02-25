import Header from "@/components/ui/Header";
import Footer from "@/components/ui/Footer";
import Link from "next/link";
import { blogPosts } from "@/data/blogData";
import { notFound } from "next/navigation";

// Define Page Props type for Next.js App Router dynamic pages
type Props = {
    params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
    return blogPosts.map((post) => ({
        slug: post.slug,
    }));
}

export default async function BlogPostPage({ params }: Props) {
    const { slug } = await params;

    const post = blogPosts.find((p) => p.slug === slug);

    if (!post) {
        notFound();
    }

    const navLinks = [
        { label: "Home", href: "/" },
        { label: "About", href: "/about" },
        { label: "Module", href: "/modules" },
        { label: "Instructors", href: "/instructors" },
        { label: "Success Stories", href: "/feedback" },
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
                { label: "Success Stories", href: "/feedback" },
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
                                {post.category}
                            </span>
                        </div>
                        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#1f2937] mb-4 leading-tight">
                            {post.title}
                        </h1>
                        <p className="text-lg md:text-xl text-[#6b7280] leading-relaxed mb-6">
                            {post.excerpt}
                        </p>
                        <div className="flex items-center gap-2 text-sm text-[#6b7280]">
                            <span>{post.category}</span>
                            <span>·</span>
                            <span>{post.readTime}</span>
                        </div>
                    </div>
                </section>

                {/* 2. Featured Image Section */}
                <section className="w-full bg-white py-8">
                    <div className="max-w-3xl mx-auto px-6 lg:px-8">
                        <div className="w-full h-64 md:h-80 bg-[#f0fdf4] rounded-2xl flex items-center justify-center shadow-sm overflow-hidden">
                            <img
                                src={post.image}
                                alt={post.title}
                                className="w-full h-full object-cover"
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
