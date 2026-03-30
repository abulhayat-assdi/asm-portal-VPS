import Header from "@/components/ui/Header";
import Footer from "@/components/ui/Footer";
import AboutCourseSection from "@/components/ui/AboutCourseSection";
import WhyThisCourseSection from "@/components/ui/WhyThisCourseSection";
import AboutCTASection from "@/components/ui/AboutCTASection";

export default function AboutPage() {
    const navLinks = [
        { label: "Home", href: "/" },
        { label: "About", href: "/about", isActive: true },
        { label: "Module", href: "/modules" },
        { label: "Instructors", href: "/instructors" },
        { label: "Success Stories", href: "/success-stories" },
        { label: "Contact & Q&A", href: "/contact" },
        { label: "Blog", href: "/blog" },
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

            <main className="min-h-screen bg-[#fafaf9] flex flex-col">
                {/* Clean Page Header */}
                <div className="pt-8 md:pt-10 pb-6 w-full max-w-7xl mx-auto px-6 lg:px-8 text-center">
                    <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-[#111827] mb-3 tracking-tight">
                        About The Course
                    </h1>
                    <p className="text-lg md:text-xl text-[#4b5563] leading-relaxed max-w-3xl mx-auto font-medium">
                        বর্তমান মার্কেটপ্লেসে সত্যিকারের সাফল্য অর্জন করতে যে সলিড স্কিলগুলো প্রয়োজন, এই কোর্স আপনাকে সেটাই প্রোভাইড করবে।<br />
                        Built on pure ethics and 100% practical knowledge.
                    </p>
                </div>

                {/* 1. What Is This Course? */}
                <div className="flex-grow z-20 relative">
                    <AboutCourseSection />

                    {/* 2. Why This Course Exists */}
                    <WhyThisCourseSection />

                    {/* 5. Call To Action */}
                    <AboutCTASection />
                </div>
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
