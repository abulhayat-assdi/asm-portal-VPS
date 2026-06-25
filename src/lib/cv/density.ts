import type { TemplateConfig } from "./constants";

export interface CvDensityData {
    fullName?: string | null;
    profilePhoto?: string | null;
    signature?: string | null;
    careerObjective?: string | null;
    phone?: string | null;
    email?: string | null;
    address?: string | null;
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

export function estimateHeights(data: CvDensityData, config: TemplateConfig | undefined, scale: number, spacingScale: number) {
    const sw = config?.sidebarWidth || 38;
    const showPhoto = config?.showPhoto !== false;

    // A4 dimensions at 96 dpi
    const PREVIEW_WIDTH = 794;
    const W_main = PREVIEW_WIDTH * (1 - sw / 100) - 36 * spacingScale; // 18px left/right padding
    const W_sidebar = PREVIEW_WIDTH * (sw / 100) - 28 * spacingScale; // 14px left/right padding

    const sz = (baseRem: number) => baseRem * scale * 16;
    const sp = (basePx: number) => Math.max(1, Math.round(basePx * spacingScale));

    // Section gap: 12px default
    const gap = sp(12);

    // 1. Estimate Main Column Height
    let H_main = 0;

    // Full Name at top of main column
    if (data.fullName) {
        const fs = sz(1.1);
        const lh = 1.2;
        const charWidth = 0.47 * fs;
        const charsPerLine = Math.max(1, W_main / charWidth);
        const lines = Math.max(1, Math.ceil(data.fullName.length / charsPerLine));
        H_main += lines * fs * lh + sp(6); // sp(6) is marginBottom
    }

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
        let sectionHeight = 0;
        let isSectionActive = false;

        if (key === "careerObjective" && data.careerObjective) {
            isSectionActive = true;
            // Header
            const fs_h = sz(0.78);
            const headingHeight = fs_h * 1.2 + Math.max(1, Math.round(1.5 * scale)) + sp(3) + sp(10);
            // Paragraph
            const fs_p = sz(0.74);
            const charsPerLine = Math.max(1, W_main / (0.47 * fs_p));
            const lines = Math.max(1, Math.ceil(data.careerObjective.length / charsPerLine));
            sectionHeight = headingHeight + lines * fs_p * 1.6;
        } else if (key === "workExperience" && Array.isArray(data.workExperience) && data.workExperience.length > 0) {
            isSectionActive = true;
            // Header
            const fs_h = sz(0.78);
            const headingHeight = fs_h * 1.2 + Math.max(1, Math.round(1.5 * scale)) + sp(3) + sp(10);
            
            let entriesHeight = 0;
            data.workExperience.forEach((item: any) => {
                if (!item) return;
                let itemHeight = 0;
                // Job Title
                const fs_title = sz(0.78);
                itemHeight += fs_title * 1.2;
                // Company
                const fs_comp = sz(0.72);
                itemHeight += fs_comp * 1.2;
                // Bullets
                const bullets = Array.isArray(item.bullets) ? item.bullets.filter(Boolean) : [];
                bullets.forEach((b: string) => {
                    const fs_b = sz(0.70);
                    const bulletW = W_main - sp(10); // padding-left: sp(10)
                    const charsPerLine = Math.max(1, bulletW / (0.47 * fs_b));
                    const lines = Math.max(1, Math.ceil(b.length / charsPerLine));
                    itemHeight += lines * fs_b * 1.45 + sp(3);
                });
                entriesHeight += itemHeight + sp(8); // marginBottom: sp(8)
            });
            sectionHeight = headingHeight + entriesHeight;
        } else if (key === "training" && Array.isArray(data.training) && data.training.length > 0) {
            isSectionActive = true;
            // Header
            const fs_h = sz(0.78);
            const headingHeight = fs_h * 1.2 + Math.max(1, Math.round(1.5 * scale)) + sp(3) + sp(10);

            let entriesHeight = 0;
            data.training.forEach((item: any) => {
                if (!item) return;
                let itemHeight = 0;
                // Training Name
                const fs_title = sz(0.78);
                itemHeight += fs_title * 1.2;
                // Institute
                const fs_inst = sz(0.72);
                itemHeight += fs_inst * 1.2;
                // Bullets
                const bullets = Array.isArray(item.bullets) ? item.bullets.filter(Boolean) : [];
                bullets.forEach((b: string) => {
                    const fs_b = sz(0.70);
                    const bulletW = W_main - sp(10);
                    const charsPerLine = Math.max(1, bulletW / (0.47 * fs_b));
                    const lines = Math.max(1, Math.ceil(b.length / charsPerLine));
                    itemHeight += lines * fs_b * 1.45 + sp(3);
                });
                entriesHeight += itemHeight + sp(8);
            });
            sectionHeight = headingHeight + entriesHeight;
        } else if (key === "education" && Array.isArray(data.education) && data.education.length > 0) {
            isSectionActive = true;
            // Header
            const fs_h = sz(0.78);
            const headingHeight = fs_h * 1.2 + Math.max(1, Math.round(1.5 * scale)) + sp(3) + sp(10);

            let entriesHeight = 0;
            data.education.forEach((item: any) => {
                if (!item) return;
                let itemHeight = 0;
                // Degree
                const fs_deg = sz(0.78);
                itemHeight += fs_deg * 1.2;
                // Institution
                const fs_inst = sz(0.72);
                itemHeight += fs_inst * 1.2;
                // GPA (if present)
                if (item.gpa) {
                    const fs_gpa = sz(0.70);
                    itemHeight += fs_gpa * 1.2;
                }
                entriesHeight += itemHeight + sp(8);
            });
            sectionHeight = headingHeight + entriesHeight;
        } else if (key === "references" && Array.isArray(data.references) && data.references.length > 0) {
            isSectionActive = true;
            // Header
            const fs_h = sz(0.78);
            const headingHeight = fs_h * 1.2 + Math.max(1, Math.round(1.5 * scale)) + sp(3) + sp(10);

            // References render in 2-column grid. Column gap is sp(10).
            const W_ref_col = (W_main - sp(10)) / 2;
            const refHeights = data.references.map((ref: any) => {
                if (!ref) return 0;
                let h = 0;
                // Name
                const fs_name = sz(0.76);
                h += fs_name * 1.2;
                // Title
                if (ref.title) h += sz(0.70) * 1.2;
                // Org
                if (ref.organization) h += sz(0.70) * 1.2;
                // Phone
                if (ref.phone) h += sz(0.68) * 1.2;
                // Email
                if (ref.email) h += sz(0.68) * 1.2;
                return h;
            });

            let gridHeight = 0;
            for (let i = 0; i < refHeights.length; i += 2) {
                const h1 = refHeights[i] || 0;
                const h2 = refHeights[i + 1] || 0;
                gridHeight += Math.max(h1, h2) + sp(10); // row height + vertical gap
            }
            sectionHeight = headingHeight + gridHeight;
        } else if (key === "declaration" && data.declaration) {
            isSectionActive = true;
            // Declaration wrapper has border-top: 1px, paddingTop: sp(10), marginTop: sp(4)
            const wrapperOverhead = 1 + sp(10) + sp(4);
            // Declaration text
            const fs_dec = sz(0.70);
            const charsPerLine = Math.max(1, W_main / (0.47 * fs_dec));
            const lines = Math.max(1, Math.ceil(data.declaration.length / charsPerLine));
            const decTextHeight = lines * fs_dec * 1.5;
            // Signature
            let sigHeight = 0;
            if (data.signature) {
                const fs_sig = sz(0.76);
                sigHeight = fs_sig * 1.2 + sp(6); // marginTop: sp(6)
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
        const charsPerLine = Math.max(1, W_sidebar / (0.47 * fs));
        const lines = Math.max(1, Math.ceil(data.fullName.length / charsPerLine));
        H_sidebar += lines * fs * 1.3 + sp(12);
    }

    const hasContact = data.phone || data.email || data.address;
    const hasSkills = Array.isArray(data.skills) && data.skills.length > 0;
    const hasLangs = Array.isArray(data.languages) && data.languages.length > 0;
    const hasHobbies = Array.isArray(data.hobbies) && data.hobbies.length > 0;
    const personalFields = [data.dateOfBirth, data.bloodGroup, data.religion, data.maritalStatus, data.nationality].filter(Boolean) as string[];
    const hasPersonal = personalFields.length > 0;

    const addSidebarSection = (contentHeight: number) => {
        const fs_h = sz(0.65);
        const headingHeight = fs_h * 1.2 + Math.max(1, Math.round(1 * scale)) + sp(3) + sp(8);
        H_sidebar += headingHeight + contentHeight;
        sidebarSectionsCount++;
    };

    if (hasContact) {
        let contactH = 0;
        const fs = sz(0.70);
        if (data.phone) {
            const charsPerLine = Math.max(1, W_sidebar / (0.47 * fs));
            const lines = Math.max(1, Math.ceil(data.phone.length / charsPerLine));
            contactH += lines * fs * 1.3 + sp(3);
        }
        if (data.email) {
            const charsPerLine = Math.max(1, W_sidebar / (0.47 * fs));
            const lines = Math.max(1, Math.ceil(data.email.length / charsPerLine));
            contactH += lines * fs * 1.3 + sp(3);
        }
        if (data.address) {
            const charsPerLine = Math.max(1, W_sidebar / (0.47 * fs));
            const lines = Math.max(1, Math.ceil(data.address.length / charsPerLine));
            contactH += lines * fs * 1.3;
        }
        addSidebarSection(contactH);
    }

    if (hasSkills) {
        let skillsH = 0;
        const fs = sz(0.70);
        data.skills.forEach((sk: string) => {
            if (!sk) return;
            const charsPerLine = Math.max(1, W_sidebar / (0.47 * fs));
            const lines = Math.max(1, Math.ceil(sk.length / charsPerLine));
            skillsH += lines * fs * 1.3 + sp(3);
        });
        addSidebarSection(skillsH);
    }

    if (hasLangs) {
        let langsH = 0;
        const fs_name = sz(0.70);
        data.languages.forEach((l: any) => {
            if (!l) return;
            langsH += fs_name * 1.3 + sp(3);
        });
        addSidebarSection(langsH);
    }

    if (hasHobbies) {
        let hobbiesH = 0;
        const fs = sz(0.70);
        data.hobbies.forEach((h: string) => {
            if (!h) return;
            const charsPerLine = Math.max(1, W_sidebar / (0.47 * fs));
            const lines = Math.max(1, Math.ceil(h.length / charsPerLine));
            hobbiesH += lines * fs * 1.3 + sp(3);
        });
        addSidebarSection(hobbiesH);
    }

    if (hasPersonal) {
        let personalH = 0;
        const labelW = Math.round(60 * scale);
        const valW = W_sidebar - labelW - sp(3);
        const fs = sz(0.66);
        personalFields.forEach((val: string) => {
            const charsPerLine = Math.max(1, valW / (0.47 * fs));
            const lines = Math.max(1, Math.ceil(val.length / charsPerLine));
            personalH += lines * fs * 1.3 + sp(3);
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

    // Candidates range: from scale 1.25 down to 0.60
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
    ];

    let bestScale = 0.60;
    let bestSpacingScale = 0.22;

    for (const step of steps) {
        const { H_main, H_sidebar } = estimateHeights(data, templateConfig, step.scale, step.spacingScale);
        const topPadding = 20 * step.spacingScale;
        // Total height must be within 1123px (including bottom padding 48px)
        // We target a slightly safer threshold of 1118px to account for slight rounding variances
        const totalHeight = Math.max(H_main, H_sidebar) + topPadding + 48;
        if (totalHeight <= 1118) {
            bestScale = step.scale;
            bestSpacingScale = step.spacingScale;
            break; // First candidate that fits is the largest one
        }
    }

    return { scale: bestScale, spacingScale: bestSpacingScale };
}
