import type { SectionKey, TemplateConfig } from "./types";

export const DEFAULT_SECTION_ORDER: SectionKey[] = [
  "careerObjective",
  "workExperience",
  "training",
  "education",
  "skills",
  "languages",
  "hobbies",
  "references",
  "declaration",
];

export const SECTION_LABELS: Record<SectionKey, string> = {
  careerObjective: "Career Objective",
  workExperience: "Work Experience",
  training: "Professional Training",
  education: "Education",
  skills: "Skills",
  languages: "Languages",
  hobbies: "Hobbies",
  references: "Reference",
  declaration: "Declaration",
};

export const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] as const;

export const MARITAL_STATUSES = ["Single", "Married", "Divorced", "Widowed"] as const;

export const LANGUAGE_LEVELS = ["Native", "Fluent", "Intermediate", "Basics"] as const;

export const NATIONALITIES = [
  "Bangladeshi",
  "Indian",
  "Pakistani",
  "Sri Lankan",
  "Nepali",
  "Other",
] as const;

export const RELIGIONS = [
  "Islam",
  "Hinduism",
  "Christianity",
  "Buddhism",
  "Other",
] as const;

// Max version snapshots to keep per draft (oldest pruned automatically)
export const MAX_CV_VERSIONS = 20;

// Auto-save debounce in milliseconds
export const AUTOSAVE_DEBOUNCE_MS = 1500;

// Template slugs
export const CV_TEMPLATE_SLUG_001 = "classic-two-column";

// Default visual config — matches the Classic Two-Column template
export const DEFAULT_TEMPLATE_CONFIG: TemplateConfig = {
  sidebarWidthPercent: 32,
  sidebarBgColor: "#1a2f4e",
  sidebarTextColor: "#ffffff",
  showProfilePhoto: true,
  profilePhotoSizePx: 80,
  profilePhotoShape: "circle",
  contentBgColor: "#ffffff",
  nameColor: "#1a2f4e",
  nameFontSize: 22,
  sectionHeadingColor: "#1a2f4e",
  sectionHeadingFontSize: 8.5,
  bodyFontSize: 10.5,
  sidebarFontSize: 10,
  sidebarSections: ["skills", "languages", "hobbies"],
  accentColor: "#1a2f4e",
};
