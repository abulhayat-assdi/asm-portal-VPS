"use client";

import { Reveal } from "./Reveal";

const learningPrinciples = [
    {
        title: "Learning by Doing",
        description: "Skills are developed through action. Our program emphasizes practical exercises, real projects, and hands-on experience over passive learning.",
        icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
        )
    },
    {
        title: "Building Confidence Through Action",
        description: "True confidence comes from doing, not just knowing. Every module is designed to help learners practice, reflect, and grow.",
        icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
            </svg>
        )
    },
    {
        title: "Market-Ready Development",
        description: "We focus on what the market actually needs—clear communication, ethical selling, and professional presentation skills.",
        icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .415.336.75.75.75z" />
            </svg>
        )
    },
];

export default function LearningPhilosophySection() {
    return (
        <section className="relative w-full py-20 md:py-28 bg-slate-50 overflow-hidden border-t border-gray-100">
            {/* Background Visual Element (Subtle Rings) */}
            <div className="absolute right-0 top-1/2 -translate-y-1/2 opacity-[0.03] hidden lg:block pointer-events-none">
                <svg className="w-[800px] h-[800px]" viewBox="0 0 800 800" fill="none">
                    <circle cx="400" cy="400" r="300" stroke="black" strokeWidth="1" strokeDasharray="10 10" />
                    <circle cx="400" cy="400" r="200" stroke="black" strokeWidth="1" />
                </svg>
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8">
                <div className="text-center max-w-2xl mx-auto mb-16">
                    <Reveal width="100%">
                        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">
                            Our Learning Philosophy
                        </h2>
                    </Reveal>
                    <Reveal delay={100} width="100%">
                        <p className="text-lg text-gray-600 leading-relaxed font-medium">
                            This course focuses on practical learning that builds confidence, responsibility, and real-world capability.
                        </p>
                    </Reveal>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {learningPrinciples.map((principle, index) => (
                        <Reveal
                            key={index}
                            delay={index * 100}
                            width="100%"
                            fullHeight
                        >
                            <div className="h-full bg-white rounded-2xl p-6 md:p-8 border border-gray-100 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] transition-all duration-300 hover:-translate-y-[2px] hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.1)]">
                                <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center text-[#4CAF50] mb-6">
                                    {principle.icon}
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 mb-3">
                                    {principle.title}
                                </h3>
                                <p className="text-sm text-gray-600 leading-relaxed font-medium">
                                    {principle.description}
                                </p>
                            </div>
                        </Reveal>
                    ))}
                </div>
            </div>
        </section>
    );
}
