"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Card, { CardBody } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { getBatches } from "@/services/scheduleService";
import { getRoutinesByBatch, syncBatchRoutines, BatchRoutineEntry } from "@/services/routineManagerService";
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

    const rowDataRef = useRef<Record<string, string>[]>([]);
    const gridRef = useRef<HTMLTableElement>(null);

    useEffect(() => {
        const fetchBatches = async () => {
            setLoadingBatches(true);
            try {
                const data = await getBatches();
                // We show both active and archived batches so they can manage everything
                setBatches(data);
            } catch (error) {
                console.error("Failed to load batches", error);
            } finally {
                setLoadingBatches(false);
            }
        };
        fetchBatches();
    }, []);

    const initializeEmptyRows = (numRows: number = maxRows) => {
        return Array.from({ length: numRows }).map(() => {
            return Object.fromEntries([...columns, "id"].map(c => [c, ""]));
        });
    };

    const handleBatchSelect = async (batchName: string) => {
        setSelectedBatch(batchName);
        setIsFetching(true);
        try {
            const routines = await getRoutinesByBatch(batchName);
            
            const neededRows = Math.max(maxRows, routines.length + 20);
            setMaxRows(neededRows);
            const rows = initializeEmptyRows(neededRows);

            routines.forEach((item: any, index) => {
                if (index < neededRows) {
                    columns.forEach(col => {
                        if (!rows[index]) rows[index] = {};
                        rows[index][col] = item[col] || "";
                    });
                    rows[index]["id"] = item.id || "";
                }
            });

            rowDataRef.current = rows;
            setGridRenderKey(k => k + 1);
        } catch (error) {
            console.error("Failed to fetch routines for batch", error);
            alert("Error loading specific batch data.");
        } finally {
            setIsFetching(false);
        }
    };

    const handleCellBlur = useCallback((rowIndex: number, field: string, value: string) => {
        if (rowDataRef.current[rowIndex]) {
            rowDataRef.current[rowIndex] = { ...rowDataRef.current[rowIndex], [field]: value };
        }
    }, []);

    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>, startRowIndex: number, startColKey: string) => {
        e.preventDefault();
        
        const clipboardData = e.clipboardData.getData('Text');
        if (!clipboardData) return;

        const pastedLines = clipboardData.split(/\r?\n/).filter(line => line.length > 0);
        const startColIndex = columns.indexOf(startColKey);
        
        if (startColIndex === -1) return;

        pastedLines.forEach((line, lineIndex) => {
            const cells = line.split('\t');
            const targetRowIndex = startRowIndex + lineIndex;
            
            if (targetRowIndex >= maxRows) return;

            cells.forEach((cellValue, cellIndex) => {
                const targetColIndex = startColIndex + cellIndex;
                if (targetColIndex < columns.length) {
                    const fieldKey = columns[targetColIndex];
                    
                    if (rowDataRef.current[targetRowIndex]) {
                        rowDataRef.current[targetRowIndex] = {
                            ...rowDataRef.current[targetRowIndex],
                            [fieldKey]: cellValue
                        };
                    }

                    const input = gridRef.current?.querySelector<HTMLInputElement>(
                        `[data-row="${targetRowIndex}"][data-col="${fieldKey}"]`
                    );
                    if (input) {
                        input.value = cellValue;
                    }
                }
            });
        });
    };

    const handleClearRows = async () => {
        const ok = await confirm({ message: "Are you sure you want to clear all data in the table for this batch?", variant: "warning" });
        if (ok) {
            const emptyRows = initializeEmptyRows(maxRows);
            rowDataRef.current = emptyRows;
            setGridRenderKey(k => k + 1);

            if (gridRef.current) {
                gridRef.current.querySelectorAll('input').forEach((el) => {
                    el.value = '';
                });
            }
        }
    };

    const handleSave = async () => {
        if (!selectedBatch) return;
        setIsSaving(true);
        try {
            const dataToSave = rowDataRef.current.map(row => ({
                id: row.id,
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
        } catch (error) {
            console.error("Save error", error);
            alert("Failed to save routines. Check console.");
        } finally {
            setIsSaving(false);
        }
    };

    if (!selectedBatch) {
        return (
            <div className="p-6">
                <h1 className="text-2xl font-bold text-[#1f2937] mb-6">Manage Class Routine</h1>
                <Card className="max-w-xl mx-auto shadow-sm border border-[#e5e7eb]">
                    <CardBody className="p-6">
                        <h2 className="text-lg font-semibold text-gray-800 mb-4">Select Batch to Manage Routine</h2>
                        {loadingBatches ? (
                            <p className="text-gray-500">Loading batches...</p>
                        ) : batches.length === 0 ? (
                            <p className="text-red-500">No batches created yet. Please create a batch first from Schedule Manager.</p>
                        ) : (
                            <div className="space-y-3">
                                {batches.map(v => (
                                    <button 
                                        key={v.id}
                                        onClick={() => handleBatchSelect(v.name)}
                                        className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-emerald-50 border border-gray-200 hover:border-emerald-500 rounded-xl transition-all font-medium text-gray-700 flex justify-between items-center"
                                    >
                                        <span>{v.name}</span>
                                        <span className={`text-xs px-2 py-1 rounded-full ${v.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-600'}`}>{v.status}</span>
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
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h1 className="text-2xl font-bold text-[#1f2937] flex items-center gap-2">
                        <button onClick={() => setSelectedBatch(null)} className="text-gray-500 hover:text-emerald-600 text-sm">
                            ← Back
                        </button>
                        <span>Manage Routine: <span className="text-emerald-600">{selectedBatch}</span></span>
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">Copy and paste data directly from Excel.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" className="bg-white" onClick={handleClearRows}>Clear All</Button>
                    <Button onClick={handleSave} disabled={isSaving || isFetching}>
                        {isSaving ? "Saving..." : "Save Routine"}
                    </Button>
                </div>
            </div>

            {isFetching ? (
                <div className="p-12 text-center text-gray-500">Loading Routine Data...</div>
            ) : (
                <div className="flex-1 overflow-auto bg-white border border-[#e5e7eb] shadow-sm rounded-xl" key={gridRenderKey}>
                    <table className="w-full text-sm text-left relative" ref={gridRef}>
                        <thead className="text-xs text-[#4b5563] uppercase bg-[#f9fafb] sticky top-0 z-10 shadow-sm">
                            <tr>
                                <th className="w-12 px-2 py-3 text-center border-b border-r bg-gray-100 text-gray-400">#</th>
                                <th className="px-4 py-3 font-semibold border-b border-r w-32 border-l">Day</th>
                                <th className="px-4 py-3 font-semibold border-b border-r w-40">Start Time</th>
                                <th className="px-4 py-3 font-semibold border-b border-r w-40">End Time</th>
                                <th className="px-4 py-3 font-semibold border-b border-r">Subject</th>
                                <th className="px-4 py-3 font-semibold border-b border-r">Teacher</th>
                                <th className="px-4 py-3 font-semibold border-b w-32">Room</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 font-medium">
                            {rowDataRef.current.map((row, rowIndex) => (
                                <tr key={rowIndex} className="hover:bg-[#f0fdf4]/50 group h-10">
                                    <td className="w-12 text-center text-gray-400 text-xs border-r select-none sticky left-0 bg-white group-hover:bg-[#f0fdf4]/50 shadow-[1px_0_0_0_#f3f4f6]">
                                        {rowIndex + 1}
                                    </td>
                                    {columns.map((col) => (
                                        <td key={`${rowIndex}-${col}`} className="p-0 border-r relative">
                                            <input
                                                type="text"
                                                defaultValue={row[col] || ""}
                                                data-row={rowIndex}
                                                data-col={col}
                                                onBlur={(e) => handleCellBlur(rowIndex, col, e.target.value)}
                                                onPaste={(e) => handlePaste(e, rowIndex, col)}
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
