import React from 'react';
import {
    Document,
    Page,
    Text,
    View,
    StyleSheet,
    pdf,
    Image,
    Svg,
    Path,
    Link,
} from '@react-pdf/renderer';
import type {
    CvDraftFull,
    WorkExperienceItem,
    TrainingItem,
    EducationItem,
    CvLanguageItem,
    CvReferenceItem,
} from '../schemas';
import { SECTION_LABELS, type TemplateConfig } from '../constants';
import { getCvDensityScale, getLinkedInDisplayAndUrl } from '../density';

// ─── Styles ──────────────────────────────────────────────────────────────────

function buildStyles(sidebarColor: string, sidebarWidthPct: number, scale: number, spacingScale: number) {
    const main = 100 - sidebarWidthPct;
    
    // Scale helpers
    const sz = (base: number) => Math.round(base * scale * 10) / 10;
    const sp = (base: number) => Math.round(base * spacingScale * 10) / 10;

    return StyleSheet.create({
        page: { flexDirection: 'row', backgroundColor: '#ffffff', fontSize: sz(10.2), fontFamily: 'Helvetica' },

        // Sidebar
        sidebar: { width: `${sidebarWidthPct}%`, backgroundColor: sidebarColor, paddingTop: sp(20), paddingLeft: sp(14), paddingRight: sp(14), paddingBottom: 36, flexDirection: 'column' },
        photoWrap: { alignSelf: 'center', marginBottom: sp(10) },
        photoCircle: { width: sz(48), height: sz(48), borderRadius: sz(24), overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
        photoSquare: { width: sz(48), height: sz(48), borderRadius: sz(4.5), overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
        photoImg: { width: sz(48), height: sz(48), objectFit: 'cover' },
        photoInitial: { color: '#fff', fontSize: sz(16.8), fontFamily: 'Helvetica-Bold' },
        sidebarName: { color: '#fff', fontSize: sz(10), fontFamily: 'Helvetica-Bold', textAlign: 'center', marginBottom: sp(8), lineHeight: 1.3 },

        sidebarSection: { marginBottom: sp(8) },
        sidebarHeading: {
            color: 'rgba(255,255,255,0.85)', fontSize: sz(7.8), fontFamily: 'Helvetica-Bold',
            letterSpacing: 1.2, textTransform: 'uppercase', borderBottom: `${sz(0.5)} solid rgba(255,255,255,0.35)`,
            paddingBottom: sp(3), marginBottom: sp(6),
        },
        sidebarRow: { flexDirection: 'row', marginBottom: sp(3), alignItems: 'center' },
        sidebarIcon: { width: sz(8), height: sz(8), marginRight: sz(5), flexShrink: 0 },
        sidebarText: { color: 'rgba(255,255,255,0.9)', fontSize: sz(8.4), flex: 1, lineHeight: 1.4 },
        sidebarLabel: { color: 'rgba(255,255,255,0.6)', fontSize: sz(7.9), width: sz(45), lineHeight: 1.4 },
        sidebarValue: { color: 'rgba(255,255,255,0.9)', fontSize: sz(7.9), flex: 1, lineHeight: 1.4 },
        personalRow: { flexDirection: 'row', marginBottom: sp(3), alignItems: 'flex-start' },
        personalLabel: { color: 'rgba(255,255,255,0.6)', fontSize: sz(7.9), width: sz(58), flexShrink: 0, lineHeight: 1.4 },
        personalColon: { color: 'rgba(255,255,255,0.6)', fontSize: sz(7.9), width: sz(8), flexShrink: 0, lineHeight: 1.4 },
        personalValue: { color: 'rgba(255,255,255,0.9)', fontSize: sz(7.9), flex: 1, lineHeight: 1.4 },
        skillBadge: { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: sz(3), paddingTop: sp(2), paddingBottom: sp(2), paddingLeft: sp(6), paddingRight: sp(6), marginBottom: sp(4), marginRight: sp(4) },
        skillText: { color: '#fff', fontSize: sz(8.4) },
        skillsRow: { flexDirection: 'row', flexWrap: 'wrap' },
        langRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: sp(3) },
        langName: { color: 'rgba(255,255,255,0.9)', fontSize: sz(8.4) },
        langLevel: { color: 'rgba(255,255,255,0.6)', fontSize: sz(7.9) },
        bulletItem: { flexDirection: 'row', marginBottom: sp(3) },
        bulletDot: { color: 'rgba(255,255,255,0.7)', fontSize: sz(8.4), width: sz(10) },
        bulletText: { color: 'rgba(255,255,255,0.9)', fontSize: sz(8.4), flex: 1, lineHeight: 1.4 },

        // Main content
        main: { width: `${main}%`, backgroundColor: '#ffffff', paddingTop: sp(20), paddingLeft: sp(18), paddingRight: sp(18), paddingBottom: 36, flexDirection: 'column' },
        mainName: { fontSize: sz(13.2), fontFamily: 'Helvetica-Bold', color: sidebarColor, marginBottom: sp(6), lineHeight: 1.2 },

        mainSection: { marginBottom: sp(8) },
        mainHeading: {
            fontSize: sz(9.4), fontFamily: 'Helvetica-Bold', color: sidebarColor,
            textTransform: 'uppercase', borderBottom: `${sz(1.1)} solid ${sidebarColor}`,
            paddingBottom: sp(2), marginBottom: sp(6), letterSpacing: 0.5,
        },
        objectiveTxt: { fontSize: sz(8.9), color: '#333', lineHeight: 1.6, textAlign: 'justify' },

        entryBlock: { marginBottom: sp(5) },
        entryTitle: { fontSize: sz(9.4), fontFamily: 'Helvetica-Bold', color: '#1a1a1a' },
        entrySubRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: sz(1) },
        entryOrg: { fontSize: sz(8.6), color: '#555', fontFamily: 'Helvetica-Oblique', flex: 1 },
        entryDate: { fontSize: sz(8.4), color: '#888' },
        bulletMain: { flexDirection: 'row', marginTop: sp(2), marginLeft: sp(8) },
        bulletMainDot: { color: '#555', fontSize: sz(8.4), width: sz(8) },
        bulletMainText: { fontSize: sz(8.4), color: '#333', flex: 1, lineHeight: 1.45 },

        refGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: sz(6) },
        refItem: { width: '47%', marginBottom: sp(3) },
        refName: { fontSize: sz(9.1), fontFamily: 'Helvetica-Bold', color: '#1a1a1a' },
        refDetail: { fontSize: sz(8.2), color: '#555', marginTop: sz(1), lineHeight: 1.3 },

        declaration: { marginTop: sp(6), borderTop: `${sz(0.5)} solid #ddd`, paddingTop: sp(8) },
        declarationTxt: { fontSize: sz(8.4), color: '#444', lineHeight: 1.5, fontFamily: 'Helvetica-Oblique' },
        signatureTxt: { fontSize: sz(9.1), color: '#222', marginTop: sp(6), fontFamily: 'Helvetica-Bold', textAlign: 'right' },
    });
}

// ─── Sidebar section wrapper ──────────────────────────────────────────────────

function SSection({ title, s, children }: { title: string; s: ReturnType<typeof buildStyles>; children: React.ReactNode }) {
    return (
        <View style={s.sidebarSection} wrap={false}>
            <Text style={s.sidebarHeading}>{title}</Text>
            {children}
        </View>
    );
}

// ─── Main section wrapper ─────────────────────────────────────────────────────

function MSection({ title, s, children }: { title: string; s: ReturnType<typeof buildStyles>; children: React.ReactNode }) {
    return (
        <View style={s.mainSection} wrap={false}>
            <Text style={s.mainHeading}>{title}</Text>
            {children}
        </View>
    );
}

// ─── Render a main section by key ─────────────────────────────────────────────

function renderMainSection(key: string, data: CvDraftFull, s: ReturnType<typeof buildStyles>) {
    switch (key) {
        case 'workExperience': {
            const items = (data.workExperience ?? []) as WorkExperienceItem[];
            if (!items.length) return null;
            return (
                <MSection key="we" title={SECTION_LABELS.workExperience} s={s}>
                    {items.map((item, i) => (
                        <View key={i} style={s.entryBlock}>
                            <Text style={s.entryTitle}>{item.jobTitle}</Text>
                            <View style={s.entrySubRow}>
                                <Text style={s.entryOrg}>{item.company}{item.location ? `, ${item.location}` : ''}</Text>
                                {(item.startDate || item.endDate) && (
                                    <Text style={s.entryDate}>{item.startDate}{item.startDate && item.endDate ? ' – ' : ''}{item.endDate}</Text>
                                )}
                            </View>
                            {item.bullets?.filter(Boolean).map((b, j) => (
                                <View key={j} style={s.bulletMain}>
                                    <Text style={s.bulletMainDot}>•</Text>
                                    <Text style={s.bulletMainText}>{b}</Text>
                                </View>
                            ))}
                        </View>
                    ))}
                </MSection>
            );
        }
        case 'training': {
            const items = (data.training ?? []) as TrainingItem[];
            if (!items.length) return null;
            return (
                <MSection key="tr" title={SECTION_LABELS.training} s={s}>
                    {items.map((item, i) => (
                        <View key={i} style={s.entryBlock}>
                            <Text style={s.entryTitle}>{item.trainingName}</Text>
                            <View style={s.entrySubRow}>
                                <Text style={s.entryOrg}>{item.institute}</Text>
                                {item.year && <Text style={s.entryDate}>{item.year}</Text>}
                            </View>
                            {item.bullets?.filter(Boolean).map((b, j) => (
                                <View key={j} style={s.bulletMain}>
                                    <Text style={s.bulletMainDot}>•</Text>
                                    <Text style={s.bulletMainText}>{b}</Text>
                                </View>
                            ))}
                        </View>
                    ))}
                </MSection>
            );
        }
        case 'education': {
            const items = (data.education ?? []) as EducationItem[];
            if (!items.length) return null;
            return (
                <MSection key="edu" title={SECTION_LABELS.education} s={s}>
                    {items.map((item, i) => (
                        <View key={i} style={s.entryBlock}>
                            <Text style={s.entryTitle}>{item.degree}{item.department ? ` — ${item.department}` : ''}</Text>
                            <View style={s.entrySubRow}>
                                <Text style={s.entryOrg}>{item.institution}</Text>
                                {item.year && <Text style={s.entryDate}>{item.year}</Text>}
                            </View>
                            {item.gpa && <Text style={{ ...s.entryDate, marginTop: 1 }}>GPA: {item.gpa}</Text>}
                        </View>
                    ))}
                </MSection>
            );
        }
        case 'references': {
            const items = (data.references ?? []) as CvReferenceItem[];
            if (!items.length) return null;
            return (
                <MSection key="ref" title={SECTION_LABELS.references} s={s}>
                    <View style={s.refGrid}>
                        {items.map((ref, i) => (
                            <View key={i} style={s.refItem}>
                                <Text style={s.refName}>{ref.name}</Text>
                                {ref.title && <Text style={s.refDetail}>{ref.title}</Text>}
                                {ref.organization && <Text style={s.refDetail}>{ref.organization}</Text>}
                                {ref.phone && <Text style={s.refDetail}>Phone : {ref.phone}</Text>}
                                {ref.email && <Text style={s.refDetail}>Email : {ref.email}</Text>}
                            </View>
                        ))}
                    </View>
                </MSection>
            );
        }
        default: return null;
    }
}

// ─── CV Document ─────────────────────────────────────────────────────────────

export function CvDocument({ data }: { data: CvDraftFull }) {
    // Defensive: runtime config may come from Prisma JSON with missing/undefined fields
    const rawCfg = data.template?.config as Partial<TemplateConfig> | undefined;
    const sidebarColor = rawCfg?.sidebarColor || '#1e3a5f';
    const sidebarWidth = Number(rawCfg?.sidebarWidth) || 38;
    const showPhoto = rawCfg?.showPhoto !== false;
    const photoShape = rawCfg?.photoShape ?? 'circle';

    const { scale, spacingScale } = getCvDensityScale(data, rawCfg as TemplateConfig);
    const s = buildStyles(sidebarColor, sidebarWidth, scale, spacingScale);
    const initial = data.fullName ? data.fullName.charAt(0).toUpperCase() : '?';
    const photoContainer = photoShape === 'circle' ? s.photoCircle : s.photoSquare;
    const langs = (data.languages ?? []) as CvLanguageItem[];
    const skills = (data.skills ?? []) as string[];
    const hobbies = (data.hobbies ?? []) as string[];

    const visibleSections = data.visibleSections || [
        'careerObjective', 'workExperience', 'training', 'education', 'references', 'skills', 'languages', 'hobbies', 'personalInfo', 'declaration'
    ];

    const personalData = [
        { label: 'Date of Birth', value: data.dateOfBirth },
        { label: 'Blood Group', value: data.bloodGroup },
        { label: 'Religion', value: data.religion },
        { label: 'Marital Status', value: data.maritalStatus },
        { label: 'Nationality', value: data.nationality },
    ].filter(f => f.value);

    const sidebarKeys = ['skills', 'hobbies', 'languages'];
    const defaultOrder = ['careerObjective', 'workExperience', 'training', 'education', 'references', 'declaration'];
    const rawOrder: string[] = Array.isArray(data.sectionOrder) && data.sectionOrder.length
        ? (data.sectionOrder as string[])
        : defaultOrder;
    // Main column only — append any missing default keys at end
    const mainSections: string[] = rawOrder.filter(k => !sidebarKeys.includes(k));
    for (const k of defaultOrder) {
        if (!mainSections.includes(k)) mainSections.push(k);
    }

    return (
        <Document title={data.fullName ? `${data.fullName} — CV` : 'CV'} author={data.fullName ?? ''}>
            <Page size="A4" style={s.page}>

                {/* ── Sidebar ── */}
                <View style={s.sidebar}>

                    {/* Photo */}
                    {showPhoto && (
                        <View style={s.photoWrap}>
                            <View style={photoContainer}>
                                {data.profilePhoto
                                    ? <Image style={s.photoImg} src={data.profilePhoto} />
                                    : <Text style={s.photoInitial}>{initial}</Text>}
                            </View>
                        </View>
                    )}

                    {/* Name */}
                    {data.fullName && <Text style={s.sidebarName}>{data.fullName}</Text>}

                    {/* Contact */}
                    {(data.phone || data.email || data.address || data.linkedin) && (
                        <SSection title="Contact" s={s}>
                            {data.phone && (
                                <View style={s.sidebarRow}>
                                    <Svg viewBox="0 0 24 24" style={s.sidebarIcon}>
                                        <Path fill="rgba(255,255,255,0.7)" d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                                    </Svg>
                                    <Text style={s.sidebarText}>{data.phone}</Text>
                                </View>
                            )}
                            {data.email && (
                                <View style={s.sidebarRow}>
                                    <Svg viewBox="0 0 24 24" style={s.sidebarIcon}>
                                        <Path fill="rgba(255,255,255,0.7)" d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
                                    </Svg>
                                    <Text style={s.sidebarText}>{data.email}</Text>
                                </View>
                            )}
                            {data.address && (
                                <View style={s.sidebarRow}>
                                    <Svg viewBox="0 0 24 24" style={s.sidebarIcon}>
                                        <Path fill="rgba(255,255,255,0.7)" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                                    </Svg>
                                    <Text style={s.sidebarText}>{data.address}</Text>
                                </View>
                            )}
                            {data.linkedin && (
                                <View style={s.sidebarRow}>
                                    <Svg viewBox="0 0 24 24" style={s.sidebarIcon}>
                                        <Path fill="rgba(255,255,255,0.7)" d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
                                    </Svg>
                                    <Link style={{ ...s.sidebarText, color: '#93c5fd', textDecoration: 'underline' }} src={getLinkedInDisplayAndUrl(data.linkedin).url}>
                                        {getLinkedInDisplayAndUrl(data.linkedin).display}
                                    </Link>
                                </View>
                            )}
                        </SSection>
                    )}

                    {/* Skills */}
                    {skills.length > 0 && visibleSections.includes('skills') && (
                        <SSection title="Skills" s={s}>
                            {skills.map((sk, i) => (
                                <View key={i} style={s.bulletItem}>
                                    <Text style={s.bulletDot}>•</Text>
                                    <Text style={s.bulletText}>{sk}</Text>
                                </View>
                            ))}
                        </SSection>
                    )}

                    {/* Languages */}
                    {langs.length > 0 && visibleSections.includes('languages') && (
                        <SSection title="Languages" s={s}>
                            {langs.map((l, i) => (
                                <View key={i} style={s.langRow}>
                                    <Text style={s.langName}>{l.name}</Text>
                                    <Text style={s.langLevel}>{l.level}</Text>
                                </View>
                            ))}
                        </SSection>
                    )}

                    {/* Hobbies */}
                    {hobbies.length > 0 && visibleSections.includes('hobbies') && (
                        <SSection title="Hobbies" s={s}>
                            {hobbies.map((h, i) => (
                                <View key={i} style={s.bulletItem}>
                                    <Text style={s.bulletDot}>•</Text>
                                    <Text style={s.bulletText}>{h}</Text>
                                </View>
                            ))}
                        </SSection>
                    )}

                    {/* Personal Information */}
                    {personalData.length > 0 && visibleSections.includes('personalInfo') && (
                        <SSection title="Personal Information" s={s}>
                            {personalData.map((f, i) => (
                                <View key={i} style={s.personalRow}>
                                    <Text style={s.personalLabel}>{f.label}</Text>
                                    <Text style={s.personalColon}>:</Text>
                                    <Text style={s.personalValue}>{f.value}</Text>
                                </View>
                            ))}
                        </SSection>
                    )}
                </View>

                {/* ── Main ── */}
                <View style={s.main}>

                    {/* All main sections rendered in sectionOrder */}
                    {mainSections.map(key => {
                        if (!visibleSections.includes(key)) return null;
                        if (key === 'careerObjective' && data.careerObjective) {
                            return (
                                <MSection key="co" title="Career Objective" s={s}>
                                    <Text style={s.objectiveTxt}>{data.careerObjective}</Text>
                                </MSection>
                            );
                        }
                        if (key === 'declaration' && data.declaration) {
                            return (
                                <View key="dec" style={s.declaration} wrap={false}>
                                    <Text style={s.declarationTxt}>{data.declaration}</Text>
                                    {data.signature && <Text style={s.signatureTxt}>{data.signature}</Text>}
                                </View>
                            );
                        }
                        return renderMainSection(key, data, s);
                    })}
                </View>
            </Page>
        </Document>
    );
}

// ─── Client-side helper (kept for potential future use) ───────────────────────

export async function generateCvPdf(data: CvDraftFull): Promise<void> {
    const blob = await pdf(<CvDocument data={data} />).toBlob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${data.fullName || 'CV'}_CV.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
