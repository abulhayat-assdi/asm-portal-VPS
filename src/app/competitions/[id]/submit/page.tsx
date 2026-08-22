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
      
      // Fetch students for the batch
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

    // Validate fields
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

  if (loading) return <div className="text-center p-10">Loading...</div>;
  if (!competition) return <div className="text-center p-10">Form not found or inactive.</div>;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-green-600 px-6 py-8 text-white">
          <h1 className="text-3xl font-bold">{competition.title}</h1>
          {competition.description && <p className="mt-2 text-green-100">{competition.description}</p>}
          <div className="mt-4 inline-block bg-green-500 rounded px-3 py-1 text-sm font-semibold">
            Batch: {competition.batchName}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="bg-gray-50 p-4 rounded-lg border">
            <label className="block text-sm font-medium mb-2 text-gray-700">Submission Type</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input type="radio" name="subType" checked={subType === "team"} onChange={() => setSubType("team")} />
                Team-wise
              </label>
              <label className="flex items-center gap-2">
                <input type="radio" name="subType" checked={subType === "individual"} onChange={() => setSubType("individual")} />
                Individual
              </label>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">Roll Number</label>
              <select required className="w-full border p-2 rounded-md" value={rollNumber} onChange={handleRollChange}>
                <option value="">-- Select Roll --</option>
                {students.map(s => (
                  <option key={s.roll} value={s.roll}>{s.roll}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">Student Name</label>
              <input type="text" readOnly className="w-full border p-2 rounded-md bg-gray-100" value={studentName} />
            </div>
          </div>

          {subType === "team" && (
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">Team Name</label>
              <input 
                required 
                type="text" 
                className="w-full border p-2 rounded-md" 
                placeholder="Enter your team name"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
              />
            </div>
          )}

          <hr className="my-6" />

          {competition.schema.map((field: any) => (
            <div key={field.id} className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">
                {field.label} {field.required && <span className="text-red-500">*</span>}
              </label>
              
              {field.type === 'short_text' && (
                <input 
                  type={field.validation === 'number' ? 'number' : 'text'}
                  className="w-full border p-2 rounded-md"
                  value={formData[field.id] || ''}
                  onChange={e => handleFieldChange(field.id, e.target.value)}
                  required={field.required}
                />
              )}

              {field.type === 'long_text' && (
                <textarea 
                  className="w-full border p-2 rounded-md"
                  rows={4}
                  value={formData[field.id] || ''}
                  onChange={e => handleFieldChange(field.id, e.target.value)}
                  required={field.required}
                />
              )}

              {field.type === 'dropdown' && (
                <select 
                  className="w-full border p-2 rounded-md"
                  value={formData[field.id] || ''}
                  onChange={e => handleFieldChange(field.id, e.target.value)}
                  required={field.required}
                >
                  <option value="">-- Select --</option>
                  {field.options?.map((opt: string) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              )}

              {field.type === 'mcq' && (
                <div className="space-y-2">
                  {field.options?.map((opt: string) => (
                    <label key={opt} className="flex items-center gap-2">
                      <input 
                        type="radio" 
                        name={field.id} 
                        value={opt}
                        checked={formData[field.id] === opt}
                        onChange={e => handleFieldChange(field.id, e.target.value)}
                        required={field.required}
                      />
                      {opt}
                    </label>
                  ))}
                </div>
              )}

              {field.type === 'date' && (
                <input 
                  type="date"
                  className="w-full border p-2 rounded-md"
                  value={formData[field.id] || ''}
                  onChange={e => handleFieldChange(field.id, e.target.value)}
                  required={field.required}
                />
              )}

              {field.type === 'rating' && (
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      className={`text-3xl ${formData[field.id] >= star ? 'text-yellow-400' : 'text-gray-300'}`}
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
                    <div key={idx} className="bg-white p-4 rounded-md border border-gray-200 relative shadow-sm">
                      <button
                        type="button"
                        onClick={() => removeRepeaterItem(field.id, idx)}
                        className="absolute top-2 right-2 text-red-500 hover:text-red-700 text-sm font-semibold"
                      >
                        Remove
                      </button>
                      <h4 className="font-bold text-gray-700 mb-3 border-b pb-1">Item #{idx + 1}</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {field.subFields?.map((sub: any) => (
                          <div key={sub.id}>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              {sub.label} {sub.required && <span className="text-red-500">*</span>}
                            </label>
                            {sub.type === 'short_text' && (
                              <input 
                                type="text"
                                className="w-full border p-2 rounded-md text-sm"
                                value={item[sub.id] || ''}
                                onChange={e => handleRepeaterChange(field.id, idx, sub.id, e.target.value)}
                                required={sub.required}
                              />
                            )}
                            {sub.type === 'dropdown' && (
                              <select 
                                className="w-full border p-2 rounded-md text-sm"
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
                    className="bg-green-100 text-green-700 hover:bg-green-200 px-4 py-2 rounded-md text-sm font-semibold border border-green-200 transition"
                  >
                    + Add Another
                  </button>
                </div>
              )}
            </div>
          ))}

          <div className="pt-4">
            <button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-md transition shadow-md">
              Submit Report
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
