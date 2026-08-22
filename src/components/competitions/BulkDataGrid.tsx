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
    // Initialize empty grid
    const initial = Array.from({ length: 100 }, () => ({}));
    setGridData(initial);

    // Fetch students to auto-fill names
    fetch(`/api/batch-info?batchName=${encodeURIComponent(competition.batchName)}&public=true`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setStudents(data);
      })
      .catch(console.error);
  }, [competition.batchName]);

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

  const handleSave = async () => {
    // Filter valid rows (must have roll number)
    const validRows = gridData.filter(row => row.rollNumber && row.rollNumber.trim() !== "");
    
    if (validRows.length === 0) {
      toast.error("Please add at least one row with a Roll Number.");
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
          rollNumber: row.rollNumber,
          studentName: row.studentName,
          teamName: row.teamName,
          data
        };
      });

      const res = await fetch(`/api/competitions/${competition.id}/submit/bulk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submissions }),
      });

      if (res.ok) {
        const resData = await res.json();
        toast.success(`Successfully saved ${resData.count} submissions!`);
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
            <h2 className="text-xl font-bold">Bulk Data Entry - {competition.title}</h2>
            <p className="text-sm text-gray-500">Tip: Click a cell and paste your Excel data. The columns must match.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 border rounded-md text-gray-600 hover:bg-gray-100">Cancel</button>
            <button 
              onClick={handleSave} 
              disabled={isSaving}
              className="px-4 py-2 bg-green-600 text-white font-bold rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              {isSaving ? "Saving..." : "Save Data"}
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-auto p-2 bg-gray-50">
          <table className="w-full border-collapse bg-white shadow-sm whitespace-nowrap">
            <thead className="sticky top-0 z-20">
              <tr className="bg-[#1e3a5f]">
                <th className="w-12 px-2 py-2 text-center text-xs font-semibold text-white border border-[#2d5278]">#</th>
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
                  <td className="px-2 py-1 border text-center text-xs text-gray-500">{rIdx + 1}</td>
                  {flatColumns.map((col, cIdx) => (
                    <td key={cIdx} className="border p-0 m-0">
                      <input
                        type="text"
                        className="w-full h-full min-h-[30px] px-2 py-1 text-sm border-none focus:ring-2 focus:ring-inset focus:ring-green-500 outline-none bg-transparent"
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
