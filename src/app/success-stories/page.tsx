import Header from "@/components/ui/Header";
import Footer from "@/components/ui/Footer";
import SuccessStoriesContent from "@/components/ui/SuccessStoriesContent";

export default async function PublicSuccessStoriesPage() {
    const navLinks = [
        { label: "Home", href: "/" },
        { label: "About", href: "/about" },
        { label: "Module", href: "/modules" },
        { label: "Instructors", href: "/instructors" },
        { label: "Success Stories", href: "/success-stories", isActive: true },
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
            <Header brandText="Sales & Marketing" navLinks={navLinks} ctaText="Enroll" />

            <main className="min-h-screen bg-slate-50 flex flex-col">
                {/* Clean Page Header */}
                <div className="pt-8 md:pt-10 pb-6 w-full max-w-7xl mx-auto px-6 lg:px-8 text-center">
                    <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-[#111827] mb-3 tracking-tight">
                        Our Success Stories
                    </h1>
                    <p className="text-lg md:text-xl text-[#4b5563] leading-relaxed max-w-2xl mx-auto font-medium">
                        Watch real stories from our students — how they transformed their careers through the Art of Sales & Marketing program.
                    </p>
                </div>

                {/* Client component for the interactive parts */}
                <SuccessStoriesContent />
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
