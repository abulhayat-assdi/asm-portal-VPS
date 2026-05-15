/**
 * ATS-Friendly PDF generation using @react-pdf/renderer.
 *
 * Two-renderer architecture:
 *  - The HTML preview (Template001Preview in the editor) is for visual fidelity.
 *  - This file renders a separate @react-pdf/renderer tree that produces a
 *    real text-layer PDF — parseable by ATS systems.
 *
 * All text is rendered as <Text> nodes (not images), fonts are embedded,
 * and the PDF metadata is set for proper ATS parsing.
 */
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  PDFDownloadLink,
  Font,
  pdf,
} from "@react-pdf/renderer";
import type { CvFormSchema } from "@/lib/cv/schemas";
import type { SectionKey } from "@/lib/cv/types";
import { DEFAULT_SECTION_ORDER } from "@/lib/cv/constants";

// ─── Colors ──────────────────────────────────────────────────────────────────
const NAVY = "#1a2f4e";
const SIDEBAR_BG = "#1a2f4e";
const WHITE = "#ffffff";
const BODY_TEXT = "#2d2d2d";
const MUTED = "#6b6b6b";

// ─── Styles ──────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  page: { flexDirection: "row", backgroundColor: WHITE, fontFamily: "Helvetica" },

  // Sidebar
  sidebar: {
    width: "32%",
    backgroundColor: SIDEBAR_BG,
    paddingTop: 24,
    paddingBottom: 20,
    paddingHorizontal: 12,
  },
  profileInitial: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#2d5278",
    alignSelf: "center",
    marginBottom: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  profileInitialText: { color: WHITE, fontSize: 22, fontFamily: "Helvetica-Bold" },
  sidebarSection: { marginBottom: 12 },
  sidebarHeading: {
    color: WHITE,
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 1.2,
    borderBottomWidth: 0.5,
    borderBottomColor: "rgba(255,255,255,0.3)",
    paddingBottom: 3,
    marginBottom: 5,
  },
  sidebarText: { color: "rgba(255,255,255,0.9)", fontSize: 8.5, marginBottom: 2 },
  sidebarBullet: { flexDirection: "row", alignItems: "flex-start", marginBottom: 2 },
  bulletDot: { color: "rgba(255,255,255,0.6)", fontSize: 8.5, marginRight: 4, marginTop: 0.5 },

  // Right content
  content: { flex: 1, paddingVertical: 24, paddingHorizontal: 20 },
  name: {
    fontFamily: "Helvetica-Bold",
    fontSize: 20,
    color: NAVY,
    textTransform: "uppercase",
    letterSpacing: 1,
    borderBottomWidth: 1.5,
    borderBottomColor: NAVY,
    paddingBottom: 5,
    marginBottom: 12,
  },
  sectionBlock: { marginBottom: 11 },
  sectionHeading: {
    fontFamily: "Helvetica-Bold",
    fontSize: 8.5,
    color: NAVY,
    textTransform: "uppercase",
    letterSpacing: 1,
    borderBottomWidth: 0.75,
    borderBottomColor: NAVY,
    paddingBottom: 2,
    marginBottom: 5,
  },
  bodyText: { fontSize: 9, color: BODY_TEXT, lineHeight: 1.5 },
  mutedText: { fontSize: 8, color: MUTED },
  itemTitle: { fontFamily: "Helvetica-Bold", fontSize: 9, color: NAVY, marginBottom: 1 },
  itemSubtitle: { fontSize: 8.5, color: MUTED, marginBottom: 2 },
  bullet: { flexDirection: "row", alignItems: "flex-start", marginBottom: 1.5 },
  bulletText: { fontSize: 9, color: BODY_TEXT, flex: 1, lineHeight: 1.4 },
  refGrid: { flexDirection: "row", flexWrap: "wrap" },
  refItem: { width: "50%", marginBottom: 6 },
  refName: { fontFamily: "Helvetica-Bold", fontSize: 9, color: NAVY, marginBottom: 1 },
  refText: { fontSize: 8.5, color: BODY_TEXT, marginBottom: 0.5 },
  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  declaration: { fontSize: 8.5, color: BODY_TEXT, lineHeight: 1.5, marginTop: 2 },
  signature: { fontSize: 9, color: NAVY, fontFamily: "Helvetica-Bold", textAlign: "right", marginTop: 10 },
});

// ─── PDF Document ─────────────────────────────────────────────────────────────
function CvDocument({ data }: { data: CvFormSchema }) {
  const sectionOrder = (data.sectionOrder ?? DEFAULT_SECTION_ORDER) as SectionKey[];
  const sidebarSections: SectionKey[] = ["skills", "languages", "hobbies"];
  const rightSections = sectionOrder.filter((s) => !sidebarSections.includes(s));

  return (
    <Document
      title={data.fullName ?? "CV"}
      author={data.fullName ?? ""}
      subject="Curriculum Vitae"
      keywords="CV resume curriculum vitae"
      creator="ASM Internal Portal"
    >
      <Page size="A4" style={s.page}>
        {/* ── Sidebar ── */}
        <View style={s.sidebar}>
          {/* Profile initial / placeholder */}
          <View style={s.profileInitial}>
            <Text style={s.profileInitialText}>
              {data.fullName?.charAt(0).toUpperCase() ?? "?"}
            </Text>
          </View>

          {/* Contact */}
          <View style={s.sidebarSection}>
            <Text style={s.sidebarHeading}>Contact</Text>
            {data.phone ? <Text style={s.sidebarText}>{data.phone}</Text> : null}
            {data.email ? <Text style={s.sidebarText}>{data.email}</Text> : null}
            {data.address ? <Text style={s.sidebarText}>{data.address}</Text> : null}
          </View>

          {/* Skills */}
          {(data.skills ?? []).length > 0 && (
            <View style={s.sidebarSection}>
              <Text style={s.sidebarHeading}>Skills</Text>
              {(data.skills ?? []).filter(Boolean).map((skill, i) => (
                <View key={i} style={s.sidebarBullet}>
                  <Text style={s.bulletDot}>•</Text>
                  <Text style={s.sidebarText}>{skill}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Languages */}
          {(data.languages ?? []).length > 0 && (
            <View style={s.sidebarSection}>
              <Text style={s.sidebarHeading}>Languages</Text>
              {(data.languages ?? []).map((l, i) => (
                <Text key={i} style={s.sidebarText}>
                  {l.name}{l.level ? ` (${l.level})` : ""}
                </Text>
              ))}
            </View>
          )}

          {/* Hobbies */}
          {(data.hobbies ?? []).length > 0 && (
            <View style={s.sidebarSection}>
              <Text style={s.sidebarHeading}>Hobbies</Text>
              {(data.hobbies ?? []).filter(Boolean).map((h, i) => (
                <View key={i} style={s.sidebarBullet}>
                  <Text style={s.bulletDot}>•</Text>
                  <Text style={s.sidebarText}>{h}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Personal Data */}
          {(data.dateOfBirth || data.bloodGroup || data.religion || data.maritalStatus || data.nationality) && (
            <View style={s.sidebarSection}>
              <Text style={s.sidebarHeading}>Personal Data</Text>
              {data.dateOfBirth && <Text style={s.sidebarText}>Date of Birth : {data.dateOfBirth}</Text>}
              {data.bloodGroup && <Text style={s.sidebarText}>Blood Group : {data.bloodGroup}</Text>}
              {data.religion && <Text style={s.sidebarText}>Religion : {data.religion}</Text>}
              {data.maritalStatus && <Text style={s.sidebarText}>Marital Status : {data.maritalStatus}</Text>}
              {data.nationality && <Text style={s.sidebarText}>Nationality : {data.nationality}</Text>}
            </View>
          )}
        </View>

        {/* ── Right Content ── */}
        <View style={s.content}>
          {/* Name */}
          <Text style={s.name}>{data.fullName ?? ""}</Text>

          {/* Ordered sections */}
          {rightSections.map((key) => {
            if (key === "careerObjective" && data.careerObjective) {
              return (
                <View key={key} style={s.sectionBlock}>
                  <Text style={s.sectionHeading}>Career Objective</Text>
                  <Text style={s.bodyText}>{data.careerObjective}</Text>
                </View>
              );
            }

            if (key === "workExperience" && (data.workExperience ?? []).length > 0) {
              return (
                <View key={key} style={s.sectionBlock}>
                  <Text style={s.sectionHeading}>Work Experience</Text>
                  {(data.workExperience ?? []).map((w) => (
                    <View key={w.id} style={{ marginBottom: 6 }}>
                      <Text style={s.itemTitle}>{w.jobTitle}</Text>
                      <Text style={s.itemSubtitle}>{[w.company, w.location].filter(Boolean).join(" , ")}</Text>
                      {w.bullets.filter(Boolean).map((b, bi) => (
                        <View key={bi} style={s.bullet}>
                          <Text style={s.bulletDot}>•</Text>
                          <Text style={s.bulletText}>{b}</Text>
                        </View>
                      ))}
                    </View>
                  ))}
                </View>
              );
            }

            if (key === "training" && (data.training ?? []).length > 0) {
              return (
                <View key={key} style={s.sectionBlock}>
                  <Text style={s.sectionHeading}>Professional Training</Text>
                  {(data.training ?? []).map((t) => (
                    <View key={t.id} style={{ marginBottom: 6 }}>
                      <Text style={s.itemTitle}>{t.trainingName}</Text>
                      <Text style={s.itemSubtitle}>{t.institute}</Text>
                      {t.bullets.filter(Boolean).map((b, bi) => (
                        <View key={bi} style={s.bullet}>
                          <Text style={s.bulletDot}>•</Text>
                          <Text style={s.bulletText}>{b}</Text>
                        </View>
                      ))}
                    </View>
                  ))}
                </View>
              );
            }

            if (key === "education" && (data.education ?? []).length > 0) {
              return (
                <View key={key} style={s.sectionBlock}>
                  <Text style={s.sectionHeading}>Education</Text>
                  {(data.education ?? []).map((e) => (
                    <View key={e.id} style={{ marginBottom: 5 }}>
                      <Text style={s.itemTitle}>{[e.degree, e.department].filter(Boolean).join(" , ")}</Text>
                      <Text style={s.itemSubtitle}>{e.institution}</Text>
                      <View style={s.rowBetween}>
                        {e.gpa ? <Text style={s.mutedText}>GPA: {e.gpa}</Text> : <Text />}
                        {e.year ? <Text style={s.mutedText}>{e.year}</Text> : null}
                      </View>
                    </View>
                  ))}
                </View>
              );
            }

            if (key === "references" && (data.references ?? []).length > 0) {
              return (
                <View key={key} style={s.sectionBlock}>
                  <Text style={s.sectionHeading}>Reference</Text>
                  <View style={s.refGrid}>
                    {(data.references ?? []).map((r) => (
                      <View key={r.id} style={s.refItem}>
                        <Text style={s.refName}>{r.name}</Text>
                        <Text style={s.refText}>Phone : {r.phone}</Text>
                        <Text style={s.refText}>Email : {r.email}</Text>
                        <Text style={s.mutedText}>{r.title}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              );
            }

            if (key === "declaration" && data.declaration) {
              return (
                <View key={key} style={s.sectionBlock}>
                  <Text style={s.declaration}>{data.declaration}</Text>
                  {data.signature && <Text style={s.signature}>{data.signature}</Text>}
                </View>
              );
            }

            return null;
          })}
        </View>
      </Page>
    </Document>
  );
}

// ─── Export function (called from the editor) ─────────────────────────────────
export async function generateCvPdf(data: CvFormSchema, filename = "cv.pdf"): Promise<void> {
  const blob = await pdf(<CvDocument data={data} />).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Re-export for potential direct use
export { CvDocument };
export type { CvFormSchema };
