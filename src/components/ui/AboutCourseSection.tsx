"use client";

import { cn } from "@/lib/utils";
import Reveal from "./Reveal";

export default function AboutCourseSection() {
    return (
        <section className="relative w-full overflow-hidden bg-gradient-to-b from-white to-slate-50 py-20 lg:py-28">
            {/* Background Image */}
            <div className="absolute inset-0 z-0">
                <img
                    src="https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=2940&auto=format&fit=crop"
                    alt="Professional learning environment"
                    className="w-full h-full object-cover opacity-10"
                />
                {/* Light Overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/80 to-white/60" />
                <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-transparent to-white/70" />
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">

                    {/* LEFT SIDE: Content */}
                    <div className="max-w-2xl">
                        <Reveal>
                            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-8 tracking-tight">
                                What Is This Course?
                            </h2>
                        </Reveal>

                        <div className="space-y-6 text-lg text-gray-600 leading-relaxed font-medium">
                            <Reveal delay={100}>
                                <p>
                                    The Art of Sales &amp; Marketing is a 90-day professional training program designed to empower aspiring individuals with practical sales techniques, modern marketing strategies, and essential soft skills.
                                </p>
                            </Reveal>

                            <Reveal delay={200}>
                                <p>
                                    We treat sales as an &ldquo;Amanah&rdquo; (trust) and marketing as truthful communication—never manipulation. It combines practical fieldwork, digital expertise, and strong ethical values to build confident, market-ready professionals.
                                </p>
                            </Reveal>

                            <Reveal delay={300}>
                                <p>
                                    Delivered through real-life projects, in-person experiences, and technology-driven learning, this course bridges the gap between theory and employment—enabling you to succeed in business and earn halal rizq with dignity.
                                </p>
                            </Reveal>
                        </div>
                    </div>

                    {/* RIGHT SIDE: Key Highlights */}
                    <div className="flex flex-col gap-5">
                        {/* Highlight 1 - Lead Card (Visual Priority) */}
                        <Reveal delay={200} width="100%">
                            <div className="flex items-start gap-4 p-5 rounded-xl bg-white border border-green-100 shadow-[0_10px_30px_-10px_rgba(76,175,80,0.15)] transition-all duration-300 hover:-translate-y-[2px] hover:shadow-[0_20px_40px_-10px_rgba(76,175,80,0.25)]">
                                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center text-[#4CAF50] mt-1 border border-green-100">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-gray-900 mb-1">
                                        90-Day Residential Training
                                    </h3>
                                    <p className="text-sm text-gray-600 leading-relaxed">
                                        An immersive, in-person training program designed to build real-world skills and strong character.
                                    </p>
                                </div>
                            </div>
                        </Reveal>

                        {/* Highlight 2 */}
                        <Reveal delay={300} width="100%">
                            <div className="flex items-start gap-4 p-5 rounded-xl bg-white border border-gray-100 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] transition-all duration-300 hover:-translate-y-[2px] hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.1)]">
                                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center text-gray-500 mt-1 border border-gray-100 group-hover:text-[#4CAF50] transition-colors">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-gray-900 mb-1">
                                        Practical &amp; Digital Mastery
                                    </h3>
                                    <p className="text-sm text-gray-600 leading-relaxed">
                                        Learn through street-selling, real projects, AI tools, and Meta Ads—not just bookish theory.
                                    </p>
                                </div>
                            </div>
                        </Reveal>

                        {/* Highlight 3 */}
                        <Reveal delay={400} width="100%">
                            <div className="flex items-start gap-4 p-5 rounded-xl bg-white border border-gray-100 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] transition-all duration-300 hover:-translate-y-[2px] hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.1)]">
                                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center text-gray-500 mt-1 border border-gray-100 group-hover:text-[#4CAF50] transition-colors">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 5.523-4.477 10-10 10S1 17.523 1 12 5.477 2 11 2s10 4.477 10 10z" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-gray-900 mb-1">
                                        Islamic Ethical Foundation
                                    </h3>
                                    <p className="text-sm text-gray-600 leading-relaxed">
                                        Grounded in core values like Amanah, Ikhlas, and Adl to ensure business success with absolute integrity.
                                    </p>
                                </div>
                            </div>
                        </Reveal>
                    </div>
                </div>
            </div>
        </section>
    );
}
