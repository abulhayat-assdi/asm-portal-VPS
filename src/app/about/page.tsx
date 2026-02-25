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
        { label: "Success Stories", href: "/feedback" },
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
                {/* 1. What Is This Course? */}
                <AboutCourseSection />

                {/* 2. Why This Course Exists */}
                <WhyThisCourseSection />

                {/* 5. Call To Action */}
                <AboutCTASection />
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
