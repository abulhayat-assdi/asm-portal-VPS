import Header from "@/components/ui/Header";
import Footer from "@/components/ui/Footer";
import AboutCourseSection from "@/components/ui/AboutCourseSection";
import WhyThisCourseSection from "@/components/ui/WhyThisCourseSection";
import AboutCTASection from "@/components/ui/AboutCTASection";
import { getCmsContent } from "@/lib/getCmsContent";

export default async function AboutPage() {
    const cmsData = await getCmsContent("about_page");
    type Rec = Record<string, unknown>;
    const d = cmsData as Rec;

    const header = (d.header as Rec) ?? {};
    const aboutSection = (d.aboutSection as Rec) ?? {};
    const whySection = (d.whySection as Rec) ?? {};
    const ctaSection = (d.ctaSection as Rec) ?? {};
    const courseHighlights = Array.isArray(d.courseHighlights)
        ? d.courseHighlights as { id?: string; title: string; description: string }[]
        : [];
    const whyCards = Array.isArray(d.whyCards)
        ? d.whyCards as { id?: string; title: string; description: string }[]
        : [];

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

            <main className="min-h-screen bg-slate-50 flex flex-col">
                <div className="pt-8 md:pt-10 pb-6 w-full max-w-7xl mx-auto px-6 lg:px-8 text-center">
                    <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-[#111827] mb-3 tracking-tight">
                        {(header.title as string) || "About The Course"}
                    </h1>
                    <p className="text-lg md:text-xl text-[#4b5563] leading-relaxed max-w-3xl mx-auto font-medium">
                        {(header.subtitle as string) || ""}
                    </p>
                </div>

                <div className="flex-grow z-20 relative">
                    <AboutCourseSection
                        title={aboutSection.title as string | undefined}
                        description1={aboutSection.description1 as string | undefined}
                        description2={aboutSection.description2 as string | undefined}
                        description3={aboutSection.description3 as string | undefined}
                        courseHighlights={courseHighlights}
                    />

                    <WhyThisCourseSection
                        title={whySection.title as string | undefined}
                        whyCards={whyCards}
                    />

                    <AboutCTASection
                        text={ctaSection.text as string | undefined}
                        buttonText={ctaSection.buttonText as string | undefined}
                    />
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
