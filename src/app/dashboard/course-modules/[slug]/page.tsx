import { notFound } from "next/navigation";
import { getModuleData } from "@/data/modules";
import { Metadata } from 'next';
import CurriculumTimeline from "@/app/modules/[slug]/CurriculumTimeline";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const data = getModuleData(params.slug);
  if (!data) return { title: 'Module Not Found' };
  return {
    title: `${data.title} | Internal Portal`,
  };
}

export default function TeacherModuleOutlinePage({ params }: { params: { slug: string } }) {
  const courseData = getModuleData(params.slug);

  if (!courseData) {
    notFound();
  }

  return (
             <div className="bg-[#f1f3f5] min-h-[calc(100vh-4rem)] rounded-2xl relative overflow-hidden border border-gray-200" style={{ backgroundImage: "linear-gradient(#e9ecef 1px, transparent 1px), linear-gradient(90deg, #e9ecef 1px, transparent 1px)", backgroundSize: "40px 40px" }}>
               <div className="w-full py-10 px-6 lg:px-8 relative z-10 text-center flex flex-col items-center">
                 <span className="inline-block py-1 px-3 rounded-full bg-white shadow-sm border border-gray-200 text-gray-500 text-xs font-bold tracking-widest uppercase mb-3">
                   Course Curriculum Guide
                 </span>
                 <h1 className="text-2xl md:text-3xl lg:text-4xl font-black mb-3 tracking-tight text-gray-800 drop-shadow-sm uppercase">
                   {courseData.title}
                 </h1>
                 <p className="text-sm md:text-base text-gray-500 font-medium max-w-2xl mx-auto leading-relaxed">
                   {courseData.description}
                 </p>
               </div>
       
               <div className="pb-12 px-2 md:px-6">
                 <CurriculumTimeline data={courseData} />
               </div>
             </div>
  );
}
