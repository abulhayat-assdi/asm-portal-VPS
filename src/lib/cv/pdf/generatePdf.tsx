import {
    Document,
    Page,
    Text,
    View,
    StyleSheet,
    pdf,
    Image,
} from '@react-pdf/renderer';
import React from 'react';
import type { CvDraftFull, WorkExperienceItem, TrainingItem, EducationItem, CvLanguageItem, CvReferenceItem } from '../schemas';
import { SECTION_LABELS } from '../constants';

function buildStyles(sidebarColor: string, sidebarWidth: number) {
    const mainWidth = 100 - sidebarWidth;
    return StyleSheet.create({
        page: {
            flexDirection: 'row',
            backgroundColor: '#ffffff',
            fontFamily: 'Helvetica',
            fontSize: 9,
        },
        sidebar: {
            width: `${sidebarWidth}%`,
            backgroundColor: sidebarColor,
            padding: 20,
            color: '#ffffff',
            flexDirection: 'column',
        },
        main: {
            width: `${mainWidth}%`,
            backgroundColor: '#ffffff',
            padding: 20,
            flexDirection: 'column',
        },
        // Sidebar elements
        photoCircle: {
            width: 70,
            height: 70,
            borderRadius: 35,
            backgroundColor: 'rgba(255,255,255,0.2)',
            border: '2pt solid rgba(255,255,255,0.5)',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 12,
            alignSelf: 'center',
            overflow: 'hidden',
        },
        photoSquare: {
            width: 70,
            height: 70,
            backgroundColor: 'rgba(255,255,255,0.2)',
            border: '2pt solid rgba(255,255,255,0.5)',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 12,
            alignSelf: 'center',
            overflow: 'hidden',
        },
        photoInitial: {
            color: '#ffffff',
            fontSize: 24,
            fontWeight: 700,
        },
        photoImage: {
            width: 70,
            height: 70,
            objectFit: 'cover',
        },
        sidebarName: {
            color: '#ffffff',
            fontSize: 14,
            fontWeight: 700,
            textAlign: 'center',
            marginBottom: 4,
        },
        sidebarDivider: {
            borderBottom: '1pt solid rgba(255,255,255,0.3)',
            marginVertical: 10,
        },
        sidebarSectionTitle: {
            color: 'rgba(255,255,255,0.7)',
            fontSize: 7,
            fontWeight: 700,
            letterSpacing: 1,
            textTransform: 'uppercase',
            marginBottom: 6,
        },
        sidebarText: {
            color: 'rgba(255,255,255,0.9)',
            fontSize: 8,
            marginBottom: 3,
            lineHeight: 1.4,
        },
        sidebarSkillBadge: {
            backgroundColor: 'rgba(255,255,255,0.15)',
            borderRadius: 3,
            padding: '3 6',
            marginBottom: 4,
            marginRight: 4,
        },
        sidebarSkillText: {
            color: '#ffffff',
            fontSize: 8,
        },
        skillsRow: {
            flexDirection: 'row',
            flexWrap: 'wrap',
        },
        langRow: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginBottom: 4,
        },
        langName: {
            color: '#ffffff',
            fontSize: 8,
        },
        langLevel: {
            color: 'rgba(255,255,255,0.65)',
            fontSize: 7,
        },
        // Main content elements
        mainName: {
            fontSize: 20,
            fontWeight: 700,
            color: sidebarColor,
            marginBottom: 2,
        },
        mainSectionTitle: {
            fontSize: 10,
            fontWeight: 700,
            color: sidebarColor,
            borderBottom: `1.5pt solid ${sidebarColor}`,
            paddingBottom: 3,
            marginBottom: 8,
            marginTop: 12,
        },
        objective: {
            fontSize: 8,
            color: '#444444',
            lineHeight: 1.6,
            marginBottom: 6,
        },
        entryBlock: {
            marginBottom: 8,
        },
        entryTitle: {
            fontSize: 9,
            fontWeight: 700,
            color: '#1f2937',
        },
        entrySubtitle: {
            fontSize: 8,
            color: '#6b7280',
            marginTop: 1,
        },
        bullet: {
            fontSize: 8,
            color: '#374151',
            marginLeft: 10,
            marginTop: 2,
            lineHeight: 1.4,
        },
        metaRow: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginBottom: 2,
        },
        metaLabel: {
            fontSize: 7,
            color: '#9ca3af',
            fontWeight: 700,
            letterSpacing: 0.5,
        },
        metaValue: {
            fontSize: 8,
            color: '#374151',
        },
        personalDataGrid: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 6,
            marginBottom: 6,
        },
        personalDataItem: {
            width: '47%',
        },
        refBlock: {
            marginBottom: 6,
        },
        refName: {
            fontSize: 9,
            fontWeight: 700,
            color: '#1f2937',
        },
        refDetail: {
            fontSize: 8,
            color: '#6b7280',
            marginTop: 1,
        },
        declarationText: {
            fontSize: 8,
            color: '#374151',
            lineHeight: 1.5,
            fontStyle: 'italic',
        },
    });
}

function SidebarSection({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <View style={{ marginBottom: 12 }}>
            <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 7, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6, borderBottom: '0.5pt solid rgba(255,255,255,0.3)', paddingBottom: 3 }}>
                {title}
            </Text>
            {children}
        </View>
    );
}

function MainSection({ title, styles, children }: { title: string; styles: ReturnType<typeof buildStyles>; children: React.ReactNode }) {
    return (
        <View>
            <Text style={styles.mainSectionTitle}>{title}</Text>
            {children}
        </View>
    );
}

function renderSection(key: string, data: CvDraftFull, styles: ReturnType<typeof buildStyles>) {
    switch (key) {
        case 'workExperience':
            if (!data.workExperience?.length) return null;
            return (
                <MainSection key="we" title="Work Experience" styles={styles}>
                    {(data.workExperience as WorkExperienceItem[]).map((item, i) => (
                        <View key={i} style={styles.entryBlock}>
                            <Text style={styles.entryTitle}>{item.jobTitle}</Text>
                            <Text style={styles.entrySubtitle}>{item.company}{item.location ? ` — ${item.location}` : ''}</Text>
                            {item.startDate || item.endDate ? (
                                <Text style={styles.entrySubtitle}>{item.startDate}{item.startDate && item.endDate ? ' – ' : ''}{item.endDate}</Text>
                            ) : null}
                            {item.bullets?.map((b, j) => (
                                <Text key={j} style={styles.bullet}>• {b}</Text>
                            ))}
                        </View>
                    ))}
                </MainSection>
            );
        case 'training':
            if (!data.training?.length) return null;
            return (
                <MainSection key="tr" title="Training" styles={styles}>
                    {(data.training as TrainingItem[]).map((item, i) => (
                        <View key={i} style={styles.entryBlock}>
                            <Text style={styles.entryTitle}>{item.trainingName}</Text>
                            <Text style={styles.entrySubtitle}>{item.institute}{item.year ? ` (${item.year})` : ''}</Text>
                            {item.bullets?.map((b, j) => (
                                <Text key={j} style={styles.bullet}>• {b}</Text>
                            ))}
                        </View>
                    ))}
                </MainSection>
            );
        case 'education':
            if (!data.education?.length) return null;
            return (
                <MainSection key="edu" title="Education" styles={styles}>
                    {(data.education as EducationItem[]).map((item, i) => (
                        <View key={i} style={styles.entryBlock}>
                            <Text style={styles.entryTitle}>{item.degree}{item.department ? ` — ${item.department}` : ''}</Text>
                            <Text style={styles.entrySubtitle}>{item.institution}</Text>
                            {(item.gpa || item.year) && (
                                <Text style={styles.entrySubtitle}>{item.gpa ? `GPA: ${item.gpa}` : ''}{item.gpa && item.year ? ' | ' : ''}{item.year || ''}</Text>
                            )}
                        </View>
                    ))}
                </MainSection>
            );
        case 'references':
            if (!data.references?.length) return null;
            return (
                <MainSection key="ref" title="References" styles={styles}>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                        {(data.references as CvReferenceItem[]).map((ref, i) => (
                            <View key={i} style={{ ...styles.refBlock, width: '47%' }}>
                                <Text style={styles.refName}>{ref.name}</Text>
                                {ref.title && <Text style={styles.refDetail}>{ref.title}</Text>}
                                {ref.organization && <Text style={styles.refDetail}>{ref.organization}</Text>}
                                {ref.phone && <Text style={styles.refDetail}>{ref.phone}</Text>}
                                {ref.email && <Text style={styles.refDetail}>{ref.email}</Text>}
                            </View>
                        ))}
                    </View>
                </MainSection>
            );
        case 'skills':
            if (!data.skills?.length) return null;
            return (
                <MainSection key="sk" title="Skills" styles={styles}>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
                        {(data.skills as string[]).map((skill, i) => (
                            <View key={i} style={{ backgroundColor: '#f3f4f6', borderRadius: 3, padding: '3 6', marginBottom: 3 }}>
                                <Text style={{ fontSize: 8, color: '#374151' }}>{skill}</Text>
                            </View>
                        ))}
                    </View>
                </MainSection>
            );
        case 'hobbies':
            if (!data.hobbies?.length) return null;
            return (
                <MainSection key="hb" title="Hobbies & Interests" styles={styles}>
                    <Text style={{ fontSize: 8, color: '#374151', lineHeight: 1.5 }}>
                        {(data.hobbies as string[]).join(' • ')}
                    </Text>
                </MainSection>
            );
        case 'languages':
            return null; // handled in sidebar
        default:
            return null;
    }
}

export function CvDocument({ data }: { data: CvDraftFull }) {
    const config = data.template?.config ?? {
        sidebarColor: '#1e3a5f',
        sidebarWidth: 35,
        primaryColor: '#1e3a5f',
        photoShape: 'circle' as const,
        showPhoto: true,
        fontFamily: 'Helvetica',
    };
    const styles = buildStyles(config.sidebarColor, config.sidebarWidth);
    const initial = data.fullName ? data.fullName.charAt(0).toUpperCase() : '?';
    const photoContainer = config.photoShape === 'circle' ? styles.photoCircle : styles.photoSquare;
    const languages = (data.languages ?? []) as CvLanguageItem[];

    const personalDataFields = [
        { label: 'Date of Birth', value: data.dateOfBirth },
        { label: 'Blood Group', value: data.bloodGroup },
        { label: 'Religion', value: data.religion },
        { label: 'Marital Status', value: data.maritalStatus },
        { label: 'Nationality', value: data.nationality },
    ].filter((f) => f.value);

    const sectionOrder: string[] = Array.isArray(data.sectionOrder) && data.sectionOrder.length
        ? (data.sectionOrder as string[])
        : ['workExperience', 'training', 'education', 'languages', 'references', 'skills', 'hobbies'];

    return (
        <Document title={data.fullName ? `${data.fullName} — CV` : 'CV'} author={data.fullName ?? ''}>
            <Page size="A4" style={styles.page}>
                {/* Sidebar */}
                <View style={styles.sidebar}>
                    {config.showPhoto && (
                        <View style={photoContainer}>
                            {data.profilePhoto ? (
                                <Image style={styles.photoImage} src={data.profilePhoto} />
                            ) : (
                                <Text style={styles.photoInitial}>{initial}</Text>
                            )}
                        </View>
                    )}
                    {data.fullName && <Text style={styles.sidebarName}>{data.fullName}</Text>}

                    {/* Contact */}
                    {(data.phone || data.email || data.address) && (
                        <SidebarSection title="Contact">
                            {data.phone && <Text style={styles.sidebarText}>📞 {data.phone}</Text>}
                            {data.email && <Text style={styles.sidebarText}>✉ {data.email}</Text>}
                            {data.address && <Text style={styles.sidebarText}>📍 {data.address}</Text>}
                        </SidebarSection>
                    )}

                    {/* Skills in sidebar */}
                    {sectionOrder.includes('skills') && (data.skills as string[])?.length > 0 && (
                        <SidebarSection title="Skills">
                            <View style={styles.skillsRow}>
                                {(data.skills as string[]).map((skill, i) => (
                                    <View key={i} style={styles.sidebarSkillBadge}>
                                        <Text style={styles.sidebarSkillText}>{skill}</Text>
                                    </View>
                                ))}
                            </View>
                        </SidebarSection>
                    )}

                    {/* Languages in sidebar */}
                    {sectionOrder.includes('languages') && languages.length > 0 && (
                        <SidebarSection title="Languages">
                            {languages.map((lang, i) => (
                                <View key={i} style={styles.langRow}>
                                    <Text style={styles.langName}>{lang.name}</Text>
                                    <Text style={styles.langLevel}>{lang.level}</Text>
                                </View>
                            ))}
                        </SidebarSection>
                    )}

                    {/* Hobbies in sidebar */}
                    {sectionOrder.includes('hobbies') && (data.hobbies as string[])?.length > 0 && (
                        <SidebarSection title="Hobbies">
                            <Text style={styles.sidebarText}>{(data.hobbies as string[]).join(' • ')}</Text>
                        </SidebarSection>
                    )}
                </View>

                {/* Main content */}
                <View style={styles.main}>
                    {data.fullName && <Text style={styles.mainName}>{data.fullName}</Text>}

                    {data.careerObjective && (
                        <View>
                            <Text style={styles.mainSectionTitle}>Career Objective</Text>
                            <Text style={styles.objective}>{data.careerObjective}</Text>
                        </View>
                    )}

                    {/* Personal data */}
                    {personalDataFields.length > 0 && (
                        <View>
                            <Text style={styles.mainSectionTitle}>Personal Information</Text>
                            <View style={styles.personalDataGrid}>
                                {personalDataFields.map((f, i) => (
                                    <View key={i} style={styles.personalDataItem}>
                                        <Text style={styles.metaLabel}>{f.label}</Text>
                                        <Text style={styles.metaValue}>{f.value}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    )}

                    {/* Dynamic sections in sectionOrder */}
                    {sectionOrder
                        .filter((k) => !['skills', 'hobbies', 'languages'].includes(k))
                        .map((key) => renderSection(key, data, styles))}

                    {/* Declaration */}
                    {data.declaration && (
                        <View>
                            <Text style={styles.mainSectionTitle}>Declaration</Text>
                            <Text style={styles.declarationText}>{data.declaration}</Text>
                        </View>
                    )}
                </View>
            </Page>
        </Document>
    );
}

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
