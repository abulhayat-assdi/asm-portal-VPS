// ─── Dynamic section item types ─────────────────────────────────────────────

export interface WorkExperience {
  id: string;
  jobTitle: string;
  company: string;
  location: string;
  bullets: string[];
}

export interface Training {
  id: string;
  trainingName: string;
  institute: string;
  bullets: string[];
}

export interface Education {
  id: string;
  degree: string;
  department: string;
  institution: string;
  gpa?: string;
  year?: string;
}

export interface CvLanguage {
  id: string;
  name: string;
  level: string;
}

export interface CvReference {
  id: string;
  name: string;
  phone: string;
  email: string;
  title: string;
}

// ─── Section keys (used for drag-and-drop ordering) ─────────────────────────

export type SectionKey =
  | "careerObjective"
  | "workExperience"
  | "training"
  | "education"
  | "skills"
  | "languages"
  | "hobbies"
  | "references"
  | "declaration";

// ─── Main form data shape (mirrors the DB model) ────────────────────────────

export interface CvFormData {
  title: string;
  templateId: string;
  // Personal
  fullName: string;
  profilePhoto?: string | null;
  careerObjective?: string;
  // Contact
  phone: string;
  email: string;
  address?: string;
  // Personal Data
  dateOfBirth?: string;
  bloodGroup?: string;
  religion?: string;
  maritalStatus?: string;
  nationality?: string;
  // Dynamic sections
  skills: string[];
  languages: CvLanguage[];
  hobbies: string[];
  workExperience: WorkExperience[];
  training: Training[];
  education: Education[];
  references: CvReference[];
  // Declaration
  declaration?: string;
  signature?: string;
  // Section order
  sectionOrder: SectionKey[];
}

// ─── API response shapes ─────────────────────────────────────────────────────

export interface CvDraftSummary {
  id: string;
  title: string;
  templateId: string;
  templateName: string;
  templateSlug: string;
  downloadCount: number;
  isPublic: boolean;
  shareSlug?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CvDraftFull extends CvFormData {
  id: string;
  userId: string;
  isPublic: boolean;
  shareSlug?: string | null;
  downloadCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CvVersionSummary {
  id: string;
  label?: string | null;
  createdAt: string;
}

export interface CvTemplateRecord {
  id: string;
  name: string;
  slug: string;
  thumbnail?: string | null;
  description?: string | null;
  isActive: boolean;
  createdAt: string;
}

// ─── Admin list item ─────────────────────────────────────────────────────────

export interface AdminCvListItem {
  id: string;
  title: string;
  userId: string;
  userName: string;
  userEmail: string;
  templateName: string;
  downloadCount: number;
  isPublic: boolean;
  shareSlug?: string | null;
  createdAt: string;
  updatedAt: string;
}
