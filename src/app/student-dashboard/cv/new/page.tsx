"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { CvTemplateRecord } from "@/lib/cv/types";

function TemplateCard({
  template,
  selected,
  onSelect,
}: {
  template: CvTemplateRecord;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className={`group relative w-full text-left rounded-2xl border-2 overflow-hidden transition-all duration-200 ${
        selected
          ? "border-[#1e3a5f] shadow-lg shadow-[#1e3a5f]/20 scale-[1.02]"
          : "border-gray-200 hover:border-[#1e3a5f]/40 hover:shadow-md"
      }`}
    >
      {/* Template thumbnail */}
      <div className="aspect-[3/4] bg-gradient-to-br from-gray-50 to-gray-100 relative overflow-hidden">
        {template.thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={template.thumbnail}
            alt={template.name}
            className="w-full h-full object-cover object-top"
          />
        ) : (
          /* Placeholder preview matching Template 001 visual style */
          <div className="w-full h-full flex">
            {/* Left sidebar mock */}
            <div className="w-[35%] bg-[#1e3a5f] flex flex-col items-center pt-4 gap-2 px-2">
              <div className="w-10 h-10 rounded-full bg-white/20" />
              <div className="w-full space-y-1.5 mt-2">
                {[70, 55, 80, 60, 70].map((w, i) => (
                  <div key={i} className="h-1.5 rounded-full bg-white/30" style={{ width: `${w}%` }} />
                ))}
              </div>
            </div>
            {/* Right content mock */}
            <div className="flex-1 bg-white p-2 space-y-2">
              <div className="h-3 w-4/5 bg-gray-800 rounded" />
              <div className="h-1.5 w-full bg-gray-200 rounded" />
              <div className="h-1.5 w-4/5 bg-gray-200 rounded" />
              <div className="h-1.5 w-3/5 bg-gray-200 rounded" />
              <div className="mt-2 space-y-1">
                {[100, 90, 80].map((w, i) => (
                  <div key={i} className="h-1.5 rounded-full bg-gray-100" style={{ width: `${w}%` }} />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Selected overlay */}
        {selected && (
          <div className="absolute inset-0 bg-[#1e3a5f]/10 flex items-center justify-center">
            <div className="w-10 h-10 rounded-full bg-[#1e3a5f] flex items-center justify-center shadow-lg">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
          </div>
        )}
      </div>

      {/* Template info */}
      <div className="p-3 border-t border-gray-100">
        <p className="font-bold text-gray-900 text-sm truncate">{template.name}</p>
        {template.description && (
          <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{template.description}</p>
        )}
      </div>
    </button>
  );
}

export default function TemplatGalleryPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<CvTemplateRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [cvTitle, setCvTitle] = useState("My CV");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/cv/admin/templates")
      .then((r) => r.json())
      .then((data) => {
        setTemplates(data);
        if (data.length === 1) setSelectedId(data[0].id);
      })
      .catch(() => setError("Failed to load templates"))
      .finally(() => setLoading(false));
  }, []);

  const handleCreate = async () => {
    if (!selectedId) return;
    setCreating(true);
    setError("");
    try {
      const res = await fetch("/api/cv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId: selectedId, title: cvTitle.trim() || "My CV" }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed to create CV");
      }
      const { id } = await res.json();
      router.push(`/student-dashboard/cv/${id}/edit`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-1 h-10 bg-[#1e3a5f] rounded-full" />
        <div>
          <h1 className="text-3xl font-bold text-[#1f2937]">Choose a Template</h1>
          <p className="text-[#6b7280] mt-0.5">Pick a professional design, then fill in your details.</p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm font-medium">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="animate-spin rounded-full h-9 w-9 border-b-2 border-[#1e3a5f]" />
        </div>
      ) : (
        <>
          {/* Template grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {templates.map((t) => (
              <TemplateCard
                key={t.id}
                template={t}
                selected={selectedId === t.id}
                onSelect={() => setSelectedId(t.id)}
              />
            ))}
          </div>

          {/* CV title + CTA — only show when a template is selected */}
          {selectedId && (
            <div className="sticky bottom-4 mt-8">
              <div className="bg-white border border-gray-200 rounded-2xl shadow-xl p-4 flex flex-col sm:flex-row items-center gap-4">
                <div className="flex-1 w-full">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1.5">
                    Give this CV a name
                  </label>
                  <input
                    type="text"
                    value={cvTitle}
                    onChange={(e) => setCvTitle(e.target.value)}
                    maxLength={100}
                    placeholder="e.g. Sales Executive CV, Internship CV"
                    className="w-full py-2.5 px-4 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:border-[#1e3a5f] focus:ring-1 focus:ring-[#1e3a5f] outline-none text-sm transition-all"
                  />
                </div>
                <button
                  onClick={handleCreate}
                  disabled={creating || !cvTitle.trim()}
                  className={`shrink-0 inline-flex items-center gap-2 px-7 py-3 font-bold text-sm rounded-xl transition-all shadow-sm ${
                    creating || !cvTitle.trim()
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-[#1e3a5f] text-white hover:bg-[#2d5278]"
                  }`}
                >
                  {creating ? (
                    <>
                      <div className="w-4 h-4 animate-spin rounded-full border-b-2 border-white" />
                      Creating...
                    </>
                  ) : (
                    <>
                      Start Building
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                      </svg>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
