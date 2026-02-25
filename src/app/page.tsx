"use client";

import HeroSection from "@/components/ui/HeroSection";

import LearningOutcomes from "@/components/ui/LearningOutcomes";
import TargetAudience, { defaultAudienceIcons } from "@/components/ui/TargetAudience";
import Header from "@/components/ui/Header";
import Footer from "@/components/ui/Footer";
import { useRouter } from "next/navigation";

export default function HomePage() {
    const router = useRouter();

    const navLinks = [
        { label: "Home", href: "/", isActive: true },
        { label: "About", href: "/about" },
        { label: "Module", href: "/modules" },
        { label: "Instructors", href: "/instructors" },
        { label: "Success Stories", href: "/feedback" },
        { label: "Contact & Q&A", href: "/contact" },
        { label: "Blog", href: "/blog" },
    ];



    const learningOutcomes = [
        "Confidently pitch and sell products face-to-face and online with absolute honesty.",
        "Master AI tools, Canva, and Meta Ads responsibly to drive business growth.",
        "Communicate persuasively and handle objections while respecting customer choices.",
        "Design and execute high-converting digital marketing campaigns without deception.",
        "Build a professional CV, portfolio, and a personal brand rooted in integrity.",
        "Apply Islamic ethics (Amanah, Adl, Ikhlas) in daily business decisions and workplace behavior.",
        "Gain proficiency in MS Office Applications to manage business data and professional communications.",
        "Develop highly engaging landing pages and content marketing strategies that deliver real value.",
    ];

    const audiences = [
        {
            icon: defaultAudienceIcons.students,
            title: "Students",
            description: "Bridge the gap between education and employment. Overcome fear and build real-world confidence.",
        },
        {
            icon: defaultAudienceIcons.jobSeekers,
            title: "Job Seekers",
            description: "Impress in job interviews with confident communication and secure a dignified career in a competitive market.",
        },
        {
            icon: defaultAudienceIcons.entrepreneurs,
            title: "Entrepreneurs",
            description: "Grow your business by mastering offline and online sales, and build long-term trust with real customers.",
        },
        {
            icon: defaultAudienceIcons.ethicalLearners,
            title: "Ethical Learners",
            description: "Earn halal rizq with dignity by treating sales as a trust (amanah) without manipulation or haram shortcuts.",
        },
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
                onCtaClick={() => router.push('/enroll')}
                onBrandClick={() => router.push('/')}
                transparent={true}
            />
            <main className="min-h-screen bg-white">
                <HeroSection
                    heading="The Art of Sales & Marketing"
                    subheading=""
                    primaryButtonText="Learn About the Course"
                    secondaryButtonText="View Modules"
                    onPrimaryClick={() => router.push('/about')}
                    onSecondaryClick={() => router.push('/modules')}
                />



                <TargetAudience
                    title="Who This Course Is For"
                    subtitle="Transform into a confident, ethical professional—ready for a career or business while earning halal rizq."
                    audiences={audiences}
                />

                <LearningOutcomes
                    title="What You Will Gain"
                    subtitle="Practical skills, digital expertise, and an ethical mindset to thrive in today's competitive market."
                    outcomes={learningOutcomes}
                />
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
