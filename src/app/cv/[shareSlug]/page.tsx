import { notFound } from "next/navigation";
import type { Metadata } from "next";
import type { SectionKey } from "@/lib/cv/types";
import { DEFAULT_SECTION_ORDER } from "@/lib/cv/constants";

// ─── Data fetching (Server Component) ────────────────────────────────────────
async function getCvData(shareSlug: string) {
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL ??
    (process.env.NODE_ENV === "production" ? "https://your-domain.com" : "http://localhost:3000");

  const res = await fetch(`${baseUrl}/api/cv/public/${shareSlug}`, {
    cache: "no-store",
  });
  if (!res.ok) return null;
  return res.json();
}

// ─── Dynamic metadata ─────────────────────────────────────────────────────────
export async function generateMetadata({ params }: { params: Promise<{ shareSlug: string }> }): Promise<Metadata> {
  const { shareSlug } = await params;
  const data = await getCvData(shareSlug);
  if (!data) return { title: "CV Not Found" };
  return {
    title: `${data.fullName ?? "CV"} — Curriculum Vitae`,
    description: data.careerObjective?.slice(0, 160) ?? `Professional CV of ${data.fullName}`,
  };
}

// ─── Public CV Page (read-only, no auth) ─────────────────────────────────────
export default async function PublicCvPage({ params }: { params: Promise<{ shareSlug: string }> }) {
  const { shareSlug } = await params;
  const data = await getCvData(shareSlug);
  if (!data) notFound();

  const sectionOrder: SectionKey[] = data.sectionOrder?.length ? data.sectionOrder : DEFAULT_SECTION_ORDER;
  const sidebarSections: SectionKey[] = ["skills", "languages", "hobbies"];
  const rightSections = sectionOrder.filter((s: SectionKey) => !sidebarSections.includes(s));

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center py-8 px-4">
      {/* Share banner */}
      <div className="w-full max-w-[210mm] mb-4 flex items-center justify-between bg-white rounded-xl border border-gray-200 px-4 py-3 text-sm">
        <div className="flex items-center gap-2 text-gray-500">
          <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
          </svg>
          <span>Public CV — read-only view</span>
        </div>
        <span className="text-xs text-gray-400">Generated via ASM Portal</span>
      </div>

      {/* CV render */}
      <div
        className="w-full max-w-[210mm] bg-white shadow-xl overflow-hidden"
        style={{ fontFamily: "Arial, sans-serif", fontSize: "11px", lineHeight: 1.45 }}
      >
        <div className="flex min-h-[297mm]">
          {/* Left sidebar */}
          <div
            className="flex flex-col items-center pt-8 px-4 pb-8 gap-5"
            style={{ width: "32%", backgroundColor: "#1a2f4e", color: "#fff" }}
          >
            {/* Profile */}
            <div
              className="rounded-full overflow-hidden border-4 border-white/30 flex items-center justify-center font-black text-3xl"
              style={{ width: 90, height: 90, backgroundColor: "#2d5278", flexShrink: 0 }}
            >
              {data.profilePhoto ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={data.profilePhoto} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span style={{ color: "#fff" }}>{data.fullName?.charAt(0).toUpperCase() ?? "?"}</span>
              )}
            </div>

            {/* Contact */}
            <div className="w-full">
              <p className="font-black text-xs uppercase tracking-wider mb-2 border-b border-white/20 pb-1">Contact</p>
              {data.phone && <p className="text-[10px] text-white/90 mb-1">📞 {data.phone}</p>}
              {data.email && <p className="text-[10px] text-white/90 mb-1 break-all">✉ {data.email}</p>}
              {data.address && <p className="text-[10px] text-white/90">📍 {data.address}</p>}
            </div>

            {/* Skills */}
            {(data.skills ?? []).length > 0 && (
              <div className="w-full">
                <p className="font-black text-xs uppercase tracking-wider mb-2 border-b border-white/20 pb-1">Skills</p>
                <ul className="space-y-1">
                  {(data.skills ?? []).map((s: string, i: number) => (
                    <li key={i} className="text-[10px] text-white/90 flex items-center gap-1.5">
                      <span className="w-1 h-1 rounded-full bg-white/60" />
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Languages */}
            {(data.languages ?? []).length > 0 && (
              <div className="w-full">
                <p className="font-black text-xs uppercase tracking-wider mb-2 border-b border-white/20 pb-1">Languages</p>
                {(data.languages ?? []).map((l: { name: string; level: string }, i: number) => (
                  <p key={i} className="text-[10px] text-white/90 mb-1">
                    {l.name} <span className="text-white/50">({l.level})</span>
                  </p>
                ))}
              </div>
            )}

            {/* Hobbies */}
            {(data.hobbies ?? []).length > 0 && (
              <div className="w-full">
                <p className="font-black text-xs uppercase tracking-wider mb-2 border-b border-white/20 pb-1">Hobbies</p>
                <ul className="space-y-1">
                  {(data.hobbies ?? []).map((h: string, i: number) => (
                    <li key={i} className="text-[10px] text-white/90 flex items-center gap-1.5">
                      <span className="w-1 h-1 rounded-full bg-white/60" />
                      {h}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Personal Data */}
            {(data.dateOfBirth || data.bloodGroup || data.religion || data.maritalStatus || data.nationality) && (
              <div className="w-full">
                <p className="font-black text-xs uppercase tracking-wider mb-2 border-b border-white/20 pb-1">Personal Data</p>
                <div className="space-y-0.5 text-[10px] text-white/90">
                  {data.dateOfBirth && <p>Date of Birth : {data.dateOfBirth}</p>}
                  {data.bloodGroup && <p>Blood Group : {data.bloodGroup}</p>}
                  {data.religion && <p>Religion : {data.religion}</p>}
                  {data.maritalStatus && <p>Marital Status : {data.maritalStatus}</p>}
                  {data.nationality && <p>Nationality : {data.nationality}</p>}
                </div>
              </div>
            )}
          </div>

          {/* Right content */}
          <div className="flex-1 p-8 space-y-5">
            {/* Name */}
            <div className="border-b-2 pb-3" style={{ borderColor: "#1a2f4e" }}>
              <h1 className="font-black uppercase tracking-wide" style={{ fontSize: "24px", color: "#1a2f4e" }}>
                {data.fullName}
              </h1>
            </div>

            {/* Sections */}
            {rightSections.map((key: SectionKey) => {
              if (key === "careerObjective" && data.careerObjective) {
                return (
                  <div key={key}>
                    <h2 className="font-black uppercase text-xs tracking-widest border-b pb-1 mb-3" style={{ color: "#1a2f4e", borderColor: "#1a2f4e" }}>
                      Career Objective
                    </h2>
                    <p className="text-gray-700 leading-relaxed" style={{ fontSize: "10.5px" }}>{data.careerObjective}</p>
                  </div>
                );
              }

              if (key === "workExperience" && (data.workExperience ?? []).length > 0) {
                return (
                  <div key={key}>
                    <h2 className="font-black uppercase text-xs tracking-widest border-b pb-1 mb-3" style={{ color: "#1a2f4e", borderColor: "#1a2f4e" }}>
                      Work Experience
                    </h2>
                    {(data.workExperience ?? []).map((w: { id: string; jobTitle: string; company: string; location: string; bullets: string[] }) => (
                      <div key={w.id} className="mb-4">
                        <p className="font-bold italic" style={{ color: "#1a2f4e" }}>{w.jobTitle}</p>
                        <p className="text-gray-600 text-[10px] mb-1">{[w.company, w.location].filter(Boolean).join(" , ")}</p>
                        <ul className="space-y-0.5">
                          {w.bullets.filter(Boolean).map((b: string, i: number) => (
                            <li key={i} className="flex items-start gap-2 text-gray-700" style={{ fontSize: "10.5px" }}>
                              <span className="text-gray-400 mt-0.5">•</span> {b}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                );
              }

              if (key === "training" && (data.training ?? []).length > 0) {
                return (
                  <div key={key}>
                    <h2 className="font-black uppercase text-xs tracking-widest border-b pb-1 mb-3" style={{ color: "#1a2f4e", borderColor: "#1a2f4e" }}>
                      Professional Training
                    </h2>
                    {(data.training ?? []).map((t: { id: string; trainingName: string; institute: string; bullets: string[] }) => (
                      <div key={t.id} className="mb-4">
                        <p className="font-bold" style={{ color: "#1a2f4e" }}>{t.trainingName}</p>
                        <p className="text-gray-600 text-[10px] mb-1">{t.institute}</p>
                        <ul className="space-y-0.5">
                          {t.bullets.filter(Boolean).map((b: string, i: number) => (
                            <li key={i} className="flex items-start gap-2 text-gray-700" style={{ fontSize: "10.5px" }}>
                              <span className="text-gray-400 mt-0.5">•</span> {b}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                );
              }

              if (key === "education" && (data.education ?? []).length > 0) {
                return (
                  <div key={key}>
                    <h2 className="font-black uppercase text-xs tracking-widest border-b pb-1 mb-3" style={{ color: "#1a2f4e", borderColor: "#1a2f4e" }}>
                      Education
                    </h2>
                    {(data.education ?? []).map((e: { id: string; degree: string; department: string; institution: string; gpa?: string; year?: string }) => (
                      <div key={e.id} className="mb-3">
                        <p className="font-bold italic" style={{ color: "#1a2f4e" }}>{[e.degree, e.department].filter(Boolean).join(" , ")}</p>
                        <p className="text-gray-600 text-[10px]">{e.institution}</p>
                        <div className="flex items-center justify-between text-[10px] text-gray-500">
                          {e.gpa && <span>GPA: {e.gpa}</span>}
                          {e.year && <span>{e.year}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              }

              if (key === "references" && (data.references ?? []).length > 0) {
                return (
                  <div key={key}>
                    <h2 className="font-black uppercase text-xs tracking-widest border-b pb-1 mb-3" style={{ color: "#1a2f4e", borderColor: "#1a2f4e" }}>
                      Reference
                    </h2>
                    <div className="grid grid-cols-2 gap-4">
                      {(data.references ?? []).map((r: { id: string; name: string; phone: string; email: string; title: string }) => (
                        <div key={r.id} className="text-[10px] text-gray-700">
                          <p className="font-bold text-[#1a2f4e]">{r.name}</p>
                          <p>Phone : {r.phone}</p>
                          <p>Email : {r.email}</p>
                          <p className="text-gray-500">{r.title}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }

              if (key === "declaration" && data.declaration) {
                return (
                  <div key={key}>
                    <p className="text-gray-700 leading-relaxed" style={{ fontSize: "10px" }}>{data.declaration}</p>
                    {data.signature && (
                      <p className="mt-6 text-right font-semibold" style={{ color: "#1a2f4e" }}>
                        {data.signature}
                      </p>
                    )}
                  </div>
                );
              }
              return null;
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
