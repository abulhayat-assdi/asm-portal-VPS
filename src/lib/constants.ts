/**
 * Global Constants for ASM Internal Portal
 */

export const AUTH_ROLES = {
    SUPER_ADMIN: 'super_admin',
    ADMIN: 'admin',
    TEACHER: 'teacher',
    STUDENT: 'student',
} as const;

export const COOKIES = {
    SESSION: '__session',
} as const;

export const COLLECTIONS = {
    USERS: 'users',
    TEACHERS: 'teachers',
    CLASSES: 'classes',
    NOTICES: 'notices',
    STUDENT_NOTICES: 'student_notices',
    HOMEWORK_SUBMISSIONS: 'homework_submissions',
    EXAM_RESULTS: 'exam_results',
    FEEDBACK: 'feedback',
    BLOG_COMMENTS: 'blogComments',
    CONTACT_INQUIRIES: 'contact_inquiries',
    ACTIVITY_LOGS: 'activity_logs',
} as const;

export const APP_PATHS = {
    LOGIN: '/login',
    STUDENT_LOGIN: '/student-login',
    DASHBOARD: '/dashboard',
    STUDENT_DASHBOARD: '/student-dashboard',
} as const;
