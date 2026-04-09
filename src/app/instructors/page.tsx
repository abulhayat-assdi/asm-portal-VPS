import Header from "@/components/ui/Header";
import Footer from "@/components/ui/Footer";
import InstructorCard from "@/components/ui/InstructorCard";
import { getAllTeachers } from "@/services/teacherService";
import Link from "next/link";
import { getAdminServices } from "@/lib/firebase-admin";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

async function getAdminStatus() {
    const cookieStore = await cookies();
    const token = cookieStore.get("__session")?.value;
    if (!token) return false;

    try {
        const { adminAuth, adminDb } = getAdminServices();
        const decodedToken = await adminAuth.verifyIdToken(token);
        const userDoc = await adminDb.collection("users").doc(decodedToken.uid).get();
        return userDoc.exists && userDoc.data()?.role === "admin";
    } catch (e) {
        return false;
    }
}

export default async function InstructorsPage() {
    const instructors = await getAllTeachers();
    const isAdmin = await getAdminStatus();

    const navLinks = [
        { label: "Home", href: "/" },
        { label: "About", href: "/about" },
        { label: "Module", href: "/modules" },
        { label: "Instructors", href: "/instructors", isActive: true },
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

    return (
        <>
            <Header
                brandText="Sales & Marketing"
                navLinks={navLinks}
                ctaText="Enroll"
            />

            <main className="min-h-screen bg-[#fafaf9] flex flex-col">
                {/* Clean Page Header */}
                <div className="pt-8 md:pt-10 pb-6 w-full max-w-7xl mx-auto px-6 lg:px-8 text-center relative">
                    <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-[#111827] mb-3 tracking-tight">
                        Meet Our Team
                    </h1>
                    <p className="text-lg md:text-xl text-[#4b5563] leading-relaxed max-w-2xl mx-auto font-medium">
                        Dedicated professionals committed to helping you grow with practical skills and ethical values.
                    </p>
                    
                    {isAdmin && (
                        <div className="mt-6">
                            <Link 
                                href="/dashboard/teachers"
                                className="inline-flex items-center gap-2 px-6 py-2 bg-[#059669] text-white font-bold rounded-full hover:bg-[#10b981] transition-all shadow-md"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                Edit Instructors Content
                            </Link>
                        </div>
                    )}
                </div>

                {/* 3. Instructors Grid Section */}
                <section className="w-full pb-16 md:pb-24 flex-grow relative z-20">
                    <div className="max-w-7xl mx-auto px-6 lg:px-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {instructors.map((instructor, index) => (
                                <InstructorCard
                                    key={instructor.id}
                                    index={index}
                                    name={instructor.name}
                                    role={instructor.designation}
                                    description={instructor.about}
                                    email={instructor.email}
                                    image={instructor.profileImageUrl}
                                />
                            ))}
                        </div>
                        {instructors.length === 0 && (
                            <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-gray-100">
                                <p className="text-gray-500 text-lg">No instructors found.</p>
                            </div>
                        )}
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
