"use client";

import { useState } from "react";
import Header from "@/components/ui/Header";
import Footer from "@/components/ui/Footer";
import emailjs from "@emailjs/browser";

export const dynamic = "force-static";

export default function EnrollPage() {
    const [formData, setFormData] = useState({
        name: "",
        phone: "",
        email: "",
        district: "",
        education: "",
        institute: "",
        interest: "",
    });

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

    const navLinks = [
        { label: "Home", href: "/" },
        { label: "About", href: "/about" },
        { label: "Module", href: "/modules" },
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

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        // Check for EmailJS config
        if (
            !process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID ||
            !process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID ||
            !process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY
        ) {
            setMessage({ text: "EmailJS configuration missing. Please report this to admin.", type: "error" });
            console.error("Missing EmailJS env variables");
            setLoading(false);
            return;
        }

        try {
            await emailjs.send(
                process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID,
                process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID,
                {
                    from_name: formData.name,
                    from_email: formData.email,
                    phone: formData.phone,
                    district: formData.district,
                    education: formData.education,
                    institute: formData.institute,
                    interest: formData.interest,
                },
                process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY
            );

            setMessage({ text: "Application submitted successfully! We will contact you soon.", type: "success" });
            setFormData({
                name: "",
                phone: "",
                email: "",
                district: "",
                education: "",
                institute: "",
                interest: "",
            });
        } catch (error: any) {
            console.error("EmailJS Error:", error);
            setMessage({ text: `Failed to submit: ${error.text || "Unknown error"}`, type: "error" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Header
                brandText="Sales & Marketing"
                navLinks={navLinks}
                ctaText="Enroll"
            />

            <main className="min-h-screen bg-white">
                <section className="bg-gradient-to-r from-[#059669] to-[#10b981] py-16 md:py-20">
                    <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center text-white">
                        <h1 className="text-3xl md:text-5xl font-bold mb-6">Join Our Next Batch</h1>
                        <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto">
                            Fill out the form below to enroll. We will review your details and contact you shortly.
                        </p>
                    </div>
                </section>

                <section className="w-full py-16 md:py-20">
                    <div className="max-w-3xl mx-auto px-6 lg:px-8">
                        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 p-8 md:p-12">
                            {message && (
                                <div className={`p-4 rounded-lg mb-8 ${message.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
                                    {message.text}
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Name */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                                        <input
                                            required
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#059669] focus:border-transparent outline-none transition-all"
                                            placeholder="Your Name"
                                        />
                                    </div>

                                    {/* Phone */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number</label>
                                        <input
                                            required
                                            type="tel"
                                            name="phone"
                                            value={formData.phone}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#059669] focus:border-transparent outline-none transition-all"
                                            placeholder="017xxxxxxxx"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Email */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                                        <input
                                            required
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#059669] focus:border-transparent outline-none transition-all"
                                            placeholder="you@example.com"
                                        />
                                    </div>

                                    {/* District */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">District</label>
                                        <input
                                            required
                                            type="text"
                                            name="district"
                                            value={formData.district}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#059669] focus:border-transparent outline-none transition-all"
                                            placeholder="Dhaka, Chittagong, etc."
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Education Degree */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Education Degree</label>
                                        <input
                                            required
                                            type="text"
                                            name="education"
                                            value={formData.education}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#059669] focus:border-transparent outline-none transition-all"
                                            placeholder="BBA, BSc, HSC, etc."
                                        />
                                    </div>

                                    {/* Institute */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Institute</label>
                                        <input
                                            required
                                            type="text"
                                            name="institute"
                                            value={formData.institute}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#059669] focus:border-transparent outline-none transition-all"
                                            placeholder="University/College Name"
                                        />
                                    </div>
                                </div>

                                {/* What do you want to do */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">What do you want to do?</label>
                                    <textarea
                                        required
                                        name="interest"
                                        value={formData.interest}
                                        onChange={handleChange}
                                        rows={4}
                                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#059669] focus:border-transparent outline-none transition-all resize-none"
                                        placeholder="Briefly describe your goals or why you want to join this course..."
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-[#059669] text-white font-bold py-4 px-6 rounded-xl hover:bg-[#047857] transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                                >
                                    {loading ? (
                                        <>
                                            <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Sending...
                                        </>
                                    ) : "Submit Application"}
                                </button>
                            </form>
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
