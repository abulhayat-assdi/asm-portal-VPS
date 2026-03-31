import Header from "@/components/ui/Header";
import Footer from "@/components/ui/Footer";
import { getPublishedPosts } from "@/services/blogService";
import BlogList from "@/components/blog/BlogList";

export const revalidate = 3600; // revalidate at most every hour

export default async function BlogPage() {
    const publishedPosts = await getPublishedPosts();
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
                {/* 1. Page Header Section */}
                <section className="w-full bg-white pt-6 pb-8 md:pt-8 md:pb-10">
                    <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center">
                        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#1f2937] mb-4">
                            Blog
                        </h1>
                        <p className="text-lg md:text-xl text-[#6b7280] max-w-3xl mx-auto">
                            সেলস, মার্কেটিং, হিউম্যান সাইকোলজি এবং প্রফেশনাল গ্রোথ নিয়ে রিয়েল-লাইফ এক্সপেরিয়েন্স ও প্র্যাক্টিক্যাল লার্নিংয়ের এক সমৃদ্ধ সংগ্রহশালা।
                        </p>
                    </div>
                </section>

                {/* 4. Blog Posts Grid Section */}
                <section className="w-full bg-[#f9fafb] py-16 md:py-20">
                    <div className="max-w-7xl mx-auto px-6 lg:px-8">
                        <BlogList posts={publishedPosts} />
                    </div>
                </section>


                {/* 5. Educational Note Section */}
                <section className="w-full bg-white py-12 md:py-16">
                    <div className="max-w-3xl mx-auto px-6 lg:px-8 text-center">
                        <p className="text-[#6b7280] leading-relaxed">
                            This blog is part of an educational effort to promote honest communication, ethical earning, and responsible professional growth in sales and marketing.
                        </p>
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
