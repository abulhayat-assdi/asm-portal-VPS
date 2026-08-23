"use client";

import React, { useState, useCallback, useEffect } from "react";
import { toast } from "react-hot-toast";

interface BulkDataGridProps {
  competition: any;
  onClose: () => void;
  onSuccess: () => void;
}

export default function BulkDataGrid({ competition, onClose, onSuccess }: BulkDataGridProps) {
  const [activeTab, setActiveTab] = useState<"team" | "individual">("team");
  const [teamGridData, setTeamGridData] = useState<any[]>([]);
  const [individualGridData, setIndividualGridData] = useState<any[]>([]);
  const [deletedIds, setDeletedIds] = useState<string[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Flatten the schema for Team columns (includes Team Name)
  const teamColumns: { key: string, label: string, type: string }[] = [
    { key: "rollNumber", label: "Roll Number", type: "short_text" },
    { key: "studentName", label: "Student Name", type: "short_text" },
    { key: "teamName", label: "Team Name", type: "short_text" }
  ];

  // Flatten the schema for Individual columns (excludes Team Name)
  const individualColumns: { key: string, label: string, type: string }[] = [
    { key: "rollNumber", label: "Roll Number", type: "short_text" },
    { key: "studentName", label: "Student Name", type: "short_text" }
  ];

  competition.schema.forEach((field: any) => {
    if (field.type === 'repeater') {
      for (let i = 0; i < 5; i++) {
        (field.subFields || []).forEach((sub: any) => {
          const colObj = {
            key: `${field.id}_${i}_${sub.id}`,
            label: `${field.label} [${i+1}] - ${sub.label}`,
            type: sub.type
          };
          teamColumns.push(colObj);
          individualColumns.push(colObj);
        });
      }
    } else {
      const colObj = { key: field.id, label: field.label, type: field.type };
      teamColumns.push(colObj);
      individualColumns.push(colObj);
    }
  });

  const activeColumns = activeTab === "team" ? teamColumns : individualColumns;
  const MAX_ROWS = 500;

  useEffect(() => {
    const initialTeam: any[] = [];
    const initialInd: any[] = [];

    if (Array.isArray(competition.submissions) && competition.submissions.length > 0) {
      competition.submissions.forEach((sub: any) => {
        const isTeam = sub.type === "team" || Boolean(sub.teamName && sub.teamName.trim() !== "");
        
        const rowObj: any = {
          id: sub.id,
          rollNumber: sub.rollNumber || "",
          studentName: sub.studentName || "",
          teamName: sub.teamName || "",
        };

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

        if (isTeam) {
          initialTeam.push(rowObj);
        } else {
          initialInd.push(rowObj);
        }
      });
    }

    // Append 15 empty rows to both tabs
    const emptyRows = Array.from({ length: 15 }, () => ({}));
    setTeamGridData([...initialTeam, ...emptyRows]);
    setIndividualGridData([...initialInd, ...emptyRows]);

    // Fetch students for auto-filling names
    fetch(`/api/batch-info?batchName=${encodeURIComponent(competition.batchName)}&public=true`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setStudents(data);
      })
      .catch(console.error);
  }, [competition]);

  const activeGridData = activeTab === "team" ? teamGridData : individualGridData;
  const setActiveGridData = activeTab === "team" ? setTeamGridData : setIndividualGridData;

  const handlePaste = useCallback((e: React.ClipboardEvent<HTMLInputElement>, startRowIndex: number, startColKey: string) => {
    e.preventDefault();
    const clipboardData = e.clipboardData.getData('Text');
    if (!clipboardData) return;

    const pastedLines = clipboardData.split(/\r?\n/).filter(line => line.length > 0);
    const startColIndex = activeColumns.findIndex(c => c.key === startColKey);
    if (startColIndex === -1) return;

    setActiveGridData(prev => {
      const next = [...prev];
      pastedLines.forEach((line, lineIndex) => {
        const cells = line.split('\t');
        const targetRowIndex = startRowIndex + lineIndex;
        if (targetRowIndex >= MAX_ROWS) return;
        
        if (!next[targetRowIndex]) next[targetRowIndex] = {};

        cells.forEach((cellValue, cellIndex) => {
          const targetColIndex = startColIndex + cellIndex;
          if (targetColIndex < activeColumns.length) {
            const fieldKey = activeColumns[targetColIndex].key;
            next[targetRowIndex] = { ...next[targetRowIndex], [fieldKey]: cellValue.trim() };
            
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
  }, [activeColumns, students, setActiveGridData]);

  const handleChange = (rowIndex: number, colKey: string, value: string) => {
    setActiveGridData(prev => {
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
    setActiveGridData(prev => {
      const rowToDelete = prev[rowIndex];
      if (rowToDelete?.id) {
        setDeletedIds(d => [...d, rowToDelete.id]);
      }
      return prev.filter((_, idx) => idx !== rowIndex);
    });
  };

  const handleAddRow = (count: number = 1) => {
    setActiveGridData(prev => [
      ...prev,
      ...Array.from({ length: count }, () => ({}))
    ]);
  };

  const buildSubmissionPayload = (rows: any[], isTeamMode: boolean) => {
    const validRows = rows.filter(row => row.rollNumber && row.rollNumber.trim() !== "");
    return validRows.map(row => {
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
        type: isTeamMode ? "team" : "individual",
        rollNumber: row.rollNumber,
        studentName: row.studentName,
        teamName: isTeamMode ? (row.teamName || null) : null,
        data
      };
    });
  };

  const handleSave = async () => {
    const teamPayload = buildSubmissionPayload(teamGridData, true);
    const indPayload = buildSubmissionPayload(individualGridData, false);

    const allSubmissions = [...teamPayload, ...indPayload];
    
    if (allSubmissions.length === 0 && deletedIds.length === 0) {
      toast.error("Please add or edit responses to save.");
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch(`/api/competitions/${competition.id}/submit/bulk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submissions: allSubmissions, deletedIds }),
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

  const teamCount = teamGridData.filter(r => r.rollNumber && r.rollNumber.trim() !== "").length;
  const indCount = individualGridData.filter(r => r.rollNumber && r.rollNumber.trim() !== "").length;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm font-sans">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[95vw] h-[90vh] flex flex-col overflow-hidden border border-slate-200">
        
        {/* Header Controls */}
        <div className="p-4 border-b flex flex-wrap justify-between items-center bg-slate-900 text-white shrink-0 gap-3">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span>📋</span> Manage Responses & Results - {competition.title}
            </h2>
            <p className="text-xs text-slate-300">
              Manage Team-wise & Individual responses in separate tabs. Paste rows from Excel or delete entries.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button 
              type="button" 
              onClick={() => handleAddRow(1)} 
              className="px-3 py-1.5 bg-emerald-600/90 hover:bg-emerald-600 text-white font-semibold rounded-lg text-xs transition flex items-center gap-1 shadow-sm"
            >
              <span>➕</span> Add Row
            </button>
            <button 
              type="button" 
              onClick={() => handleAddRow(5)} 
              className="px-3 py-1.5 bg-emerald-600/90 hover:bg-emerald-600 text-white font-semibold rounded-lg text-xs transition flex items-center gap-1 shadow-sm"
            >
              <span>➕</span> Add 5 Rows
            </button>
            <button onClick={onClose} className="px-4 py-2 border border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700 text-xs font-semibold rounded-lg">Cancel</button>
            <button 
              onClick={handleSave} 
              disabled={isSaving}
              className="px-5 py-2 bg-emerald-500 text-slate-950 font-black rounded-lg hover:bg-emerald-400 disabled:opacity-50 text-xs shadow-md transition"
            >
              {isSaving ? "Saving..." : "Save / Update Responses"}
            </button>
          </div>
        </div>

        {/* Tab Selection Bar (Excel-Style Sheets Navigation) */}
        <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 flex items-center gap-3 shrink-0">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Sheets:</span>
          
          <button
            type="button"
            onClick={() => setActiveTab("team")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 border ${
              activeTab === "team"
                ? "bg-white text-emerald-800 border-emerald-300 shadow-sm"
                : "bg-slate-200/70 text-slate-600 border-slate-300 hover:bg-slate-200"
            }`}
          >
            <span>👥</span> Team-wise Responses
            <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full text-[10px] font-extrabold">
              {teamCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("individual")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 border ${
              activeTab === "individual"
                ? "bg-white text-blue-800 border-blue-300 shadow-sm"
                : "bg-slate-200/70 text-slate-600 border-slate-300 hover:bg-slate-200"
            }`}
          >
            <span>👤</span> Individual Responses
            <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-[10px] font-extrabold">
              {indCount}
            </span>
          </button>
        </div>

        {/* Grid Container */}
        <div className="flex-1 overflow-auto p-2 bg-slate-50 flex flex-col justify-between">
          <table className="w-full border-collapse bg-white shadow-sm whitespace-nowrap">
            <thead className="sticky top-0 z-20">
              <tr className={activeTab === "team" ? "bg-slate-900" : "bg-blue-950"}>
                <th className="w-10 px-2 py-2 text-center text-xs font-bold text-white border border-slate-700">#</th>
                <th className="w-12 px-2 py-2 text-center text-xs font-bold text-white border border-slate-700">Delete</th>
                {activeColumns.map((col, idx) => (
                  <th key={idx} className="px-3 py-2 text-left text-xs font-bold text-white border border-slate-700 min-w-[130px]">
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {activeGridData.map((row, rIdx) => (
                <tr key={rIdx} className={rIdx % 2 === 0 ? "bg-white" : "bg-slate-50/80 hover:bg-emerald-50/50 transition-colors"}>
                  <td className="px-2 py-1 border border-slate-200 text-center text-xs text-slate-500 font-mono font-semibold">{rIdx + 1}</td>
                  <td className="px-1 py-1 border border-slate-200 text-center">
                    <button
                      type="button"
                      onClick={() => handleDeleteRow(rIdx)}
                      title="Delete Row"
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 text-xs p-1 rounded transition"
                    >
                      🗑️
                    </button>
                  </td>
                  {activeColumns.map((col, cIdx) => (
                    <td key={cIdx} className="border border-slate-200 p-0 m-0">
                      <input
                        type="text"
                        className="w-full h-full min-h-[32px] px-2 py-1 text-sm border-none focus:ring-2 focus:ring-inset focus:ring-emerald-500 outline-none bg-transparent font-medium"
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

          {/* Bottom Table Add Row Controls */}
          <div className="p-3 bg-white border-t border-slate-200 flex justify-between items-center sticky bottom-0 z-10 mt-2 rounded-b-xl shadow-inner">
            <span className="text-xs text-slate-600 font-bold">
              Showing {activeTab === "team" ? "Team-wise" : "Individual"} Sheet ({activeGridData.length} total rows)
            </span>
            <div className="flex gap-2">
              <button 
                type="button" 
                onClick={() => handleAddRow(1)} 
                className="px-3 py-1.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 text-xs shadow transition flex items-center gap-1"
              >
                <span>➕</span> Add New Row ({activeTab === "team" ? "Team" : "Individual"})
              </button>
              <button 
                type="button" 
                onClick={() => handleAddRow(5)} 
                className="px-3 py-1.5 bg-slate-700 text-white font-bold rounded-lg hover:bg-slate-800 text-xs shadow transition flex items-center gap-1"
              >
                <span>➕</span> Add 5 New Rows
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
