"use client";

import React from "react";
import type { CvFormData } from "@/lib/cv/schemas";
import { SECTION_LABELS, type TemplateConfig } from "@/lib/cv/constants";
import { getCvDensityScale } from "@/lib/cv/density";

export function CvPreview({ data, config, fillHeight = false }: { data: CvFormData; config: TemplateConfig; fillHeight?: boolean }) {
    const sw = config.sidebarWidth || 38;
    const color = config.sidebarColor || "#1e3a5f";
    const initial = data.fullName?.charAt(0)?.toUpperCase() ?? "?";

    const { scale, spacingScale } = getCvDensityScale(data);
    const sz = (baseRem: number) => `${(baseRem * scale).toFixed(3)}rem`;
    const sp = (basePx: number) => Math.max(1, Math.round(basePx * spacingScale));

    const rawOrder: string[] = Array.isArray(data.sectionOrder) && data.sectionOrder.length
        ? (data.sectionOrder as string[])
        : ["careerObjective", "workExperience", "training", "education", "references", "declaration"];

    const sidebarKeys = ["skills", "languages", "hobbies"];
    const mainOrder = rawOrder.filter(k => !sidebarKeys.includes(k));
    for (const k of ["careerObjective", "workExperience", "training", "education", "references", "declaration"]) {
        if (!mainOrder.includes(k)) mainOrder.push(k);
    }

    const sSH: React.CSSProperties = {
        color: "rgba(255,255,255,0.75)", fontWeight: 700, fontSize: sz(0.65),
        textTransform: "uppercase", letterSpacing: "0.1em",
        borderBottom: `${Math.max(1, Math.round(1 * scale))}px solid rgba(255,255,255,0.3)`, paddingBottom: sp(3), marginBottom: sp(8),
    };
    const mSH = (c: string): React.CSSProperties => ({
        fontWeight: 700, fontSize: sz(0.78), textTransform: "uppercase",
        letterSpacing: "0.07em", borderBottom: `${Math.max(1, Math.round(1.5 * scale))}px solid ${c}`,
        paddingBottom: sp(3), marginBottom: sp(10), color: c,
    });

    const personalData = [
        { label: "Date of Birth",  value: data.dateOfBirth },
        { label: "Blood Group",    value: data.bloodGroup },
        { label: "Religion",       value: data.religion },
        { label: "Marital Status", value: data.maritalStatus },
        { label: "Nationality",    value: data.nationality },
    ].filter(f => f.value);

    function renderSection(key: string) {
        switch (key) {
            case "careerObjective":
                return data.careerObjective ? (
                    <div>
                        <h4 style={mSH(color)}>Career Objective</h4>
                        <p style={{ fontSize: sz(0.74), color: "#333", lineHeight: 1.6 }}>{data.careerObjective}</p>
                    </div>
                ) : null;
            case "workExperience":
                return data.workExperience?.length ? (
                    <div>
                        <h4 style={mSH(color)}>{SECTION_LABELS.workExperience}</h4>
                        {data.workExperience.map((item, i) => (
                            <div key={i} style={{ marginBottom: sp(8) }}>
                                <p style={{ fontWeight: 700, fontSize: sz(0.78), color: "#1a1a1a" }}>{item.jobTitle}</p>
                                <p style={{ fontSize: sz(0.72), color: "#555", fontStyle: "italic" }}>{item.company}{item.location ? `, ${item.location}` : ""}</p>
                                {item.bullets?.map((b, j) => b && <p key={j} style={{ fontSize: sz(0.70), color: "#444", paddingLeft: sp(10) }}>• {b}</p>)}
                            </div>
                        ))}
                    </div>
                ) : null;
            case "training":
                return data.training?.length ? (
                    <div>
                        <h4 style={mSH(color)}>{SECTION_LABELS.training}</h4>
                        {data.training.map((item, i) => (
                            <div key={i} style={{ marginBottom: sp(8) }}>
                                <p style={{ fontWeight: 700, fontSize: sz(0.78), color: "#1a1a1a" }}>{item.trainingName}</p>
                                <p style={{ fontSize: sz(0.72), color: "#555", fontStyle: "italic" }}>{item.institute}{item.year ? ` (${item.year})` : ""}</p>
                                {item.bullets?.map((b, j) => b && <p key={j} style={{ fontSize: sz(0.70), color: "#444", paddingLeft: sp(10) }}>• {b}</p>)}
                            </div>
                        ))}
                    </div>
                ) : null;
            case "education":
                return data.education?.length ? (
                    <div>
                        <h4 style={mSH(color)}>{SECTION_LABELS.education}</h4>
                        {data.education.map((item, i) => (
                            <div key={i} style={{ marginBottom: sp(8) }}>
                                <p style={{ fontWeight: 700, fontSize: sz(0.78), color: "#1a1a1a" }}>{item.degree}{item.department ? ` — ${item.department}` : ""}</p>
                                <div style={{ display: "flex", justifyContent: "space-between" }}>
                                    <p style={{ fontSize: sz(0.72), color: "#555", fontStyle: "italic" }}>{item.institution}</p>
                                    {item.year && <p style={{ fontSize: sz(0.70), color: "#888" }}>{item.year}</p>}
                                </div>
                                {item.gpa && <p style={{ fontSize: sz(0.70), color: "#888" }}>GPA: {item.gpa}</p>}
                            </div>
                        ))}
                    </div>
                ) : null;
            case "references":
                return data.references?.length ? (
                    <div>
                        <h4 style={mSH(color)}>{SECTION_LABELS.references}</h4>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: sp(10) }}>
                            {data.references.map((ref, i) => (
                                <div key={i}>
                                    <p style={{ fontWeight: 700, fontSize: sz(0.76), color: "#1a1a1a" }}>{ref.name}</p>
                                    {ref.title && <p style={{ fontSize: sz(0.70), color: "#555" }}>{ref.title}</p>}
                                    {ref.organization && <p style={{ fontSize: sz(0.70), color: "#555" }}>{ref.organization}</p>}
                                    {ref.phone && <p style={{ fontSize: sz(0.68), color: "#777" }}>Phone : {ref.phone}</p>}
                                    {ref.email && <p style={{ fontSize: sz(0.68), color: "#777" }}>Email : {ref.email}</p>}
                                </div>
                            ))}
                        </div>
                    </div>
                ) : null;
            case "declaration":
                return data.declaration ? (
                    <div style={{ borderTop: "1px solid #e5e7eb", paddingTop: sp(10), marginTop: sp(4) }}>
                        <p style={{ fontSize: sz(0.70), color: "#444", lineHeight: 1.5, fontStyle: "italic" }}>{data.declaration}</p>
                        {data.signature && <p style={{ fontSize: sz(0.76), color: "#222", fontWeight: 700, textAlign: "right", marginTop: sp(6) }}>{data.signature}</p>}
                    </div>
                ) : null;
            default: return null;
        }
    }

    return (
        <div style={{ background: "#fff", overflow: "hidden", fontSize: sz(0.85), fontFamily: "sans-serif", height: fillHeight ? "100%" : "auto" }}>
            <div style={{ display: "flex", flexDirection: "row", height: fillHeight ? "100%" : "auto", minHeight: 400 }}>
                {/* Sidebar */}
                <div style={{ flexShrink: 0, width: `${sw}%`, minWidth: `${sw}%`, backgroundColor: color, padding: `${sp(20)}px ${sp(14)}px`, color: "#fff", display: "flex", flexDirection: "column", gap: sp(12), boxSizing: "border-box" }}>
                    {config.showPhoto !== false && (
                        <div style={{ alignSelf: "center" }}>
                            <div style={{ width: Math.round(64 * scale), height: Math.round(64 * scale), borderRadius: (config.photoShape ?? "circle") !== "square" ? "50%" : "6px", backgroundColor: "rgba(255,255,255,0.2)", border: `${Math.max(1, Math.round(2 * scale))}px solid rgba(255,255,255,0.4)`, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                                {data.profilePhoto
                                    ? <img src={data.profilePhoto} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                    : <span style={{ fontWeight: 900, fontSize: sz(1.4), color: "#fff" }}>{initial}</span>}
                            </div>
                        </div>
                    )}
                    {data.fullName && <p style={{ fontWeight: 900, textAlign: "center", fontSize: sz(0.84), lineHeight: 1.3, color: "#fff" }}>{data.fullName}</p>}
                    {(data.phone || data.email || data.address) && (
                        <div>
                            <p style={sSH}>Contact</p>
                            {data.phone && <p style={{ color: "rgba(255,255,255,0.9)", fontSize: sz(0.70), marginBottom: sp(3) }}>✆ {data.phone}</p>}
                            {data.email && <p style={{ color: "rgba(255,255,255,0.9)", fontSize: sz(0.70), marginBottom: sp(3), wordBreak: "break-all" }}>✉ {data.email}</p>}
                            {data.address && <p style={{ color: "rgba(255,255,255,0.9)", fontSize: sz(0.70) }}>⌂ {data.address}</p>}
                        </div>
                    )}
                    {data.skills?.length > 0 && (
                        <div>
                            <p style={sSH}>Skills</p>
                            {data.skills.map((sk, i) => <p key={i} style={{ color: "rgba(255,255,255,0.9)", fontSize: sz(0.70), marginBottom: sp(3) }}>• {sk}</p>)}
                        </div>
                    )}
                    {data.languages?.length > 0 && (
                        <div>
                            <p style={sSH}>Languages</p>
                            {data.languages.map((l, i) => (
                                <div key={i} style={{ display: "flex", justifyContent: "space-between", marginBottom: sp(3) }}>
                                    <span style={{ color: "rgba(255,255,255,0.9)", fontSize: sz(0.70) }}>{l.name}</span>
                                    <span style={{ color: "rgba(255,255,255,0.6)", fontSize: sz(0.66) }}>{l.level}</span>
                                </div>
                            ))}
                        </div>
                    )}
                    {data.hobbies?.length > 0 && (
                        <div>
                            <p style={sSH}>Hobbies</p>
                            {data.hobbies.map((h, i) => <p key={i} style={{ color: "rgba(255,255,255,0.9)", fontSize: sz(0.70), marginBottom: sp(3) }}>• {h}</p>)}
                        </div>
                    )}
                    {personalData.length > 0 && (
                        <div>
                            <p style={sSH}>Personal Data</p>
                            {personalData.map((f, i) => (
                                <div key={i} style={{ display: "flex", gap: sp(3), marginBottom: sp(3) }}>
                                    <span style={{ color: "rgba(255,255,255,0.65)", fontSize: sz(0.66), minWidth: Math.round(60 * scale) }}>{f.label} :</span>
                                    <span style={{ color: "rgba(255,255,255,0.9)", fontSize: sz(0.66), flex: 1 }}>{f.value}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Main column */}
                <div style={{ flex: 1, minWidth: 0, padding: `${sp(20)}px ${sp(18)}px ${sp(24)}px ${sp(18)}px`, display: "flex", flexDirection: "column", gap: sp(12), boxSizing: "border-box" }}>
                    {data.fullName && <p style={{ fontWeight: 900, fontSize: sz(1.1), color, marginBottom: sp(6) }}>{data.fullName}</p>}
                    {mainOrder.map(key => (
                        <React.Fragment key={key}>
                            {renderSection(key)}
                        </React.Fragment>
                    ))}
                </div>
            </div>
        </div>
    );
}
