import { z } from 'zod';
import type { TemplateConfig } from './constants';

// ── Section item schemas ──────────────────────────────────────────────────────

export const workExperienceSchema = z.object({
    jobTitle: z.string().min(1, 'Job title is required'),
    company: z.string().min(1, 'Company is required'),
    location: z.string().optional().default(''),
    startDate: z.string().optional().default(''),
    endDate: z.string().optional().default(''),
    bullets: z.array(z.string()).default([]),
});

export const trainingSchema = z.object({
    trainingName: z.string().min(1, 'Training name is required'),
    institute: z.string().min(1, 'Institute is required'),
    year: z.string().optional().default(''),
    bullets: z.array(z.string()).default([]),
});

export const educationSchema = z.object({
    degree: z.string().min(1, 'Degree is required'),
    department: z.string().optional().default(''),
    institution: z.string().min(1, 'Institution is required'),
    gpa: z.string().optional().default(''),
    year: z.string().optional().default(''),
});

export const cvLanguageSchema = z.object({
    name: z.string().min(1, 'Language name is required'),
    level: z.string().min(1, 'Proficiency level is required'),
});

export const cvReferenceSchema = z.object({
    name: z.string().min(1, 'Reference name is required'),
    phone: z.string().optional().default(''),
    email: z.string().optional().default(''),
    title: z.string().optional().default(''),
    organization: z.string().optional().default(''),
});

// ── Main CV form schema ───────────────────────────────────────────────────────

const bdPhoneRegex = /^(\+8801|01)[0-9]{9}$/;

export const cvFormSchema = z.object({
    title: z.string().min(1, 'CV title is required').default('My CV'),

    // Personal
    fullName: z.string().optional().default(''),
    profilePhoto: z.string().optional().default(''),
    careerObjective: z.string().optional().default(''),

    // Contact
    phone: z
        .string()
        .optional()
        .refine((val) => !val || val === '' || bdPhoneRegex.test(val), {
            message: 'Enter a valid BD number (01XXXXXXXXX or +8801XXXXXXXXX)',
        })
        .default(''),
    email: z.string().optional().default(''),
    address: z.string().optional().default(''),

    // Personal data
    dateOfBirth: z.string().optional().default(''),
    bloodGroup: z.string().optional().default(''),
    religion: z.string().optional().default(''),
    maritalStatus: z.string().optional().default(''),
    nationality: z.string().optional().default(''),

    // JSON array sections
    skills: z.array(z.string()).default([]),
    languages: z.array(cvLanguageSchema).default([]),
    hobbies: z.array(z.string()).default([]),
    workExperience: z.array(workExperienceSchema).default([]),
    training: z.array(trainingSchema).default([]),
    education: z.array(educationSchema).default([]),
    references: z.array(cvReferenceSchema).default([]),

    // Extra
    declaration: z.string().optional().default(''),
    signature: z.string().optional().default(''),
    sectionOrder: z.array(z.string()).default([
        'workExperience',
        'training',
        'education',
        'languages',
        'references',
        'skills',
        'hobbies',
    ]),
});

export const cvAutoSaveSchema = cvFormSchema.partial();

export type CvFormData = z.infer<typeof cvFormSchema>;
export type CvAutoSaveData = z.infer<typeof cvAutoSaveSchema>;
export type WorkExperienceItem = z.infer<typeof workExperienceSchema>;
export type TrainingItem = z.infer<typeof trainingSchema>;
export type EducationItem = z.infer<typeof educationSchema>;
export type CvLanguageItem = z.infer<typeof cvLanguageSchema>;
export type CvReferenceItem = z.infer<typeof cvReferenceSchema>;

export type CvDraftFull = CvFormData & {
    id: string;
    userId: string;
    templateId: string;
    downloadCount: number;
    shareSlug?: string | null;
    isPublic: boolean;
    createdAt: string;
    updatedAt: string;
    template?: {
        id: string;
        name: string;
        slug: string;
        config: TemplateConfig;
    };
};
