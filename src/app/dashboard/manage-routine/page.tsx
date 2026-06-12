"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Card, { CardBody } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { getBatches } from "@/services/scheduleService";
import { getRoutinesByBatch, syncBatchRoutines, BatchRoutineEntry } from "@/services/routineManagerService";
import {
    getRoutineConfig, saveRoutineConfig,
    CustomCategory, DEFAULT_CATEGORIES,
} from "@/services/routineConfigService";
import { useConfirm } from "@/contexts/ConfirmContext";


export default function ManageRoutinePage() {
    const confirm = useConfirm();
    const [batches, setBatches] = useState<{ id: string; name: string; status: string }[]>([]);
    const [selectedBatch, setSelectedBatch] = useState<string | null>(null);
    const [loadingBatches, setLoadingBatches] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isFetching, setIsFetching] = useState(false);
    const [columns] = useState(["dayOfWeek", "startTime", "endTime", "subject", "teacherName", "room"]);
    const [maxRows, setMaxRows] = useState(50);
    const [gridRenderKey, setGridRenderKey] = useState(0);

    // Display config
    const [routineTitle, setRoutineTitle] = useState("");
    const [routineSubtitle, setRoutineSubtitle] = useState("");
    const [routineFooter, setRoutineFooter] = useState("");
    const [hiddenCategories, setHiddenCategories] = useState<Set<string>>(new Set());
    const [customCategories, setCustomCategories] = useState<CustomCategory[]>([]);
    const [isSavingConfig, setIsSavingConfig] = useState(false);

    // Collapsible section states
    const [configOpen, setConfigOpen] = useState(false);
    const [categoriesOpen, setCategoriesOpen] = useState(false);

    const rowDataRef = useRef<Record<string, string>[]>([]);
    const gridRef = useRef<HTMLTableElement>(null);

    useEffect(() => {
        getBatches()
            .then(d => setBatches(d))
            .catch(() => {})
            .finally(() => setLoadingBatches(false));
    }, []);

    const makeEmptyRows = (n: number) =>
        Array.from({ length: n }).map(() =>
            Object.fromEntries([...columns, "id"].map(c => [c, ""]))
        );

    const handleBatchSelect = async (batchName: string) => {
        setSelectedBatch(batchName);
        setIsFetching(true);
        try {
            const [routines, cfg] = await Promise.all([
                getRoutinesByBatch(batchName),
                getRoutineConfig(batchName),
            ]);

            setRoutineTitle(cfg.title);
            setRoutineSubtitle(cfg.subtitle);
            setRoutineFooter(cfg.footerText);
            setHiddenCategories(new Set(cfg.hiddenCategories ?? []));
            // If no custom categories saved yet, pre-fill with defaults
            setCustomCategories(
                cfg.customCategories?.length > 0 ? cfg.customCategories : DEFAULT_CATEGORIES
            );

            // ── BUG FIX: only load non-empty rows from DB ──────────────────
            const realRows = routines.filter(r =>
                r.dayOfWeek?.trim() || r.subject?.trim() || r.startTime?.trim()
            );
            const neededRows = Math.max(50, realRows.length + 20);
            setMaxRows(neededRows);
            const rows = makeEmptyRows(neededRows);

            realRows.forEach((item: any, index) => {
                columns.forEach(col => { rows[index][col] = item[col] || ""; });
                rows[index]["id"] = item.id || "";
            });

            rowDataRef.current = rows;
            setGridRenderKey(k => k + 1);
        } catch (err) {
            console.error("Failed to load batch data", err);
            alert("Error loading batch data.");
        } finally {
            setIsFetching(false);
        }
    };

    const handleCellBlur = useCallback((rowIndex: number, field: string, value: string) => {
        if (rowDataRef.current[rowIndex]) {
            rowDataRef.current[rowIndex] = { ...rowDataRef.current[rowIndex], [field]: value };
        }
    }, []);

    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>, startRow: number, startCol: string) => {
        e.preventDefault();
        const text = e.clipboardData.getData("Text");
        if (!text) return;
        const lines = text.split(/\r?\n/).filter(l => l.length > 0);
        const colIdx = columns.indexOf(startCol);
        if (colIdx === -1) return;
        lines.forEach((line, li) => {
            const cells = line.split("\t");
            const ri = startRow + li;
            if (ri >= maxRows) return;
            cells.forEach((val, ci) => {
                const ti = colIdx + ci;
                if (ti < columns.length && rowDataRef.current[ri]) {
                    const key = columns[ti];
                    rowDataRef.current[ri] = { ...rowDataRef.current[ri], [key]: val };
                    const input = gridRef.current?.querySelector<HTMLInputElement>(
                        `[data-row="${ri}"][data-col="${key}"]`
                    );
                    if (input) input.value = val;
                }
            });
        });
    };

    const handleClearRows = async () => {
        const ok = await confirm({ message: "Are you sure you want to clear all routine data for this batch?", variant: "warning" });
        if (ok) {
            rowDataRef.current = makeEmptyRows(maxRows);
            setGridRenderKey(k => k + 1);
            gridRef.current?.querySelectorAll("input").forEach(el => { (el as HTMLInputElement).value = ""; });
        }
    };

    const handleSave = async () => {
        if (!selectedBatch) return;
        setIsSaving(true);
        try {
            // ── BUG FIX: skip blank rows ────────────────────────────────────
            const dataToSave = rowDataRef.current
                .filter(row => row.dayOfWeek?.trim() || row.subject?.trim() || row.startTime?.trim())
                .map(row => ({
                    batch: selectedBatch,
                    dayOfWeek: row.dayOfWeek || "",
                    startTime: row.startTime || "",
                    endTime: row.endTime || "",
                    subject: row.subject || "",
                    teacherName: row.teacherName || "",
                    room: row.room || "",
                })) as BatchRoutineEntry[];

            await syncBatchRoutines(selectedBatch, dataToSave);
            alert("Routines saved successfully!");
        } catch (err) {
            console.error("Save error", err);
            alert("Failed to save routines.");
        } finally {
            setIsSaving(false);
        }
    };

    // ── Category helpers ────────────────────────────────────────────────────
    const toggleVisibility = (id: string) =>
        setHiddenCategories(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });

    const updateCategory = (idx: number, field: keyof CustomCategory, value: string) =>
        setCustomCategories(prev => prev.map((c, i) => i === idx ? { ...c, [field]: value } : c));

    const addCategory = () =>
        setCustomCategories(prev => [
            ...prev,
            { id: Date.now().toString(), label: "New Category", keywords: "keyword1,keyword2", color: "#6B7280", count: "" },
        ]);

    const deleteCategory = async (idx: number) => {
        const ok = await confirm({ message: `"${customCategories[idx].label}" ডিলিট করবেন?`, variant: "warning" });
        if (ok) setCustomCategories(prev => prev.filter((_, i) => i !== idx));
    };

    // ── Config save ─────────────────────────────────────────────────────────
    const handleSaveConfig = async () => {
        if (!selectedBatch) return;
        setIsSavingConfig(true);
        try {
            await saveRoutineConfig({
                batch: selectedBatch,
                title: routineTitle,
                subtitle: routineSubtitle,
                footerText: routineFooter,
                hiddenCategories: Array.from(hiddenCategories),
                customCategories,
            });
            alert("Config saved!");
        } catch (err) {
            console.error("Config save error", err);
            alert("Failed to save config.");
        } finally {
            setIsSavingConfig(false);
        }
    };

    // ── Batch list ──────────────────────────────────────────────────────────
    if (!selectedBatch) {
        return (
            <div className="p-6">
                <h1 className="no-gradient text-2xl font-bold text-[#1f2937] mb-6">Manage Class Routine</h1>
                <Card className="max-w-xl mx-auto shadow-sm border border-[#e5e7eb]">
                    <CardBody className="p-6">
                        <h2 className="no-gradient text-lg font-semibold text-gray-800 mb-4">Select Batch to Manage Routine</h2>
                        {loadingBatches ? (
                            <p className="text-gray-500">Loading batches...</p>
                        ) : batches.length === 0 ? (
                            <p className="text-red-500">No batches created yet.</p>
                        ) : (
                            <div className="space-y-3">
                                {batches.map(v => (
                                    <button
                                        key={v.id}
                                        onClick={() => handleBatchSelect(v.name)}
                                        className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-emerald-50 border border-gray-200 hover:border-emerald-500 rounded-xl transition-all font-medium text-gray-700 flex justify-between items-center"
                                    >
                                        <span>{v.name}</span>
                                        <span className={`text-xs px-2 py-1 rounded-full ${v.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-gray-200 text-gray-600"}`}>
                                            {v.status}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </CardBody>
                </Card>
            </div>
        );
    }

    return (
        <div className="p-6 max-h-screen overflow-hidden flex flex-col">
            {/* Page header */}
            <div className="flex items-center justify-between mb-4 flex-shrink-0">
                <div>
                    <h1 className="no-gradient text-2xl font-bold text-[#1f2937] flex items-center gap-2">
                        <button onClick={() => setSelectedBatch(null)} className="text-gray-500 hover:text-emerald-600 text-sm">← Back</button>
                        <span>Manage Routine: <span className="text-emerald-600">{selectedBatch}</span></span>
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">Copy and paste data directly from Excel. Empty rows are ignored on save.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" className="bg-white" onClick={handleClearRows}>Clear All</Button>
                    <Button onClick={handleSave} disabled={isSaving || isFetching}>
                        {isSaving ? "Saving..." : "Save Routine"}
                    </Button>
                </div>
            </div>

            {/* ── Display Config (collapsible) ─────────────────────────── */}
            <div className="mb-3 bg-blue-50 border border-blue-200 rounded-xl flex-shrink-0 overflow-hidden">

                {/* Section 1 header: Display Config */}
                <button
                    type="button"
                    onClick={() => setConfigOpen(v => !v)}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-blue-100/50 transition-colors text-left"
                >
                    <span className="text-sm font-bold text-blue-800">
                        📋 Routine Display Config
                        {(routineTitle || routineSubtitle || routineFooter) && !configOpen && (
                            <span className="ml-2 text-blue-500 font-normal text-xs">
                                ({routineTitle || "…"})
                            </span>
                        )}
                    </span>
                    <svg className={`w-4 h-4 text-blue-500 transition-transform duration-200 ${configOpen ? "rotate-180" : ""}`}
                        fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </button>

                {/* Section 1 content */}
                {configOpen && (
                    <div className="px-4 pb-4 border-t border-blue-200">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3">
                            <div>
                                <label className="text-xs font-semibold text-gray-600">শিরোনাম (Title)</label>
                                <input value={routineTitle} onChange={e => setRoutineTitle(e.target.value)}
                                    placeholder="যেমন: The Art of Sales & Marketing"
                                    className="w-full mt-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white" />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-gray-600">Subtitle — ঐচ্ছিক</label>
                                <input value={routineSubtitle} onChange={e => setRoutineSubtitle(e.target.value)}
                                    placeholder="যেমন: Batch 09 Weekly Schedule"
                                    className="w-full mt-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white" />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-gray-600">ফুটার টেক্সট</label>
                                <input value={routineFooter} onChange={e => setRoutineFooter(e.target.value)}
                                    placeholder="যেমন: As Sunnah Skill Development Institute"
                                    className="w-full mt-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white" />
                            </div>
                        </div>
                    </div>
                )}

                {/* Section 2 header: Category Editor */}
                <button
                    type="button"
                    onClick={() => setCategoriesOpen(v => !v)}
                    className="w-full flex items-center justify-between px-4 py-3 border-t border-blue-200 hover:bg-blue-100/50 transition-colors text-left"
                >
                    <span className="text-sm font-bold text-blue-800">
                        🎨 Subject Categories
                        {!categoriesOpen && customCategories.length > 0 && (
                            <span className="ml-2 text-blue-500 font-normal text-xs">
                                ({customCategories.length} categories)
                            </span>
                        )}
                    </span>
                    <div className="flex items-center gap-2">
                        {categoriesOpen && (
                            <span
                                role="button"
                                onClick={e => { e.stopPropagation(); addCategory(); }}
                                className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
                            >
                                + Add
                            </span>
                        )}
                        <svg className={`w-4 h-4 text-blue-500 transition-transform duration-200 ${categoriesOpen ? "rotate-180" : ""}`}
                            fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </div>
                </button>

                {/* Section 2 content */}
                {categoriesOpen && (
                    <div className="px-4 pb-3 border-t border-blue-200">
                        <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1 pt-3">
                            {customCategories.map((cat, idx) => (
                                <div key={cat.id} className="flex items-center gap-2 bg-white rounded-lg px-2 py-1.5 border border-blue-100">
                                    <input type="color" value={cat.color}
                                        onChange={e => updateCategory(idx, "color", e.target.value)}
                                        className="w-8 h-8 rounded cursor-pointer border-0 p-0.5 bg-transparent flex-shrink-0"
                                        title="Pick color" />
                                    <input value={cat.label}
                                        onChange={e => updateCategory(idx, "label", e.target.value)}
                                        placeholder="Category name"
                                        className="w-36 flex-shrink-0 px-2 py-1 text-xs font-semibold border border-gray-300 rounded focus:ring-1 focus:ring-blue-400 outline-none"
                                        style={{ color: cat.color }} />
                                    <input value={cat.keywords}
                                        onChange={e => updateCategory(idx, "keywords", e.target.value)}
                                        placeholder="keyword1,keyword2 — subject এ থাকলে এই color পাবে"
                                        className="flex-1 px-2 py-1 text-xs text-gray-600 border border-gray-300 rounded focus:ring-1 focus:ring-blue-400 outline-none" />
                                    <input value={cat.count ?? ""}
                                        onChange={e => updateCategory(idx, "count", e.target.value.replace(/[^0-9]/g, ""))}
                                        placeholder="ক্লাস"
                                        inputMode="numeric"
                                        title="এই টপিকে মোট কতগুলো ক্লাস (legend এ দেখাবে)"
                                        className="w-16 flex-shrink-0 px-2 py-1 text-xs text-center text-gray-700 border border-gray-300 rounded focus:ring-1 focus:ring-blue-400 outline-none" />
                                    <button
                                        onClick={() => toggleVisibility(cat.id)}
                                        title={hiddenCategories.has(cat.id) ? "Hidden from students" : "Visible to students"}
                                        className={`flex-shrink-0 w-7 h-7 rounded-lg border-2 flex items-center justify-center transition-colors ${hiddenCategories.has(cat.id) ? "border-gray-300 bg-white" : "border-transparent"}`}
                                        style={!hiddenCategories.has(cat.id) ? { backgroundColor: cat.color, borderColor: cat.color } : {}}
                                    >
                                        {!hiddenCategories.has(cat.id) && (
                                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                        )}
                                    </button>
                                    <button onClick={() => deleteCategory(idx)}
                                        className="flex-shrink-0 w-6 h-6 text-red-400 hover:text-red-600 font-bold flex items-center justify-center rounded hover:bg-red-50 transition-colors"
                                        title="Delete">✕</button>
                                </div>
                            ))}
                        </div>
                        <p className="text-[11px] text-gray-400 mt-2">
                            💡 Checkmark = students দেখবে · ✕ = delete · Color = color change · &quot;ক্লাস&quot; = legend এ এই সংখ্যাটা দেখাবে (খালি রাখলে অটো গণনা)
                        </p>
                    </div>
                )}

                {/* Save Config — always visible */}
                <div className="px-4 py-3 border-t border-blue-200 flex justify-end">
                    <button onClick={handleSaveConfig} disabled={isSavingConfig}
                        className="px-5 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
                        {isSavingConfig ? "Saving..." : "Save Config"}
                    </button>
                </div>
            </div>

            {/* ── Spreadsheet ──────────────────────────────────────────────── */}
            {isFetching ? (
                <div className="p-12 text-center text-gray-500">Loading Routine Data...</div>
            ) : (
                <div className="flex-1 overflow-auto bg-white border border-[#e5e7eb] shadow-sm rounded-xl" key={gridRenderKey}>
                    <table className="w-full text-sm text-left relative" ref={gridRef}>
                        <thead className="text-xs text-[#4b5563] uppercase bg-[#f9fafb] sticky top-0 z-10 shadow-sm">
                            <tr>
                                <th className="w-12 px-2 py-3 text-center border-b border-r bg-gray-100 text-gray-400">#</th>
                                <th className="px-4 py-3 font-semibold border-b border-r w-32">Day</th>
                                <th className="px-4 py-3 font-semibold border-b border-r w-36">Start Time</th>
                                <th className="px-4 py-3 font-semibold border-b border-r w-36">End Time</th>
                                <th className="px-4 py-3 font-semibold border-b border-r">Subject</th>
                                <th className="px-4 py-3 font-semibold border-b border-r">Teacher</th>
                                <th className="px-4 py-3 font-semibold border-b w-32">Room / Note</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 font-medium">
                            {rowDataRef.current.map((row, rowIndex) => (
                                <tr key={rowIndex} className="hover:bg-[#f0fdf4]/50 group h-10">
                                    <td className="w-12 text-center text-gray-400 text-xs border-r select-none sticky left-0 bg-white group-hover:bg-[#f0fdf4]/50">
                                        {rowIndex + 1}
                                    </td>
                                    {columns.map(col => (
                                        <td key={`${rowIndex}-${col}`} className="p-0 border-r relative">
                                            <input
                                                type="text"
                                                defaultValue={row[col] || ""}
                                                data-row={rowIndex}
                                                data-col={col}
                                                onBlur={e => handleCellBlur(rowIndex, col, e.target.value)}
                                                onPaste={e => handlePaste(e, rowIndex, col)}
                                                className="w-full h-full min-h-[40px] px-3 py-2 text-sm text-gray-800 bg-transparent border-none focus:ring-2 focus:ring-inset focus:ring-[#059669] outline-none"
                                            />
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
