import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getModuleData } from "@/data/modules";
import Header from "@/components/ui/Header";
import Footer from "@/components/ui/Footer";
import { Metadata } from 'next';
import CurriculumTimeline from "./CurriculumTimeline";
import BackButton from "@/components/ui/BackButton";
import type { CourseData } from "@/data/modules/sales-mastery";

type Props = {
  params: Promise<{ slug: string }>;
};

function normalizeSlug(raw: string): string {
    return raw.toLowerCase().trim()
        .replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-+|-+$/g, "");
}

async function getModuleFromDB(slug: string): Promise<CourseData | null> {
    try {
        const normalized = normalizeSlug(slug);
        const rows = await prisma.$queryRaw<{ title: string; description: string; curriculum: unknown }[]>`
            SELECT title, description, curriculum
            FROM course_modules
            WHERE (slug = ${slug} OR slug = ${normalized} OR LOWER(slug) = LOWER(${slug}))
              AND is_published = true
            LIMIT 1
        `;
        if (!rows.length) return null;
        const row = rows[0];
        return {
            title: row.title,
            description: row.description,
            modules: row.curriculum as unknown as CourseData["modules"],
        };
    } catch {
        return null;
    }
}

async function resolveModule(slug: string): Promise<CourseData | null> {
    const fromDB = await getModuleFromDB(slug);
    if (fromDB) return fromDB;
    // Fallback to hardcoded TS files if DB not yet migrated or module missing
    return getModuleData(slug);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params;
  const data = await resolveModule(resolvedParams.slug);
  if (!data) return { title: 'Module Not Found' };
  return {
    title: `${data.title} | Sales & Marketing`,
    description: data.description,
  };
}

export default async function ModuleDetailsPage({ params }: Props) {
  const resolvedParams = await params;
  const courseData = await resolveModule(resolvedParams.slug);

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

        <div className="w-full px-6 lg:px-8 pt-6">
          <BackButton />
        </div>

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
