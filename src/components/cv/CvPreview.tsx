"use client";

import React, { useState, useEffect, useRef } from "react";
import type { CvFormData } from "@/lib/cv/schemas";
import { SECTION_LABELS, type TemplateConfig } from "@/lib/cv/constants";
import { getCvDensityScale } from "@/lib/cv/density";

export function CvPreview({ data, config, fillHeight = false }: { data: CvFormData; config: TemplateConfig; fillHeight?: boolean }) {
    const sw = config.sidebarWidth || 38;
    const color = config.sidebarColor || "#1e3a5f";
    const initial = data.fullName?.charAt(0)?.toUpperCase() ?? "?";

    const { scale, spacingScale } = getCvDensityScale(data, config);
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
                <div style={{
                    flexShrink: 0,
                    width: `${sw}%`,
                    minWidth: `${sw}%`,
                    backgroundColor: color,
                    paddingTop: `${sp(20)}px`,
                    paddingLeft: `${sp(14)}px`,
                    paddingRight: `${sp(14)}px`,
                    paddingBottom: "48px",
                    color: "#fff",
                    display: "flex",
                    flexDirection: "column",
                    gap: sp(12),
                    boxSizing: "border-box"
                }}>
                    {config.showPhoto !== false && (
                        <div style={{ alignSelf: "center" }}>
                            <div style={{ width: Math.round(64 * scale), height: Math.round(64 * scale), borderRadius: (config.photoShape ?? "circle") !== "square" ? "50%" : "6px", backgroundColor: "rgba(255,255,255,0.2)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
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
                            {data.phone && (
                                <p style={{ display: "flex", alignItems: "center", gap: `${sp(5)}px`, color: "rgba(255,255,255,0.9)", fontSize: sz(0.70), marginBottom: sp(3) }}>
                                    <svg style={{ width: sz(0.68), height: sz(0.68), fill: "rgba(255,255,255,0.7)", flexShrink: 0 }} viewBox="0 0 24 24">
                                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                                    </svg>
                                    <span style={{ flex: 1 }}>{data.phone}</span>
                                </p>
                            )}
                            {data.email && (
                                <p style={{ display: "flex", alignItems: "center", gap: `${sp(5)}px`, color: "rgba(255,255,255,0.9)", fontSize: sz(0.70), marginBottom: sp(3), wordBreak: "break-all" }}>
                                    <svg style={{ width: sz(0.68), height: sz(0.68), fill: "none", stroke: "rgba(255,255,255,0.7)", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", flexShrink: 0 }} viewBox="0 0 24 24">
                                        <rect x="2" y="4" width="20" height="16" rx="2" />
                                        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                                    </svg>
                                    <span style={{ flex: 1 }}>{data.email}</span>
                                </p>
                            )}
                            {data.address && (
                                <p style={{ display: "flex", alignItems: "center", gap: `${sp(5)}px`, color: "rgba(255,255,255,0.9)", fontSize: sz(0.70) }}>
                                    <svg style={{ width: sz(0.68), height: sz(0.68), fill: "none", stroke: "rgba(255,255,255,0.7)", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", flexShrink: 0 }} viewBox="0 0 24 24">
                                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                                        <circle cx="12" cy="10" r="3" />
                                    </svg>
                                    <span style={{ flex: 1 }}>{data.address}</span>
                                </p>
                            )}
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
                <div style={{
                    flex: 1,
                    minWidth: 0,
                    paddingTop: `${sp(20)}px`,
                    paddingLeft: `${sp(18)}px`,
                    paddingRight: `${sp(18)}px`,
                    paddingBottom: "48px",
                    display: "flex",
                    flexDirection: "column",
                    gap: sp(12),
                    boxSizing: "border-box"
                }}>
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

const PREVIEW_WIDTH  = 794;
const PREVIEW_HEIGHT = 1123; // A4 at 96 dpi: 794 × (297/210)

export function A4ScaledPreview({ data, config }: { data: CvFormData; config: TemplateConfig }) {
    const wrapRef = useRef<HTMLDivElement>(null);
    const [scale, setScale] = useState(0.7);

    useEffect(() => {
        const el = wrapRef.current;
        if (!el) return;
        const update = () => setScale(el.getBoundingClientRect().width / PREVIEW_WIDTH);
        const ro = new ResizeObserver(update);
        ro.observe(el);
        update();
        return () => ro.disconnect();
    }, []);

    return (
        <div ref={wrapRef} style={{ width: "100%", height: Math.round(PREVIEW_HEIGHT * scale), overflow: "hidden", position: "relative" }}>
            <div style={{
                width: PREVIEW_WIDTH,
                height: PREVIEW_HEIGHT,
                position: "absolute",
                top: 0, left: 0,
                transformOrigin: "top left",
                transform: `scale(${scale})`,
                pointerEvents: "none",
            }}>
                <CvPreview data={data} config={config} fillHeight />
            </div>
        </div>
    );
}
