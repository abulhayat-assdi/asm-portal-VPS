"use client";

import { cn } from "@/lib/utils";
import Reveal from "./Reveal";

const whyReasons = [
    {
        title: "Bridging the Skill Gap",
        description: "প্রথাগত শিক্ষা এবং বাস্তব কর্মক্ষেত্রের মধ্যকার দূরত্ব ঘুচিয়ে তোলাই আমাদের লক্ষ্য। তাই গতানুগতিক বইয়ের থিওরির বদলে, প্র্যাকটিক্যাল ও অন-ফিল্ড ট্রেনিংয়ের মাধ্যমে আমরা তৈরি করি সত্যিকারের মার্কেট-রেডি প্রফেশনাল।",
        icon: (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
            </svg>
        )
    },
    {
        title: "Redefining Sales & Marketing",
        description: "চটকদার বিজ্ঞাপন আর ধোঁকা খেতে খেতে মানুষ এখন ক্লান্ত। তাই আমরা সেলসকে একটি 'আমানাহ' (বিশ্বাস) এবং মার্কেটিংকে সত্য ও স্বচ্ছ যোগাযোগ হিসেবে উপস্থাপন করি। কোনো ফন্দি-ফিকির নয়, বরং কাস্টমারের জন্য আসল ভ্যালু তৈরি করাই আমাদের মূল ফোকাস।",
        icon: (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
        )
    },
    {
        title: "Building Self-Reliant Youth",
        description: "সেলস বা বিক্রয় নিয়ে আপনার সব দ্বিধা ও ভয় দূর করে আপনাকে আত্মনির্ভরশীল করে তোলাই আমাদের উদ্দেশ্য। কোনো অসদুপায় বা হারাম শর্টকাটের আশ্রয় না নিয়ে, নিজের স্কিলের ওপর ভিত্তি করে হালাল উপার্জনের আত্মবিশ্বাস তৈরি করুন।",
        icon: (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 5.523-4.477 10-10 10S1 17.523 1 12 5.477 2 11 2s10 4.477 10 10z" />
            </svg>
        )
    },
    {
        title: "Meeting Real Market Demand",
        description: "বর্তমান সময়ের ব্যবসা ও SME উদ্যোক্তাদের এমন প্রফেশনাল প্রয়োজন, যারা সততা ও দক্ষতার সাথে সেলস জেনারেট করতে পারে। আমরা এমন গ্র্যাজুয়েট তৈরি করি, যারা কাস্টমারের সমস্যার সঠিক সমাধানের মাধ্যমে দীর্ঘমেয়াদি সম্পর্ক গড়ে তোলে এবং ব্যবসার সত্যিকারের গ্রোথ নিশ্চিত করে।",
        icon: (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
            </svg>
        )
    },
];

export default function WhyThisCourseSection() {
    return (
        <section className="relative w-full bg-white overflow-hidden border-t border-gray-100 py-[15px]">
            {/* Background Ambience (Subtle) */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-green-500/5 rounded-full blur-[100px]" />
                <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[100px]" />
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8">
                {/* Section Header */}
                <div className="text-center mb-10">
                    <Reveal>
                        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6 tracking-tight">
                            Why This Course Exists
                        </h2>
                    </Reveal>
                    <Reveal delay={100}>
                        <div className="h-1 w-16 bg-[#4CAF50] mx-auto rounded-full" />
                    </Reveal>
                </div>

                {/* Grid Layout */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 max-w-5xl mx-auto">
                    {whyReasons.map((reason, index) => {
                        const isLeadCard = index === 0;

                        return (
                            <Reveal
                                key={index}
                                delay={index * 100}
                                width="100%"
                                fullHeight
                            >
                                <div
                                    className={cn(
                                        "h-full flex flex-col items-start gap-4 p-6 md:p-8 rounded-2xl transition-all duration-300",
                                        // Base Styles
                                        "hover:-translate-y-[2px] bg-white",
                                        // Visual Priority for Lead Card vs Standard Cards
                                        isLeadCard
                                            ? "border border-green-100 shadow-[0_10px_30px_-10px_rgba(76,175,80,0.15)] hover:shadow-[0_20px_40px_-5px_rgba(76,175,80,0.25)]"
                                            : "border border-gray-100 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.1)]"
                                    )}
                                >
                                    <div className="flex items-center gap-4">
                                        <div
                                            className={cn(
                                                "flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center transition-colors duration-300",
                                                isLeadCard
                                                    ? "bg-green-50 text-[#4CAF50]"
                                                    : "bg-gray-50 text-gray-400 group-hover:text-[#4CAF50]"
                                            )}
                                        >
                                            {reason.icon}
                                        </div>
                                        <h3 className={cn(
                                            "text-xl font-bold",
                                            isLeadCard ? "text-gray-900" : "text-gray-900"
                                        )}>
                                            {reason.title}
                                        </h3>
                                    </div>
                                    <div>
                                        <p className="text-base text-gray-600 leading-relaxed font-medium">
                                            {reason.description}
                                        </p>
                                    </div>
                                </div>
                            </Reveal>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
