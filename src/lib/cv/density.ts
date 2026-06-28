import type { TemplateConfig } from "./constants";

export interface CvDensityData {
    fullName?: string | null;
    profilePhoto?: string | null;
    signature?: string | null;
    careerObjective?: string | null;
    phone?: string | null;
    email?: string | null;
    address?: string | null;
    linkedin?: string | null;
    visibleSections?: any;
    workExperience?: any;
    training?: any;
    education?: any;
    references?: any;
    declaration?: string | null;
    skills?: any;
    languages?: any;
    hobbies?: any;
    dateOfBirth?: string | null;
    bloodGroup?: string | null;
    religion?: string | null;
    maritalStatus?: string | null;
    nationality?: string | null;
}

/**
 * Extracts the username and URL from a LinkedIn input (full URL or just a username).
 */
export function getLinkedInDisplayAndUrl(val: string | null | undefined) {
    if (!val) return { display: "", url: "" };
    const trimmed = val.trim();
    let display = trimmed;
    let href = trimmed;

    if (trimmed.includes("linkedin.com/")) {
        // Clean trailing slashes & query parameters
        const clean = trimmed.replace(/\/+$/, "").split("?")[0];
        const parts = clean.split("/");
        display = parts[parts.length - 1] || trimmed;
        
        if (!/^https?:\/\//i.test(trimmed)) {
            href = "https://" + trimmed;
        }
    } else {
        display = trimmed;
        href = `https://www.linkedin.com/in/${trimmed}`;
    }

    return { display, url: href };
}

/**
 * Simulates Helvetica word wrapping to count the exact number of text lines.
 */
function estimateWrappedLines(text: string, containerWidth: number, fontSize: number): number {
    if (!text) return 0;
    // Average Helvetica char width is ~0.48 of font size.
    const avgCharWidth = fontSize * 0.48;
    const spaceWidth = fontSize * 0.25;
    const words = text.split(/\s+/);
    let lines = 1;
    let currentLineWidth = 0;

    for (let i = 0; i < words.length; i++) {
        const word = words[i];
        if (!word) continue;
        const wordWidth = word.length * avgCharWidth;
        if (currentLineWidth === 0) {
            currentLineWidth = wordWidth;
        } else if (currentLineWidth + spaceWidth + wordWidth <= containerWidth) {
            currentLineWidth += spaceWidth + wordWidth;
        } else {
            lines++;
            currentLineWidth = wordWidth;
        }
    }
    return lines;
}

export function estimateHeights(data: CvDensityData, config: TemplateConfig | undefined, scale: number, spacingScale: number) {
    const sw = config?.sidebarWidth || 38;
    const showPhoto = config?.showPhoto !== false;

    // A4 dimensions at 96 dpi
    const PREVIEW_WIDTH = 794;
    // main padding sp(18)*2 = 36 pt. In pixels: 36 * 1.3333 = 48 px.
    const W_main = PREVIEW_WIDTH * (1 - sw / 100) - 48 * spacingScale;
    // sidebar padding sp(14)*2 = 28 pt. In pixels: 28 * 1.3333 = 37.33 px.
    const W_sidebar = PREVIEW_WIDTH * (sw / 100) - 37.33 * spacingScale;

    const sz = (baseRem: number) => baseRem * scale * 16;
    const sp = (basePx: number) => Math.max(1, Math.round(basePx * spacingScale));

    // Section gap: reduced to sp(8) from sp(12)
    const gap = sp(8);

    // Retrieve list of visible sections (fall back to all if not defined)
    const visibleSections = data.visibleSections || [
        "careerObjective", "workExperience", "training", "education", "references", "skills", "languages", "hobbies", "personalInfo", "declaration"
    ];

    // 1. Estimate Main Column Height
    let H_main = 0;

    // Determine main sections in order
    const rawOrder: string[] = Array.isArray((data as any).sectionOrder) && (data as any).sectionOrder.length
        ? ((data as any).sectionOrder as string[])
        : ["careerObjective", "workExperience", "training", "education", "references", "declaration"];

    const sidebarKeys = ["skills", "languages", "hobbies"];
    const mainOrder = rawOrder.filter(k => !sidebarKeys.includes(k));
    for (const k of ["careerObjective", "workExperience", "training", "education", "references", "declaration"]) {
        if (!mainOrder.includes(k)) mainOrder.push(k);
    }

    let mainSectionsCount = 0;

    mainOrder.forEach(key => {
        if (!visibleSections.includes(key)) return;

        let sectionHeight = 0;
        let isSectionActive = false;

        if (key === "careerObjective" && data.careerObjective) {
            isSectionActive = true;
            // Header
            const fs_h = sz(0.78);
            const headingHeight = fs_h * 1.2 + Math.max(1, Math.round(1.5 * scale)) + sp(2) + sp(6);
            // Paragraph
            const fs_p = sz(0.74);
            const lines = estimateWrappedLines(data.careerObjective, W_main, fs_p);
            sectionHeight = headingHeight + lines * fs_p * 1.6;
        } else if (key === "workExperience" && Array.isArray(data.workExperience) && data.workExperience.length > 0) {
            isSectionActive = true;
            // Header
            const fs_h = sz(0.78);
            const headingHeight = fs_h * 1.2 + Math.max(1, Math.round(1.5 * scale)) + sp(2) + sp(6);
            
            let entriesHeight = 0;
            data.workExperience.forEach((item: any) => {
                if (!item) return;
                let itemHeight = 0;
                // Job Title
                const fs_title = sz(0.78);
                itemHeight += estimateWrappedLines(item.jobTitle, W_main, fs_title) * fs_title * 1.2;
                // Company & Location (subrow has marginTop: sz(1) pt = 1.33 * scale px)
                const fs_comp = sz(0.72);
                const subRowMargin = Math.round(1.33 * scale);
                const compW = W_main - 80 * scale; // Subtract approximate date width
                const compText = item.company + (item.location ? `, ${item.location}` : "");
                itemHeight += subRowMargin + estimateWrappedLines(compText, compW, fs_comp) * fs_comp * 1.2;
                // Bullets
                const bullets = Array.isArray(item.bullets) ? item.bullets.filter(Boolean) : [];
                bullets.forEach((b: string) => {
                    const fs_b = sz(0.70);
                    // marginLeft: sp(8) pt, bulletDot width: sz(8) pt. Total: 16 pt = 21.33 * scale px
                    const bulletW = W_main - 21.33 * scale;
                    itemHeight += estimateWrappedLines(b, bulletW, fs_b) * fs_b * 1.45 + sp(2); // marginTop: sp(2) pt
                });
                entriesHeight += itemHeight + sp(5); // entryBlock marginBottom: sp(5)
            });
            sectionHeight = headingHeight + entriesHeight;
        } else if (key === "training" && Array.isArray(data.training) && data.training.length > 0) {
            isSectionActive = true;
            // Header
            const fs_h = sz(0.78);
            const headingHeight = fs_h * 1.2 + Math.max(1, Math.round(1.5 * scale)) + sp(2) + sp(6);

            let entriesHeight = 0;
            data.training.forEach((item: any) => {
                if (!item) return;
                let itemHeight = 0;
                // Training Name
                const fs_title = sz(0.78);
                itemHeight += estimateWrappedLines(item.trainingName, W_main, fs_title) * fs_title * 1.2;
                // Institute
                const fs_inst = sz(0.72);
                const subRowMargin = Math.round(1.33 * scale);
                const instW = W_main - 60 * scale; // Subtract year width
                itemHeight += subRowMargin + estimateWrappedLines(item.institute, instW, fs_inst) * fs_inst * 1.2;
                // Bullets
                const bullets = Array.isArray(item.bullets) ? item.bullets.filter(Boolean) : [];
                bullets.forEach((b: string) => {
                    const fs_b = sz(0.70);
                    const bulletW = W_main - 21.33 * scale;
                    itemHeight += estimateWrappedLines(b, bulletW, fs_b) * fs_b * 1.45 + sp(2);
                });
                entriesHeight += itemHeight + sp(5);
            });
            sectionHeight = headingHeight + entriesHeight;
        } else if (key === "education" && Array.isArray(data.education) && data.education.length > 0) {
            isSectionActive = true;
            // Header
            const fs_h = sz(0.78);
            const headingHeight = fs_h * 1.2 + Math.max(1, Math.round(1.5 * scale)) + sp(2) + sp(6);

            let entriesHeight = 0;
            data.education.forEach((item: any) => {
                if (!item) return;
                let itemHeight = 0;
                // Degree
                const fs_deg = sz(0.78);
                const degText = item.degree + (item.department ? ` — ${item.department}` : "");
                itemHeight += estimateWrappedLines(degText, W_main, fs_deg) * fs_deg * 1.2;
                // Institution
                const fs_inst = sz(0.72);
                const subRowMargin = Math.round(1.33 * scale);
                const instW = W_main - 60 * scale;
                itemHeight += subRowMargin + estimateWrappedLines(item.institution, instW, fs_inst) * fs_inst * 1.2;
                // GPA (if present)
                if (item.gpa) {
                    const fs_gpa = sz(0.70);
                    itemHeight += 1 + fs_gpa * 1.2; // marginTop: 1pt
                }
                entriesHeight += itemHeight + sp(5);
            });
            sectionHeight = headingHeight + entriesHeight;
        } else if (key === "references" && Array.isArray(data.references) && data.references.length > 0) {
            isSectionActive = true;
            // Header
            const fs_h = sz(0.78);
            const headingHeight = fs_h * 1.2 + Math.max(1, Math.round(1.5 * scale)) + sp(2) + sp(6);

            // References render in 2-column grid. Column gap is Math.round(8 * scale) px.
            const W_ref_col = W_main * 0.47;
            const refHeights = data.references.map((ref: any) => {
                if (!ref) return 0;
                let h = 0;
                // Name
                const fs_name = sz(0.76);
                h += estimateWrappedLines(ref.name, W_ref_col, fs_name) * fs_name * 1.2;
                // Title
                if (ref.title) {
                    const fs = sz(0.70);
                    h += estimateWrappedLines(ref.title, W_ref_col, fs) * fs * 1.2;
                }
                // Org
                if (ref.organization) {
                    const fs = sz(0.70);
                    h += estimateWrappedLines(ref.organization, W_ref_col, fs) * fs * 1.2;
                }
                // Phone
                if (ref.phone) {
                    const fs = sz(0.68);
                    h += estimateWrappedLines(`Phone : ${ref.phone}`, W_ref_col, fs) * fs * 1.2;
                }
                // Email
                if (ref.email) {
                    const fs = sz(0.68);
                    h += estimateWrappedLines(`Email : ${ref.email}`, W_ref_col, fs) * fs * 1.2;
                }
                return h;
            });

            let gridHeight = 0;
            const rowGap = sp(3) + Math.round(8 * scale); // refItem marginBottom + gap
            for (let i = 0; i < refHeights.length; i += 2) {
                const h1 = refHeights[i] || 0;
                const h2 = refHeights[i + 1] || 0;
                gridHeight += Math.max(h1, h2);
                if (i + 2 < refHeights.length) {
                    gridHeight += rowGap;
                }
            }
            sectionHeight = headingHeight + gridHeight;
        } else if (key === "declaration" && data.declaration) {
            isSectionActive = true;
            // Declaration wrapper has border-top: sz(0.5) pt, paddingTop: sp(8) pt, marginTop: sp(6) pt
            const wrapperOverhead = sz(0.5) * 1.3333 + sp(8) + sp(6);
            // Declaration text
            const fs_dec = sz(0.70);
            const decLines = estimateWrappedLines(data.declaration, W_main, fs_dec);
            const decTextHeight = decLines * fs_dec * 1.5;
            // Signature
            let sigHeight = 0;
            if (data.signature) {
                const fs_sig = sz(0.76);
                const sigLines = estimateWrappedLines(data.signature, W_main, fs_sig);
                sigHeight = sigLines * fs_sig * 1.2 + sp(6); // marginTop: sp(6)
            }
            sectionHeight = wrapperOverhead + decTextHeight + sigHeight;
        }

        if (isSectionActive) {
            H_main += sectionHeight;
            mainSectionsCount++;
        }
    });

    if (mainSectionsCount > 1) {
        H_main += (mainSectionsCount - 1) * gap;
    }

    // 2. Estimate Sidebar Height
    let H_sidebar = 0;
    let sidebarSectionsCount = 0;

    // Photo
    if (showPhoto) {
        H_sidebar += Math.round(64 * scale) + sp(10);
    }

    // Full Name
    if (data.fullName) {
        const fs = sz(0.84);
        const lines = estimateWrappedLines(data.fullName, W_sidebar, fs);
        H_sidebar += lines * fs * 1.3 + sp(8);
    }

    const hasContact = data.phone || data.email || data.address || data.linkedin;
    const hasSkills = Array.isArray(data.skills) && data.skills.length > 0 && visibleSections.includes("skills");
    const hasLangs = Array.isArray(data.languages) && data.languages.length > 0 && visibleSections.includes("languages");
    const hasHobbies = Array.isArray(data.hobbies) && data.hobbies.length > 0 && visibleSections.includes("hobbies");
    const personalFields = [data.dateOfBirth, data.bloodGroup, data.religion, data.maritalStatus, data.nationality].filter(Boolean) as string[];
    const hasPersonal = personalFields.length > 0 && visibleSections.includes("personalInfo");

    const addSidebarSection = (contentHeight: number) => {
        const fs_h = sz(0.65);
        const headingHeight = fs_h * 1.2 + sz(0.5) * 1.3333 + sp(3) + sp(6);
        H_sidebar += headingHeight + contentHeight;
        sidebarSectionsCount++;
    };

    if (hasContact) {
        let contactH = 0;
        const fs = sz(0.70);
        const textW = W_sidebar - 17.33 * scale;
        if (data.phone) {
            contactH += estimateWrappedLines(data.phone, textW, fs) * fs * 1.4 + sp(3);
        }
        if (data.email) {
            contactH += estimateWrappedLines(data.email, textW, fs) * fs * 1.4 + sp(3);
        }
        if (data.address) {
            contactH += estimateWrappedLines(data.address, textW, fs) * fs * 1.4 + (data.linkedin ? sp(3) : 0);
        }
        if (data.linkedin) {
            const { display } = getLinkedInDisplayAndUrl(data.linkedin);
            contactH += estimateWrappedLines(display, textW, fs) * fs * 1.4;
        }
        addSidebarSection(contactH);
    }

    if (hasSkills) {
        let skillsH = 0;
        const fs = sz(0.70);
        const textW = W_sidebar - 13.33 * scale;
        data.skills.forEach((sk: string) => {
            if (!sk) return;
            skillsH += estimateWrappedLines(sk, textW, fs) * fs * 1.4 + sp(3);
        });
        addSidebarSection(skillsH);
    }

    if (hasLangs) {
        let langsH = 0;
        const fs = sz(0.70);
        data.languages.forEach((l: any) => {
            if (!l) return;
            langsH += fs * 1.4 + sp(3);
        });
        addSidebarSection(langsH);
    }

    if (hasHobbies) {
        let hobbiesH = 0;
        const fs = sz(0.70);
        const textW = W_sidebar - 13.33 * scale;
        data.hobbies.forEach((h: string) => {
            if (!h) return;
            hobbiesH += estimateWrappedLines(h, textW, fs) * fs * 1.4 + sp(3);
        });
        addSidebarSection(hobbiesH);
    }

    if (hasPersonal) {
        let personalH = 0;
        const fs = sz(0.66);
        const labelW = sz(58) * 1.3333;
        const colonW = sz(8) * 1.3333;
        const valW = W_sidebar - labelW - colonW;
        personalFields.forEach((val: string) => {
            personalH += estimateWrappedLines(val, valW, fs) * fs * 1.4 + sp(3);
        });
        addSidebarSection(personalH);
    }

    if (sidebarSectionsCount > 1) {
        H_sidebar += (sidebarSectionsCount - 1) * gap;
    }

    return { H_main, H_sidebar };
}

export function getCvDensityScale(data: CvDensityData, config?: TemplateConfig) {
    if (!data) {
        return { scale: 1.0, spacingScale: 1.0 };
    }

    // Default configuration if not provided
    const templateConfig: TemplateConfig = config || {
        primaryColor: "#1e3a5f",
        sidebarColor: "#1e3a5f",
        sidebarWidth: 38,
        fontFamily: "Helvetica",
        photoShape: "circle",
        showPhoto: true,
    };

    // Candidates range: from scale 1.25 down to 0.45
    const steps = [
        { scale: 1.25, spacingScale: 1.60 },
        { scale: 1.20, spacingScale: 1.45 },
        { scale: 1.15, spacingScale: 1.30 },
        { scale: 1.12, spacingScale: 1.20 },
        { scale: 1.08, spacingScale: 1.12 },
        { scale: 1.05, spacingScale: 1.05 },
        { scale: 1.02, spacingScale: 0.98 },
        { scale: 1.00, spacingScale: 0.92 },
        { scale: 0.97, spacingScale: 0.86 },
        { scale: 0.94, spacingScale: 0.80 },
        { scale: 0.91, spacingScale: 0.74 },
        { scale: 0.88, spacingScale: 0.68 },
        { scale: 0.85, spacingScale: 0.62 },
        { scale: 0.82, spacingScale: 0.56 },
        { scale: 0.79, spacingScale: 0.50 },
        { scale: 0.76, spacingScale: 0.44 },
        { scale: 0.73, spacingScale: 0.38 },
        { scale: 0.70, spacingScale: 0.33 },
        { scale: 0.67, spacingScale: 0.29 },
        { scale: 0.64, spacingScale: 0.25 },
        { scale: 0.60, spacingScale: 0.22 },
        { scale: 0.57, spacingScale: 0.19 },
        { scale: 0.54, spacingScale: 0.16 },
        { scale: 0.50, spacingScale: 0.13 },
        { scale: 0.45, spacingScale: 0.10 },
    ];

    let bestScale = 0.45;
    let bestSpacingScale = 0.10;

    for (const step of steps) {
        const { H_main, H_sidebar } = estimateHeights(data, templateConfig, step.scale, step.spacingScale);
        const topPadding = 20 * step.spacingScale;
        // Total height must be within 1115px (including bottom padding 48px)
        // We target a safe threshold of 1115px (corresponding to 836pt) to enforce bottom safety zone.
        const totalHeight = Math.max(H_main, H_sidebar) + topPadding + 48;
        if (totalHeight <= 1115) {
            bestScale = step.scale;
            bestSpacingScale = step.spacingScale;
            break; // First candidate that fits is the largest one
        }
    }

    return { scale: bestScale, spacingScale: bestSpacingScale };
}
