"use client";

import Link from "next/link";

const DocumentTextIcon = ({ className }: { className: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
);

const UserIcon = ({ className }: { className: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
);

const CalendarIcon = ({ className }: { className: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
);

export default function CourseOutlinePage() {
    const modules = [
        {
            title: "Sales Mastery",
            description: "Face-to-Face এবং অনলাইনে কনফিডেন্টলি প্রোডাক্ট সেল করার সাইকোলজি আয়ত্ত করা।",
            teacherName: "Mohammad Abu Zabar Rezvhe",
            publishedDate: "2026-04-13",
            slug: "sales-mastery"
        },
        {
            title: "Career Planning & Branding",
            description: "Winning CV তৈরি করা যা সহজেই ইন্টারভিউ কল নিয়ে আসবে এবং নিজেকে Personal Brand হিসেবে এস্টাবলিশ করা।",
            teacherName: "Golam Kibria",
            publishedDate: "2026-04-13",
            slug: "career-planning-branding"
        },
        {
            title: "Customer Service Excellence",
            description: "রাগান্বিত কাস্টমারকেও আপনার ব্র্যান্ডের লয়্যাল ফ্যানে পরিণত করার সাইকোলজিক্যাল টেকনিক।",
            teacherName: "Maksud Al-Hasan",
            publishedDate: "2026-04-13",
            slug: "customer-service-excellence"
        },
        {
            title: "AI for Digital Marketers",
            description: "লেটেস্ট AI Tools ব্যবহার করে কাজের স্পিড এবং প্রোডাক্টিভিটি 10x বাড়িয়ে ফেলা।",
            teacherName: "Ehasanul Haque",
            publishedDate: "2026-04-13",
            slug: "ai-for-digital-marketers"
        },
        {
            title: "Digital Marketing",
            description: "ম্যাক্সিমাম ROI-এর জন্য Meta Ads (Facebook & Instagram) এর নাড়িভুঁড়ি আয়ত্ত করা।",
            teacherName: "Nazmul Hasan",
            publishedDate: "2026-04-13",
            slug: "digital-marketing"
        },
        {
            title: "Business Management Tools (MS Office)",
            description: "ডেটা ট্র্যাকিং, সেলস রিপোর্ট এবং ফ্ললেস কর্পোরেট ডকুমেন্টেশনের জন্য MS Word/Excel-এ প্রো হয়ে ওঠা।",
            teacherName: "Abul Hayat",
            publishedDate: "2026-04-13",
            slug: "business-management-tools"
        },
        {
            title: "Landing Page & Content Marketing",
            description: "High-Converting Landing Page ডিজাইন করা যা ভিজিটরকে পেইং কাস্টমারে রূপান্তর করবে।",
            teacherName: "Shahidur Rahman",
            publishedDate: "2026-04-13",
            slug: "landing-page-content-marketing"
        },
        {
            title: "Business English",
            description: "উচ্চারণ ও গ্রামারের ভয় কাটিয়ে প্রফেশনাল ইংলিশে স্মার্টলি কমিউনিকেট করা।",
            teacherName: "Ataur Rahman",
            publishedDate: "2026-04-13",
            slug: "business-english"
        },
        {
            title: "Dawah & Business Ethics",
            description: "বিজনেসের প্রতিদিনের ডিসিশনে ইখলাস (Sincerity) এবং শতভাগ সততা অ্যাপ্লাই করা।",
            teacherName: "Talebpur Rahman",
            publishedDate: "2026-04-13",
            slug: "dawah-business-ethics"
        }
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-500 max-w-5xl mx-auto pb-12">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-1 h-10 bg-[#059669] rounded-full"></div>
                    <div>
                        <h1 className="text-3xl font-bold text-[#1f2937]">Course Outline</h1>
                        <p className="text-[#6b7280] mt-1">
                            A dynamic overview of the curriculum and modules published by your instructors.
                        </p>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden relative">
                {/* Decorative background element */}
                <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
                     <svg className="w-64 h-64 text-[#059669]" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2L1 21h22M12 6l7.53 13H4.47" />
                     </svg>
                </div>
                
                <div className="p-8 grid gap-8 relative z-10 w-full">
                    {modules.map((module, idx) => (
                        <div key={module.slug} className="flex gap-6 relative">
                            {/* Vertical timeline line */}
                            {idx !== modules.length - 1 && (
                                <div className="absolute left-[1.15rem] top-10 bottom-[-2rem] w-0.5 bg-gray-100"></div>
                            )}
                            
                            {/* Number indicator */}
                            <div className="shrink-0 flex flex-col items-center">
                                <div className="w-10 h-10 rounded-full bg-[#059669] text-white flex items-center justify-center font-bold shadow-md z-10">
                                    {idx + 1}
                                </div>
                            </div>
                            
                            {/* Content */}
                            <div className="flex-1 bg-gray-50 rounded-2xl p-6 border border-gray-100 hover:border-[#059669]/30 hover:shadow-md transition-all group">
                                <h3 className="text-xl font-bold text-gray-900 group-hover:text-[#059669] transition-colors">{module.title}</h3>
                                
                                <p className="text-gray-600 mt-2 text-sm leading-relaxed">
                                    {module.description}
                                </p>
                                
                                <div className="mt-5 pt-5 border-t border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div className="flex flex-col gap-2">
                                        <div className="flex items-center gap-2 text-xs font-semibold text-gray-500">
                                            <UserIcon className="w-4 h-4 text-[#059669]" />
                                            <span>Teacher Name: {module.teacherName}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs font-semibold text-gray-500">
                                            <CalendarIcon className="w-4 h-4 text-[#059669]" />
                                            <span>Published: {module.publishedDate}</span>
                                        </div>
                                    </div>
                                    
                                    <Link
                                        href={`/modules/${module.slug}`}
                                        className="w-full sm:w-auto text-center px-6 py-2 bg-[#059669] text-white rounded-lg hover:bg-[#047857] transition-all font-semibold shadow-sm hover:shadow-md active:scale-[0.98] text-sm flex items-center justify-center gap-2 whitespace-nowrap"
                                    >
                                        <DocumentTextIcon className="w-4 h-4" />
                                        View
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
