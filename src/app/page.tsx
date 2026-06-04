import HeroSection from "@/components/ui/HeroSection";
import StudentVideoTestimonials from "@/components/ui/StudentVideoTestimonials";
import TargetAudience from "@/components/ui/TargetAudience";
import Header from "@/components/ui/Header";
import Footer from "@/components/ui/Footer";
import { prisma } from "@/lib/db";
import { getCmsContent } from "@/lib/getCmsContent";

async function getActiveHeroImages(): Promise<string[]> {
    try {
        const images = await prisma.heroImage.findMany({
            where: { isActive: true },
            orderBy: { order: "asc" },
            select: { url: true },
        });
        return images.map((img: { url: string }) => img.url);
    } catch {
        return [];
    }
}

const navLinks = [
    { label: "Home", href: "/", isActive: true },
    { label: "About", href: "/about" },
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

export default async function HomePage() {
    const [heroImages, cmsData] = await Promise.all([
        getActiveHeroImages(),
        getCmsContent("home_page"),
    ]);

    type Rec = Record<string, unknown>;
    const d = cmsData as Rec;
    const hero = (d.hero as Rec) ?? {};
    const targetAudience = (d.targetAudience as Rec) ?? {};
    const audienceCards = Array.isArray(d.audienceCards) ? d.audienceCards as { id?: string; iconKey?: string; title: string; description: string }[] : [];

    return (
        <>
            <Header
                brandText="Sales & Marketing"
                navLinks={navLinks}
                ctaText="Enroll"
                ctaHref="/enroll"
                secondaryCtaText="Login as Teacher"
                secondaryCtaHref="/login"
                studentLoginHref="/student-login"
                transparent={true}
            />
            <main className="min-h-screen bg-slate-50">
                <HeroSection
                    heading={hero.heading as string | undefined}
                    subheading={hero.subheading as string | undefined}
                    primaryButtonText={hero.primaryButtonText as string | undefined}
                    secondaryButtonText={hero.secondaryButtonText as string | undefined}
                    primaryButtonHref="/about"
                    secondaryButtonHref="/modules"
                    heroImages={heroImages}
                />

                <TargetAudience
                    title={(targetAudience.title as string) || "Who This Course Is For"}
                    subtitle={(targetAudience.subtitle as string) || ""}
                    audiences={audienceCards}
                />

                <StudentVideoTestimonials />
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
