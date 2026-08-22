"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { toast } from "react-hot-toast";

export default function SubmitCompetitionForm() {
  const params = useParams();
  const id = params.id as string;
  
  const [competition, setCompetition] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [subType, setSubType] = useState<"team"|"individual">("team");
  const [rollNumber, setRollNumber] = useState("");
  const [studentName, setStudentName] = useState("");
  const [teamName, setTeamName] = useState("");
  const [formData, setFormData] = useState<Record<string, any>>({});

  useEffect(() => {
    fetchCompetition();
  }, [id]);

  const fetchCompetition = async () => {
    try {
      const res = await fetch(`/api/competitions/${id}`);
      if (!res.ok) {
        setLoading(false);
        return;
      }
      const data = await res.json();
      setCompetition(data);
      
      const stdRes = await fetch(`/api/batch-info?batchName=${encodeURIComponent(data.batchName)}&public=true`);
      if (stdRes.ok) {
        const stds = await stdRes.json();
        setStudents(Array.isArray(stds) ? stds : []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleRollChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const roll = e.target.value;
    setRollNumber(roll);
    const student = students.find(s => s.roll === roll);
    if (student) {
      setStudentName(student.name);
    } else {
      setStudentName("");
    }
  };

  const handleFieldChange = (fieldId: string, value: any) => {
    setFormData(prev => ({ ...prev, [fieldId]: value }));
  };

  const handleRepeaterChange = (fieldId: string, index: number, subFieldId: string, value: any) => {
    setFormData(prev => {
      const arr = [...(prev[fieldId] || [])];
      if (!arr[index]) arr[index] = {};
      arr[index][subFieldId] = value;
      return { ...prev, [fieldId]: arr };
    });
  };

  const addRepeaterItem = (fieldId: string) => {
    setFormData(prev => {
      const arr = [...(prev[fieldId] || [])];
      arr.push({});
      return { ...prev, [fieldId]: arr };
    });
  };

  const removeRepeaterItem = (fieldId: string, index: number) => {
    setFormData(prev => {
      const arr = [...(prev[fieldId] || [])];
      arr.splice(index, 1);
      return { ...prev, [fieldId]: arr };
    });
  };

  const validateField = (field: any, value: any) => {
    if (field.type === 'repeater') {
      if (field.required && (!value || value.length === 0)) return `${field.label} is required. Please add at least one item.`;
      if (value && value.length > 0) {
        for (let i = 0; i < value.length; i++) {
          for (const sub of (field.subFields || [])) {
            if (sub.required && !value[i][sub.id]) return `${field.label} (Item ${i + 1}): ${sub.label} is required.`;
            if (value[i][sub.id] && sub.validation === 'bd_mobile') {
              if (!/^01[3-9]\d{8}$/.test(value[i][sub.id])) return `${field.label} (Item ${i + 1}): ${sub.label} must be a valid 11-digit BD mobile number.`;
            }
          }
        }
      }
      return null;
    }

    if (field.required && !value) return `${field.label} is required.`;
    if (value && field.validation === 'number' && isNaN(Number(value))) return `${field.label} must be a number.`;
    if (value && field.validation === 'bd_mobile') {
      const regex = /^01[3-9]\d{8}$/;
      if (!regex.test(value)) return `${field.label} must be a valid 11-digit Bangladeshi mobile number starting with 0.`;
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rollNumber) return toast.error("Please select your Roll Number");
    if (subType === "team" && !teamName) return toast.error("Please enter/select your Team Name");

    for (const field of competition.schema) {
      const error = validateField(field, formData[field.id]);
      if (error) {
        toast.error(error);
        return;
      }
    }

    try {
      const res = await fetch(`/api/competitions/${id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: subType,
          teamName: subType === "team" ? teamName : null,
          rollNumber,
          studentName,
          data: formData
        })
      });

      if (res.ok) {
        toast.success("Submitted successfully!");
        setFormData({});
        setRollNumber("");
        setStudentName("");
      } else {
        const d = await res.json();
        toast.error(d.error || "Submission failed");
      }
    } catch (e) {
      toast.error("Error submitting form");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 flex flex-col justify-center items-center text-white p-6">
        <div className="w-12 h-12 border-4 border-emerald-500/30 border-t-emerald-400 rounded-full animate-spin mb-4"></div>
        <p className="text-emerald-300 font-medium tracking-wide">Loading Submission Form...</p>
      </div>
    );
  }

  if (!competition) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 flex justify-center items-center text-slate-300 p-6">
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 p-8 rounded-2xl text-center max-w-md shadow-2xl">
          <p className="text-xl font-semibold text-slate-200">Form Not Available</p>
          <p className="text-sm text-slate-400 mt-2">The competition form was not found or is currently inactive.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 text-slate-100 py-6 sm:py-12 px-3 sm:px-6 lg:px-8 flex justify-center items-center font-sans selection:bg-emerald-500 selection:text-slate-950">
      
      {/* Glassmorphic Form Card Wrapper */}
      <div className="w-full max-w-2xl bg-slate-900/80 backdrop-blur-2xl border border-emerald-500/20 rounded-3xl shadow-2xl shadow-emerald-950/60 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16"></div>

        {/* Card Header Banner */}
        <div className="bg-gradient-to-r from-emerald-900/90 via-teal-900/90 to-slate-900/90 p-6 sm:p-8 border-b border-emerald-500/20 relative">
          <span className="inline-block bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider mb-2">
            Batch: {competition.batchName}
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {competition.title}
          </h1>
          {competition.description && (
            <p className="mt-2 text-sm text-emerald-100/80 leading-relaxed">
              {competition.description}
            </p>
          )}
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-8 space-y-6">
          
          {/* Submission Type Toggle Pills */}
          <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              Submission Type
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setSubType("team")}
                className={`py-3 px-4 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 border ${
                  subType === "team"
                    ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-emerald-400 shadow-lg shadow-emerald-950/60"
                    : "bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200"
                }`}
              >
                <span>👥</span> Team-wise
              </button>
              <button
                type="button"
                onClick={() => setSubType("individual")}
                className={`py-3 px-4 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 border ${
                  subType === "individual"
                    ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-emerald-400 shadow-lg shadow-emerald-950/60"
                    : "bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200"
                }`}
              >
                <span>👤</span> Individual
              </button>
            </div>
          </div>

          {/* Student & Roll Selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Roll Number <span className="text-red-400">*</span>
              </label>
              <select 
                required 
                className="w-full bg-slate-950/90 text-white border border-slate-700/80 px-4 py-3 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-none transition-all text-sm"
                value={rollNumber} 
                onChange={handleRollChange}
              >
                <option value="">-- Select Roll --</option>
                {students.map(s => (
                  <option key={s.roll} value={s.roll}>{s.roll}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Student Name
              </label>
              <input 
                type="text" 
                readOnly 
                className="w-full bg-slate-950/50 text-slate-400 border border-slate-800 px-4 py-3 rounded-xl text-sm font-medium cursor-not-allowed"
                value={studentName} 
                placeholder="Auto-filled from Roll"
              />
            </div>
          </div>

          {/* Team Name Input */}
          {subType === "team" && (
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Team Name <span className="text-red-400">*</span>
              </label>
              <input 
                required 
                type="text" 
                className="w-full bg-slate-950/90 text-white border border-slate-700/80 px-4 py-3 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-none transition-all text-sm placeholder:text-slate-600" 
                placeholder="Enter your official team name"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
              />
            </div>
          )}

          <div className="border-t border-slate-800 my-6"></div>

          {/* Dynamic Schema Fields */}
          <div className="space-y-5">
            {competition.schema.map((field: any) => (
              <div key={field.id} className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                  {field.label} {field.required && <span className="text-red-400">*</span>}
                </label>
                
                {field.type === 'short_text' && (
                  <input 
                    type={field.validation === 'number' ? 'number' : 'text'}
                    className="w-full bg-slate-950/90 text-white border border-slate-700/80 px-4 py-3 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-none transition-all text-sm placeholder:text-slate-600"
                    value={formData[field.id] || ''}
                    onChange={e => handleFieldChange(field.id, e.target.value)}
                    required={field.required}
                  />
                )}

                {field.type === 'long_text' && (
                  <textarea 
                    className="w-full bg-slate-950/90 text-white border border-slate-700/80 px-4 py-3 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-none transition-all text-sm placeholder:text-slate-600"
                    rows={4}
                    value={formData[field.id] || ''}
                    onChange={e => handleFieldChange(field.id, e.target.value)}
                    required={field.required}
                  />
                )}

                {field.type === 'dropdown' && (
                  <select 
                    className="w-full bg-slate-950/90 text-white border border-slate-700/80 px-4 py-3 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-none transition-all text-sm"
                    value={formData[field.id] || ''}
                    onChange={e => handleFieldChange(field.id, e.target.value)}
                    required={field.required}
                  >
                    <option value="">-- Select Option --</option>
                    {field.options?.map((opt: string) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                )}

                {field.type === 'mcq' && (
                  <div className="space-y-2 pt-1">
                    {field.options?.map((opt: string) => (
                      <label key={opt} className="flex items-center gap-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800 cursor-pointer hover:border-slate-700 transition">
                        <input 
                          type="radio" 
                          name={field.id} 
                          value={opt}
                          checked={formData[field.id] === opt}
                          onChange={e => handleFieldChange(field.id, e.target.value)}
                          required={field.required}
                          className="accent-emerald-500 w-4 h-4"
                        />
                        <span className="text-sm font-medium text-slate-200">{opt}</span>
                      </label>
                    ))}
                  </div>
                )}

                {field.type === 'date' && (
                  <input 
                    type="date"
                    className="w-full bg-slate-950/90 text-white border border-slate-700/80 px-4 py-3 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-none transition-all text-sm"
                    value={formData[field.id] || ''}
                    onChange={e => handleFieldChange(field.id, e.target.value)}
                    required={field.required}
                  />
                )}

                {field.type === 'rating' && (
                  <div className="flex gap-2 pt-1">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star}
                        type="button"
                        className={`text-3xl transition-transform hover:scale-110 ${formData[field.id] >= star ? 'text-amber-400' : 'text-slate-700'}`}
                        onClick={() => handleFieldChange(field.id, star)}
                      >
                        ★
                      </button>
                    ))}
                    {field.required && !formData[field.id] && <input type="hidden" required />}
                  </div>
                )}

                {field.type === 'repeater' && (
                  <div className="mt-2 space-y-4">
                    {(formData[field.id] || []).map((item: any, idx: number) => (
                      <div key={idx} className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 relative shadow-inner">
                        <button
                          type="button"
                          onClick={() => removeRepeaterItem(field.id, idx)}
                          className="absolute top-3 right-3 text-red-400 hover:text-red-300 text-xs font-semibold bg-red-500/10 px-2.5 py-1 rounded-md border border-red-500/20 transition"
                        >
                          Remove
                        </button>
                        <h4 className="font-bold text-slate-300 text-xs uppercase tracking-wider mb-3 pb-2 border-b border-slate-800">
                          Item #{idx + 1}
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {field.subFields?.map((sub: any) => (
                            <div key={sub.id}>
                              <label className="block text-xs font-medium text-slate-400 mb-1">
                                {sub.label} {sub.required && <span className="text-red-400">*</span>}
                              </label>
                              {sub.type === 'short_text' && (
                                <input 
                                  type="text"
                                  className="w-full bg-slate-900 text-white border border-slate-700/80 px-3 py-2 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                                  value={item[sub.id] || ''}
                                  onChange={e => handleRepeaterChange(field.id, idx, sub.id, e.target.value)}
                                  required={sub.required}
                                />
                              )}
                              {sub.type === 'dropdown' && (
                                <select 
                                  className="w-full bg-slate-900 text-white border border-slate-700/80 px-3 py-2 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                                  value={item[sub.id] || ''}
                                  onChange={e => handleRepeaterChange(field.id, idx, sub.id, e.target.value)}
                                  required={sub.required}
                                >
                                  <option value="">-- Select --</option>
                                  {sub.options?.map((o:string) => <option key={o} value={o}>{o}</option>)}
                                </select>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => addRepeaterItem(field.id)}
                      className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 px-4 py-2.5 rounded-xl text-sm font-semibold border border-emerald-500/30 transition flex items-center gap-2"
                    >
                      <span>+</span> Add Item
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <button 
              type="submit" 
              className="w-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-black text-base sm:text-lg py-4 rounded-2xl shadow-xl shadow-emerald-950/60 hover:shadow-emerald-400/20 transition-all transform active:scale-95 flex items-center justify-center gap-2"
            >
              <span>🚀</span> Submit Battle Report
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
