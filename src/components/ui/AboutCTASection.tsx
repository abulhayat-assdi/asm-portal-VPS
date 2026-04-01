"use client";

import Link from "next/link";
import Reveal from "./Reveal";

export default function AboutCTASection() {
    return (
        <section className="relative w-full py-20 md:py-28 bg-gradient-to-b from-slate-50 to-white overflow-hidden border-t border-gray-100">
            <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 text-center">
                <Reveal width="100%">
                    <p className="text-xl md:text-2xl text-gray-900 font-semibold mb-8 max-w-3xl mx-auto leading-relaxed">
                        Take the next step toward building real skills, <br className="hidden md:block" />
                        professional confidence, and ethical earning.
                    </p>
                </Reveal>

                <Reveal delay={100} width="100%">
                    <Link
                        href="/modules"
                        prefetch={true}
                        className="inline-flex items-center justify-center px-8 py-4 bg-[#4CAF50] text-white font-bold rounded-full
                        transition-all duration-300 ease-out
                        hover:bg-[#43A047] hover:shadow-[0_10px_30px_-10px_rgba(76,175,80,0.4)] hover:-translate-y-1
                        focus:outline-none focus:ring-2 focus:ring-[#4CAF50] focus:ring-offset-2 focus:ring-offset-white"
                    >
                        View Course Modules
                        <svg className="ml-2 w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                        </svg>
                    </Link>
                </Reveal>
            </div>
        </section>
    );
}
