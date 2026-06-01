export const DEFAULT_SECTION_ORDER = [
    'workExperience',
    'training',
    'education',
    'languages',
    'references',
    'skills',
    'hobbies',
] as const;

export type SectionKey = (typeof DEFAULT_SECTION_ORDER)[number];

export const SECTION_LABELS: Record<string, string> = {
    workExperience: 'Work Experience',
    training: 'Training',
    education: 'Education',
    languages: 'Languages',
    references: 'References',
    skills: 'Skills',
    hobbies: 'Hobbies',
};

export const MAX_CV_VERSIONS = 20;
export const AUTOSAVE_DEBOUNCE_MS = 1500;

export const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] as const;

export const MARITAL_STATUSES = ['Single', 'Married', 'Divorced', 'Widowed'] as const;

export const LANGUAGE_PROFICIENCY_LEVELS = [
    'Beginner',
    'Conversational',
    'Fluent',
    'Native',
] as const;

export const RELIGIONS = [
    'Islam',
    'Hinduism',
    'Christianity',
    'Buddhism',
    'Judaism',
    'Other',
] as const;

export const NATIONALITIES = [
    'Bangladeshi',
    'Indian',
    'Pakistani',
    'British',
    'American',
    'Canadian',
    'Australian',
    'Other',
] as const;

export type TemplateConfig = {
    primaryColor: string;
    sidebarColor: string;
    sidebarWidth: number;
    fontFamily: string;
    photoShape: 'circle' | 'square';
    showPhoto: boolean;
};
