"use client";

import React, { useState, useEffect } from "react";
import "../dashboard/tracker/tracker.css";

// Local type matching the API response
interface BatchMetadata {
    name: string;
    status: string;
}

/**
 * Checklist items for the Daily Discipline Tracker
 */
const CHECKLIST_ITEMS = [
    "ক্লাস শুরুর ১০মিনিট আগে সবাই উপস্থিত ছিল?",
    "স্টুডেন্টদের ড্রেস কোড ঠিক ছিল?",
    "অ্যাসাইনমেন্ট কমপ্লিট করেছে সবাই?",
    "কেউ স্কীলের ডিসিপ্লিন ও নিয়মকানুন ব্রেক করেছে?",
    "খাবারের সময়সূচি অনুযায়ী সবাই খেয়েছে?",
    "সবাই যথাযথ খাবার পেয়েছে?",
    "কেউ খাবার নষ্ট বা অপচয় করেছে?",
    "আমিরদের কথা সবাই মেনেছে?",
    "রাতে ঘুমানোর সময় কেও অনুপস্থিত ছিল?",
    "উচ্চ শব্দ, আড্ডা, বিশৃঙ্খলা, দীর্ঘক্ষণ ফোন চালানো সংক্রান্ত কোন সমস্যা হয়েছে?",
    "নামাজের জামাতে সবাই উপস্থিত ছিল?",
    "ফজরের পরে সবাই কুর-আন ক্লাসে উপস্থিত ছিল?",
    "দাওয়াহ ক্লাসে সবাই উপস্থিত ছিল?",
    "আসরের পরে নসিহা এবং মাগরিবের পরে আজকারে সবাই উপস্থিত ছিল? যদি কেও না থাকে তার নাম লিখুন।"
];

// Items where "হ্যাঁ" (Yes) is the "problem" state requiring a reason
const INVERTED_ITEMS = new Set([3, 6, 8, 9]);

function triggerValue(idx: number) {
    return INVERTED_ITEMS.has(idx) ? "হ্যাঁ" : "না";
}

function getTodayDateString() {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
}

/**
 * Complete Rewrite: Daily Discipline Tracker Form
 * Strict Client Component - No Async main function - Robust Filtering
 */
export default function DailyTrackerFormPage() {
    // ─── 1. State Setup ───
    const [toasts, setToasts] = useState<{ id: number; message: string; type: string }[]>([]);
    const [captainName, setCaptainName] = useState("");
    const [batchNumber, setBatchNumber] = useState("");
    const [reportDate, setReportDate] = useState(getTodayDateString());
    
    // Batch data states
    const [runningBatches, setRunningBatches] = useState<BatchMetadata[]>([]);
    const [isLoadingBatches, setIsLoadingBatches] = useState(true);
    const [fetchError, setFetchError] = useState(false);

    // Checklist answer states
    type AnswerState = { status: "হ্যাঁ" | "না" | null; reason: string };
    const [answers, setAnswers] = useState<AnswerState[]>(
        CHECKLIST_ITEMS.map(() => ({ status: null, reason: "" }))
    );
    const [isSubmitting, setIsSubmitting] = useState(false);

    // ─── 2. Data Fetching & Filtering (via server-side API proxy) ───
    useEffect(() => {
        const fetchBatches = async () => {
            setIsLoadingBatches(true);
            setFetchError(false);
            try {
                // Fetch batch metadata via the secure API proxy
                const res = await fetch("/api/auth/batches?mode=raw");
                if (!res.ok) throw new Error("Failed to fetch batches");
                const data = await res.json();
                const fetchedBatches: BatchMetadata[] = data.batches || [];
                
                // CRITICAL - Robust Broad Filter to catch all active variations
                const activeBatches = fetchedBatches.filter((batch) => {
                    const status = String(batch.status || '').trim().toLowerCase();
                    // Catch: "running", "active", or explicitly not completed
                    return status === 'running' || status === 'active';
                });

                // Sort alphabetically by name
                activeBatches.sort((a, b) => a.name.localeCompare(b.name));

                setRunningBatches(activeBatches);
                
                if (activeBatches.length === 0) {
                    console.warn("Daily Tracker: No active batches found after broad filtering.", fetchedBatches);
                }
            } catch (error) {
                console.error("Daily Tracker: Fetch error:", error);
                setFetchError(true);
                showToast("❗ ব্যাচ তালিকা লোড করতে ব্যর্থ হয়েছে।", "error");
            } finally {
                setIsLoadingBatches(false);
            }
        };

        fetchBatches();
    }, []);

    // ─── 3. Handlers ───
    const showToast = (message: string, type = "success") => {
        const id = Date.now() + Math.random();
        setToasts((prev) => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 3300);
    };

    const resetForm = () => {
        setCaptainName("");
        setBatchNumber("");
        setReportDate(getTodayDateString());
        setAnswers(CHECKLIST_ITEMS.map(() => ({ status: null, reason: "" })));
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const handleToggle = (idx: number, value: "হ্যাঁ" | "না") => {
        setAnswers((prev) => {
            const copy = [...prev];
            copy[idx] = { ...copy[idx], status: value };
            if (value !== triggerValue(idx)) {
                copy[idx].reason = "";
            }
            return copy;
        });
    };

    const handleSubmit = async () => {
        if (!captainName.trim()) {
            showToast("❗ অনুগ্রহ করে ব্যাচ ক্যাপ্টেনের নাম লিখুন।", "error");
            return;
        }
        if (!batchNumber) {
            showToast("❗ অনুগ্রহ করে ব্যাচ নাম্বার সিলেক্ট করুন।", "error");
            return;
        }
        if (!reportDate) {
            showToast("❗ অনুগ্রহ করে তারিখ নির্বাচন করুন।", "error");
            return;
        }

        let firstUnanswered = -1;
        let score = 0;
        for (let i = 0; i < CHECKLIST_ITEMS.length; i++) {
            if (!answers[i].status) {
                if (firstUnanswered === -1) firstUnanswered = i;
            } else {
                if (answers[i].status !== triggerValue(i)) {
                    score += 1;
                }
            }

            if (answers[i].status === triggerValue(i) && !answers[i].reason.trim()) {
                showToast(`❗ প্রশ্ন ${i + 1}-এর জন্য কারণ লিখুন।`, "error");
                document.getElementById(`reason-${i}`)?.focus();
                return;
            }
        }

        if (firstUnanswered !== -1) {
            showToast(`❗ প্রশ্ন ${firstUnanswered + 1}-এর উত্তর দিন।`, "error");
            document.getElementById(`item-${firstUnanswered}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
            return;
        }

        const payload = {
            date: reportDate,
            studentName: captainName.trim(), 
            batchName: batchNumber,          
            tasks: answers.map((a, i) => ({ 
                question: CHECKLIST_ITEMS[i],
                status: a.status, 
                reason: a.reason.trim() 
            })),
            score: Math.round((score / CHECKLIST_ITEMS.length) * 100), 
        };

        setIsSubmitting(true);
        try {
            const res = await fetch("/api/tracker", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            const result = await res.json();
            if (res.ok && result.success) {
                showToast("✅ রিপোর্ট সফলভাবে জমা হয়েছে।", "success");
                resetForm();
            } else {
                showToast(`❌ Error: ${result.error || result.message || "Submission failed"}`, "error");
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "পরিষেবা সমস্যা।";
            showToast(`❌ সমস্যা: ${errorMessage}`, "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    // ─── 4. Render ───
    return (
        <div className="tracker-page-root">
            {/* App Header */}
            <header className="app-header">
                <div className="app-title">📋 ব্যাচ ডিসিপ্লিন ট্র্যাকার</div>
                <div className="app-subtitle">Daily Discipline Tracker</div>
            </header>

            {/* Main Content */}
            <main className="tracker-view-wrap">

                {/* Captain Info Card */}
                <div className="form-card" style={{ marginTop: "20px" }}>
                    <h2>🧑‍✈️ ক্যাপ্টেনের তথ্য</h2>

                    <div className="field-group">
                        <label htmlFor="captain-name">ব্যাচ ক্যাপ্টেনের নাম</label>
                        <input
                            type="text"
                            id="captain-name"
                            value={captainName}
                            onChange={(e) => setCaptainName(e.target.value)}
                            placeholder="আপনার পুরো নাম লিখুন"
                            autoComplete="name"
                            required
                        />
                    </div>

                    <div className="field-group">
                        <label htmlFor="batch-number">ব্যাচ নাম্বার</label>
                        <select
                            id="batch-number"
                            value={batchNumber}
                            onChange={(e) => setBatchNumber(e.target.value)}
                            required
                            disabled={isLoadingBatches}
                        >
                            {isLoadingBatches ? (
                                <option value="" disabled>লোড হচ্ছে (Loading batches)...</option>
                            ) : runningBatches.length === 0 ? (
                                <option value="" disabled>কোনো রানিং ব্যাচ পাওয়া যায়নি</option>
                            ) : (
                                <>
                                    <option value="" disabled>ব্যাচ সিলেক্ট করুন</option>
                                    {runningBatches.map(batch => (
                                        <option key={batch.name} value={batch.name}>{batch.name}</option>
                                    ))}
                                </>
                            )}
                        </select>
                        {!isLoadingBatches && runningBatches.length === 0 && !fetchError && (
                            <p className="hint-text">Note: Admin has not marked any batches as "Running" yet.</p>
                        )}
                    </div>

                    <div className="field-group">
                        <label htmlFor="report-date">রিপোর্টের তারিখ</label>
                        <input
                            type="date"
                            id="report-date"
                            value={reportDate}
                            onChange={(e) => setReportDate(e.target.value)}
                            required
                        />
                    </div>
                </div>

                {/* Checklist Card */}
                <div className="form-card">
                    <h2>✅ দৈনিক চেকলিস্ট</h2>

                    <p style={{ fontSize: "0.88rem", color: "#64748b", marginBottom: "14px", lineHeight: "1.5" }}>
                        For each item, select <strong style={{ color: "#16a34a" }}>হ্যাঁ (Yes)</strong> or <strong style={{ color: "#dc2626" }}>না (No)</strong>. 
                        If a specific state requires explanation, a reason box will appear.
                    </p>

                    <div id="checklist-container">
                        {CHECKLIST_ITEMS.map((label, idx) => {
                            const answer = answers[idx];
                            const isYes = answer.status === "হ্যাঁ";
                            const isNo = answer.status === "না";
                            const showReason = answer.status === triggerValue(idx);

                            let itemClass = "checklist-item";
                            if (isYes) itemClass += " answered-yes";
                            if (isNo) itemClass += " answered-no";

                            return (
                                <div key={idx} id={`item-${idx}`} className={itemClass}>
                                    <div className="item-top">
                                        <span className="item-number">{idx + 1}</span>
                                        <span className="item-label">{label}</span>
                                        <div className="toggle-btns">
                                            <button
                                                className={`toggle-btn yes-btn${isYes ? " active" : ""}`}
                                                type="button"
                                                onClick={() => handleToggle(idx, "হ্যাঁ")}
                                            >
                                                ✓ হ্যাঁ
                                            </button>
                                            <button
                                                className={`toggle-btn no-btn${isNo ? " active" : ""}`}
                                                type="button"
                                                onClick={() => handleToggle(idx, "না")}
                                            >
                                                ✗ না
                                            </button>
                                        </div>
                                    </div>

                                    <div className={`reason-wrapper${showReason ? " visible" : ""}`}>
                                        <label className="reason-label" htmlFor={`reason-${idx}`}>
                                            ⚠️ কারণ লিখুন
                                        </label>
                                        <textarea
                                            className="reason-input"
                                            id={`reason-${idx}`}
                                            rows={3}
                                            placeholder="বিস্তারিত লিখুন..."
                                            value={answer.reason}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                setAnswers((prev) => {
                                                    const copy = [...prev];
                                                    copy[idx] = { ...copy[idx], reason: val };
                                                    return copy;
                                                });
                                            }}
                                            required={showReason}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Submit Button */}
                <button
                    className="submit-btn"
                    type="button"
                    onClick={handleSubmit}
                    disabled={isSubmitting || isLoadingBatches}
                >
                    {isSubmitting ? (
                        <>
                            <span className="spinner"></span>
                            জমা হচ্ছে...
                        </>
                    ) : (
                        "📤 রিপোর্ট জমা দিন"
                    )}
                </button>

                <div style={{ height: "32px" }} />
            </main>

            {/* Toasts */}
            <div className="toast-container">
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        className={`toast ${toast.type === "success" ? "success" : "error"}`}
                    >
                        {toast.message}
                    </div>
                ))}
            </div>

            <style jsx>{`
                .hint-text {
                    color: #64748b;
                    font-size: 0.75rem;
                    margin-top: 0.25rem;
                    font-style: italic;
                }
                .spinner {
                    display: inline-block;
                    width: 1rem;
                    height: 1rem;
                    border: 2px solid rgba(255,255,255,0.3);
                    border-radius: 50%;
                    border-top-color: #fff;
                    animation: spin 1s ease-in-out infinite;
                    margin-right: 0.5rem;
                }
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}
