"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { CvDraftSummary } from "@/lib/cv/types";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-BD", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-20 h-20 rounded-2xl bg-[#1e3a5f]/10 flex items-center justify-center mb-5">
        <svg className="w-10 h-10 text-[#1e3a5f]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>
      </div>
      <h3 className="text-xl font-bold text-gray-800 mb-2">No CVs yet</h3>
      <p className="text-gray-500 text-sm mb-6 max-w-xs">
        Create your first professional CV. It takes less than 5 minutes.
      </p>
      <Link
        href="/student-dashboard/cv/new"
        className="inline-flex items-center gap-2 px-6 py-3 bg-[#1e3a5f] text-white font-bold rounded-xl hover:bg-[#2d5278] transition-all shadow-md"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
        Create New CV
      </Link>
    </div>
  );
}

export default function MyCVsPage() {
  const router = useRouter();
  const [drafts, setDrafts] = useState<CvDraftSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [copyMsg, setCopyMsg] = useState<string | null>(null);

  const loadDrafts = useCallback(async () => {
    try {
      const res = await fetch("/api/cv");
      if (res.ok) setDrafts(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadDrafts(); }, [loadDrafts]);

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    setDeleting(id);
    try {
      await fetch(`/api/cv/${id}`, { method: "DELETE" });
      setDrafts((prev) => prev.filter((d) => d.id !== id));
    } finally {
      setDeleting(null);
    }
  };

  const handleCopyLink = async (shareSlug: string) => {
    const url = `${window.location.origin}/cv/${shareSlug}`;
    await navigator.clipboard.writeText(url);
    setCopyMsg(shareSlug);
    setTimeout(() => setCopyMsg(null), 2000);
  };

  const handleToggleShare = async (draft: CvDraftSummary) => {
    if (draft.isPublic) {
      await fetch(`/api/cv/${draft.id}/share`, { method: "DELETE" });
      setDrafts((prev) =>
        prev.map((d) => (d.id === draft.id ? { ...d, isPublic: false } : d))
      );
    } else {
      const res = await fetch(`/api/cv/${draft.id}/share`, { method: "POST" });
      if (res.ok) {
        const { shareSlug } = await res.json();
        setDrafts((prev) =>
          prev.map((d) => (d.id === draft.id ? { ...d, isPublic: true, shareSlug } : d))
        );
      }
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-1 h-10 bg-[#1e3a5f] rounded-full" />
          <div>
            <h1 className="text-3xl font-bold text-[#1f2937]">My CVs</h1>
            <p className="text-[#6b7280] mt-0.5">Create, manage, and download your professional CVs.</p>
          </div>
        </div>
        <Link
          href="/student-dashboard/cv/new"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1e3a5f] text-white font-bold text-sm rounded-xl hover:bg-[#2d5278] transition-all shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          New CV
        </Link>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="animate-spin rounded-full h-9 w-9 border-b-2 border-[#1e3a5f]" />
        </div>
      ) : drafts.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {drafts.map((draft) => (
            <div
              key={draft.id}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden group"
            >
              {/* Card header */}
              <div className="bg-gradient-to-br from-[#1e3a5f] to-[#2d5278] p-5 relative">
                <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center mb-3">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                </div>
                <h3 className="font-bold text-white text-lg leading-tight truncate pr-6">{draft.title}</h3>
                <p className="text-blue-200 text-xs mt-1">{draft.templateName}</p>
                {/* Public badge */}
                {draft.isPublic && (
                  <span className="absolute top-4 right-4 text-xs font-semibold bg-emerald-400/20 text-emerald-200 border border-emerald-400/30 px-2 py-0.5 rounded-full">
                    Public
                  </span>
                )}
              </div>

              {/* Card body */}
              <div className="p-4 space-y-3">
                {/* Stats row */}
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                    </svg>
                    {draft.downloadCount} downloads
                  </span>
                  <span>Updated {formatDate(draft.updatedAt)}</span>
                </div>

                {/* Share link */}
                {draft.isPublic && draft.shareSlug && (
                  <button
                    onClick={() => handleCopyLink(draft.shareSlug!)}
                    className="w-full flex items-center gap-2 px-3 py-2 bg-emerald-50 border border-emerald-100 rounded-lg text-xs text-emerald-700 font-medium hover:bg-emerald-100 transition-colors"
                  >
                    <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
                    </svg>
                    {copyMsg === draft.shareSlug ? "Copied!" : "Copy public link"}
                  </button>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => router.push(`/student-dashboard/cv/${draft.id}/edit`)}
                    className="flex-1 py-2 text-sm font-bold text-white bg-[#1e3a5f] rounded-xl hover:bg-[#2d5278] transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleToggleShare(draft)}
                    title={draft.isPublic ? "Disable public link" : "Create public link"}
                    className={`p-2 rounded-xl border transition-colors ${
                      draft.isPublic
                        ? "border-emerald-200 bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                        : "border-gray-200 bg-gray-50 text-gray-500 hover:bg-gray-100"
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDelete(draft.id, draft.title)}
                    disabled={deleting === draft.id}
                    className="p-2 rounded-xl border border-red-100 bg-red-50 text-red-500 hover:bg-red-100 transition-colors disabled:opacity-50"
                  >
                    {deleting === draft.id ? (
                      <div className="w-4 h-4 animate-spin rounded-full border-b-2 border-red-500" />
                    ) : (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
