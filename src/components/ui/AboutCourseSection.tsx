"use client";

import Reveal from "./Reveal";
import Image from "next/image";

export interface CourseHighlight {
    id?: string;
    title: string;
    description: string;
}

interface Props {
    title?: string;
    description1?: string;
    description2?: string;
    description3?: string;
    courseHighlights?: CourseHighlight[];
}

// SVG icon pool for highlight cards — cycles by index
const HIGHLIGHT_ICONS = [
    (
        <svg key="hi-0" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
    ),
    (
        <svg key="hi-1" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
        </svg>
    ),
    (
        <svg key="hi-2" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 5.523-4.477 10-10 10S1 17.523 1 12 5.477 2 11 2s10 4.477 10 10z" />
        </svg>
    ),
    (
        <svg key="hi-3" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
        </svg>
    ),
    (
        <svg key="hi-4" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
        </svg>
    ),
];

const DEFAULTS = {
    title: "What Is This Course?",
    description1: "As Sunnah Foundation এর অঙ্গ প্রতিষ্ঠান As Sunnah Skill Development Institute এর 'The Art of Sales & Marketing' কোর্স একটি ৯০ দিনের প্রফেশনাল ট্রেনিং প্রোগ্রাম। এর মূল লক্ষ্য হলো শিক্ষার্থীদের practical sales techniques, modern marketing strategies এবং essential soft skills-এ দক্ষ করে তোলা।",
    description2: "আমরা সেলসকে \"আমানত\" এবং মার্কেটিংকে একটি সত্যনিষ্ঠ যোগাযোগ মাধ্যম হিসেবে দেখি—কোনো ধরনের ম্যানিপুলেশন নয়। আত্মবিশ্বাসী এবং মার্কেট-রেডি প্রফেশনালস তৈরি করতে এই কোর্সে practical fieldwork, digital expertise এবং দৃঢ় নৈতিক মূল্যবোধের সমন্বয় করা হয়েছে।",
    description3: "'The Art of Sales & Marketing' কোর্সের মোট ফি ৭০,০০০ টাকা। এর মধ্যে ভর্তি ফি ১০,০০০ টাকা দেওয়া বাধ্যতামূলক এবং বাকি কোর্স ফি ও আবাসন ফি ৬০,০০০ টাকা। (আর্থিক অস্বচ্ছলতার প্রমাণ সাপেক্ষে ১০০% পর্যন্ত স্কলারশিপ দেওয়া হয়)।",
};

export default function AboutCourseSection({
    title = DEFAULTS.title,
    description1 = DEFAULTS.description1,
    description2 = DEFAULTS.description2,
    description3 = DEFAULTS.description3,
    courseHighlights = [],
}: Props) {
    return (
        <section className="relative w-full overflow-hidden bg-gradient-to-b from-white to-slate-50 py-[15px]">
            <div className="absolute inset-0 z-0">
                <Image
                    src="https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=2940&auto=format&fit=crop"
                    alt="Professional learning environment"
                    fill
                    className="object-cover opacity-10"
                    sizes="100vw"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/80 to-white/60" />
                <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-transparent to-white/70" />
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">

                    {/* LEFT SIDE: Content */}
                    <div className="max-w-2xl">
                        <Reveal>
                            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-8 tracking-tight">
                                {title}
                            </h2>
                        </Reveal>

                        <div className="space-y-6 text-lg text-gray-600 leading-relaxed font-medium">
                            <Reveal delay={100}><p>{description1}</p></Reveal>
                            <Reveal delay={200}><p>{description2}</p></Reveal>
                            <Reveal delay={300}><p>{description3}</p></Reveal>
                        </div>
                    </div>

                    {/* RIGHT SIDE: Highlight Cards */}
                    <div className="flex flex-col gap-5">
                        {courseHighlights.map((card, index) => {
                            const icon = HIGHLIGHT_ICONS[index % HIGHLIGHT_ICONS.length];
                            const isLead = index === 0;
                            return (
                                <Reveal key={card.id || index} delay={(index + 2) * 100} width="100%">
                                    <div className={`flex items-start gap-4 p-5 rounded-xl bg-white transition-all duration-300 hover:-translate-y-[2px] ${
                                        isLead
                                            ? "border border-green-100 shadow-[0_10px_30px_-10px_rgba(76,175,80,0.15)] hover:shadow-[0_20px_40px_-10px_rgba(76,175,80,0.25)]"
                                            : "border border-gray-100 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.1)]"
                                    }`}>
                                        <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center mt-1 ${
                                            isLead ? "bg-green-50 text-[#4CAF50] border border-green-100" : "bg-gray-50 text-gray-500 border border-gray-100"
                                        }`}>
                                            {icon}
                                        </div>
                                        <div>
                                            <h3 className="text-base font-bold text-gray-900 mb-1">{card.title}</h3>
                                            <p className="text-sm text-gray-600 leading-relaxed">{card.description}</p>
                                        </div>
                                    </div>
                                </Reveal>
                            );
                        })}
                    </div>
                </div>
            </div>
        </section>
    );
}
