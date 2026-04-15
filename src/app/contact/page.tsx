import Header from "@/components/ui/Header";
import Footer from "@/components/ui/Footer";

export default function ContactPage() {
    const navLinks = [
        { label: "Home", href: "/" },
        { label: "About", href: "/about" },
        { label: "Module", href: "/modules" },
        { label: "Instructors", href: "/instructors" },
        { label: "Success Stories", href: "/success-stories" },
        { label: "Contact & Q&A", href: "/contact", isActive: true },
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

    const contactInfo = [
        {
            icon: (
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                </svg>
            ),
            label: "Email",
            value: "abul.hayat@skill.assunnahfoundation.org",
            description: "For inquiries and course information",
        },
        {
            icon: (
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
            ),
            label: "Phone",
            value: "01862534626",
            description: "Available at 9 am to 5 pm",
        },
        {
            icon: (
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                </svg>
            ),
            label: "Training Location",
            value: "আস-সুন্নাহ স্কিল ডেভেলপমেন্ট ইনস্টিটিউট",
            description: "আলি নগর গেটের বিপরীত পাশের বিল্ডিং, সাতারকুল রোড, উত্তর বাড্ডা, ঢাকা।",
        },
    ];

    return (
        <>
            <Header
                brandText="Sales & Marketing"
                navLinks={navLinks}
                ctaText="Enroll"
            />

            <main className="min-h-screen bg-slate-50">
                {/* 2. Contact Information Section */}
                <section className="w-full bg-[#f9fafb] pt-4 pb-8 md:pt-6 md:pb-10">
                    <div className="max-w-7xl mx-auto px-6 lg:px-8">
                        <div className="text-center max-w-2xl mx-auto mb-12">
                            <h2 className="text-2xl md:text-3xl font-bold text-[#1f2937] mb-4">
                                Get in Touch
                            </h2>
                            <p className="text-[#6b7280] leading-relaxed">
                                Choose the most convenient way to reach us.
                            </p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {contactInfo.map((info, index) => (
                                <div
                                    key={index}
                                    className="bg-white rounded-2xl p-6 border border-[#e5e7eb] shadow-sm text-center"
                                >
                                    <div className="w-12 h-12 rounded-xl bg-[#f0fdf4] flex items-center justify-center mx-auto mb-4 text-[#059669]">
                                        {info.icon}
                                    </div>
                                    <h3 className="text-sm font-medium text-[#6b7280] mb-1">
                                        {info.label}
                                    </h3>
                                    <p className="text-lg font-semibold text-[#1f2937] mb-2">
                                        {info.value}
                                    </p>
                                    <p className="text-base font-bold italic text-[#6b7280]">
                                        {info.description}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* 3. Social Presence Section */}
                <section className="w-full bg-white py-8 md:py-10">
                    <div className="max-w-7xl mx-auto px-6 lg:px-8">
                        <div className="text-center max-w-2xl mx-auto mb-12">
                            <h2 className="text-2xl md:text-3xl font-bold text-[#1f2937] mb-4">
                                Our Social Presence
                            </h2>
                            <p className="text-[#6b7280] leading-relaxed">
                                আমাদের সাথে সোশ্যাল মিডিয়ায় যুক্ত থাকুন এবং সর্বশেষ আপডেট পান।
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">

                            {/* Course Social Links */}
                            <div className="bg-[#f9fafb] rounded-2xl p-8 border border-[#e5e7eb] shadow-sm">
                                <h3 className="text-lg font-bold text-[#1f2937] mb-6 flex items-center gap-2">
                                    <span className="w-8 h-8 rounded-lg bg-[#059669] flex items-center justify-center text-white text-sm">📘</span>
                                    As Sunnah Skill Development Institute
                                </h3>
                                <div className="flex flex-col gap-4">
                                    {/* Facebook */}
                                    <a
                                        href="https://www.facebook.com/assunnahskill"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-4 p-4 bg-white rounded-xl border border-[#e5e7eb] hover:border-[#059669] hover:shadow-md transition-all duration-200 group"
                                    >
                                        <div className="w-10 h-10 rounded-lg bg-[#1877F2] flex items-center justify-center flex-shrink-0">
                                            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-[#1f2937] group-hover:text-[#059669] transition-colors">Facebook Page</p>
                                            <p className="text-xs text-[#6b7280]">facebook.com/assunnahskill</p>
                                        </div>
                                    </a>

                                    {/* YouTube */}
                                    <a
                                        href="https://www.youtube.com/@assunnahskill"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-4 p-4 bg-white rounded-xl border border-[#e5e7eb] hover:border-[#059669] hover:shadow-md transition-all duration-200 group"
                                    >
                                        <div className="w-10 h-10 rounded-lg bg-[#FF0000] flex items-center justify-center flex-shrink-0">
                                            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-[#1f2937] group-hover:text-[#059669] transition-colors">YouTube Channel</p>
                                            <p className="text-xs text-[#6b7280]">youtube.com/@assunnahskill</p>
                                        </div>
                                    </a>
                                    {/* Website */}
                                    <a
                                        href="https://asm-internal-portal.web.app"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-4 p-4 bg-white rounded-xl border border-[#e5e7eb] hover:border-[#059669] hover:shadow-md transition-all duration-200 group"
                                    >
                                        <div className="w-10 h-10 rounded-lg bg-[#059669] flex items-center justify-center flex-shrink-0">
                                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                <circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-[#1f2937] group-hover:text-[#059669] transition-colors">Official Website</p>
                                            <p className="text-xs text-[#6b7280]">asm-internal-portal.web.app</p>
                                        </div>
                                    </a>
                                </div>
                            </div>

                            {/* As Sunnah Foundation Links */}
                            <div className="bg-[#f9fafb] rounded-2xl p-8 border border-[#e5e7eb] shadow-sm">
                                <h3 className="text-lg font-bold text-[#1f2937] mb-6 flex items-center gap-2">
                                    <span className="w-8 h-8 rounded-lg bg-[#059669] flex items-center justify-center text-white text-sm">🕌</span>
                                    As Sunnah Foundation
                                </h3>
                                <div className="flex flex-col gap-4">
                                    {/* Facebook */}
                                    <a
                                        href="https://www.facebook.com/assunnahfoundationbd"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-4 p-4 bg-white rounded-xl border border-[#e5e7eb] hover:border-[#059669] hover:shadow-md transition-all duration-200 group"
                                    >
                                        <div className="w-10 h-10 rounded-lg bg-[#1877F2] flex items-center justify-center flex-shrink-0">
                                            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-[#1f2937] group-hover:text-[#059669] transition-colors">Facebook Page</p>
                                            <p className="text-xs text-[#6b7280]">facebook.com/assunnahfoundationbd</p>
                                        </div>
                                    </a>
                                    {/* YouTube */}
                                    <a
                                        href="https://www.youtube.com/@As-Sunnah-Foundation-BD"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-4 p-4 bg-white rounded-xl border border-[#e5e7eb] hover:border-[#059669] hover:shadow-md transition-all duration-200 group"
                                    >
                                        <div className="w-10 h-10 rounded-lg bg-[#FF0000] flex items-center justify-center flex-shrink-0">
                                            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-[#1f2937] group-hover:text-[#059669] transition-colors">YouTube Channel</p>
                                            <p className="text-xs text-[#6b7280]">youtube.com/@As-Sunnah-Foundation-BD</p>
                                        </div>
                                    </a>
                                    {/* Website */}
                                    <a
                                        href="https://assunnahfoundation.org"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-4 p-4 bg-white rounded-xl border border-[#e5e7eb] hover:border-[#059669] hover:shadow-md transition-all duration-200 group"
                                    >
                                        <div className="w-10 h-10 rounded-lg bg-[#059669] flex items-center justify-center flex-shrink-0">
                                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                <circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-[#1f2937] group-hover:text-[#059669] transition-colors">Official Website</p>
                                            <p className="text-xs text-[#6b7280]">assunnahfoundation.org</p>
                                        </div>
                                    </a>
                                </div>
                            </div>

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
