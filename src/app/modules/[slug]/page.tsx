import { notFound } from "next/navigation";
import { getModuleData } from "@/data/modules";
import Header from "@/components/ui/Header";
import Footer from "@/components/ui/Footer";
import { Metadata } from 'next';
import CurriculumTimeline from "./CurriculumTimeline";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const data = getModuleData(params.slug);
  if (!data) return { title: 'Module Not Found' };
  return {
    title: `${data.title} | Sales & Marketing`,
    description: data.description,
  };
}

export default function ModuleDetailsPage({ params }: { params: { slug: string } }) {
  const courseData = getModuleData(params.slug);

  if (!courseData) {
    notFound();
  }

  const navLinks = [
    { label: "Home", href: "/" },
    { label: "About", href: "/about" },
    { label: "Module", href: "/modules", isActive: true },
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

  return (
    <>
      <Header brandText="Sales & Marketing" navLinks={navLinks} ctaText="Enroll" />

      <main className="min-h-screen bg-[#f1f3f5] flex flex-col pt-24" style={{ backgroundImage: "linear-gradient(#e9ecef 1px, transparent 1px), linear-gradient(90deg, #e9ecef 1px, transparent 1px)", backgroundSize: "40px 40px" }}>
        
        {/* Minimal Hero Header for Infographic page */}
        <div className="w-full py-12 px-6 lg:px-8 relative z-10 text-center flex flex-col items-center">
           <span className="inline-block py-1.5 px-4 rounded-full bg-white shadow-sm border border-gray-200 text-gray-500 text-xs font-bold tracking-widest uppercase mb-4">
             Course Curriculum Guide
           </span>
           <h1 className="text-4xl md:text-5xl lg:text-6xl font-black mb-4 tracking-tight text-gray-800 drop-shadow-sm uppercase">
             {courseData.title}
           </h1>
           <p className="text-lg text-gray-500 font-medium max-w-2xl mx-auto leading-relaxed">
             {courseData.description}
           </p>
        </div>

        {/* Infographic Timeline Section */}
        <CurriculumTimeline data={courseData} />

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
