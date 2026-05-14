"use client";

import React, { useState, useEffect, useCallback } from "react";

import Script from "next/script";
import "./tracker.css";

function getTodayDateString() {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
}

export default function TrackerDashboardPage() {
    // ── Toasts ──────────────────────────────────────────────
    const [toasts, setToasts] = useState<{ id: number; message: string; type: string }[]>([]);
    const showToast = (message: string, type = "success") => {
        const id = Date.now() + Math.random();
        setToasts((prev) => [...prev, { id, message, type }]);
        setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3300);
    };

    // ── Dashboard filter state ───────────────────────────────
    const [dashDate, setDashDate] = useState(() => getTodayDateString());
    const [dashBatch, setDashBatch] = useState("");
    const [dashLoading, setDashLoading] = useState(false);
    const [dashReports, setDashReports] = useState<any[]>([]);
    const [dashEmptyMessage, setDashEmptyMessage] = useState("");
    const [availableBatches, setAvailableBatches] = useState<string[]>([]);
    const [batchesLoading, setBatchesLoading] = useState(true);

    // ── Share link ───────────────────────────────────────────
    const [copied, setCopied] = useState(false);
    const trackerFormUrl =
        typeof window !== "undefined"
            ? `${window.location.origin}/daily-tracker`
            : "/daily-tracker";

    const handleCopy = () => {
        navigator.clipboard.writeText(trackerFormUrl).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    // ── Export state ─────────────────────────────────────────
    const [exportPeriod, setExportPeriod] = useState("weekly");
    const [exportFrom, setExportFrom] = useState("");
    const [exportTo, setExportTo] = useState("");
    const [exportBatch, setExportBatch] = useState("");
    const [isExporting, setIsExporting] = useState(false);

    // ── Load unique batches from API ────────────────────
    useEffect(() => {
        const loadBatches = async () => {
            setBatchesLoading(true);
            try {
                const res = await fetch("/api/tracker");
                const data = await res.json();
                if (data.success) {
                    setAvailableBatches(data.batches);
                    if (data.batches.length > 0) {
                        setDashBatch(data.batches[0]);
                        setExportBatch(data.batches[0]);
                    }
                }
            } catch (err) {
                console.error("Failed to load batches:", err);
            } finally {
                setBatchesLoading(false);
            }
        };
        loadBatches();
    }, []);

    // ── Load dashboard data (via API) ────────────────
    const loadDashboardData = useCallback(async (date: string, batch: string) => {
        if (!date || !batch) return;
        setDashLoading(true);
        setDashEmptyMessage("");
        setDashReports([]);
        try {
            const res = await fetch("/api/tracker", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "getDashboardData",
                    payload: { date, batch }
                })
            });
            const data = await res.json();
            if (data.success) {
                if (data.reports.length > 0) {
                    setDashReports(data.reports);
                } else {
                    setDashEmptyMessage(`"${batch}" ব্যাচে ${date} তারিখে কোনো রিপোর্ট জমা হয়নি।`);
                }
            } else {
                setDashEmptyMessage(`⚠️ সার্ভার এরর: ${data.message || "সংযোগ সমস্যা।"}`);
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "সংযোগ সমস্যা।";
            setDashEmptyMessage(`⚠️ সংযোগ ব্যর্থ: ${errorMessage}`);
        } finally {
            setDashLoading(false);
        }
    }, []);

    useEffect(() => {
        if (dashBatch) loadDashboardData(dashDate, dashBatch);
    }, [dashBatch, dashDate, loadDashboardData]);


    // ── Export handler (via API) ─────────────────────
    const handleExportDownload = async () => {
        if (!exportBatch) { showToast("❗ ব্যাচ সিলেক্ট করুন।", "error"); return; }

        let fromDateStr = "";
        let toDateStr = "";
        const today = new Date();
        const formatIso = (d: Date) =>
            `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

        if (exportPeriod === "weekly") {
            const weekAgo = new Date(today); weekAgo.setDate(today.getDate() - 6);
            fromDateStr = formatIso(weekAgo); toDateStr = formatIso(today);
        } else if (exportPeriod === "monthly") {
            const monthAgo = new Date(today); monthAgo.setDate(today.getDate() - 29);
            fromDateStr = formatIso(monthAgo); toDateStr = formatIso(today);
        } else {
            fromDateStr = exportFrom; toDateStr = exportTo;
            if (!fromDateStr || !toDateStr) { showToast("❗ শুরু ও শেষ তারিখ দিন।", "error"); return; }
            if (fromDateStr > toDateStr) { showToast("❗ শুরুর তারিখ শেষের আগে হতে হবে।", "error"); return; }
        }

        setIsExporting(true);
        try {
            const res = await fetch("/api/tracker", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "getExportData",
                    payload: { batch: exportBatch, from: fromDateStr, to: toDateStr }
                })
            });
            const data = await res.json();
            
            if (!data.success || !data.rows || data.rows.length === 0) {
                showToast(data.message || "📭 এই সময়কালে কোনো ডেটা পাওয়া পাওয়া যায়নি।", "error");
                return;
            }

            const xlsx = (window as any).XLSX;
            if (!xlsx) { showToast("❌ Excel library not loaded. Please try again.", "error"); return; }

            const wsData = [data.headers, ...data.rows];
            const ws = xlsx.utils.aoa_to_sheet(wsData);
            const wb = xlsx.utils.book_new();
            xlsx.utils.book_append_sheet(wb, ws, exportBatch);

            // Column width adjustment
            const colWidths = data.headers.map((h: any, ci: number) => {
                let maxLen = String(h).length;
                data.rows.forEach((r: any) => { const l = String(r[ci] || "").length; if (l > maxLen) maxLen = l; });
                return { wch: Math.min(maxLen + 2, 40) };
            });
            ws["!cols"] = colWidths;

            const fileName = `${exportBatch.replace(/\s+/g, "_")}_${fromDateStr}_to_${toDateStr}.xlsx`;
            xlsx.writeFile(wb, fileName);
            showToast(`✅ ${data.rows.length} টি রিপোর্ট ডাউনলোড হয়েছে!`, "success");
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "সংযোগ সমস্যা।";
            showToast(`❌ ডাউনলোড ব্যর্থ: ${errorMessage}`, "error");
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="space-y-6 pb-10">
            <Script src="https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js" strategy="lazyOnload" />

            {/* ── Page Header ── */}
            <div className="flex items-center gap-3">
                <div className="w-1 h-10 bg-[#059669] rounded-full" />
                <div>
                    <h1 className="text-3xl font-bold text-[#1f2937]">Daily Discipline Tracker</h1>
                    <p className="text-[#6b7280] mt-1">View and export student discipline reports</p>
                </div>
            </div>

            {/* ── Form Link Info Box ── */}
            <div className="bg-[#d1fae5] border-l-4 border-[#059669] p-4 rounded-lg">
                <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-[#059669] mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <div className="flex-1">
                        <p className="text-[#059669] font-semibold mb-1">Daily Discipline Tracker Form Link:</p>
                        <p className="text-[#047857] text-sm mb-2">Share this link with Captains to collect daily tracker lists</p>
                        <div className="flex items-center gap-2">
                            <input
                                type="text"
                                readOnly
                                value={trackerFormUrl}
                                className="flex-1 px-3 py-2 bg-white border border-[#059669] rounded text-sm text-[#1f2937]"
                            />
                            <button
                                onClick={handleCopy}
                                className={`px-4 py-2 text-white text-sm font-medium rounded transition-colors ${copied ? "bg-[#047857]" : "bg-[#059669] hover:bg-[#10b981]"}`}
                            >
                                {copied ? "✅ Copied!" : "📋 Copy"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Dashboard Section ── */}
            <div id="tracker-app" style={{
                background: '#f0f2ff',
                borderRadius: '14px',
                padding: '24px',
                fontFamily: "'Hind Siliguri', 'Inter', sans-serif"
            }}>

                {/* Dashboard Header */}
                <div className="dashboard-header">
                    <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#3730a3', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        📊 রিপোর্ট ড্যাশবোর্ড
                    </h2>
                </div>

                {/* Date + Batch Filter Bar */}
                <div className="date-range-bar" style={{ display: 'block', padding: '18px 20px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                        <div className="date-range-group">
                            <label htmlFor="dash-date">তারিখ বেছে নিন</label>
                            <input
                                id="dash-date"
                                type="date"
                                className="date-range-input"
                                value={dashDate}
                                onChange={(e) => setDashDate(e.target.value)}
                            />
                        </div>
                        <div className="date-range-group">
                            <label htmlFor="dash-batch">ব্যাচ নাম্বার</label>
                            <select
                                id="dash-batch"
                                className="batch-select"
                                value={dashBatch}
                                onChange={(e) => setDashBatch(e.target.value)}
                                disabled={batchesLoading}
                            >
                                {batchesLoading ? (
                                    <option value="">লোড হচ্ছে...</option>
                                ) : availableBatches.length === 0 ? (
                                    <option value="">কোনো ডেটা নেই</option>
                                ) : (
                                    availableBatches.map(b => (
                                        <option key={b} value={b}>{b}</option>
                                    ))
                                )}
                            </select>
                        </div>
                    </div>
                    <button
                        className="date-range-btn"
                        style={{ width: '100%', justifyContent: 'center', borderRadius: '100px' }}
                        onClick={() => loadDashboardData(dashDate, dashBatch)}
                    >
                        <span className="btn-dot" />
                        দেখান
                    </button>
                </div>

                {/* Loading */}
                {dashLoading && (
                    <div style={{ textAlign: "center", padding: "48px" }}>
                        <span
                            className="spinner"
                            style={{ borderColor: "rgba(79,70,229,0.3)", borderTopColor: "#4f46e5", width: "36px", height: "36px", borderWidth: "4px" }}
                        />
                        <p style={{ marginTop: "12px", color: "#64748b" }}>ডেটা লোড হচ্ছে...</p>
                    </div>
                )}

                {/* Reports */}
                {!dashLoading && (
                    <div id="dashboard-content">
                        {dashEmptyMessage ? (
                            <div className="empty-state">
                                <div className="empty-icon">📭</div>
                                <p>{dashEmptyMessage}</p>
                            </div>
                        ) : (
                            <div id="report-list">
                                {dashReports.map((report, rIdx) => (
                                    <div key={rIdx} className="report-card">
                                        <div className="report-card-header">
                                            <span className="report-captain">👤 {report.captain}</span>
                                            <div className="report-card-meta">
                                                <span className="report-batch-badge">{dashBatch}</span>
                                                <span className="report-date-badge">{dashDate}</span>
                                            </div>
                                        </div>
                                        <div className="report-items-list">
                                            {report.items.map((item: any, iIdx: number) => {
                                                const isYes = item.status === "হ্যাঁ";
                                                const isNo = item.status === "না";
                                                return (
                                                    <div key={iIdx} className={`report-item${isNo ? " report-item-no" : ""}`}>
                                                        <span className="report-item-num">{item.number}</span>
                                                        <div className="report-item-body">
                                                            <div className="report-item-label">{item.label}</div>
                                                            {isNo && item.reason && (
                                                                <div className="report-reason">💬 {item.reason}</div>
                                                            )}
                                                        </div>
                                                        <div className="report-item-status">
                                                            {isYes && <span className="badge-yes">✓ হ্যাঁ</span>}
                                                            {isNo && <span className="badge-no">X না</span>}
                                                            {!isYes && !isNo && <span className="badge-na">—</span>}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Export Section */}
                <div className="export-section" style={{ padding: '22px 22px', marginTop: '20px' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#3730a3', marginBottom: '16px', paddingBottom: '10px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '8px' }}>📥 রিপোর্ট ডাউনলোড</h3>
                    <div className="export-controls">
                        <div className="export-field">
                            <label htmlFor="export-period">সময়কাল</label>
                            <select
                                id="export-period"
                                className="batch-select"
                                value={exportPeriod}
                                onChange={(e) => setExportPeriod(e.target.value)}
                            >
                                <option value="weekly">সাপ্তাহিক (গত ৭ দিন)</option>
                                <option value="monthly">মাসিক (গত ৩০ দিন)</option>
                                <option value="custom">কাস্টম তারিখ</option>
                            </select>
                        </div>

                        {exportPeriod === "custom" && (
                            <div className="custom-dates-row">
                                <div className="export-field">
                                    <label htmlFor="export-from">শুরুর তারিখ</label>
                                    <input
                                        id="export-from"
                                        type="date"
                                        className="date-range-input"
                                        value={exportFrom}
                                        onChange={(e) => setExportFrom(e.target.value)}
                                    />
                                </div>
                                <div className="export-field">
                                    <label htmlFor="export-to">শেষ তারিখ</label>
                                    <input
                                        id="export-to"
                                        type="date"
                                        className="date-range-input"
                                        value={exportTo}
                                        onChange={(e) => setExportTo(e.target.value)}
                                    />
                                </div>
                            </div>
                        )}

                        <div className="export-field">
                            <label htmlFor="export-batch">ব্যাচ নাম্বার</label>
                            <select
                                id="export-batch"
                                className="batch-select"
                                value={exportBatch}
                                onChange={(e) => setExportBatch(e.target.value)}
                                disabled={batchesLoading}
                            >
                                {batchesLoading ? (
                                    <option value="">লোড হচ্ছে...</option>
                                ) : availableBatches.length === 0 ? (
                                    <option value="">কোনো ডেটা নেই</option>
                                ) : (
                                    availableBatches.map(b => (
                                        <option key={b} value={b}>{b}</option>
                                    ))
                                )}
                            </select>
                        </div>

                        <button className="export-btn" onClick={handleExportDownload} disabled={isExporting}>
                            {isExporting ? (
                                <>
                                    <span className="spinner" style={{ borderColor: "rgba(255,255,255,0.4)", borderTopColor: "#fff" }} />
                                    ডাউনলোড হচ্ছে...
                                </>
                            ) : (
                                "📥 এক্সেল ডাউনলোড"
                            )}
                        </button>
                    </div>
                </div>

            </div>

            {/* Toasts */}
            <div className="toast-container fixed bottom-6 left-1/2 transform -translate-x-1/2 flex flex-col items-center gap-2 z-[9999] pointer-events-none">
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        className={`toast ${toast.type === "success" ? "success" : "error"}`}
                    >
                        {toast.message}
                    </div>
                ))}
            </div>
        </div>
    );
}
