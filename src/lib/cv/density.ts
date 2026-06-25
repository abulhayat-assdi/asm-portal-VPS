export interface CvDensityData {
    careerObjective?: string | null;
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

export function getCvDensityScale(data: CvDensityData) {
    if (!data) {
        return { scale: 1.0, spacingScale: 1.0 };
    }

    let score = 0;

    // 1. Career Objective
    if (data.careerObjective) {
        score += Math.ceil(data.careerObjective.length / 80) * 1.5;
    }

    // 2. Work Experience
    const we = Array.isArray(data.workExperience) ? data.workExperience : [];
    we.forEach((item: any) => {
        if (!item) return;
        score += 2.0; // Header & company/location
        const bullets = Array.isArray(item.bullets) ? item.bullets.filter(Boolean) : [];
        bullets.forEach((b: string) => {
            score += Math.ceil(b.length / 75) * 1.15;
        });
    });

    // 3. Training
    const tr = Array.isArray(data.training) ? data.training : [];
    tr.forEach((item: any) => {
        if (!item) return;
        score += 2.0; // Header & institute
        const bullets = Array.isArray(item.bullets) ? item.bullets.filter(Boolean) : [];
        bullets.forEach((b: string) => {
            score += Math.ceil(b.length / 75) * 1.15;
        });
    });

    // 4. Education
    const edu = Array.isArray(data.education) ? data.education : [];
    edu.forEach((item: any) => {
        if (!item) return;
        score += 2.2; // Degree, Institution
        if (item.gpa) score += 0.8;
    });

    // 5. References
    const ref = Array.isArray(data.references) ? data.references : [];
    // References are rendered in a 2-column grid. Each row takes height of the tallest reference.
    score += Math.ceil(ref.length / 2) * 3.5;

    // 6. Declaration
    if (data.declaration) {
        score += Math.ceil(data.declaration.length / 80) * 1.5 + 1.0;
    }

    // Sidebar items (which affect the height of the left column)
    let sidebarScore = 0;

    // Profile Photo + Name
    sidebarScore += 6.0;

    // Contact (Phone, Email, Address)
    if (data.dateOfBirth || data.bloodGroup || data.religion || data.maritalStatus || data.nationality) {
        sidebarScore += 1.0;
    }
    const contactFields = [data.dateOfBirth, data.bloodGroup, data.religion, data.maritalStatus, data.nationality].filter(Boolean).length;
    sidebarScore += contactFields * 1.0;

    // Skills
    const skills = Array.isArray(data.skills) ? data.skills : [];
    if (skills.length > 0) sidebarScore += 1.5 + skills.length * 0.8;

    // Languages
    const langs = Array.isArray(data.languages) ? data.languages : [];
    if (langs.length > 0) sidebarScore += 1.5 + langs.length * 0.9;

    // Hobbies
    const hobbies = Array.isArray(data.hobbies) ? data.hobbies : [];
    if (hobbies.length > 0) sidebarScore += 1.5 + hobbies.length * 0.8;

    // Overall layout constraint score (take the maximum of main column or sidebar column load)
    const totalScore = Math.max(score, sidebarScore * 0.85);

    // Calculate scale factor based on total score
    // Standard template default is tuned for a score of ~34-38.
    let scale = 1.0;
    let spacingScale = 1.0;

    if (totalScore <= 12) {
        scale = 1.30;
        spacingScale = 1.80; // Make spacing larger to fill up the A4 page
    } else if (totalScore <= 18) {
        scale = 1.22;
        spacingScale = 1.50;
    } else if (totalScore <= 25) {
        scale = 1.15;
        spacingScale = 1.25;
    } else if (totalScore <= 32) {
        scale = 1.08;
        spacingScale = 1.05;
    } else if (totalScore <= 38) {
        scale = 1.00;
        spacingScale = 0.90;
    } else if (totalScore <= 45) {
        scale = 0.92;
        spacingScale = 0.75;
    } else if (totalScore <= 52) {
        scale = 0.85;
        spacingScale = 0.60;
    } else {
        scale = 0.78;
        spacingScale = 0.45; // Pack tightly to fit on one A4 page
    }

    return { scale, spacingScale };
}
