"use client";

import { useState, useEffect } from "react";
import { getAllBatchInfo, StudentBatchInfo } from "@/services/batchInfoService";
import { saveBatchResults, ExamResult, getAllExamResults } from "@/services/resultService";

export default function ManageResultsPage() {
    const [allStudents, setAllStudents] = useState<StudentBatchInfo[]>([]);
    const [allResults, setAllResults] = useState<ExamResult[]>([]);
    const [batches, setBatches] = useState<string[]>([]);
    
    const [selectedBatch, setSelectedBatch] = useState<string>("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Grid state
    const [gridData, setGridData] = useState<{ roll: string; name: string; marks: string; remarks: string }[]>([]);

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const [students, results] = await Promise.all([
                    getAllBatchInfo(),
                    getAllExamResults()
                ]);
                
                setAllStudents(students);
                setAllResults(results);
                
                const uniqueBatches = Array.from(new Set(students.map(s => s.batchName))).sort();
                setBatches(uniqueBatches);
            } catch (error) {
                console.error("Failed to load data for results management", error);
            } finally {
                setLoading(false);
            }
        };
        fetchInitialData();
    }, []);

    const handleBatchSelect = (batchName: string) => {
        setSelectedBatch(batchName);
        
        // Filter students for this batch
        const batchStudents = allStudents.filter(s => s.batchName === batchName);
        
        // Prepare grid data, prefilling with existing results if any
        const newGridData = batchStudents.map(student => {
            const existingResult = allResults.find(r => r.batchName === batchName && r.roll === student.roll);
            return {
                roll: student.roll,
                name: student.name,
                marks: existingResult ? String(existingResult.marks) : "",
                remarks: existingResult?.remarks || ""
            };
        });
        
        // Sort by roll numerically if possible
        newGridData.sort((a, b) => {
            const numA = parseInt(a.roll);
            const numB = parseInt(b.roll);
            if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
            return a.roll.localeCompare(b.roll);
        });

        setGridData(newGridData);
    };

    const handleCellChange = (index: number, field: "marks" | "remarks", value: string) => {
        const updated = [...gridData];
        updated[index][field] = value;
        setGridData(updated);
    };

    const handleSave = async () => {
        if (!selectedBatch) return;
        setSaving(true);
        
        try {
            const resultsToSave = gridData.map(row => ({
                batchName: selectedBatch,
                roll: row.roll,
                name: row.name,
                marks: row.marks,
                remarks: row.remarks
            }));
            
            await saveBatchResults(selectedBatch, resultsToSave);
            
            // Re-fetch all results to keep local state updated
            const refreshedResults = await getAllExamResults();
            setAllResults(refreshedResults);
            
            alert(`Results for ${selectedBatch} saved successfully!`);
        } catch (error) {
            console.error("Failed to save results", error);
            alert("Failed to save. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#059669]"></div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Manage Exam Results</h1>
                    <p className="text-sm text-gray-500 mt-1">Select a batch to enter or update the final exam marks of students.</p>
                </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between gap-4">
                 <div className="w-full max-w-sm">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Select Batch</label>
                    <select
                        value={selectedBatch}
                        onChange={(e) => handleBatchSelect(e.target.value)}
                        className="block w-full py-2.5 px-3 border border-gray-300 bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-[#059669] focus:border-[#059669] sm:text-sm transition-colors"
                    >
                        <option value="" disabled>Select a batch to begin</option>
                        {batches.map(b => (
                            <option key={b} value={b}>{b}</option>
                        ))}
                    </select>
                </div>
                
                {selectedBatch && (
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className={`px-6 py-2.5 font-bold rounded-xl text-white shadow-sm transition-all ${saving ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#059669] hover:bg-[#047857]'}`}
                    >
                        {saving ? "Saving..." : "Save Results"}
                    </button>
                )}
            </div>

            {selectedBatch && gridData.length > 0 && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                     <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
                         <h3 className="font-bold text-gray-800">{selectedBatch} - Student Grading Sheet</h3>
                     </div>
                     <div className="overflow-x-auto max-h-[60vh] overflow-y-auto w-full relative">
                        <table className="w-full text-left border-collapse">
                            <thead className="sticky top-0 z-10">
                                <tr className="bg-[#1e3a5f] text-white text-xs uppercase tracking-wider">
                                    <th className="px-4 py-3 font-medium border border-[#2d5278] w-[15%]">Roll No.</th>
                                    <th className="px-4 py-3 font-medium border border-[#2d5278] w-[30%]">Student Name</th>
                                    <th className="px-4 py-3 font-medium border border-[#2d5278] w-[20%]">Final Marks</th>
                                    <th className="px-4 py-3 font-medium border border-[#2d5278] w-[35%]">Remarks (Optional)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {gridData.map((row, index) => (
                                    <tr key={row.roll} className={index % 2 === 0 ? "bg-white" : "bg-[#f9fafb]"}>
                                        <td className="px-4 py-2 border-b border-gray-200 font-semibold text-gray-700">{row.roll}</td>
                                        <td className="px-4 py-2 border-b border-gray-200 text-gray-900">{row.name}</td>
                                        <td className="px-4 py-2 border-b border-gray-200">
                                            <input
                                                type="text"
                                                value={row.marks}
                                                onChange={(e) => handleCellChange(index, "marks", e.target.value)}
                                                className="w-full sm:w-3/4 p-1.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-[#059669]"
                                                placeholder="e.g. 85"
                                            />
                                        </td>
                                        <td className="px-4 py-2 border-b border-gray-200">
                                            <input
                                                type="text"
                                                value={row.remarks}
                                                onChange={(e) => handleCellChange(index, "remarks", e.target.value)}
                                                className="w-full p-1.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-[#059669]"
                                                placeholder="Very good performance..."
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                     </div>
                </div>
            )}
            
            {selectedBatch && gridData.length === 0 && (
                <div className="text-center p-12 bg-white rounded-2xl border border-gray-100 shadow-sm mt-6">
                    <p className="text-gray-500">No students found in this batch. Go to All Batch Info to add students first.</p>
                </div>
            )}
        </div>
    );
}
