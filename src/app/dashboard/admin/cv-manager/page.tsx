"use client";

import { useState, useEffect, useCallback } from "react";
import AdminRoute from "@/components/auth/AdminRoute";
import type { AdminCvListItem, CvTemplateRecord } from "@/lib/cv/types";
import { useConfirm } from "@/contexts/ConfirmContext";
import Link from "next/link";

type Tab = "cvs" | "templates";

// ─── Template Form Modal ──────────────────────────────────────────────────────
function TemplateModal({
  initial,
  onSave,
  onCancel,
}: {
  initial?: CvTemplateRecord | null;
  onSave: (data: Partial<CvTemplateRecord>) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    name: initial?.name ?? "",
    slug: initial?.slug ?? "",
    description: initial?.description ?? "",
    thumbnail: initial?.thumbnail ?? "",
    isActive: initial?.isActive ?? true,
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onCancel}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-gray-900 mb-4">
          {initial ? "Edit Template" : "Add New Template"}
        </h3>
        <div className="space-y-4">
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
            <label className="block text-sm font-semibold text-gray-700 mb-1">Slug * <span className="text-gray-400 font-normal">(unique identifier)</span></label>
            <input
              className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#1e3a5f] focus:outline-none font-mono"
              placeholder="e.g. classic-two-column"
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/\s+/g, "-") })}
            />
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
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Thumbnail URL <span className="text-gray-400 font-normal">(optional)</span></label>
            <input
              className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#1e3a5f] focus:outline-none"
              placeholder="/cv-templates/classic-two-column.png"
              value={form.thumbnail}
              onChange={(e) => setForm({ ...form, thumbnail: e.target.value })}
            />
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
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onCancel} className="px-5 py-2.5 text-sm font-semibold text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors">
            Cancel
          </button>
          <button
            onClick={() => onSave(form)}
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
  const handleSaveTemplate = async (data: Partial<CvTemplateRecord>) => {
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
                                href={`/student-dashboard/cv/${cv.id}/edit`}
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
                      <td colSpan={5} className="px-4 py-10 text-center text-gray-400">
                        Loading templates...
                      </td>
                    </tr>
                  ) : templates.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-10 text-center text-gray-400">
                        No templates yet. Click &quot;Add Template&quot; to add the first one.
                      </td>
                    </tr>
                  ) : (
                    templates.map((t, i) => (
                      <tr key={t.id} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                        <td className="px-4 py-3 border border-gray-100 font-semibold text-gray-900">{t.name}</td>
                        <td className="px-4 py-3 border border-gray-100 font-mono text-xs text-gray-500">{t.slug}</td>
                        <td className="px-4 py-3 border border-gray-100 text-gray-500 max-w-[220px] truncate">{t.description ?? "—"}</td>
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
