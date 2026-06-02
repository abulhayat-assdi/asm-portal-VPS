import React from 'react';
import {
    Document,
    Page,
    Text,
    View,
    StyleSheet,
    pdf,
    Image,
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

// ─── Styles ──────────────────────────────────────────────────────────────────

function buildStyles(sidebarColor: string, sidebarWidthPct: number) {
    const main = 100 - sidebarWidthPct;
    return StyleSheet.create({
        page: { flexDirection: 'row', backgroundColor: '#ffffff', fontSize: 9, fontFamily: 'Helvetica' },

        // Sidebar
        sidebar: { width: `${sidebarWidthPct}%`, backgroundColor: sidebarColor, padding: '20 14', flexDirection: 'column' },
        photoWrap: { alignSelf: 'center', marginBottom: 10 },
        photoCircle: { width: 72, height: 72, borderRadius: 36, overflow: 'hidden', border: '2 solid rgba(255,255,255,0.5)', backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
        photoSquare: { width: 72, height: 72, borderRadius: 6, overflow: 'hidden', border: '2 solid rgba(255,255,255,0.5)', backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
        photoImg: { width: 72, height: 72, objectFit: 'cover' },
        photoInitial: { color: '#fff', fontSize: 28, fontFamily: 'Helvetica-Bold' },
        sidebarName: { color: '#fff', fontSize: 13, fontFamily: 'Helvetica-Bold', textAlign: 'center', marginBottom: 14, lineHeight: 1.3 },

        sidebarSection: { marginBottom: 12 },
        sidebarHeading: {
            color: 'rgba(255,255,255,0.85)', fontSize: 7, fontFamily: 'Helvetica-Bold',
            letterSpacing: 1.2, textTransform: 'uppercase', borderBottom: '0.5 solid rgba(255,255,255,0.35)',
            paddingBottom: 3, marginBottom: 6,
        },
        sidebarRow: { flexDirection: 'row', marginBottom: 3, alignItems: 'flex-start' },
        sidebarIcon: { color: 'rgba(255,255,255,0.7)', fontSize: 8, width: 12, marginRight: 3, marginTop: 1 },
        sidebarText: { color: 'rgba(255,255,255,0.9)', fontSize: 8, flex: 1, lineHeight: 1.4 },
        sidebarLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 7.5, width: 68, lineHeight: 1.4 },
        sidebarValue: { color: 'rgba(255,255,255,0.9)', fontSize: 7.5, flex: 1, lineHeight: 1.4 },
        skillBadge: { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 3, paddingTop: 2, paddingBottom: 2, paddingLeft: 6, paddingRight: 6, marginBottom: 4, marginRight: 4 },
        skillText: { color: '#fff', fontSize: 7.5 },
        skillsRow: { flexDirection: 'row', flexWrap: 'wrap' },
        langRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 },
        langName: { color: 'rgba(255,255,255,0.9)', fontSize: 8 },
        langLevel: { color: 'rgba(255,255,255,0.6)', fontSize: 7.5 },
        bulletItem: { flexDirection: 'row', marginBottom: 3 },
        bulletDot: { color: 'rgba(255,255,255,0.7)', fontSize: 8, width: 10 },
        bulletText: { color: 'rgba(255,255,255,0.9)', fontSize: 8, flex: 1, lineHeight: 1.4 },

        // Main content
        main: { width: `${main}%`, backgroundColor: '#ffffff', padding: '20 18', flexDirection: 'column' },
        mainName: { fontSize: 22, fontFamily: 'Helvetica-Bold', color: sidebarColor, marginBottom: 14, lineHeight: 1.2 },

        mainSection: { marginBottom: 10 },
        mainHeading: {
            fontSize: 10, fontFamily: 'Helvetica-Bold', color: sidebarColor,
            textTransform: 'uppercase', borderBottom: `1.5 solid ${sidebarColor}`,
            paddingBottom: 2, marginBottom: 6, letterSpacing: 0.5,
        },
        objectiveTxt: { fontSize: 8.5, color: '#333', lineHeight: 1.6 },

        entryBlock: { marginBottom: 7 },
        entryTitle: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#1a1a1a' },
        entrySubRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 1 },
        entryOrg: { fontSize: 8, color: '#555', fontFamily: 'Helvetica-Oblique', flex: 1 },
        entryDate: { fontSize: 7.5, color: '#888' },
        bulletMain: { flexDirection: 'row', marginTop: 2, marginLeft: 8 },
        bulletMainDot: { color: '#555', fontSize: 8, width: 8 },
        bulletMainText: { fontSize: 8, color: '#333', flex: 1, lineHeight: 1.45 },

        refGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
        refItem: { width: '47%', marginBottom: 4 },
        refName: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#1a1a1a' },
        refDetail: { fontSize: 7.5, color: '#555', marginTop: 1, lineHeight: 1.3 },

        declaration: { marginTop: 8, borderTop: '0.5 solid #ddd', paddingTop: 6 },
        declarationTxt: { fontSize: 8, color: '#444', lineHeight: 1.5, fontFamily: 'Helvetica-Oblique' },
        signatureTxt: { fontSize: 8.5, color: '#222', marginTop: 6, fontFamily: 'Helvetica-Bold', textAlign: 'right' },
    });
}

// ─── Sidebar section wrapper ──────────────────────────────────────────────────

function SSection({ title, s, children }: { title: string; s: ReturnType<typeof buildStyles>; children: React.ReactNode }) {
    return (
        <View style={s.sidebarSection}>
            <Text style={s.sidebarHeading}>{title}</Text>
            {children}
        </View>
    );
}

// ─── Main section wrapper ─────────────────────────────────────────────────────

function MSection({ title, s, children }: { title: string; s: ReturnType<typeof buildStyles>; children: React.ReactNode }) {
    return (
        <View style={s.mainSection}>
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

    const s = buildStyles(sidebarColor, sidebarWidth);
    const initial = data.fullName ? data.fullName.charAt(0).toUpperCase() : '?';
    const photoContainer = photoShape === 'circle' ? s.photoCircle : s.photoSquare;
    const langs = (data.languages ?? []) as CvLanguageItem[];
    const skills = (data.skills ?? []) as string[];
    const hobbies = (data.hobbies ?? []) as string[];

    const personalData = [
        { label: 'Date of Birth', value: data.dateOfBirth },
        { label: 'Blood Group', value: data.bloodGroup },
        { label: 'Religion', value: data.religion },
        { label: 'Marital Status', value: data.maritalStatus },
        { label: 'Nationality', value: data.nationality },
    ].filter(f => f.value);

    const sectionOrder: string[] = Array.isArray(data.sectionOrder) && data.sectionOrder.length
        ? (data.sectionOrder as string[])
        : ['workExperience', 'training', 'education', 'references'];

    const mainSections = sectionOrder.filter(k => !['skills', 'hobbies', 'languages'].includes(k));

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
                    {(data.phone || data.email || data.address) && (
                        <SSection title="Contact" s={s}>
                            {data.phone && (
                                <View style={s.sidebarRow}>
                                    <Text style={s.sidebarIcon}>✆</Text>
                                    <Text style={s.sidebarText}>{data.phone}</Text>
                                </View>
                            )}
                            {data.email && (
                                <View style={s.sidebarRow}>
                                    <Text style={s.sidebarIcon}>✉</Text>
                                    <Text style={s.sidebarText}>{data.email}</Text>
                                </View>
                            )}
                            {data.address && (
                                <View style={s.sidebarRow}>
                                    <Text style={s.sidebarIcon}>⌂</Text>
                                    <Text style={s.sidebarText}>{data.address}</Text>
                                </View>
                            )}
                        </SSection>
                    )}

                    {/* Skills */}
                    {skills.length > 0 && (
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
                    {langs.length > 0 && (
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
                    {hobbies.length > 0 && (
                        <SSection title="Hobbies" s={s}>
                            {hobbies.map((h, i) => (
                                <View key={i} style={s.bulletItem}>
                                    <Text style={s.bulletDot}>•</Text>
                                    <Text style={s.bulletText}>{h}</Text>
                                </View>
                            ))}
                        </SSection>
                    )}

                    {/* Personal Data */}
                    {personalData.length > 0 && (
                        <SSection title="Personal Data" s={s}>
                            {personalData.map((f, i) => (
                                <View key={i} style={s.sidebarRow}>
                                    <Text style={s.sidebarLabel}>{f.label} :</Text>
                                    <Text style={s.sidebarValue}>{f.value}</Text>
                                </View>
                            ))}
                        </SSection>
                    )}
                </View>

                {/* ── Main ── */}
                <View style={s.main}>

                    {/* Name */}
                    {data.fullName && <Text style={s.mainName}>{data.fullName}</Text>}

                    {/* Career Objective */}
                    {data.careerObjective && (
                        <MSection title="Career Objective" s={s}>
                            <Text style={s.objectiveTxt}>{data.careerObjective}</Text>
                        </MSection>
                    )}

                    {/* Dynamic sections */}
                    {mainSections.map(key => renderMainSection(key, data, s))}

                    {/* Declaration */}
                    {data.declaration && (
                        <View style={s.declaration}>
                            <Text style={s.declarationTxt}>{data.declaration}</Text>
                            {data.signature && <Text style={s.signatureTxt}>{data.signature}</Text>}
                        </View>
                    )}
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
