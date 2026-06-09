export const dynamic = "force-dynamic";

import Link from "next/link";
import Header from "@/components/ui/Header";
import Footer from "@/components/ui/Footer";
import { prisma } from "@/lib/db";
import { getCmsContent } from "@/lib/getCmsContent";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Course Modules",
    description:
        "TASM Skill-এর ৯টি প্রফেশনাল মডিউল — Sales Mastery, Digital Marketing, Career Planning & Branding, AI for Marketers, Business English এবং আরও অনেক কিছু। বাংলাদেশে সেরা Sales & Marketing ট্রেনিং।",
    keywords: [
        "sales course modules",
        "digital marketing modules Bangladesh",
        "career planning course",
        "AI for marketers",
        "business English course",
        "সেলস কোর্স মডিউল",
    ],
    alternates: { canonical: "/modules" },
    openGraph: {
        title: "Course Modules | TASM Skill",
        description: "TASM Skill-এর ৯টি প্রফেশনাল মডিউল — Sales, Digital Marketing, Career Planning এবং আরও অনেক কিছু।",
        url: "/modules",
    },
};

type RawModule = { id: string; slug: string; title: string; bullets: unknown; is_published: boolean };

async function getCoreModules() {
    try {
        const rows = await prisma.$queryRaw<RawModule[]>`
            SELECT id, slug, title, bullets, is_published
            FROM course_modules
            WHERE is_published = true
            ORDER BY "order" ASC, created_at ASC
        `;
        return rows.map(r => ({ id: r.id, slug: r.slug, title: r.title, bullets: r.bullets, isPublished: r.is_published }));
    } catch {
        return [];
    }
}

export default async function ModulesPage() {
    const [coreModules, cmsData] = await Promise.all([
        getCoreModules(),
        getCmsContent("modules_page"),
    ]);
    const pageHeader = (cmsData as Record<string, Record<string, string>>).header ?? {};

    const navLinks = [
        { label: "Home", href: "/" },
        { label: "About", href: "/about" },
        { label: "Module", href: "/modules", isActive: true },
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
                {/* Clean Page Header */}
                <div className="pt-8 md:pt-10 pb-6 w-full max-w-7xl mx-auto px-6 lg:px-8 text-center">
                    <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-[#111827] mb-3 tracking-tight">
                        {pageHeader.title || "Our Core Modules"}
                    </h1>
                    <p className="text-lg md:text-xl text-[#4b5563] leading-relaxed max-w-2xl mx-auto font-medium">
                        {pageHeader.subtitle || "A comprehensive journey designed to build your skills from the ground up, combining theory with real-world practice."}
                    </p>
                </div>

                {/* 3. Core Modules Section */}
                <section className="w-full pb-16 md:pb-24 flex-grow relative z-20">
                    <div className="max-w-7xl mx-auto px-6 lg:px-8">
                        {coreModules.length === 0 ? (
                            <div className="text-center py-24 text-gray-400">
                                <p className="text-lg font-medium">কোনো module পাওয়া যায়নি।</p>
                                <p className="text-sm mt-1">Admin panel থেকে module যোগ করুন।</p>
                            </div>
                        ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {coreModules.map((module, index) => {
                                const bullets = Array.isArray(module.bullets) ? module.bullets as string[] : [];
                                return (
                                    <div
                                        key={module.id}
                                        className={`
                                            group relative bg-white rounded-2xl overflow-hidden border flex flex-col
                                            transition-all duration-300 ease-out
                                            hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(0,0,0,0.06)] shadow-sm
                                            ${index === 0
                                                ? 'border-[#059669]/20 shadow-[0_4px_20px_rgba(5,150,105,0.08)] ring-1 ring-[#059669]/5'
                                                : 'border-gray-100 hover:border-[#059669]/20'
                                            }
                                        `}
                                    >
                                        {/* Animated top accent bar */}
                                        <div className={`
                                            absolute top-0 left-0 right-0 h-1 rounded-t-2xl
                                            bg-gradient-to-r from-[#059669] via-[#34d399] to-[#059669]
                                            transition-all duration-300
                                            ${index === 0 ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}
                                        `} />

                                        {/* Card body */}
                                        <div className="p-8 flex flex-col flex-1">
                                            {/* Header row */}
                                            <div className="flex items-start justify-between mb-4 gap-2">
                                                {/* Module number and title */}
                                                <div className="flex items-start gap-3">
                                                    <span className={`
                                                        w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5
                                                        transition-all duration-300
                                                        ${index === 0
                                                            ? 'bg-[#059669] text-white'
                                                            : 'bg-gray-100 text-[#9ca3af] group-hover:bg-[#059669] group-hover:text-white'
                                                        }
                                                    `}>
                                                        {String(index + 1).padStart(2, '0')}
                                                    </span>
                                                    <h3 className="text-xl font-bold text-[#1f2937] group-hover:text-[#059669] transition-colors duration-300 leading-snug pt-0.5">
                                                        {module.title}
                                                    </h3>
                                                </div>
                                                {index === 0 && (
                                                    <span className="bg-[#ecfdf5] text-[#059669] text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0">
                                                        Foundation
                                                    </span>
                                                )}
                                            </div>

                                            {/* Bullet list */}
                                            <ul className="space-y-2.5 flex-1">
                                                {bullets.map((bullet, bIndex) => (
                                                    <li key={bIndex} className="flex items-start gap-2.5 text-sm text-[#6b7280] leading-relaxed">
                                                        <span className={`
                                                            flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5
                                                            transition-all duration-300
                                                            ${index === 0
                                                                ? 'bg-[#ecfdf5] text-[#059669]'
                                                                : 'bg-gray-50 text-[#9ca3af] group-hover:bg-[#ecfdf5] group-hover:text-[#059669]'
                                                            }
                                                        `}>
                                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 12l5 5L20 7" />
                                                            </svg>
                                                        </span>
                                                        <span className="group-hover:text-[#374151] transition-colors duration-200">{bullet}</span>
                                                    </li>
                                                ))}
                                            </ul>

                                            {/* See Full Module Button */}
                                            <div className="mt-auto pt-6 border-t border-gray-100">
                                                <Link
                                                    href={`/modules/${module.slug}`}
                                                    className="inline-flex items-center justify-center w-full px-4 py-2.5 text-sm font-medium rounded-xl transition-all duration-300 border group/btn relative overflow-hidden text-white bg-[#1e293b] hover:bg-[#0f172a] border-transparent shadow-md hover:shadow-lg"
                                                >
                                                    <span className="relative z-10 font-semibold tracking-wide">
                                                        See Full Module
                                                    </span>
                                                    <svg
                                                        className="w-4 h-4 ml-2 mt-[1px] group-hover/btn:translate-x-1 transition-transform relative z-10"
                                                        fill="none"
                                                        viewBox="0 0 24 24"
                                                        stroke="currentColor"
                                                    >
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                                    </svg>
                                                </Link>
                                            </div>
                                        </div>

                                        {/* Bottom hover glow */}
                                        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-emerald-50/0 to-emerald-50/0 group-hover:from-emerald-50/30 group-hover:to-transparent transition-all duration-500 pointer-events-none" />
                                    </div>
                                );
                            })}
                        </div>
                        )}
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
