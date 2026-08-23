"use client";

import React, { useState, useCallback, useEffect } from "react";
import { toast } from "react-hot-toast";

interface BulkDataGridProps {
  competition: any;
  onClose: () => void;
  onSuccess: () => void;
}

export default function BulkDataGrid({ competition, onClose, onSuccess }: BulkDataGridProps) {
  const [gridData, setGridData] = useState<any[]>([]);
  const [deletedIds, setDeletedIds] = useState<string[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Flatten the schema for the grid columns
  const flatColumns: { key: string, label: string, type: string, subFieldId?: string, parentId?: string }[] = [];
  
  flatColumns.push({ key: "rollNumber", label: "Roll Number", type: "short_text" });
  flatColumns.push({ key: "studentName", label: "Student Name", type: "short_text" });
  flatColumns.push({ key: "teamName", label: "Team Name", type: "short_text" });

  competition.schema.forEach((field: any) => {
    if (field.type === 'repeater') {
      // Flatten up to 5 items for the repeater
      for (let i = 0; i < 5; i++) {
        (field.subFields || []).forEach((sub: any) => {
          flatColumns.push({
            key: `${field.id}_${i}_${sub.id}`,
            label: `${field.label} [${i+1}] - ${sub.label}`,
            type: sub.type,
            parentId: field.id,
            subFieldId: sub.id
          });
        });
      }
    } else {
      flatColumns.push({
        key: field.id,
        label: field.label,
        type: field.type
      });
    }
  });

  const MAX_ROWS = 500;

  useEffect(() => {
    // Populate existing submissions into grid rows
    const existingRows: any[] = [];
    if (Array.isArray(competition.submissions) && competition.submissions.length > 0) {
      competition.submissions.forEach((sub: any) => {
        const rowObj: any = {
          id: sub.id,
          rollNumber: sub.rollNumber || "",
          studentName: sub.studentName || "",
          teamName: sub.teamName || "",
        };

        // Map schema field data
        competition.schema.forEach((field: any) => {
          const val = sub.data?.[field.id];
          if (field.type === 'repeater' && Array.isArray(val)) {
            val.forEach((item: any, i: number) => {
              if (i < 5) {
                (field.subFields || []).forEach((sf: any) => {
                  rowObj[`${field.id}_${i}_${sf.id}`] = item[sf.id] !== undefined ? item[sf.id] : "";
                });
              }
            });
          } else {
            if (val !== undefined) {
              rowObj[field.id] = val;
            }
          }
        });

        existingRows.push(rowObj);
      });
    }

    // Append 20 empty rows below existing submissions
    const emptyRows = Array.from({ length: 20 }, () => ({}));
    setGridData([...existingRows, ...emptyRows]);

    // Fetch students to auto-fill names
    fetch(`/api/batch-info?batchName=${encodeURIComponent(competition.batchName)}&public=true`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setStudents(data);
      })
      .catch(console.error);
  }, [competition]);

  const handlePaste = useCallback((e: React.ClipboardEvent<HTMLInputElement>, startRowIndex: number, startColKey: string) => {
    e.preventDefault();
    const clipboardData = e.clipboardData.getData('Text');
    if (!clipboardData) return;

    const pastedLines = clipboardData.split(/\r?\n/).filter(line => line.length > 0);
    const startColIndex = flatColumns.findIndex(c => c.key === startColKey);
    if (startColIndex === -1) return;

    setGridData(prev => {
      const next = [...prev];
      pastedLines.forEach((line, lineIndex) => {
        const cells = line.split('\t');
        const targetRowIndex = startRowIndex + lineIndex;
        if (targetRowIndex >= MAX_ROWS) return;
        
        if (!next[targetRowIndex]) next[targetRowIndex] = {};

        cells.forEach((cellValue, cellIndex) => {
          const targetColIndex = startColIndex + cellIndex;
          if (targetColIndex < flatColumns.length) {
            const fieldKey = flatColumns[targetColIndex].key;
            next[targetRowIndex] = { ...next[targetRowIndex], [fieldKey]: cellValue.trim() };
            
            // Auto-fill student name if roll number is pasted
            if (fieldKey === 'rollNumber') {
              const std = students.find(s => s.roll === cellValue.trim());
              if (std) {
                next[targetRowIndex].studentName = std.name;
              }
            }
          }
        });
      });
      return next;
    });
  }, [flatColumns, students]);

  const handleChange = (rowIndex: number, colKey: string, value: string) => {
    setGridData(prev => {
      const next = [...prev];
      next[rowIndex] = { ...next[rowIndex], [colKey]: value };
      
      if (colKey === 'rollNumber') {
        const std = students.find(s => s.roll === value.trim());
        if (std) {
          next[rowIndex].studentName = std.name;
        }
      }
      return next;
    });
  };

  const handleDeleteRow = (rowIndex: number) => {
    setGridData(prev => {
      const rowToDelete = prev[rowIndex];
      if (rowToDelete?.id) {
        setDeletedIds(d => [...d, rowToDelete.id]);
      }
      return prev.filter((_, idx) => idx !== rowIndex);
    });
  };

  const handleSave = async () => {
    // Filter valid rows (must have roll number)
    const validRows = gridData.filter(row => row.rollNumber && row.rollNumber.trim() !== "");
    
    if (validRows.length === 0 && deletedIds.length === 0) {
      toast.error("Please add or edit responses to save.");
      return;
    }

    setIsSaving(true);
    try {
      const submissions = validRows.map(row => {
        const data: any = {};
        
        competition.schema.forEach((field: any) => {
          if (field.type === 'repeater') {
            const arr = [];
            for (let i = 0; i < 5; i++) {
              let hasData = false;
              const itemData: any = {};
              (field.subFields || []).forEach((sub: any) => {
                const val = row[`${field.id}_${i}_${sub.id}`];
                if (val) {
                  hasData = true;
                  itemData[sub.id] = val;
                }
              });
              if (hasData) arr.push(itemData);
            }
            if (arr.length > 0) data[field.id] = arr;
          } else {
            if (row[field.id] !== undefined) {
              data[field.id] = field.type === 'rating' ? Number(row[field.id]) : row[field.id];
            }
          }
        });

        return {
          id: row.id || undefined,
          rollNumber: row.rollNumber,
          studentName: row.studentName,
          teamName: row.teamName,
          data
        };
      });

      const res = await fetch(`/api/competitions/${competition.id}/submit/bulk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submissions, deletedIds }),
      });

      if (res.ok) {
        toast.success("Responses & Results updated successfully!");
        onSuccess();
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to save data.");
      }
    } catch (e: any) {
      toast.error("An error occurred while saving.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-[95vw] h-[90vh] flex flex-col">
        <div className="p-4 border-b flex justify-between items-center bg-gray-50 rounded-t-xl shrink-0">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Manage Responses & Results - {competition.title}</h2>
            <p className="text-xs text-gray-500">Edit existing responses, paste new rows from Excel, or delete rows.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 border rounded-md text-gray-600 hover:bg-gray-100 text-sm font-semibold">Cancel</button>
            <button 
              onClick={handleSave} 
              disabled={isSaving}
              className="px-5 py-2 bg-emerald-600 text-white font-bold rounded-md hover:bg-emerald-700 disabled:opacity-50 text-sm shadow transition"
            >
              {isSaving ? "Saving..." : "Save / Update Responses"}
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-auto p-2 bg-gray-50">
          <table className="w-full border-collapse bg-white shadow-sm whitespace-nowrap">
            <thead className="sticky top-0 z-20">
              <tr className="bg-[#1e3a5f]">
                <th className="w-10 px-2 py-2 text-center text-xs font-semibold text-white border border-[#2d5278]">#</th>
                <th className="w-12 px-2 py-2 text-center text-xs font-semibold text-white border border-[#2d5278]">Delete</th>
                {flatColumns.map((col, idx) => (
                  <th key={idx} className="px-3 py-2 text-left text-xs font-semibold text-white border border-[#2d5278] min-w-[120px]">
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {gridData.map((row, rIdx) => (
                <tr key={rIdx} className={rIdx % 2 === 0 ? "bg-white" : "bg-gray-50 hover:bg-emerald-50 transition-colors"}>
                  <td className="px-2 py-1 border text-center text-xs text-gray-500 font-mono">{rIdx + 1}</td>
                  <td className="px-1 py-1 border text-center">
                    <button
                      type="button"
                      onClick={() => handleDeleteRow(rIdx)}
                      title="Delete Row"
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 text-xs p-1 rounded transition"
                    >
                      🗑️
                    </button>
                  </td>
                  {flatColumns.map((col, cIdx) => (
                    <td key={cIdx} className="border p-0 m-0">
                      <input
                        type="text"
                        className="w-full h-full min-h-[30px] px-2 py-1 text-sm border-none focus:ring-2 focus:ring-inset focus:ring-emerald-500 outline-none bg-transparent"
                        value={row[col.key] || ""}
                        onChange={(e) => handleChange(rIdx, col.key, e.target.value)}
                        onPaste={(e) => handlePaste(e, rIdx, col.key)}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
