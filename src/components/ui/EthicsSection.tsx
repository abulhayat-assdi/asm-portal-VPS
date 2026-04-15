"use client";

import Reveal from "./Reveal";

const coreValues = [
    "Trust and responsibility",
    "Honesty and transparency",
    "Fairness and accountability",
    "Excellence in skills and character",
    "Service through solving real problems",
];

export default function EthicsSection() {
    return (
        <section className="relative w-full bg-white overflow-hidden border-t border-gray-100 py-[15px]">
            {/* Background Ambience */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-green-500/5 rounded-full blur-[100px]" />
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8">
                <div className="max-w-4xl mx-auto">
                    <Reveal>
                        <div className="flex items-start gap-6 mb-8">
                            {/* Small Ethics Icon */}
                            <div className="hidden sm:flex flex-shrink-0 w-12 h-12 rounded-xl bg-green-50 items-center justify-center border border-green-100">
                                <svg className="w-6 h-6 text-[#4CAF50]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                                    <path d="M9 12l2 2 4-4" />
                                </svg>
                            </div>
                            <div>
                                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
                                    Ethics & Responsibility
                                </h2>
                                <p className="text-lg text-transparent bg-clip-text bg-gradient-to-r from-[#374151] to-[#059669] leading-relaxed font-medium">
                                    At its core, this course is grounded in ethical responsibility and Islamic business values.
                                </p>
                            </div>
                        </div>
                    </Reveal>

                    <Reveal delay={100}>
                        <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)]">
                            <h3 className="text-lg font-bold text-[#4CAF50] mb-6 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#4CAF50]" />
                                Core Values
                            </h3>
                            <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {coreValues.map((value, index) => (
                                    <li key={index} className="flex items-center gap-3">
                                        <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-50 flex items-center justify-center border border-green-100">
                                            <svg
                                                className="w-3 h-3 text-[#4CAF50]"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="2.5"
                                                viewBox="0 0 24 24"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            >
                                                <path d="M5 12l5 5L20 7" />
                                            </svg>
                                        </div>
                                        <span className="text-gray-700 font-medium">{value}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </Reveal>
                </div>
            </div>
        </section>
    );
}
