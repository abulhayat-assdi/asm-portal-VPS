import { z } from "zod";

// BD mobile: +8801XXXXXXXXX or 01XXXXXXXXX (3rd digit 3-9, then 8 more digits)
const bdPhoneRegex = /^(?:\+880|0)1[3-9]\d{8}$/;

const bdPhone = z
  .string()
  .min(1, "Phone number is required")
  .regex(bdPhoneRegex, "Enter a valid Bangladeshi mobile number (e.g. 01XXXXXXXXX or +8801XXXXXXXXX)");

// ─── Dynamic section item schemas ────────────────────────────────────────────

export const workExperienceSchema = z.object({
  id: z.string(),
  jobTitle: z.string().min(1, "Job title is required"),
  company: z.string().min(1, "Company name is required"),
  location: z.string().min(1, "Location is required"),
  bullets: z.array(z.string()).default([]),
});

export const trainingSchema = z.object({
  id: z.string(),
  trainingName: z.string().min(1, "Training name is required"),
  institute: z.string().min(1, "Institute name is required"),
  bullets: z.array(z.string()).default([]),
});

export const educationSchema = z.object({
  id: z.string(),
  degree: z.string().min(1, "Degree is required"),
  department: z.string().min(1, "Department is required"),
  institution: z.string().min(1, "Institution name is required"),
  gpa: z.string().optional(),
  year: z.string().optional(),
});

export const cvLanguageSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Language name is required"),
  level: z.string().min(1, "Level is required"),
});

export const cvReferenceSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Reference name is required"),
  phone: z.string().min(1, "Phone is required"),
  email: z.string().email("Valid email required"),
  title: z.string().min(1, "Title/position is required"),
});

// ─── Main CV form schema ──────────────────────────────────────────────────────

export const cvFormSchema = z.object({
  title: z.string().min(1, "CV title is required").max(100),
  templateId: z.string().min(1, "Template is required"),

  // Personal
  fullName: z
    .string()
    .min(2, "Full name must be at least 2 characters")
    .max(100, "Name too long"),
  profilePhoto: z.string().nullable().optional(),
  careerObjective: z.string().max(1000).optional(),

  // Contact — required fields
  phone: bdPhone,
  email: z.string().email("Enter a valid email address"),
  address: z.string().max(300).optional(),

  // Personal Data — all optional
  dateOfBirth: z.string().optional(),
  bloodGroup: z.string().optional(),
  religion: z.string().optional(),
  maritalStatus: z.string().optional(),
  nationality: z.string().optional(),

  // Dynamic sections
  skills: z.array(z.string().min(1)).default([]),
  languages: z.array(cvLanguageSchema).default([]),
  hobbies: z.array(z.string().min(1)).default([]),
  workExperience: z.array(workExperienceSchema).default([]),
  training: z.array(trainingSchema).default([]),
  education: z.array(educationSchema).default([]),
  references: z.array(cvReferenceSchema).default([]),

  // Declaration
  declaration: z.string().max(500).optional(),
  signature: z.string().max(100).optional(),

  // Section order
  sectionOrder: z.array(z.string()).default([]),
});

// Partial version used for auto-save (no required field enforcement)
export const cvAutoSaveSchema = cvFormSchema.partial().extend({
  title: z.string().min(1).max(100).optional(),
});

export type CvFormSchema = z.infer<typeof cvFormSchema>;
export type CvAutoSaveSchema = z.infer<typeof cvAutoSaveSchema>;
