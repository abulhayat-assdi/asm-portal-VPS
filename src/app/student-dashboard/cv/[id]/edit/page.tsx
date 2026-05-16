"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { DropResult } from "@hello-pangea/dnd";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { cvFormSchema, type CvFormSchema } from "@/lib/cv/schemas";
import type { z } from "zod";
import {
  DEFAULT_SECTION_ORDER,
  SECTION_LABELS,
  AUTOSAVE_DEBOUNCE_MS,
  BLOOD_GROUPS,
  MARITAL_STATUSES,
  LANGUAGE_LEVELS,
  RELIGIONS,
  NATIONALITIES,
  DEFAULT_TEMPLATE_CONFIG,
} from "@/lib/cv/constants";
import type { SectionKey, CvVersionSummary, TemplateConfig } from "@/lib/cv/types";
import { generateCvPdf } from "@/lib/cv/pdf/generatePdf";
import { resolveProfilePhoto } from "@/lib/cv/imageUtils";

// ─── Auto-save status indicator ──────────────────────────────────────────────
type SaveStatus = "idle" | "saving" | "saved" | "error";

function SaveBadge({ status }: { status: SaveStatus }) {
  if (status === "idle") return null;
  const map = {
    saving: { text: "Saving...", cls: "text-amber-600 bg-amber-50 border-amber-200" },
    saved: { text: "All saved", cls: "text-emerald-600 bg-emerald-50 border-emerald-200" },
    error: { text: "Save failed", cls: "text-red-600 bg-red-50 border-red-200" },
  };
  const { text, cls } = map[status];
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${cls}`}>
      {status === "saving" && <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />}
      {status === "saved" && (
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        </svg>
      )}
      {text}
    </span>
  );
}

// ─── Reusable form field components ──────────────────────────────────────────
function Field({
  label,
  error,
  required,
  children,
}: {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 uppercase tracking-widest mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}

const inputCls =
  "block w-full py-2.5 px-3.5 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:border-[#1e3a5f] focus:ring-1 focus:ring-[#1e3a5f] outline-none text-sm transition-all placeholder:text-gray-300";

const textareaCls = `${inputCls} resize-none`;

// ─── Section panel wrapper ────────────────────────────────────────────────────
function SectionPanel({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-5 py-4 font-bold text-[#1e3a5f] text-sm hover:bg-gray-50 transition-colors"
      >
        {title}
        <svg
          className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>
      {open && <div className="px-5 pb-5 space-y-4 border-t border-gray-100 pt-4">{children}</div>}
    </div>
  );
}

// ─── Live Preview — Template 001 (Classic Two-Column) ────────────────────────
function Template001Preview({
  data,
  config = DEFAULT_TEMPLATE_CONFIG,
}: {
  data: Partial<CvFormSchema>;
  config?: TemplateConfig;
}) {
  const sectionOrder = (data.sectionOrder as SectionKey[]) ?? DEFAULT_SECTION_ORDER;
  const sidebarSections = (config.sidebarSections ?? ["skills", "languages", "hobbies"]) as SectionKey[];
  const rightSections = sectionOrder.filter((s) => !sidebarSections.includes(s));

  const photoRadius =
    config.profilePhotoShape === "circle"
      ? "50%"
      : config.profilePhotoShape === "rounded"
      ? "12px"
      : "0";

  const resolvedPhoto = resolveProfilePhoto(data.profilePhoto);

  const headingStyle: React.CSSProperties = {
    color: config.sectionHeadingColor,
    borderColor: config.accentColor,
    fontSize: `${config.sectionHeadingFontSize}px`,
  };

  return (
    <div
      className="w-full bg-white shadow-xl overflow-hidden"
      style={{ fontFamily: "Arial, sans-serif", fontSize: `${config.bodyFontSize}px`, lineHeight: 1.45 }}
    >
      <div className="flex min-h-[297mm]">
        {/* ── Left Sidebar ── */}
        <div
          className="flex flex-col items-center pt-8 px-3 pb-6 gap-4"
          style={{
            width: `${config.sidebarWidthPercent}%`,
            backgroundColor: config.sidebarBgColor,
            color: config.sidebarTextColor,
            fontSize: `${config.sidebarFontSize}px`,
            flexShrink: 0,
          }}
        >
          {/* Profile photo */}
          {config.showProfilePhoto && (
            <div
              className="overflow-hidden border-4 border-white/30"
              style={{
                width: config.profilePhotoSizePx,
                height: config.profilePhotoSizePx,
                borderRadius: photoRadius,
                flexShrink: 0,
              }}
            >
              {resolvedPhoto ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={resolvedPhoto} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center font-black"
                  style={{ backgroundColor: "#2d5278", fontSize: `${Math.round(config.profilePhotoSizePx * 0.3)}px` }}
                >
                  {data.fullName?.charAt(0).toUpperCase() ?? "?"}
                </div>
              )}
            </div>
          )}

          {/* Contact */}
          <div className="w-full">
            <p
              className="font-black uppercase tracking-wider mb-2 border-b pb-1"
              style={{ borderColor: "rgba(255,255,255,0.2)", fontSize: `${config.sidebarFontSize + 1}px` }}
            >
              Contact
            </p>
            {data.phone && (
              <p className="flex items-center gap-1.5 mb-1" style={{ opacity: 0.9 }}>
                <span>📞</span> {data.phone}
              </p>
            )}
            {data.email && (
              <p className="flex items-center gap-1.5 mb-1 break-all" style={{ opacity: 0.9 }}>
                <span>✉</span> {data.email}
              </p>
            )}
            {data.address && (
              <p className="flex items-start gap-1.5" style={{ opacity: 0.9 }}>
                <span className="mt-0.5">📍</span> {data.address}
              </p>
            )}
          </div>

          {/* Dynamic sidebar sections */}
          {sidebarSections.includes("skills") && (data.skills ?? []).length > 0 && (
            <div className="w-full">
              <p
                className="font-black uppercase tracking-wider mb-2 border-b pb-1"
                style={{ borderColor: "rgba(255,255,255,0.2)", fontSize: `${config.sidebarFontSize + 1}px` }}
              >
                Skills
              </p>
              <ul className="space-y-1">
                {(data.skills ?? []).map((s, i) => (
                  <li key={i} className="flex items-center gap-1.5" style={{ opacity: 0.9 }}>
                    <span className="w-1 h-1 rounded-full bg-white/60 shrink-0" />
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {sidebarSections.includes("languages") && (data.languages ?? []).length > 0 && (
            <div className="w-full">
              <p
                className="font-black uppercase tracking-wider mb-2 border-b pb-1"
                style={{ borderColor: "rgba(255,255,255,0.2)", fontSize: `${config.sidebarFontSize + 1}px` }}
              >
                Languages
              </p>
              <ul className="space-y-1">
                {(data.languages ?? []).map((l, i) => (
                  <li key={i} style={{ opacity: 0.9 }}>
                    {l.name} <span style={{ opacity: 0.5 }}>({l.level})</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {sidebarSections.includes("hobbies") && (data.hobbies ?? []).length > 0 && (
            <div className="w-full">
              <p
                className="font-black uppercase tracking-wider mb-2 border-b pb-1"
                style={{ borderColor: "rgba(255,255,255,0.2)", fontSize: `${config.sidebarFontSize + 1}px` }}
              >
                Hobbies
              </p>
              <ul className="space-y-1">
                {(data.hobbies ?? []).map((h, i) => (
                  <li key={i} className="flex items-center gap-1.5" style={{ opacity: 0.9 }}>
                    <span className="w-1 h-1 rounded-full bg-white/60 shrink-0" />
                    {h}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Personal Data */}
          {(data.dateOfBirth || data.bloodGroup || data.religion || data.maritalStatus || data.nationality) && (
            <div className="w-full">
              <p
                className="font-black uppercase tracking-wider mb-2 border-b pb-1"
                style={{ borderColor: "rgba(255,255,255,0.2)", fontSize: `${config.sidebarFontSize + 1}px` }}
              >
                Personal Data
              </p>
              <div className="space-y-0.5" style={{ opacity: 0.9 }}>
                {data.dateOfBirth && <p>Date of Birth : {data.dateOfBirth}</p>}
                {data.bloodGroup && <p>Blood Group : {data.bloodGroup}</p>}
                {data.religion && <p>Religion : {data.religion}</p>}
                {data.maritalStatus && <p>Marital Status : {data.maritalStatus}</p>}
                {data.nationality && <p>Nationality : {data.nationality}</p>}
              </div>
            </div>
          )}
        </div>

        {/* ── Right Content ── */}
        <div className="flex-1 p-6 space-y-4" style={{ backgroundColor: config.contentBgColor }}>
          {/* Name */}
          <div className="border-b-2 pb-2" style={{ borderColor: config.accentColor }}>
            <h1
              className="font-black uppercase tracking-wide leading-tight"
              style={{ fontSize: `${config.nameFontSize}px`, color: config.nameColor }}
            >
              {data.fullName || <span className="text-gray-300">Your Full Name</span>}
            </h1>
          </div>

          {/* Ordered right sections */}
          {rightSections.map((key) => {
            if (key === "careerObjective" && data.careerObjective) {
              return (
                <div key={key}>
                  <h2 className="font-black uppercase tracking-widest border-b pb-1 mb-2" style={headingStyle}>
                    Career Objective
                  </h2>
                  <p className="text-gray-700 leading-relaxed" style={{ fontSize: `${config.bodyFontSize}px` }}>
                    {data.careerObjective}
                  </p>
                </div>
              );
            }

            if (key === "workExperience" && (data.workExperience ?? []).length > 0) {
              return (
                <div key={key}>
                  <h2 className="font-black uppercase tracking-widest border-b pb-1 mb-2" style={headingStyle}>
                    Work Experience
                  </h2>
                  {(data.workExperience ?? []).map((w) => (
                    <div key={w.id} className="mb-2">
                      <p className="font-bold italic" style={{ color: config.sectionHeadingColor }}>{w.jobTitle}</p>
                      <p className="text-gray-600" style={{ fontSize: `${config.bodyFontSize - 1}px` }}>{[w.company, w.location].filter(Boolean).join(" , ")}</p>
                      <ul className="mt-1 space-y-0.5">
                        {w.bullets.filter(Boolean).map((b, i) => (
                          <li key={i} className="flex items-start gap-1.5 text-gray-700" style={{ fontSize: `${config.bodyFontSize}px` }}>
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
                  <h2 className="font-black uppercase tracking-widest border-b pb-1 mb-2" style={headingStyle}>
                    Professional Training
                  </h2>
                  {(data.training ?? []).map((t) => (
                    <div key={t.id} className="mb-2">
                      <p className="font-bold" style={{ color: config.sectionHeadingColor }}>{t.trainingName}</p>
                      <p className="text-gray-600" style={{ fontSize: `${config.bodyFontSize - 1}px` }}>{t.institute}</p>
                      <ul className="mt-1 space-y-0.5">
                        {t.bullets.filter(Boolean).map((b, i) => (
                          <li key={i} className="flex items-start gap-1.5 text-gray-700" style={{ fontSize: `${config.bodyFontSize}px` }}>
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
                  <h2 className="font-black uppercase tracking-widest border-b pb-1 mb-2" style={headingStyle}>
                    Education
                  </h2>
                  {(data.education ?? []).map((e) => (
                    <div key={e.id} className="mb-2">
                      <p className="font-bold italic" style={{ color: config.sectionHeadingColor }}>{[e.degree, e.department].filter(Boolean).join(" , ")}</p>
                      <p className="text-gray-600" style={{ fontSize: `${config.bodyFontSize - 1}px` }}>{e.institution}</p>
                      <div className="flex items-center justify-between text-gray-500" style={{ fontSize: `${config.bodyFontSize - 1}px` }}>
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
                  <h2 className="font-black uppercase tracking-widest border-b pb-1 mb-2" style={headingStyle}>
                    Reference
                  </h2>
                  <div className="grid grid-cols-2 gap-3">
                    {(data.references ?? []).map((r) => (
                      <div key={r.id} className="text-gray-700" style={{ fontSize: `${config.bodyFontSize - 1}px` }}>
                        <p className="font-bold">{r.name}</p>
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
                  <p className="text-gray-700 leading-relaxed" style={{ fontSize: `${config.bodyFontSize - 1}px` }}>
                    {data.declaration}
                  </p>
                  {data.signature && (
                    <p className="mt-4 text-right font-semibold" style={{ color: config.nameColor }}>
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
  );
}

// ─── Main Editor Page ─────────────────────────────────────────────────────────
export default function CvEditorPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromAdmin = searchParams.get("from") === "admin";
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [activeTab, setActiveTab] = useState<"form" | "preview">("form");
  const [versions, setVersions] = useState<CvVersionSummary[]>([]);
  const [showVersions, setShowVersions] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [templateConfig, setTemplateConfig] = useState<TemplateConfig>(DEFAULT_TEMPLATE_CONFIG);
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Use input type for RHF so optional defaults match the resolver's expected type
  const form = useForm<z.input<typeof cvFormSchema>>({
    resolver: zodResolver(cvFormSchema) as never,
    defaultValues: {
      title: "My CV",
      templateId: "",
      fullName: "",
      profilePhoto: null,
      careerObjective: "",
      phone: "",
      email: "",
      address: "",
      dateOfBirth: "",
      bloodGroup: "",
      religion: "",
      maritalStatus: "",
      nationality: "",
      skills: [],
      languages: [],
      hobbies: [],
      workExperience: [],
      training: [],
      education: [],
      references: [],
      declaration: "",
      signature: "",
      sectionOrder: DEFAULT_SECTION_ORDER,
    },
  });

  const { watch, setValue, getValues, formState: { errors } } = form;
  const formData = watch() as CvFormSchema;

  // Load draft
  useEffect(() => {
    fetch(`/api/cv/${id}`)
      .then((r) => r.json())
      .then((data) => {
        const fields: (keyof CvFormSchema)[] = [
          "title", "templateId", "fullName", "profilePhoto", "careerObjective",
          "phone", "email", "address", "dateOfBirth", "bloodGroup", "religion",
          "maritalStatus", "nationality", "skills", "languages", "hobbies",
          "workExperience", "training", "education", "references",
          "declaration", "signature", "sectionOrder",
        ];
        fields.forEach((f) => {
          if (data[f] !== undefined && data[f] !== null) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            setValue(f, data[f] as any);
          }
        });
        if (!data.sectionOrder?.length) setValue("sectionOrder", DEFAULT_SECTION_ORDER);
        // Apply template visual config if present
        if (data.template?.config) {
          setTemplateConfig(data.template.config as TemplateConfig);
        }
      })
      .catch(() => router.replace("/student-dashboard/cv"))
      .finally(() => setLoading(false));
  }, [id, setValue, router]);

  // Auto-save on form change (debounced)
  useEffect(() => {
    if (loading) return;
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    setSaveStatus("saving");
    autoSaveTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/cv/${id}/auto-save`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(getValues()),
        });
        setSaveStatus(res.ok ? "saved" : "error");
        setTimeout(() => setSaveStatus("idle"), 2500);
      } catch {
        setSaveStatus("error");
      }
    }, AUTOSAVE_DEBOUNCE_MS);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(formData), loading]);

  // Version snapshot
  const takeSnapshot = useCallback(async (label?: string) => {
    await fetch(`/api/cv/${id}/versions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label }),
    });
    const res = await fetch(`/api/cv/${id}/versions`);
    if (res.ok) setVersions(await res.json());
  }, [id]);

  const loadVersions = useCallback(async () => {
    const res = await fetch(`/api/cv/${id}/versions`);
    if (res.ok) setVersions(await res.json());
    setShowVersions(true);
  }, [id]);

  const restoreVersion = useCallback(async (versionId: string) => {
    if (!confirm("Restore this version? Current data will be overwritten.")) return;
    const res = await fetch(`/api/cv/${id}/versions`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ versionId }),
    });
    if (res.ok) window.location.reload();
  }, [id]);

  // PDF export
  const handleExportPdf = useCallback(async () => {
    setExporting(true);
    try {
      await fetch(`/api/cv/${id}/download`, { method: "POST" });
      await generateCvPdf(getValues() as unknown as CvFormSchema, `${(getValues("fullName" as any) as string) || "cv"}.pdf`);
    } finally {
      setExporting(false);
    }
  }, [id, getValues]);

  // Section reorder (drag-and-drop)
  const handleDragEnd = useCallback((result: DropResult) => {
    if (!result.destination) return;
    const order = [...((getValues("sectionOrder" as any) ?? DEFAULT_SECTION_ORDER) as SectionKey[])];
    const [moved] = order.splice(result.source.index, 1);
    order.splice(result.destination.index, 0, moved);
    setValue("sectionOrder" as any, order as any);
  }, [getValues, setValue]);

  // ─── Helpers for dynamic array fields ───────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const addItem = (field: keyof CvFormSchema, item: Record<string, unknown> | string) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const current = (getValues(field as any) ?? []) as unknown[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setValue(field as any, [...current, item] as any);
  };

  const removeItem = (field: keyof CvFormSchema, index: number) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const current = [...((getValues(field as any) ?? []) as unknown[])];
    current.splice(index, 1);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setValue(field as any, current as any);
  };

  const updateItem = (field: keyof CvFormSchema, index: number, key: string, value: unknown) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const current = [...((getValues(field as any) ?? []) as any[])];
    current[index] = { ...current[index], [key]: value };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setValue(field as any, current as any);
  };

  const newId = () => crypto.randomUUID();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#1e3a5f]" />
      </div>
    );
  }

  // ─── Layout ──────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden">
      {/* Top toolbar */}
      <div className="shrink-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 flex-wrap">
        <button
          onClick={() => router.push(fromAdmin ? "/dashboard/admin/cv-manager" : "/student-dashboard/cv")}
          className="p-2 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
        </button>

        <div className="flex-1 min-w-0">
          <input
            {...form.register("title")}
            className="font-bold text-gray-900 text-sm bg-transparent border-0 outline-none w-full truncate"
            placeholder="CV Title"
          />
        </div>

        <SaveBadge status={saveStatus} />

        {/* Mobile tab toggle */}
        <div className="flex lg:hidden gap-1 bg-gray-100 p-1 rounded-xl">
          {(["form", "preview"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                activeTab === t ? "bg-white text-[#1e3a5f] shadow-sm" : "text-gray-500"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Actions */}
        <button
          onClick={() => takeSnapshot()}
          title="Save version snapshot"
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Snapshot
        </button>
        <button
          onClick={loadVersions}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors"
        >
          History
        </button>
        <button
          onClick={handleExportPdf}
          disabled={exporting}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-[#1e3a5f] text-white rounded-xl hover:bg-[#2d5278] transition-colors disabled:opacity-60"
        >
          {exporting ? "Exporting..." : "Download PDF"}
        </button>
      </div>

      {/* Main split layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* ── Form panel (left) ── */}
        <div
          className={`w-full lg:w-[45%] xl:w-[40%] overflow-y-auto bg-gray-50 p-4 space-y-4 ${
            activeTab === "preview" ? "hidden lg:block" : "block"
          }`}
        >
          {/* Section reorder panel */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">
              Section Order — Drag to reorder
            </p>
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="sections">
                {(provided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-1.5">
                    {(formData.sectionOrder as SectionKey[]).map((key, index) => (
                      <Draggable key={key} draggableId={key} index={index}>
                        {(drag, snapshot) => (
                          <div
                            ref={drag.innerRef}
                            {...drag.draggableProps}
                            {...drag.dragHandleProps}
                            className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold transition-all cursor-grab ${
                              snapshot.isDragging
                                ? "bg-[#1e3a5f] text-white border-[#1e3a5f] shadow-lg"
                                : "bg-gray-50 border-gray-200 text-gray-700"
                            }`}
                          >
                            <svg className="w-3.5 h-3.5 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9h16.5m-16.5 6.75h16.5" />
                            </svg>
                            {SECTION_LABELS[key]}
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </div>

          {/* ── Personal Info ── */}
          <SectionPanel title="Personal Information">
            <Field label="Full Name" required error={errors.fullName?.message}>
              <input {...form.register("fullName")} className={inputCls} placeholder="MD Safayat Hossain" />
            </Field>
            <Field label="Career Objective" error={errors.careerObjective?.message}>
              <textarea {...form.register("careerObjective")} className={textareaCls} rows={4} placeholder="Write a brief career objective..." />
            </Field>
            <Field label="Profile Photo URL" error={errors.profilePhoto?.message}>
              <input
                {...form.register("profilePhoto")}
                className={inputCls}
                placeholder="Paste image URL or upload below"
              />
            </Field>
          </SectionPanel>

          {/* ── Contact ── */}
          <SectionPanel title="Contact Information">
            <Field label="Phone" required error={errors.phone?.message}>
              <input {...form.register("phone")} className={inputCls} placeholder="01XXXXXXXXX or +8801XXXXXXXXX" />
            </Field>
            <Field label="Email" required error={errors.email?.message}>
              <input {...form.register("email")} type="email" className={inputCls} placeholder="you@email.com" />
            </Field>
            <Field label="Address" error={errors.address?.message}>
              <input {...form.register("address")} className={inputCls} placeholder="City, District" />
            </Field>
          </SectionPanel>

          {/* ── Personal Data ── */}
          <SectionPanel title="Personal Data">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Date of Birth">
                <input {...form.register("dateOfBirth")} className={inputCls} placeholder="DD-MM-YYYY" />
              </Field>
              <Field label="Blood Group">
                <select {...form.register("bloodGroup")} className={inputCls}>
                  <option value="">Select</option>
                  {BLOOD_GROUPS.map((g) => <option key={g}>{g}</option>)}
                </select>
              </Field>
              <Field label="Religion">
                <select {...form.register("religion")} className={inputCls}>
                  <option value="">Select</option>
                  {RELIGIONS.map((r) => <option key={r}>{r}</option>)}
                </select>
              </Field>
              <Field label="Marital Status">
                <select {...form.register("maritalStatus")} className={inputCls}>
                  <option value="">Select</option>
                  {MARITAL_STATUSES.map((m) => <option key={m}>{m}</option>)}
                </select>
              </Field>
              <Field label="Nationality">
                <select {...form.register("nationality")} className={inputCls}>
                  <option value="">Select</option>
                  {NATIONALITIES.map((n) => <option key={n}>{n}</option>)}
                </select>
              </Field>
            </div>
          </SectionPanel>

          {/* ── Skills ── */}
          <SectionPanel title="Skills">
            {(formData.skills ?? []).map((skill, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  value={skill}
                  onChange={(e) => {
                    const s = [...((getValues("skills" as any) ?? []) as string[])];
                    s[i] = e.target.value;
                    setValue("skills" as any, s as any);
                  }}
                  className={`${inputCls} flex-1`}
                  placeholder={`Skill ${i + 1}`}
                />
                <button type="button" onClick={() => removeItem("skills", i)} className="p-2 text-red-400 hover:text-red-600">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
            <button type="button" onClick={() => addItem("skills", "")}
              className="text-xs font-bold text-[#1e3a5f] hover:underline">
              + Add Skill
            </button>
          </SectionPanel>

          {/* ── Languages ── */}
          <SectionPanel title="Languages">
            {(formData.languages ?? []).map((lang, i) => (
              <div key={lang.id} className="flex items-center gap-2">
                <input
                  value={lang.name}
                  onChange={(e) => updateItem("languages", i, "name", e.target.value)}
                  className={`${inputCls} flex-1`}
                  placeholder="Language"
                />
                <select
                  value={lang.level}
                  onChange={(e) => updateItem("languages", i, "level", e.target.value)}
                  className={`${inputCls} w-32`}
                >
                  {LANGUAGE_LEVELS.map((l) => <option key={l}>{l}</option>)}
                </select>
                <button type="button" onClick={() => removeItem("languages", i)} className="p-2 text-red-400 hover:text-red-600">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
            <button type="button" onClick={() => addItem("languages", { id: newId(), name: "", level: "Basics" })}
              className="text-xs font-bold text-[#1e3a5f] hover:underline">
              + Add Language
            </button>
          </SectionPanel>

          {/* ── Hobbies ── */}
          <SectionPanel title="Hobbies">
            {(formData.hobbies ?? []).map((hobby, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  value={hobby}
                  onChange={(e) => {
                    const h = [...((getValues("hobbies" as any) ?? []) as string[])];
                    h[i] = e.target.value;
                    setValue("hobbies" as any, h as any);
                  }}
                  className={`${inputCls} flex-1`}
                  placeholder={`Hobby ${i + 1}`}
                />
                <button type="button" onClick={() => removeItem("hobbies", i)} className="p-2 text-red-400 hover:text-red-600">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
            <button type="button" onClick={() => addItem("hobbies", "")}
              className="text-xs font-bold text-[#1e3a5f] hover:underline">
              + Add Hobby
            </button>
          </SectionPanel>

          {/* ── Work Experience ── */}
          <SectionPanel title="Work Experience">
            {(formData.workExperience ?? []).map((exp, i) => (
              <div key={exp.id} className="border border-gray-100 rounded-xl p-3 space-y-2 relative">
                <button type="button" onClick={() => removeItem("workExperience", i)}
                  className="absolute top-2 right-2 text-red-400 hover:text-red-600">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                <Field label="Job Title" required>
                  <input value={exp.jobTitle} onChange={(e) => updateItem("workExperience", i, "jobTitle", e.target.value)} className={inputCls} placeholder="Sales Executive (Internship)" />
                </Field>
                <div className="grid grid-cols-2 gap-2">
                  <Field label="Company" required>
                    <input value={exp.company} onChange={(e) => updateItem("workExperience", i, "company", e.target.value)} className={inputCls} placeholder="Company Name" />
                  </Field>
                  <Field label="Location" required>
                    <input value={exp.location} onChange={(e) => updateItem("workExperience", i, "location", e.target.value)} className={inputCls} placeholder="Dhaka" />
                  </Field>
                </div>
                <Field label="Bullet Points">
                  {exp.bullets.map((b, bi) => (
                    <div key={bi} className="flex items-center gap-2 mb-1.5">
                      <input
                        value={b}
                        onChange={(e) => {
                          const bullets = [...exp.bullets];
                          bullets[bi] = e.target.value;
                          updateItem("workExperience", i, "bullets", bullets);
                        }}
                        className={`${inputCls} flex-1`}
                        placeholder={`Point ${bi + 1}`}
                      />
                      <button type="button" onClick={() => {
                        const bullets = exp.bullets.filter((_, idx) => idx !== bi);
                        updateItem("workExperience", i, "bullets", bullets);
                      }} className="text-red-400 hover:text-red-600">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                  <button type="button" onClick={() => updateItem("workExperience", i, "bullets", [...exp.bullets, ""])}
                    className="text-xs font-bold text-[#1e3a5f] hover:underline">+ Add point</button>
                </Field>
              </div>
            ))}
            <button type="button" onClick={() => addItem("workExperience", { id: newId(), jobTitle: "", company: "", location: "", bullets: [""] })}
              className="text-xs font-bold text-[#1e3a5f] hover:underline">
              + Add Work Experience
            </button>
          </SectionPanel>

          {/* ── Training ── */}
          <SectionPanel title="Professional Training">
            {(formData.training ?? []).map((t, i) => (
              <div key={t.id} className="border border-gray-100 rounded-xl p-3 space-y-2 relative">
                <button type="button" onClick={() => removeItem("training", i)} className="absolute top-2 right-2 text-red-400 hover:text-red-600">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                <Field label="Training Name" required>
                  <input value={t.trainingName} onChange={(e) => updateItem("training", i, "trainingName", e.target.value)} className={inputCls} placeholder="The Art of Sales and Marketing" />
                </Field>
                <Field label="Institute" required>
                  <input value={t.institute} onChange={(e) => updateItem("training", i, "institute", e.target.value)} className={inputCls} placeholder="Institute Name" />
                </Field>
                <Field label="Bullet Points">
                  {t.bullets.map((b, bi) => (
                    <div key={bi} className="flex items-center gap-2 mb-1.5">
                      <input
                        value={b}
                        onChange={(e) => {
                          const bullets = [...t.bullets];
                          bullets[bi] = e.target.value;
                          updateItem("training", i, "bullets", bullets);
                        }}
                        className={`${inputCls} flex-1`}
                        placeholder={`Skill learned ${bi + 1}`}
                      />
                      <button type="button" onClick={() => {
                        const bullets = t.bullets.filter((_, idx) => idx !== bi);
                        updateItem("training", i, "bullets", bullets);
                      }} className="text-red-400 hover:text-red-600">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                  <button type="button" onClick={() => updateItem("training", i, "bullets", [...t.bullets, ""])}
                    className="text-xs font-bold text-[#1e3a5f] hover:underline">+ Add point</button>
                </Field>
              </div>
            ))}
            <button type="button" onClick={() => addItem("training", { id: newId(), trainingName: "", institute: "", bullets: [""] })}
              className="text-xs font-bold text-[#1e3a5f] hover:underline">
              + Add Training
            </button>
          </SectionPanel>

          {/* ── Education ── */}
          <SectionPanel title="Education">
            {(formData.education ?? []).map((edu, i) => (
              <div key={edu.id} className="border border-gray-100 rounded-xl p-3 space-y-2 relative">
                <button type="button" onClick={() => removeItem("education", i)} className="absolute top-2 right-2 text-red-400 hover:text-red-600">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                <div className="grid grid-cols-2 gap-2">
                  <Field label="Degree" required>
                    <input value={edu.degree} onChange={(e) => updateItem("education", i, "degree", e.target.value)} className={inputCls} placeholder="BA(hon)" />
                  </Field>
                  <Field label="Department" required>
                    <input value={edu.department} onChange={(e) => updateItem("education", i, "department", e.target.value)} className={inputCls} placeholder="Geography" />
                  </Field>
                </div>
                <Field label="Institution" required>
                  <input value={edu.institution} onChange={(e) => updateItem("education", i, "institution", e.target.value)} className={inputCls} placeholder="College / University name" />
                </Field>
                <div className="grid grid-cols-2 gap-2">
                  <Field label="GPA">
                    <input value={edu.gpa ?? ""} onChange={(e) => updateItem("education", i, "gpa", e.target.value)} className={inputCls} placeholder="4.33 out of 5.00" />
                  </Field>
                  <Field label="Year">
                    <input value={edu.year ?? ""} onChange={(e) => updateItem("education", i, "year", e.target.value)} className={inputCls} placeholder="2023" />
                  </Field>
                </div>
              </div>
            ))}
            <button type="button" onClick={() => addItem("education", { id: newId(), degree: "", department: "", institution: "", gpa: "", year: "" })}
              className="text-xs font-bold text-[#1e3a5f] hover:underline">
              + Add Education
            </button>
          </SectionPanel>

          {/* ── References ── */}
          <SectionPanel title="References">
            {(formData.references ?? []).map((ref, i) => (
              <div key={ref.id} className="border border-gray-100 rounded-xl p-3 space-y-2 relative">
                <button type="button" onClick={() => removeItem("references", i)} className="absolute top-2 right-2 text-red-400 hover:text-red-600">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                <div className="grid grid-cols-2 gap-2">
                  <Field label="Name" required>
                    <input value={ref.name} onChange={(e) => updateItem("references", i, "name", e.target.value)} className={inputCls} placeholder="MD. Abu Zabar Rezvhe" />
                  </Field>
                  <Field label="Phone" required>
                    <input value={ref.phone} onChange={(e) => updateItem("references", i, "phone", e.target.value)} className={inputCls} placeholder="01XXXXXXXXX" />
                  </Field>
                </div>
                <Field label="Email" required>
                  <input value={ref.email} onChange={(e) => updateItem("references", i, "email", e.target.value)} className={inputCls} placeholder="name@email.com" />
                </Field>
                <Field label="Title / Position" required>
                  <input value={ref.title} onChange={(e) => updateItem("references", i, "title", e.target.value)} className={inputCls} placeholder="Executive Director, XYZ Corp" />
                </Field>
              </div>
            ))}
            <button type="button" onClick={() => addItem("references", { id: newId(), name: "", phone: "", email: "", title: "" })}
              className="text-xs font-bold text-[#1e3a5f] hover:underline">
              + Add Reference
            </button>
          </SectionPanel>

          {/* ── Declaration ── */}
          <SectionPanel title="Declaration">
            <Field label="Declaration Text">
              <textarea {...form.register("declaration")} className={textareaCls} rows={3}
                placeholder="I do hereby state that the above statement is true..." />
            </Field>
            <Field label="Signature (Your name)">
              <input {...form.register("signature")} className={inputCls} placeholder="Your Full Name" />
            </Field>
          </SectionPanel>
        </div>

        {/* ── Divider (desktop) ── */}
        <div className="hidden lg:block w-px bg-gray-200 shrink-0" />

        {/* ── Preview panel (right) ── */}
        <div
          className={`flex-1 overflow-y-auto bg-gray-100 p-6 ${
            activeTab === "form" ? "hidden lg:block" : "block"
          }`}
        >
          <div className="max-w-[210mm] mx-auto">
            <Template001Preview data={formData} config={templateConfig} />
          </div>
        </div>
      </div>

      {/* Version history drawer */}
      {showVersions && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4"
          onClick={() => setShowVersions(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-gray-900 mb-4">Version History</h3>
            {versions.length === 0 ? (
              <p className="text-gray-500 text-sm">No snapshots saved yet. Click &quot;Snapshot&quot; to save one.</p>
            ) : (
              <div className="space-y-2">
                {versions.map((v) => (
                  <div key={v.id} className="flex items-center justify-between p-3 border border-gray-100 rounded-xl">
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{v.label ?? "Snapshot"}</p>
                      <p className="text-xs text-gray-500">{new Date(v.createdAt).toLocaleString()}</p>
                    </div>
                    <button onClick={() => restoreVersion(v.id)}
                      className="text-xs font-bold text-[#1e3a5f] hover:underline">
                      Restore
                    </button>
                  </div>
                ))}
              </div>
            )}
            <button onClick={() => setShowVersions(false)}
              className="mt-4 w-full py-2.5 text-sm font-bold text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors">
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
