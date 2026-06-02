"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm, useFieldArray, Controller, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import toast from "react-hot-toast";
import compressImage from "browser-image-compression";
import { cvFormSchema, type CvFormData, type CvDraftFull } from "@/lib/cv/schemas";
import {
    SECTION_LABELS,
    BLOOD_GROUPS,
    MARITAL_STATUSES,
    LANGUAGE_PROFICIENCY_LEVELS,
    RELIGIONS,
    NATIONALITIES,
    AUTOSAVE_DEBOUNCE_MS,
    type TemplateConfig,
} from "@/lib/cv/constants";

// ─── Helpers ────────────────────────────────────────────────────────────────

function inputCls(extra = "") {
    return `block w-full py-2.5 px-4 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:border-[#059669] focus:ring-1 focus:ring-[#059669] outline-none text-sm transition-all ${extra}`;
}
function labelCls() { return "block text-sm font-semibold text-gray-700 mb-1.5"; }

// ─── Section collapse state ──────────────────────────────────────────────────

function CollapsibleSection({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
    const [open, setOpen] = useState(defaultOpen);
    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition-colors"
            >
                <span className="font-bold text-gray-900">{title}</span>
                <svg className={`w-5 h-5 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>
            {open && <div className="px-5 pb-5 space-y-4">{children}</div>}
        </div>
    );
}

// ─── Tag Input ────────────────────────────────────────────────────────────────

function TagInput({ value, onChange, placeholder }: { value: string[]; onChange: (v: string[]) => void; placeholder?: string }) {
    const [input, setInput] = useState("");
    const addTag = () => {
        const tag = input.trim();
        if (tag && !value.includes(tag)) onChange([...value, tag]);
        setInput("");
    };
    return (
        <div>
            <div className="flex flex-wrap gap-2 mb-2">
                {value.map((tag, i) => (
                    <span key={i} className="flex items-center gap-1 bg-[#d1fae5] text-[#065f46] text-xs font-semibold px-3 py-1.5 rounded-full">
                        {tag}
                        <button type="button" onClick={() => onChange(value.filter((_, j) => j !== i))} className="hover:text-red-500 font-bold ml-1">×</button>
                    </span>
                ))}
            </div>
            <div className="flex gap-2">
                <input
                    className={inputCls("flex-1")}
                    placeholder={placeholder ?? "Type and press Enter"}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
                />
                <button type="button" onClick={addTag} className="px-4 py-2.5 bg-[#059669] text-white text-sm font-bold rounded-xl hover:bg-[#047857]">Add</button>
            </div>
        </div>
    );
}

// ─── CV Preview ────────────────────────────────────────────────────────────────

function CvPreview({ data, config }: { data: CvFormData; config: TemplateConfig }) {
    const sw = config.sidebarWidth || 38;
    const color = config.sidebarColor || "#1e3a5f";
    const initial = data.fullName?.charAt(0)?.toUpperCase() ?? "?";
    const sections = data.sectionOrder?.length
        ? data.sectionOrder
        : ["workExperience", "training", "education", "languages", "references", "skills", "hobbies"];

    const sSH: React.CSSProperties = {
        color: "rgba(255,255,255,0.75)", fontWeight: 700, fontSize: "0.5rem",
        textTransform: "uppercase", letterSpacing: "0.1em",
        borderBottom: "1px solid rgba(255,255,255,0.3)", paddingBottom: 2, marginBottom: 5,
    };
    const mSH = (c: string): React.CSSProperties => ({
        fontWeight: 700, fontSize: "0.6rem", textTransform: "uppercase",
        letterSpacing: "0.07em", borderBottom: `1.5px solid ${c}`,
        paddingBottom: 2, marginBottom: 6, color: c,
    });

    const personalData = [
        { label: "Date of Birth", value: data.dateOfBirth },
        { label: "Blood Group",   value: data.bloodGroup },
        { label: "Religion",      value: data.religion },
        { label: "Marital Status",value: data.maritalStatus },
        { label: "Nationality",   value: data.nationality },
    ].filter(f => f.value);

    function renderMainSection(key: string) {
        switch (key) {
            case "workExperience":
                return data.workExperience?.length ? (
                    <div key="we">
                        <h4 style={mSH(color)}>{SECTION_LABELS.workExperience}</h4>
                        {data.workExperience.map((item, i) => (
                            <div key={i} style={{ marginBottom: 6 }}>
                                <p style={{ fontWeight: 700, fontSize: "0.62rem", color: "#1a1a1a" }}>{item.jobTitle}</p>
                                <p style={{ fontSize: "0.57rem", color: "#555", fontStyle: "italic" }}>{item.company}{item.location ? `, ${item.location}` : ""}</p>
                                {item.bullets?.map((b, j) => b && <p key={j} style={{ fontSize: "0.57rem", color: "#444", paddingLeft: 8 }}>• {b}</p>)}
                            </div>
                        ))}
                    </div>
                ) : null;
            case "training":
                return data.training?.length ? (
                    <div key="tr">
                        <h4 style={mSH(color)}>{SECTION_LABELS.training}</h4>
                        {data.training.map((item, i) => (
                            <div key={i} style={{ marginBottom: 6 }}>
                                <p style={{ fontWeight: 700, fontSize: "0.62rem", color: "#1a1a1a" }}>{item.trainingName}</p>
                                <p style={{ fontSize: "0.57rem", color: "#555", fontStyle: "italic" }}>{item.institute}{item.year ? ` (${item.year})` : ""}</p>
                                {item.bullets?.map((b, j) => b && <p key={j} style={{ fontSize: "0.57rem", color: "#444", paddingLeft: 8 }}>• {b}</p>)}
                            </div>
                        ))}
                    </div>
                ) : null;
            case "education":
                return data.education?.length ? (
                    <div key="edu">
                        <h4 style={mSH(color)}>{SECTION_LABELS.education}</h4>
                        {data.education.map((item, i) => (
                            <div key={i} style={{ marginBottom: 6 }}>
                                <p style={{ fontWeight: 700, fontSize: "0.62rem", color: "#1a1a1a" }}>{item.degree}{item.department ? ` — ${item.department}` : ""}</p>
                                <div style={{ display: "flex", justifyContent: "space-between" }}>
                                    <p style={{ fontSize: "0.57rem", color: "#555", fontStyle: "italic" }}>{item.institution}</p>
                                    {item.year && <p style={{ fontSize: "0.55rem", color: "#888" }}>{item.year}</p>}
                                </div>
                                {item.gpa && <p style={{ fontSize: "0.55rem", color: "#888" }}>GPA: {item.gpa}</p>}
                            </div>
                        ))}
                    </div>
                ) : null;
            case "references":
                return data.references?.length ? (
                    <div key="ref">
                        <h4 style={mSH(color)}>{SECTION_LABELS.references}</h4>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                            {data.references.map((ref, i) => (
                                <div key={i}>
                                    <p style={{ fontWeight: 700, fontSize: "0.6rem", color: "#1a1a1a" }}>{ref.name}</p>
                                    {ref.title && <p style={{ fontSize: "0.55rem", color: "#555" }}>{ref.title}</p>}
                                    {ref.organization && <p style={{ fontSize: "0.55rem", color: "#555" }}>{ref.organization}</p>}
                                    {ref.phone && <p style={{ fontSize: "0.53rem", color: "#777" }}>Phone : {ref.phone}</p>}
                                    {ref.email && <p style={{ fontSize: "0.53rem", color: "#777" }}>Email : {ref.email}</p>}
                                </div>
                            ))}
                        </div>
                    </div>
                ) : null;
            default: return null;
        }
    }

    return (
        <div style={{ background: "#fff", overflow: "hidden", fontSize: "0.72rem", fontFamily: "sans-serif", height: "100%", minHeight: 400 }}>
            <div style={{ display: "flex", flexDirection: "row", height: "100%", minHeight: 400 }}>

                {/* ── Sidebar ── */}
                <div style={{ flexShrink: 0, width: `${sw}%`, minWidth: `${sw}%`, backgroundColor: color, padding: "12px 10px", color: "#fff", display: "flex", flexDirection: "column", gap: 8, boxSizing: "border-box" }}>

                    {/* Photo */}
                    {config.showPhoto && (
                        <div style={{ alignSelf: "center" }}>
                            <div style={{ width: 52, height: 52, borderRadius: config.photoShape === "circle" ? "50%" : "6px", backgroundColor: "rgba(255,255,255,0.2)", border: "2px solid rgba(255,255,255,0.4)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                                {data.profilePhoto
                                    ? <img src={data.profilePhoto} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                    : <span style={{ fontWeight: 900, fontSize: "1.2rem", color: "#fff" }}>{initial}</span>}
                            </div>
                        </div>
                    )}
                    {data.fullName && <p style={{ fontWeight: 900, textAlign: "center", fontSize: "0.68rem", lineHeight: 1.3, color: "#fff" }}>{data.fullName}</p>}

                    {(data.phone || data.email || data.address) && (
                        <div>
                            <p style={sSH}>Contact</p>
                            {data.phone && <p style={{ color: "rgba(255,255,255,0.9)", fontSize: "0.55rem", marginBottom: 2 }}>✆ {data.phone}</p>}
                            {data.email && <p style={{ color: "rgba(255,255,255,0.9)", fontSize: "0.55rem", marginBottom: 2, wordBreak: "break-all" }}>✉ {data.email}</p>}
                            {data.address && <p style={{ color: "rgba(255,255,255,0.9)", fontSize: "0.55rem" }}>⌂ {data.address}</p>}
                        </div>
                    )}

                    {data.skills?.length > 0 && (
                        <div>
                            <p style={sSH}>Skills</p>
                            {data.skills.map((sk, i) => (
                                <p key={i} style={{ color: "rgba(255,255,255,0.9)", fontSize: "0.55rem", marginBottom: 2 }}>• {sk}</p>
                            ))}
                        </div>
                    )}

                    {data.languages?.length > 0 && (
                        <div>
                            <p style={sSH}>Languages</p>
                            {data.languages.map((l, i) => (
                                <div key={i} style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                                    <span style={{ color: "rgba(255,255,255,0.9)", fontSize: "0.55rem" }}>{l.name}</span>
                                    <span style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.52rem" }}>{l.level}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {data.hobbies?.length > 0 && (
                        <div>
                            <p style={sSH}>Hobbies</p>
                            {data.hobbies.map((h, i) => (
                                <p key={i} style={{ color: "rgba(255,255,255,0.9)", fontSize: "0.55rem", marginBottom: 2 }}>• {h}</p>
                            ))}
                        </div>
                    )}

                    {personalData.length > 0 && (
                        <div>
                            <p style={sSH}>Personal Data</p>
                            {personalData.map((f, i) => (
                                <div key={i} style={{ display: "flex", gap: 3, marginBottom: 2 }}>
                                    <span style={{ color: "rgba(255,255,255,0.65)", fontSize: "0.52rem", minWidth: 54 }}>{f.label} :</span>
                                    <span style={{ color: "rgba(255,255,255,0.9)", fontSize: "0.52rem", flex: 1 }}>{f.value}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* ── Main ── */}
                <div style={{ flex: 1, minWidth: 0, padding: "12px 14px", display: "flex", flexDirection: "column", gap: 8, boxSizing: "border-box" }}>
                    {data.fullName && <p style={{ fontWeight: 900, fontSize: "0.9rem", color, marginBottom: 2 }}>{data.fullName}</p>}

                    {data.careerObjective && (
                        <div>
                            <h4 style={mSH(color)}>Career Objective</h4>
                            <p style={{ fontSize: "0.58rem", color: "#333", lineHeight: 1.6 }}>{data.careerObjective}</p>
                        </div>
                    )}

                    {sections.filter(k => !["skills", "hobbies", "languages"].includes(k)).map(renderMainSection)}

                    {data.declaration && (
                        <div style={{ borderTop: "1px solid #e5e7eb", paddingTop: 6, marginTop: 4 }}>
                            <p style={{ fontSize: "0.55rem", color: "#444", lineHeight: 1.5, fontStyle: "italic" }}>{data.declaration}</p>
                            {data.signature && <p style={{ fontSize: "0.6rem", color: "#222", fontWeight: 700, textAlign: "right", marginTop: 4 }}>{data.signature}</p>}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// ─── Version History Modal ────────────────────────────────────────────────────

function VersionHistoryModal({ draftId, onClose, onRestore }: { draftId: string; onClose: () => void; onRestore: (draft: CvFormData) => void }) {
    const [versions, setVersions] = useState<{ id: string; label: string | null; createdAt: string }[]>([]);
    const [loading, setLoading] = useState(true);
    const [restoring, setRestoring] = useState<string | null>(null);

    useEffect(() => {
        fetch(`/api/cv/${draftId}/versions`)
            .then((r) => r.json())
            .then((d) => setVersions(Array.isArray(d) ? d : []))
            .catch(() => toast.error("Failed to load versions"))
            .finally(() => setLoading(false));
    }, [draftId]);

    const handleRestore = async (versionId: string) => {
        setRestoring(versionId);
        try {
            const res = await fetch(`/api/cv/${draftId}/versions`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ versionId }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to restore");
            onRestore(data as CvFormData);
            toast.success("Version restored!");
            onClose();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Restore failed");
        } finally {
            setRestoring(null);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col max-h-[80vh]">
                <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="font-bold text-gray-900">Version History</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    {loading && <p className="text-center text-gray-400 py-8">Loading...</p>}
                    {!loading && versions.length === 0 && (
                        <p className="text-center text-gray-400 py-8">No saved versions yet.<br /><span className="text-sm">Use the Save Version button to create a snapshot.</span></p>
                    )}
                    {versions.map((v) => (
                        <div key={v.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                            <div>
                                <p className="font-semibold text-sm text-gray-800">{v.label || "Unnamed version"}</p>
                                <p className="text-xs text-gray-400">{new Date(v.createdAt).toLocaleString()}</p>
                            </div>
                            <button
                                onClick={() => handleRestore(v.id)}
                                disabled={restoring === v.id}
                                className="px-3 py-1.5 bg-[#059669] text-white text-xs font-bold rounded-lg hover:bg-[#047857] disabled:opacity-50"
                            >
                                {restoring === v.id ? "Restoring..." : "Restore"}
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// ─── Main Editor ─────────────────────────────────────────────────────────────

export default function CvEditorPage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;

    const [draft, setDraft] = useState<CvDraftFull | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<"form" | "preview">("form");
    const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "unsaved">("saved");
    const [showVersions, setShowVersions] = useState(false);
    const [downloading, setDownloading] = useState(false);
    const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const config: TemplateConfig = draft?.template?.config ?? {
        primaryColor: "#1e3a5f",
        sidebarColor: "#1e3a5f",
        sidebarWidth: 35,
        fontFamily: "Helvetica",
        photoShape: "circle",
        showPhoto: true,
    };

    const form = useForm<CvFormData>({
        resolver: zodResolver(cvFormSchema) as Resolver<CvFormData>,
        defaultValues: {
            title: "My CV",
            fullName: "", profilePhoto: "", careerObjective: "",
            phone: "", email: "", address: "",
            dateOfBirth: "", bloodGroup: "", religion: "", maritalStatus: "", nationality: "",
            skills: [], languages: [], hobbies: [],
            workExperience: [], training: [], education: [], references: [],
            declaration: "", signature: "",
            sectionOrder: ["workExperience","training","education","languages","references","skills","hobbies"],
        },
    });

    const { fields: weFields, append: appendWe, remove: removeWe } = useFieldArray({ control: form.control, name: "workExperience" });
    const { fields: trainingFields, append: appendTraining, remove: removeTraining } = useFieldArray({ control: form.control, name: "training" });
    const { fields: eduFields, append: appendEdu, remove: removeEdu } = useFieldArray({ control: form.control, name: "education" });
    const { fields: refFields, append: appendRef, remove: removeRef } = useFieldArray({ control: form.control, name: "references" });
    const { fields: langFields, append: appendLang, remove: removeLang } = useFieldArray({ control: form.control, name: "languages" });

    // Load draft
    useEffect(() => {
        fetch(`/api/cv/${id}`)
            .then((r) => { if (!r.ok) throw new Error("Not found"); return r.json(); })
            .then((data: CvDraftFull) => {
                setDraft(data);
                const sectionOrder = Array.isArray(data.sectionOrder) && data.sectionOrder.length
                    ? data.sectionOrder as string[]
                    : ["workExperience","training","education","languages","references","skills","hobbies"];
                form.reset({
                    title: data.title ?? "My CV",
                    fullName: data.fullName ?? "",
                    profilePhoto: data.profilePhoto ?? "",
                    careerObjective: data.careerObjective ?? "",
                    phone: data.phone ?? "",
                    email: data.email ?? "",
                    address: data.address ?? "",
                    dateOfBirth: data.dateOfBirth ?? "",
                    bloodGroup: data.bloodGroup ?? "",
                    religion: data.religion ?? "",
                    maritalStatus: data.maritalStatus ?? "",
                    nationality: data.nationality ?? "",
                    skills: (data.skills as string[]) ?? [],
                    languages: (data.languages as CvFormData["languages"]) ?? [],
                    hobbies: (data.hobbies as string[]) ?? [],
                    workExperience: (data.workExperience as CvFormData["workExperience"]) ?? [],
                    training: (data.training as CvFormData["training"]) ?? [],
                    education: (data.education as CvFormData["education"]) ?? [],
                    references: (data.references as CvFormData["references"]) ?? [],
                    declaration: data.declaration ?? "",
                    signature: data.signature ?? "",
                    sectionOrder,
                });
            })
            .catch(() => { toast.error("Failed to load CV"); router.push("/student-dashboard/cv"); })
            .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    // Auto-save
    const triggerAutoSave = useCallback((values: CvFormData) => {
        setSaveStatus("unsaved");
        if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
        autoSaveTimerRef.current = setTimeout(async () => {
            setSaveStatus("saving");
            try {
                await fetch(`/api/cv/${id}/auto-save`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(values),
                });
                setSaveStatus("saved");
            } catch {
                setSaveStatus("unsaved");
            }
        }, AUTOSAVE_DEBOUNCE_MS);
    }, [id]);

    useEffect(() => {
        const subscription = form.watch((values) => {
            triggerAutoSave(values as CvFormData);
        });
        return () => subscription.unsubscribe();
    }, [form, triggerAutoSave]);

    // Manual save
    const handleManualSave = form.handleSubmit(async (values) => {
        if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
        setSaveStatus("saving");
        try {
            const res = await fetch(`/api/cv/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(values),
            });
            if (!res.ok) throw new Error("Save failed");
            setSaveStatus("saved");
            toast.success("CV saved!");
        } catch {
            setSaveStatus("unsaved");
            toast.error("Failed to save CV");
        }
    });

    // Save version
    const handleSaveVersion = async () => {
        const label = prompt("Version label (optional):");
        if (label === null) return; // Cancelled
        try {
            await fetch(`/api/cv/${id}/versions`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ label: label || undefined }),
            });
            toast.success("Version saved!");
        } catch {
            toast.error("Failed to save version");
        }
    };

    // Download PDF — client-side generation using @react-pdf/renderer in browser
    const handleDownload = async () => {
        setDownloading(true);
        try {
            const values = form.getValues();
            const fullData: CvDraftFull = {
                ...values,
                id,
                userId: "",
                templateId: draft?.templateId ?? "",
                downloadCount: draft?.downloadCount ?? 0,
                shareSlug: draft?.shareSlug,
                isPublic: draft?.isPublic ?? false,
                createdAt: draft?.createdAt ?? "",
                updatedAt: draft?.updatedAt ?? "",
                template: draft?.template,
            };
            // Dynamic import so the library is only loaded on button click (avoids SSR)
            const { generateCvPdf } = await import("@/lib/cv/pdf/generatePdf");
            await generateCvPdf(fullData);
            await fetch(`/api/cv/${id}/download`, { method: "POST" }).catch(() => {});
        } catch (err) {
            console.error("[PDF client]", err);
            toast.error("Failed to generate PDF");
        } finally {
            setDownloading(false);
        }
    };

    // Profile photo upload
    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            const compressed = await compressImage(file, { maxSizeMB: 0.3, maxWidthOrHeight: 400, useWebWorker: true });
            const reader = new FileReader();
            reader.onload = () => {
                form.setValue("profilePhoto", reader.result as string);
            };
            reader.readAsDataURL(compressed);
        } catch {
            toast.error("Failed to process image");
        }
    };

    // Drag-and-drop section reorder
    const handleDragEnd = (result: DropResult) => {
        if (!result.destination) return;
        const current = form.getValues("sectionOrder");
        const reordered = Array.from(current);
        const [moved] = reordered.splice(result.source.index, 1);
        reordered.splice(result.destination.index, 0, moved);
        form.setValue("sectionOrder", reordered, { shouldDirty: true });
    };

    // Restore from version
    const handleRestored = (restored: CvFormData) => {
        form.reset(restored);
        setSaveStatus("unsaved");
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#059669]" />
            </div>
        );
    }

    const sectionOrder = form.watch("sectionOrder");
    const watchedValues = form.watch();

    return (
        <div className="max-w-screen-xl mx-auto pb-12">
            {/* Top toolbar */}
            <div className="sticky top-16 z-30 bg-white border-b border-gray-100 shadow-sm mb-6 rounded-xl overflow-hidden">
                <div className="flex items-center gap-3 px-4 py-3 flex-wrap">
                    {/* Editable title */}
                    <input
                        {...form.register("title")}
                        className="flex-1 min-w-0 font-bold text-gray-900 bg-transparent outline-none border-b-2 border-transparent focus:border-[#059669] py-1 text-sm"
                        placeholder="CV Title"
                    />

                    {/* Save status */}
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full flex-shrink-0 ${
                        saveStatus === "saved" ? "bg-green-50 text-green-600" :
                        saveStatus === "saving" ? "bg-yellow-50 text-yellow-600 animate-pulse" :
                        "bg-red-50 text-red-600"
                    }`}>
                        {saveStatus === "saved" ? "Saved" : saveStatus === "saving" ? "Saving..." : "Unsaved"}
                    </span>

                    <div className="flex items-center gap-2 flex-shrink-0">
                        {/* Mobile tab toggle */}
                        <div className="flex lg:hidden bg-gray-100 rounded-lg p-0.5">
                            <button onClick={() => setActiveTab("form")} className={`px-3 py-1.5 text-xs font-bold rounded-md ${activeTab === "form" ? "bg-white shadow-sm" : "text-gray-500"}`}>Edit</button>
                            <button onClick={() => setActiveTab("preview")} className={`px-3 py-1.5 text-xs font-bold rounded-md ${activeTab === "preview" ? "bg-white shadow-sm" : "text-gray-500"}`}>Preview</button>
                        </div>

                        <button onClick={handleSaveVersion} className="px-3 py-2 bg-gray-100 text-gray-700 text-xs font-bold rounded-xl hover:bg-gray-200">
                            Save Version
                        </button>
                        <button onClick={() => setShowVersions(true)} className="px-3 py-2 bg-gray-100 text-gray-700 text-xs font-bold rounded-xl hover:bg-gray-200">
                            History
                        </button>
                        <button onClick={() => handleManualSave()} className="px-3 py-2 bg-[#059669] text-white text-xs font-bold rounded-xl hover:bg-[#047857]">
                            Save
                        </button>
                        <button
                            onClick={handleDownload}
                            disabled={downloading}
                            className="px-3 py-2 bg-[#1e3a5f] text-white text-xs font-bold rounded-xl hover:bg-[#152d4a] disabled:opacity-50 flex items-center gap-1"
                        >
                            {downloading ? (
                                <><span className="animate-spin rounded-full h-3 w-3 border-b border-white inline-block" /> Generating...</>
                            ) : (
                                <><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg> PDF</>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Two-panel layout */}
            <div className="flex gap-6">
                {/* Form panel */}
                <div className={`w-full lg:w-1/2 space-y-4 ${activeTab === "preview" ? "hidden lg:block" : ""}`}>
                    {/* Personal Info */}
                    <CollapsibleSection title="Personal Information" defaultOpen>
                        <div>
                            <label className={labelCls()}>Full Name</label>
                            <input {...form.register("fullName")} className={inputCls()} placeholder="Your full name" />
                        </div>
                        <div>
                            <label className={labelCls()}>Career Objective</label>
                            <textarea {...form.register("careerObjective")} className={inputCls("min-h-[80px] resize-y")} rows={3} placeholder="Brief professional summary..." />
                        </div>
                        <div>
                            <label className={labelCls()}>Profile Photo</label>
                            <div className="flex items-center gap-3">
                                {watchedValues.profilePhoto && (
                                    <img src={watchedValues.profilePhoto} alt="Profile" className="w-12 h-12 rounded-full object-cover border-2 border-gray-200" />
                                )}
                                <input type="file" accept="image/*" onChange={handlePhotoUpload} className="text-sm text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-[#d1fae5] file:text-[#065f46] file:font-bold hover:file:bg-[#a7f3d0]" />
                                {watchedValues.profilePhoto && (
                                    <button type="button" onClick={() => form.setValue("profilePhoto", "")} className="text-xs text-red-500 hover:underline">Remove</button>
                                )}
                            </div>
                        </div>
                    </CollapsibleSection>

                    {/* Contact */}
                    <CollapsibleSection title="Contact Information">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className={labelCls()}>Phone (BD)</label>
                                <input {...form.register("phone")} className={inputCls()} placeholder="01XXXXXXXXX" />
                                {form.formState.errors.phone && <p className="text-red-500 text-xs mt-1">{form.formState.errors.phone.message}</p>}
                            </div>
                            <div>
                                <label className={labelCls()}>Email</label>
                                <input {...form.register("email")} type="email" className={inputCls()} placeholder="you@email.com" />
                            </div>
                        </div>
                        <div>
                            <label className={labelCls()}>Address</label>
                            <input {...form.register("address")} className={inputCls()} placeholder="City, Country" />
                        </div>
                    </CollapsibleSection>

                    {/* Personal Data */}
                    <CollapsibleSection title="Personal Data">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className={labelCls()}>Date of Birth</label>
                                <input type="date" {...form.register("dateOfBirth")} className={inputCls()} />
                            </div>
                            <div>
                                <label className={labelCls()}>Blood Group</label>
                                <select {...form.register("bloodGroup")} className={inputCls()}>
                                    <option value="">Select</option>
                                    {BLOOD_GROUPS.map((g) => <option key={g}>{g}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className={labelCls()}>Marital Status</label>
                                <select {...form.register("maritalStatus")} className={inputCls()}>
                                    <option value="">Select</option>
                                    {MARITAL_STATUSES.map((s) => <option key={s}>{s}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className={labelCls()}>Religion</label>
                                <select {...form.register("religion")} className={inputCls()}>
                                    <option value="">Select</option>
                                    {RELIGIONS.map((r) => <option key={r}>{r}</option>)}
                                </select>
                            </div>
                            <div className="col-span-2">
                                <label className={labelCls()}>Nationality</label>
                                <select {...form.register("nationality")} className={inputCls()}>
                                    <option value="">Select</option>
                                    {NATIONALITIES.map((n) => <option key={n}>{n}</option>)}
                                </select>
                            </div>
                        </div>
                    </CollapsibleSection>

                    {/* Skills */}
                    <CollapsibleSection title="Skills">
                        <Controller
                            control={form.control}
                            name="skills"
                            render={({ field }) => (
                                <TagInput value={field.value} onChange={field.onChange} placeholder="Add a skill (e.g. Excel, Photoshop)" />
                            )}
                        />
                    </CollapsibleSection>

                    {/* Languages */}
                    <CollapsibleSection title="Languages">
                        {langFields.map((field, index) => (
                            <div key={field.id} className="grid grid-cols-2 gap-3 p-3 bg-gray-50 rounded-xl">
                                <div>
                                    <label className={labelCls()}>Language</label>
                                    <input {...form.register(`languages.${index}.name`)} className={inputCls()} placeholder="e.g. English" />
                                </div>
                                <div>
                                    <label className={labelCls()}>Level</label>
                                    <select {...form.register(`languages.${index}.level`)} className={inputCls()}>
                                        <option value="">Select</option>
                                        {LANGUAGE_PROFICIENCY_LEVELS.map((l) => <option key={l}>{l}</option>)}
                                    </select>
                                </div>
                                <button type="button" onClick={() => removeLang(index)} className="col-span-2 text-xs text-red-500 hover:underline text-right">Remove</button>
                            </div>
                        ))}
                        <button type="button" onClick={() => appendLang({ name: "", level: "" })} className="w-full py-2 border-2 border-dashed border-gray-200 text-gray-500 rounded-xl text-sm font-semibold hover:border-[#059669] hover:text-[#059669]">
                            + Add Language
                        </button>
                    </CollapsibleSection>

                    {/* Hobbies */}
                    <CollapsibleSection title="Hobbies & Interests">
                        <Controller
                            control={form.control}
                            name="hobbies"
                            render={({ field }) => (
                                <TagInput value={field.value} onChange={field.onChange} placeholder="Add a hobby (e.g. Reading, Photography)" />
                            )}
                        />
                    </CollapsibleSection>

                    {/* Work Experience */}
                    <CollapsibleSection title="Work Experience">
                        {weFields.map((field, index) => (
                            <div key={field.id} className="p-4 bg-gray-50 rounded-xl space-y-3">
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className={labelCls()}>Job Title</label>
                                        <input {...form.register(`workExperience.${index}.jobTitle`)} className={inputCls()} placeholder="Sales Manager" />
                                    </div>
                                    <div>
                                        <label className={labelCls()}>Company</label>
                                        <input {...form.register(`workExperience.${index}.company`)} className={inputCls()} placeholder="Company Name" />
                                    </div>
                                    <div>
                                        <label className={labelCls()}>Location</label>
                                        <input {...form.register(`workExperience.${index}.location`)} className={inputCls()} placeholder="Dhaka, BD" />
                                    </div>
                                    <div>
                                        <label className={labelCls()}>Start Date</label>
                                        <input {...form.register(`workExperience.${index}.startDate`)} className={inputCls()} placeholder="Jan 2022" />
                                    </div>
                                    <div>
                                        <label className={labelCls()}>End Date</label>
                                        <input {...form.register(`workExperience.${index}.endDate`)} className={inputCls()} placeholder="Present" />
                                    </div>
                                </div>
                                <div>
                                    <label className={labelCls()}>Bullet Points (one per line)</label>
                                    <Controller
                                        control={form.control}
                                        name={`workExperience.${index}.bullets`}
                                        render={({ field }) => (
                                            <textarea
                                                className={inputCls("min-h-[80px] resize-y")}
                                                placeholder="Achieved 150% of sales target&#10;Managed a team of 5 people"
                                                value={field.value.join("\n")}
                                                onChange={(e) => field.onChange(e.target.value.split("\n"))}
                                            />
                                        )}
                                    />
                                </div>
                                <button type="button" onClick={() => removeWe(index)} className="text-xs text-red-500 hover:underline">Remove this entry</button>
                            </div>
                        ))}
                        <button type="button" onClick={() => appendWe({ jobTitle: "", company: "", location: "", startDate: "", endDate: "", bullets: [] })} className="w-full py-2 border-2 border-dashed border-gray-200 text-gray-500 rounded-xl text-sm font-semibold hover:border-[#059669] hover:text-[#059669]">
                            + Add Work Experience
                        </button>
                    </CollapsibleSection>

                    {/* Training */}
                    <CollapsibleSection title="Training">
                        {trainingFields.map((field, index) => (
                            <div key={field.id} className="p-4 bg-gray-50 rounded-xl space-y-3">
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className={labelCls()}>Training Name</label>
                                        <input {...form.register(`training.${index}.trainingName`)} className={inputCls()} placeholder="Digital Marketing" />
                                    </div>
                                    <div>
                                        <label className={labelCls()}>Institute</label>
                                        <input {...form.register(`training.${index}.institute`)} className={inputCls()} placeholder="Institute Name" />
                                    </div>
                                    <div>
                                        <label className={labelCls()}>Year</label>
                                        <input {...form.register(`training.${index}.year`)} className={inputCls()} placeholder="2023" />
                                    </div>
                                </div>
                                <div>
                                    <label className={labelCls()}>Bullet Points (one per line)</label>
                                    <Controller
                                        control={form.control}
                                        name={`training.${index}.bullets`}
                                        render={({ field }) => (
                                            <textarea
                                                className={inputCls("min-h-[60px] resize-y")}
                                                placeholder="Learned Google Ads&#10;Completed Facebook Ads certification"
                                                value={field.value.join("\n")}
                                                onChange={(e) => field.onChange(e.target.value.split("\n"))}
                                            />
                                        )}
                                    />
                                </div>
                                <button type="button" onClick={() => removeTraining(index)} className="text-xs text-red-500 hover:underline">Remove this entry</button>
                            </div>
                        ))}
                        <button type="button" onClick={() => appendTraining({ trainingName: "", institute: "", year: "", bullets: [] })} className="w-full py-2 border-2 border-dashed border-gray-200 text-gray-500 rounded-xl text-sm font-semibold hover:border-[#059669] hover:text-[#059669]">
                            + Add Training
                        </button>
                    </CollapsibleSection>

                    {/* Education */}
                    <CollapsibleSection title="Education">
                        {eduFields.map((field, index) => (
                            <div key={field.id} className="p-4 bg-gray-50 rounded-xl space-y-3">
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className={labelCls()}>Degree</label>
                                        <input {...form.register(`education.${index}.degree`)} className={inputCls()} placeholder="BBA, BSc in CS" />
                                    </div>
                                    <div>
                                        <label className={labelCls()}>Department</label>
                                        <input {...form.register(`education.${index}.department`)} className={inputCls()} placeholder="Marketing" />
                                    </div>
                                    <div className="col-span-2">
                                        <label className={labelCls()}>Institution</label>
                                        <input {...form.register(`education.${index}.institution`)} className={inputCls()} placeholder="University Name" />
                                    </div>
                                    <div>
                                        <label className={labelCls()}>GPA</label>
                                        <input {...form.register(`education.${index}.gpa`)} className={inputCls()} placeholder="3.8" />
                                    </div>
                                    <div>
                                        <label className={labelCls()}>Year</label>
                                        <input {...form.register(`education.${index}.year`)} className={inputCls()} placeholder="2022" />
                                    </div>
                                </div>
                                <button type="button" onClick={() => removeEdu(index)} className="text-xs text-red-500 hover:underline">Remove this entry</button>
                            </div>
                        ))}
                        <button type="button" onClick={() => appendEdu({ degree: "", department: "", institution: "", gpa: "", year: "" })} className="w-full py-2 border-2 border-dashed border-gray-200 text-gray-500 rounded-xl text-sm font-semibold hover:border-[#059669] hover:text-[#059669]">
                            + Add Education
                        </button>
                    </CollapsibleSection>

                    {/* References */}
                    <CollapsibleSection title="References">
                        {refFields.map((field, index) => (
                            <div key={field.id} className="p-4 bg-gray-50 rounded-xl space-y-3">
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className={labelCls()}>Name</label>
                                        <input {...form.register(`references.${index}.name`)} className={inputCls()} placeholder="Dr. John Doe" />
                                    </div>
                                    <div>
                                        <label className={labelCls()}>Title / Designation</label>
                                        <input {...form.register(`references.${index}.title`)} className={inputCls()} placeholder="Professor" />
                                    </div>
                                    <div>
                                        <label className={labelCls()}>Organization</label>
                                        <input {...form.register(`references.${index}.organization`)} className={inputCls()} placeholder="University Name" />
                                    </div>
                                    <div>
                                        <label className={labelCls()}>Phone</label>
                                        <input {...form.register(`references.${index}.phone`)} className={inputCls()} placeholder="01XXXXXXXXX" />
                                    </div>
                                    <div>
                                        <label className={labelCls()}>Email</label>
                                        <input {...form.register(`references.${index}.email`)} className={inputCls()} placeholder="ref@email.com" />
                                    </div>
                                </div>
                                <button type="button" onClick={() => removeRef(index)} className="text-xs text-red-500 hover:underline">Remove this entry</button>
                            </div>
                        ))}
                        <button type="button" onClick={() => appendRef({ name: "", phone: "", email: "", title: "", organization: "" })} className="w-full py-2 border-2 border-dashed border-gray-200 text-gray-500 rounded-xl text-sm font-semibold hover:border-[#059669] hover:text-[#059669]">
                            + Add Reference
                        </button>
                    </CollapsibleSection>

                    {/* Declaration & Signature */}
                    <CollapsibleSection title="Declaration & Signature">
                        <div>
                            <label className={labelCls()}>Declaration</label>
                            <textarea {...form.register("declaration")} className={inputCls("min-h-[80px] resize-y")} placeholder="I hereby declare that the information provided above is true and accurate to the best of my knowledge." />
                        </div>
                        <div>
                            <label className={labelCls()}>Signature (name or text)</label>
                            <input {...form.register("signature")} className={inputCls()} placeholder="Your name" />
                        </div>
                    </CollapsibleSection>

                    {/* Section Reorder */}
                    <CollapsibleSection title="Section Order (Drag to Reorder)">
                        <p className="text-xs text-gray-500 mb-3">Drag sections to change their order in the CV.</p>
                        <DragDropContext onDragEnd={handleDragEnd}>
                            <Droppable droppableId="sections">
                                {(provided) => (
                                    <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                                        {sectionOrder.map((key, index) => (
                                            <Draggable key={key} draggableId={key} index={index}>
                                                {(drag, snapshot) => (
                                                    <div
                                                        ref={drag.innerRef}
                                                        {...drag.draggableProps}
                                                        {...drag.dragHandleProps}
                                                        className={`flex items-center gap-3 px-4 py-3 rounded-xl border select-none transition-all ${snapshot.isDragging ? "bg-emerald-50 border-[#059669] shadow-lg" : "bg-white border-gray-200 hover:border-gray-300"}`}
                                                    >
                                                        <svg className="w-4 h-4 text-gray-300 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                                                            <path d="M11 18c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2zm-2-8c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0-6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm6 4c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                                                        </svg>
                                                        <span className="text-sm font-semibold text-gray-700">{SECTION_LABELS[key] ?? key}</span>
                                                        <span className="ml-auto text-xs text-gray-300">#{index + 1}</span>
                                                    </div>
                                                )}
                                            </Draggable>
                                        ))}
                                        {provided.placeholder}
                                    </div>
                                )}
                            </Droppable>
                        </DragDropContext>
                    </CollapsibleSection>
                </div>

                {/* Preview panel — A4 proportioned */}
                <div className={`w-full lg:w-1/2 ${activeTab === "form" ? "hidden lg:block" : ""}`}>
                    <div className="sticky top-32">
                        <h3 className="font-bold text-gray-600 text-xs uppercase tracking-widest mb-3">Live Preview (A4)</h3>
                        {/* A4 ratio: 210mm × 297mm = 1 : 1.4142 */}
                        <div className="rounded-xl border border-gray-100 shadow-sm overflow-hidden" style={{ aspectRatio: "210/297", overflowY: "auto" }}>
                            <CvPreview data={watchedValues} config={config} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Version History Modal */}
            {showVersions && (
                <VersionHistoryModal
                    draftId={id}
                    onClose={() => setShowVersions(false)}
                    onRestore={handleRestored}
                />
            )}
        </div>
    );
}
