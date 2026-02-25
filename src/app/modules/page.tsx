import Header from "@/components/ui/Header";
import Footer from "@/components/ui/Footer";

export default function ModulesPage() {
    const navLinks = [
        { label: "Home", href: "/" },
        { label: "About", href: "/about" },
        { label: "Module", href: "/modules", isActive: true },
        { label: "Instructors", href: "/instructors" },
        { label: "Success Stories", href: "/feedback" },
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
                { label: "Success Stories", href: "/feedback" },
                { label: "Contact & Q&A", href: "/contact" },
                { label: "Enroll / Learn More", href: "/enroll" },
            ],
        },
    ];

    const coreModules = [
        {
            title: "Sales Mastery",
            bullets: [
                "On-field practical sales & in-store customer experience",
                "Active listening and respectful problem solving",
                "Effective communication & objection handling",
                "Office sales (B2B) & CRM strategy",
            ],
        },
        {
            title: "Career Planning & Branding",
            bullets: [
                "Writing professional CVs and winning resumes",
                "Building a strong personal brand and portfolio",
                "Interview preparation and confident presentation",
                "Taking responsibility for career or entrepreneurial growth",
            ],
        },
        {
            title: "Customer Service Excellence",
            bullets: [
                "Managing customer queries and providing proactive support",
                "Handling difficult customers with empathy and Sabr",
                "Building long-term relationships and brand loyalty",
                "Ensuring fairness (Adl) and excellence (Ihsan) in service",
            ],
        },
        {
            title: "AI for Digital Marketers",
            bullets: [
                "Leveraging AI tools for efficient content creation",
                "Mastering Canva for professional branding & ad design",
                "Automating marketing workflows effectively",
                "Using technology responsibly without misleading exaggeration",
            ],
        },
        {
            title: "Digital Marketing",
            bullets: [
                "Social media marketing & comprehensive strategy",
                "Mastering Meta Ads Manager (Facebook & Instagram)",
                "Referral sales and community-based growth",
                "Ethical promotion and audience targeting",
            ],
        },
        {
            title: "MS Office Applications",
            bullets: [
                "MS Word for professional business documentation",
                "MS Excel for sales tracking, data entry, and reporting",
                "MS PowerPoint for creating persuasive business pitches",
                "Managing daily corporate tasks with efficiency",
            ],
        },
        {
            title: "Landing Page & Content Marketing",
            bullets: [
                "Designing high-converting landing pages",
                "Copywriting with clear, truthful messaging",
                "Creating content strategies that deliver real value",
                "A/B testing, performance tracking, and conversion",
            ],
        },
        {
            title: "Business English",
            bullets: [
                "Professional email writing and corporate correspondence",
                "Confident speaking for interviews and client meetings",
                "Essential vocabulary for sales and marketing",
                "Overcoming the fear of speaking in English",
            ],
        },
        {
            title: "Dawah & Business Ethics",
            bullets: [
                "Understanding marketing as truth and Dawah",
                "Applying Ikhlas (Sincerity) in daily business decisions",
                "Avoiding haram practices, shortcuts, and deception",
                "Balancing professional excellence with Islamic character",
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

            <main className="min-h-screen bg-white">


                {/* 3. Core Modules Section */}
                <section className="w-full bg-white py-16 md:py-20">
                    <div className="max-w-7xl mx-auto px-6 lg:px-8">
                        <div className="text-center max-w-2xl mx-auto mb-16">
                            <h2 className="text-2xl md:text-3xl font-bold text-[#1f2937] mb-4">
                                Core Learning Modules
                            </h2>
                            <p className="text-[#6b7280] leading-relaxed">
                                A step-by-step journey designed to build your skills from the ground up.
                            </p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {coreModules.map((module, index) => (
                                <div
                                    key={index}
                                    className={`
                                        group relative bg-white rounded-2xl overflow-hidden border
                                        transition-all duration-300 ease-out
                                        hover:-translate-y-2 hover:shadow-2xl hover:shadow-emerald-100/60
                                        ${index === 0
                                            ? 'border-[#059669]/30 shadow-md ring-1 ring-[#059669]/10'
                                            : 'border-[#e5e7eb] shadow-sm hover:border-[#059669]/20'
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
                                    <div className="p-8">
                                        {/* Header row */}
                                        <div className="flex items-center justify-between mb-6">
                                            {/* Module number pill */}
                                            <div className={`
                                                flex items-center gap-2
                                            `}>
                                                <span className={`
                                                    w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold
                                                    transition-all duration-300
                                                    ${index === 0
                                                        ? 'bg-[#059669] text-white'
                                                        : 'bg-gray-100 text-[#9ca3af] group-hover:bg-[#059669] group-hover:text-white'
                                                    }
                                                `}>
                                                    {String(index + 1).padStart(2, '0')}
                                                </span>
                                                <span className={`
                                                    text-xs font-bold tracking-widest uppercase
                                                    ${index === 0 ? 'text-[#059669]' : 'text-[#9ca3af] group-hover:text-[#059669]'}
                                                    transition-colors duration-300
                                                `}>
                                                    Module
                                                </span>
                                            </div>
                                            {index === 0 && (
                                                <span className="bg-[#ecfdf5] text-[#059669] text-xs font-semibold px-2.5 py-1 rounded-full">
                                                    Foundation
                                                </span>
                                            )}
                                        </div>

                                        {/* Title */}
                                        <h3 className="text-xl font-bold text-[#1f2937] mb-4 group-hover:text-[#059669] transition-colors duration-300 leading-snug">
                                            {module.title}
                                        </h3>

                                        {/* Bullet list */}
                                        <ul className="space-y-2.5">
                                            {module.bullets.map((bullet, bIndex) => (
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
                                    </div>

                                    {/* Bottom hover glow */}
                                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-emerald-50/0 to-emerald-50/0 group-hover:from-emerald-50/30 group-hover:to-transparent transition-all duration-500 pointer-events-none" />
                                </div>
                            ))}
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
