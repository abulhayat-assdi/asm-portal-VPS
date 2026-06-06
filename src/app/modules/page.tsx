import Header from "@/components/ui/Header";
import Footer from "@/components/ui/Footer";
import Link from "next/link";
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

// Fallback hardcoded modules used only when DB has no data yet
const FALLBACK_MODULES = [
    { id: "fallback-1", slug: "sales-mastery", title: "Sales Mastery", bullets: ["Face-to-Face এবং অনলাইনে কনফিডেন্টলি প্রোডাক্ট সেল করার সাইকোলজি আয়ত্ত করা।", "কাস্টমারের যেকোনো অবজেকশন স্মার্টলি এবং পেশাদারিত্বের সাথে হ্যান্ডেল করা।", "কোনো বিরক্তিকর অ্যাপ্রোচ ছাড়াই B2B এবং B2C ডিল ক্র্যাক করার স্ট্র্যাটেজি।", "সেলসকে একটি 'আমানাহ' হিসেবে নিয়ে কাস্টমারের সাথে লং-টার্ম ট্রাস্ট বিল্ড করা।"], isPublished: true },
    { id: "fallback-2", slug: "career-planning-branding", title: "Career Planning & Branding", bullets: ["এমন একটি Winning CV তৈরি করা যা সহজেই ইন্টারভিউ কল নিয়ে আসবে।", "নিজেকে একটি পাওয়ারফুল Personal Brand হিসেবে এস্টাবলিশ করা।", "ইন্টারভিউ বোর্ডে 100% কনফিডেন্সের সাথে নিজেকে প্রেজেন্ট করার সিক্রেট হ্যাকস।", "নিজের ক্যারিয়ার বা অন্ট্রাপ্রেনিউরিয়াল জার্নির পুরো কন্ট্রোল নিজের হাতে নেওয়া।"], isPublished: true },
    { id: "fallback-3", slug: "customer-service-excellence", title: "Customer Service Excellence", bullets: ["রাগান্বিত কাস্টমারকেও আপনার ব্র্যান্ডের লয়্যাল ফ্যানে পরিণত করার সাইকোলজিক্যাল টেকনিক।", "Empathy এবং সবরের সাথে যেকোনো ডিফিকাল্ট সিচুয়েশন হ্যান্ডেল করা।", "প্রো-অ্যাকটিভ সাপোর্ট দিয়ে Client-এর সাথে স্ট্রং রিলেশনশিপ বিল্ড করা।", "কাস্টমার সার্ভিসের ক্ষেত্রে ইহসান (Excellence) এবং আদল (Fairness) নিশ্চিত করা।"], isPublished: true },
    { id: "fallback-4", slug: "ai-for-digital-marketers", title: "AI for Digital Marketers", bullets: ["লেটেস্ট AI Tools ব্যবহার করে কাজের স্পিড এবং প্রোডাক্টিভিটি 10x বাড়িয়ে ফেলা।", "Canva মাস্টার করে আইক্যাচি ব্র্যান্ডিং এবং সোশ্যাল মিডিয়া অ্যাড ডিজাইন করা।", "বোরিং মার্কেটিং ওয়ার্কফ্লো অটোমেট করে স্ট্র্যাটেজি এবং ব্রেইনস্টর্মিংয়ে ফোকাস করা।", "কোনো ফেক হাইপ বা ধোঁকা ছাড়াই রেসপন্সিবিলিটির সাথে টেকনোলজি ইউজ করা।"], isPublished: true },
    { id: "fallback-5", slug: "digital-marketing", title: "Digital Marketing", bullets: ["ম্যাক্সিমাম ROI-এর জন্য Meta Ads (Facebook & Instagram) এর নাড়িভুঁড়ি আয়ত্ত করা।", "বিজনেস গ্রোথের জন্য স্ক্র্যাচ থেকে পাওয়ারফুল সোশ্যাল মিডিয়া স্ট্র্যাটেজি দাঁড় করানো।", "কমিউনিটি বিল্ড-আপ এবং রেফারেলের মাধ্যমে জেনুইন অর্গানিক গ্রোথ আনা।", "এথিক্যাল প্রমোশন এবং প্রিসাইজ অডিয়েন্স টার্গেটিংয়ের মাধ্যমে রিয়েল সঞ্চয় জেনারেট করা।"], isPublished: true },
    { id: "fallback-6", slug: "business-management-tools", title: "Business Management Tools (MS Office)", bullets: ["ডেটা ট্র্যাকিং, সেলস রিপোর্ট এবং অ্যানালিটিক্সের জন্য MS Excel-এ প্রো হয়ে ওঠা।", "MS Word ব্যবহার করে ফ্ললেস কর্পোরেট ডকুমেন্টেশন এবং প্রপোজাল রেডি করা।", "ইনভেস্টর বা ক্লায়েন্টকে ইমপ্রেস করতে MS PowerPoint-এ কিলার পিচ ডেক বানানো।", "কর্পোরেট ওয়ার্কফ্লো এবং ডেইলি টাস্কগুলো এফিশিয়েন্টলি এবং দ্রুত ম্যানেজ করা।"], isPublished: true },
    { id: "fallback-7", slug: "landing-page-content-marketing", title: "Landing Page & Content Marketing", bullets: ["High-Converting Landing Page ডিজাইন করা যা ভিজিটরকে পেইং কাস্টমারে রূপান্তর করবে।", "100% সত্যতা বজায় রেখে ম্যাগনেটিক Copywriting করা যা ইজিলি সেলস আনাবে।", "অডিয়েন্সকে রিয়েল ভ্যালু প্রোভাইড করে এমন কিলার কন্টেন্ট স্ট্র্যাটেজি ডেভেলপ করা।", "A/B টেস্টিং এবং পারফরম্যান্স ট্র্যাকিংয়ের মাধ্যমে মার্কেটিং ক্যাম্পেইন স্কেল করা।"], isPublished: true },
    { id: "fallback-8", slug: "business-english", title: "Business English", bullets: ["পাবলিক স্পিকিংয়ের ভয় কাটিয়ে সবার সামনে কনফিডেন্টলি কথা বলা।", "ক্লায়েন্ট মিটিং বা জব ইন্টারভিউতে প্রফেশনাল ইংলিশে স্মার্টলি কমিউনিকেট করা।", "কর্পোরেট লেভেলের প্রফেশনাল ইমেইল লেখা যা দ্রুত রিপ্লাই নিয়ে আসবে।", "সেলস, মার্কেটিং এবং কর্পোরেট দুনিয়ার হাই-ভ্যালু ভোকাবুলারি আয়ত্ত করা।"], isPublished: true },
    { id: "fallback-9", slug: "dawah-business-ethics", title: "Dawah & Business Ethics", bullets: ["মার্কেটিংকে শুধুমাত্র প্রমোশন নয়, বরং সত্য ও 'দাওয়াহ' হিসেবে প্রেজেন্ট করা।", "বিজনেসের প্রতিদিনের ডিসিশনে ইখলাস (Sincerity) এবং শতভাগ সততা অ্যাপ্লাই করা।", "কর্পোরেট দুনিয়ার ফেক শর্টকাট এবং হারাম প্র্যাকটিসগুলো থেকে 100% দূরে থাকা।", "প্রফেশনাল সাকসেস এবং ইসলামিক ক্যারেক্টারের মধ্যে একটি পারফেক্ট ব্যালেন্স তৈরি করা।"], isPublished: true },
];

type RawModule = { id: string; slug: string; title: string; bullets: unknown; is_published: boolean };

async function getCoreModules() {
    try {
        const rows = await prisma.$queryRaw<RawModule[]>`
            SELECT id, slug, title, bullets, is_published
            FROM course_modules
            WHERE is_published = true
            ORDER BY "order" ASC, created_at ASC
        `;
        if (rows.length > 0) {
            return rows.map(r => ({ id: r.id, slug: r.slug, title: r.title, bullets: r.bullets, isPublished: r.is_published }));
        }
    } catch {
        // DB not yet migrated — fall back to static list
    }
    return FALLBACK_MODULES;
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
                                            <ul className="space-y-2.5">
                                                {bullets.map((bullet, bIndex) => (
                                                    <li key={bIndex} className="flex items-start gap-2.5 text-sm text-[#6b7280] leading-relaxed group/item">
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
