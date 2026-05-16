"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import AdminRoute from "@/components/auth/AdminRoute";
import type { AdminCvListItem, CvTemplateRecord, TemplateConfig } from "@/lib/cv/types";
import { DEFAULT_TEMPLATE_CONFIG } from "@/lib/cv/constants";
import { useConfirm } from "@/contexts/ConfirmContext";
import Link from "next/link";

type Tab = "cvs" | "templates";

const ALL_SECTION_KEYS = ["skills", "languages", "hobbies", "careerObjective", "workExperience", "training", "education", "references", "declaration"] as const;
const SECTION_NAMES: Record<string, string> = {
  skills: "Skills", languages: "Languages", hobbies: "Hobbies",
  careerObjective: "Career Objective", workExperience: "Work Experience",
  training: "Professional Training", education: "Education",
  references: "Reference", declaration: "Declaration",
};

// ─── Template Form Modal ──────────────────────────────────────────────────────
function TemplateModal({
  initial,
  onSave,
  onCancel,
}: {
  initial?: CvTemplateRecord | null;
  onSave: (data: Partial<CvTemplateRecord> & { config: TemplateConfig }) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    name: initial?.name ?? "",
    slug: initial?.slug ?? "",
    description: initial?.description ?? "",
    thumbnail: initial?.thumbnail ?? "",
    isActive: initial?.isActive ?? true,
  });
  const [config, setConfig] = useState<TemplateConfig>(
    (initial?.config as TemplateConfig | null) ?? DEFAULT_TEMPLATE_CONFIG
  );
  const [uploading, setUploading] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/cv/admin/templates/upload", { method: "POST", body: fd });
      if (res.ok) {
        const { url } = await res.json();
        setForm((f) => ({ ...f, thumbnail: url }));
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.error ?? "Upload failed");
      }
    } finally {
      setUploading(false);
    }
  };

  const setC = (key: keyof TemplateConfig, value: unknown) =>
    setConfig((c) => ({ ...c, [key]: value }));

  const toggleSidebarSection = (key: string) => {
    const sections = config.sidebarSections.includes(key)
      ? config.sidebarSections.filter((s) => s !== key)
      : [...config.sidebarSections, key];
    setC("sidebarSections", sections);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onCancel}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-bold text-gray-900 mb-5">
          {initial ? "Edit Template" : "Add New Template"}
        </h3>

        {/* ── Basic info ── */}
        <div className="space-y-4 mb-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Template Name *</label>
              <input
                className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#1e3a5f] focus:outline-none"
                placeholder="e.g. Classic Two-Column"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Slug * <span className="text-gray-400 font-normal text-xs">(unique ID)</span>
              </label>
              <input
                className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#1e3a5f] focus:outline-none font-mono"
                placeholder="classic-two-column"
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/\s+/g, "-") })}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
            <textarea
              rows={2}
              className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#1e3a5f] focus:outline-none resize-none"
              placeholder="Brief description of this template style"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>

          {/* Thumbnail upload */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Thumbnail</label>
            <div className="flex items-start gap-3">
              {form.thumbnail && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={form.thumbnail} alt="Preview" className="w-20 h-20 object-cover rounded-xl border border-gray-200" />
              )}
              <div className="flex-1 space-y-2">
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleUpload(file);
                  }}
                />
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="px-4 py-2 text-sm font-semibold border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 disabled:opacity-60 transition-colors"
                >
                  {uploading ? "Uploading..." : "Upload Image"}
                </button>
                <p className="text-xs text-gray-400">or paste a URL below (JPEG, PNG, WebP, max 5 MB)</p>
                <input
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-[#1e3a5f] focus:outline-none"
                  placeholder="/cv-templates/my-template.png"
                  value={form.thumbnail}
                  onChange={(e) => setForm({ ...form, thumbnail: e.target.value })}
                />
              </div>
            </div>
          </div>

          {initial && (
            <label className="flex items-center gap-3 cursor-pointer">
              <div
                onClick={() => setForm({ ...form, isActive: !form.isActive })}
                className={`relative w-10 h-5 rounded-full transition-colors ${form.isActive ? "bg-emerald-500" : "bg-gray-300"}`}
              >
                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${form.isActive ? "translate-x-5" : "translate-x-0.5"}`} />
              </div>
              <span className="text-sm font-semibold text-gray-700">Active (visible to students)</span>
            </label>
          )}
        </div>

        {/* ── Visual config accordion ── */}
        <div className="border border-gray-200 rounded-xl overflow-hidden mb-5">
          <button
            type="button"
            onClick={() => setShowConfig((v) => !v)}
            className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 text-sm font-bold text-gray-700 hover:bg-gray-100 transition-colors"
          >
            Visual Configuration
            <svg
              className={`w-4 h-4 transition-transform ${showConfig ? "rotate-180" : ""}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
          </button>

          {showConfig && (
            <div className="p-4 space-y-5 text-sm">
              {/* Layout */}
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Layout</p>
                <div className="space-y-3">
                  <div>
                    <label className="flex items-center justify-between mb-1 font-medium text-gray-700">
                      Sidebar Width <span className="text-[#1e3a5f] font-bold">{config.sidebarWidthPercent}%</span>
                    </label>
                    <input
                      type="range" min={25} max={45} value={config.sidebarWidthPercent}
                      onChange={(e) => setC("sidebarWidthPercent", Number(e.target.value))}
                      className="w-full accent-[#1e3a5f]"
                    />
                  </div>
                </div>
              </div>

              {/* Colors */}
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Colors</p>
                <div className="grid grid-cols-2 gap-3">
                  {([
                    ["sidebarBgColor", "Sidebar Background"],
                    ["sidebarTextColor", "Sidebar Text"],
                    ["contentBgColor", "Content Background"],
                    ["nameColor", "Name Color"],
                    ["sectionHeadingColor", "Heading Color"],
                    ["accentColor", "Accent / Border"],
                  ] as [keyof TemplateConfig, string][]).map(([key, label]) => (
                    <label key={key} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="color"
                        value={config[key] as string}
                        onChange={(e) => setC(key, e.target.value)}
                        className="w-8 h-8 rounded-lg border border-gray-200 cursor-pointer p-0.5"
                      />
                      <span className="text-gray-700 text-xs">{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Profile Photo */}
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Profile Photo</p>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <div
                      onClick={() => setC("showProfilePhoto", !config.showProfilePhoto)}
                      className={`relative w-9 h-5 rounded-full transition-colors ${config.showProfilePhoto ? "bg-emerald-500" : "bg-gray-300"}`}
                    >
                      <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${config.showProfilePhoto ? "translate-x-4" : "translate-x-0.5"}`} />
                    </div>
                    <span className="font-medium text-gray-700">Show Profile Photo</span>
                  </label>
                  {config.showProfilePhoto && (
                    <>
                      <div>
                        <label className="flex items-center justify-between mb-1 font-medium text-gray-700">
                          Photo Size <span className="text-[#1e3a5f] font-bold">{config.profilePhotoSizePx}px</span>
                        </label>
                        <input
                          type="range" min={60} max={120} value={config.profilePhotoSizePx}
                          onChange={(e) => setC("profilePhotoSizePx", Number(e.target.value))}
                          className="w-full accent-[#1e3a5f]"
                        />
                      </div>
                      <div>
                        <label className="block mb-1 font-medium text-gray-700">Photo Shape</label>
                        <div className="flex gap-2">
                          {(["circle", "rounded", "square"] as const).map((shape) => (
                            <button
                              key={shape}
                              type="button"
                              onClick={() => setC("profilePhotoShape", shape)}
                              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all capitalize ${
                                config.profilePhotoShape === shape
                                  ? "bg-[#1e3a5f] text-white border-[#1e3a5f]"
                                  : "border-gray-200 text-gray-600 hover:bg-gray-50"
                              }`}
                            >
                              {shape}
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Typography */}
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Typography</p>
                <div className="space-y-3">
                  {([
                    ["nameFontSize", "Name Size", 16, 32],
                    ["sectionHeadingFontSize", "Section Heading Size", 7, 12],
                    ["bodyFontSize", "Body Text Size", 8, 12],
                    ["sidebarFontSize", "Sidebar Text Size", 8, 11],
                  ] as [keyof TemplateConfig, string, number, number][]).map(([key, label, min, max]) => (
                    <div key={key}>
                      <label className="flex items-center justify-between mb-1 font-medium text-gray-700">
                        {label} <span className="text-[#1e3a5f] font-bold">{config[key] as number}px</span>
                      </label>
                      <input
                        type="range" min={min} max={max} step={0.5} value={config[key] as number}
                        onChange={(e) => setC(key, Number(e.target.value))}
                        className="w-full accent-[#1e3a5f]"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Sidebar sections */}
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">
                  Sidebar Sections <span className="text-gray-400 font-normal normal-case">(Contact &amp; Personal Data always in sidebar)</span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {ALL_SECTION_KEYS.map((key) => {
                    const inSidebar = config.sidebarSections.includes(key);
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => toggleSidebarSection(key)}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                          inSidebar
                            ? "bg-[#1e3a5f] text-white border-[#1e3a5f]"
                            : "border-gray-200 text-gray-600 hover:bg-gray-50"
                        }`}
                      >
                        {SECTION_NAMES[key]}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-5 py-2.5 text-sm font-semibold text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave({ ...form, config })}
            disabled={!form.name || !form.slug}
            className="px-5 py-2.5 text-sm font-bold bg-[#1e3a5f] text-white rounded-xl hover:bg-[#2d5278] transition-colors disabled:opacity-50"
          >
            {initial ? "Update Template" : "Add Template"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Admin Page ──────────────────────────────────────────────────────────
export default function AdminCvManagerPage() {
  const confirm = useConfirm();
  const [tab, setTab] = useState<Tab>("cvs");

  // CVs list state
  const [cvs, setCvs] = useState<AdminCvListItem[]>([]);
  const [cvLoading, setCvLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCvs, setTotalCvs] = useState(0);

  // Templates state
  const [templates, setTemplates] = useState<CvTemplateRecord[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(true);
  const [showTemplateForm, setShowTemplateForm] = useState(false);
  const [editTemplate, setEditTemplate] = useState<CvTemplateRecord | null>(null);

  // ─── Load CVs ───────────────────────────────────────────────────────────────
  const loadCvs = useCallback(async () => {
    setCvLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), search });
      const res = await fetch(`/api/cv/admin?${params}`);
      if (res.ok) {
        const data = await res.json();
        setCvs(data.drafts);
        setTotalPages(data.pages);
        setTotalCvs(data.total);
      }
    } finally {
      setCvLoading(false);
    }
  }, [page, search]);

  const loadTemplates = useCallback(async () => {
    setTemplatesLoading(true);
    try {
      const res = await fetch("/api/cv/admin/templates");
      if (res.ok) setTemplates(await res.json());
    } finally {
      setTemplatesLoading(false);
    }
  }, []);

  useEffect(() => { loadCvs(); }, [loadCvs]);
  useEffect(() => { loadTemplates(); }, [loadTemplates]);

  // ─── CV Actions ──────────────────────────────────────────────────────────────
  const handleDeleteCv = async (cv: AdminCvListItem) => {
    const ok = await confirm({ message: `Delete "${cv.title}" by ${cv.userName}? This is permanent.`, variant: "danger" });
    if (!ok) return;
    await fetch(`/api/cv/${cv.id}`, { method: "DELETE" });
    await loadCvs();
  };

  // ─── Template Actions ─────────────────────────────────────────────────────────
  const handleSaveTemplate = async (data: Partial<CvTemplateRecord> & { config: TemplateConfig }) => {
    if (editTemplate) {
      await fetch("/api/cv/admin/templates", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editTemplate.id, ...data }),
      });
    } else {
      await fetch("/api/cv/admin/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    }
    setShowTemplateForm(false);
    setEditTemplate(null);
    await loadTemplates();
  };

  const handleDeleteTemplate = async (t: CvTemplateRecord) => {
    const ok = await confirm({ message: `Delete template "${t.name}"?`, variant: "danger" });
    if (!ok) return;
    const res = await fetch(`/api/cv/admin/templates?id=${t.id}`, { method: "DELETE" });
    const result = await res.json();
    if (result.deactivated) {
      alert(`Template has ${result.draftCount} active CVs — it has been deactivated instead of deleted.`);
    }
    await loadTemplates();
  };

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-BD", { day: "2-digit", month: "short", year: "numeric" });
  }

  return (
    <AdminRoute>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#1f2937]">CV Manager</h1>
            <p className="text-[#6b7280] mt-1">Manage student CVs and CV templates</p>
          </div>
          {tab === "templates" && (
            <button
              onClick={() => { setEditTemplate(null); setShowTemplateForm(true); }}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1e3a5f] text-white font-bold text-sm rounded-xl hover:bg-[#2d5278] transition-all shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Add Template
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
          {([
            { key: "cvs", label: `Student CVs (${totalCvs})` },
            { key: "templates", label: `Templates (${templates.length})` },
          ] as { key: Tab; label: string }[]).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
                tab === key ? "bg-white text-[#1e3a5f] shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* ── STUDENT CVs TAB ── */}
        {tab === "cvs" && (
          <div className="space-y-4">
            {/* Search */}
            <div className="flex items-center gap-3">
              <div className="relative flex-1 max-w-sm">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
                <input
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  placeholder="Search by student name or CV title..."
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl bg-white text-sm focus:border-[#1e3a5f] focus:ring-1 focus:ring-[#1e3a5f] outline-none"
                />
              </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-600">
                  <thead className="bg-[#1e3a5f] text-white uppercase text-xs font-semibold">
                    <tr>
                      <th className="px-4 py-3 border border-[#2d5278]">Student</th>
                      <th className="px-4 py-3 border border-[#2d5278]">CV Title</th>
                      <th className="px-4 py-3 border border-[#2d5278] w-32">Template</th>
                      <th className="px-4 py-3 border border-[#2d5278] w-24 text-center">Downloads</th>
                      <th className="px-4 py-3 border border-[#2d5278] w-24 text-center">Public</th>
                      <th className="px-4 py-3 border border-[#2d5278] w-32">Updated</th>
                      <th className="px-4 py-3 border border-[#2d5278] text-right w-36">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {cvLoading ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-10 text-center text-gray-400">
                          <div className="flex items-center justify-center gap-2">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#1e3a5f]" />
                            Loading...
                          </div>
                        </td>
                      </tr>
                    ) : cvs.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-10 text-center text-gray-400">
                          No CVs found{search ? ` for "${search}"` : ""}.
                        </td>
                      </tr>
                    ) : (
                      cvs.map((cv, i) => (
                        <tr key={cv.id} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                          <td className="px-4 py-3 border border-gray-100">
                            <p className="font-semibold text-gray-900">{cv.userName}</p>
                            <p className="text-xs text-gray-500">{cv.userEmail}</p>
                          </td>
                          <td className="px-4 py-3 border border-gray-100 font-medium text-gray-900 max-w-[180px] truncate">
                            {cv.title}
                          </td>
                          <td className="px-4 py-3 border border-gray-100">
                            <span className="text-xs font-medium bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                              {cv.templateName}
                            </span>
                          </td>
                          <td className="px-4 py-3 border border-gray-100 text-center">
                            <span className="font-bold text-gray-700">{cv.downloadCount}</span>
                          </td>
                          <td className="px-4 py-3 border border-gray-100 text-center">
                            {cv.isPublic ? (
                              <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Yes</span>
                            ) : (
                              <span className="text-xs text-gray-400">No</span>
                            )}
                          </td>
                          <td className="px-4 py-3 border border-gray-100 text-xs text-gray-500">
                            {formatDate(cv.updatedAt)}
                          </td>
                          <td className="px-4 py-3 border border-gray-100 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Link
                                href={`/student-dashboard/cv/${cv.id}/edit?from=admin`}
                                className="px-3 py-1.5 text-xs font-semibold border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                              >
                                Edit
                              </Link>
                              {cv.isPublic && cv.shareSlug && (
                                <Link
                                  href={`/cv/${cv.shareSlug}`}
                                  target="_blank"
                                  className="px-3 py-1.5 text-xs font-semibold border border-blue-200 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
                                >
                                  View
                                </Link>
                              )}
                              <button
                                onClick={() => handleDeleteCv(cv)}
                                className="px-3 py-1.5 text-xs font-semibold border border-red-100 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between text-sm">
                  <p className="text-gray-500">Page {page} of {totalPages}</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="px-3 py-1.5 text-xs font-semibold border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50"
                    >
                      Prev
                    </button>
                    <button
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="px-3 py-1.5 text-xs font-semibold border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── TEMPLATES TAB ── */}
        {tab === "templates" && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-[#1e3a5f] text-white uppercase text-xs font-semibold">
                  <tr>
                    <th className="px-4 py-3 border border-[#2d5278]">Thumbnail</th>
                    <th className="px-4 py-3 border border-[#2d5278]">Name</th>
                    <th className="px-4 py-3 border border-[#2d5278]">Slug</th>
                    <th className="px-4 py-3 border border-[#2d5278]">Description</th>
                    <th className="px-4 py-3 border border-[#2d5278] w-24 text-center">Status</th>
                    <th className="px-4 py-3 border border-[#2d5278] text-right w-36">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {templatesLoading ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-10 text-center text-gray-400">
                        Loading templates...
                      </td>
                    </tr>
                  ) : templates.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-10 text-center text-gray-400">
                        No templates yet. Click &quot;Add Template&quot; to add the first one.
                      </td>
                    </tr>
                  ) : (
                    templates.map((t, i) => (
                      <tr key={t.id} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                        <td className="px-4 py-3 border border-gray-100 w-16">
                          {t.thumbnail ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={t.thumbnail} alt={t.name} className="w-12 h-12 object-cover rounded-lg border border-gray-200" />
                          ) : (
                            <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 text-xs">No img</div>
                          )}
                        </td>
                        <td className="px-4 py-3 border border-gray-100 font-semibold text-gray-900">{t.name}</td>
                        <td className="px-4 py-3 border border-gray-100 font-mono text-xs text-gray-500">{t.slug}</td>
                        <td className="px-4 py-3 border border-gray-100 text-gray-500 max-w-[200px] truncate">{t.description ?? "—"}</td>
                        <td className="px-4 py-3 border border-gray-100 text-center">
                          {t.isActive ? (
                            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Active</span>
                          ) : (
                            <span className="text-xs font-semibold text-red-500 bg-red-50 px-2 py-0.5 rounded-full">Inactive</span>
                          )}
                        </td>
                        <td className="px-4 py-3 border border-gray-100 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => { setEditTemplate(t); setShowTemplateForm(true); }}
                              className="px-3 py-1.5 text-xs font-semibold border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteTemplate(t)}
                              className="px-3 py-1.5 text-xs font-semibold border border-red-100 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Template modal */}
      {showTemplateForm && (
        <TemplateModal
          initial={editTemplate}
          onSave={handleSaveTemplate}
          onCancel={() => { setShowTemplateForm(false); setEditTemplate(null); }}
        />
      )}
    </AdminRoute>
  );
}
