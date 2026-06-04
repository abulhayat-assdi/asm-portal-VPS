import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { COOKIES, APP_PATHS } from '@/lib/constants';
import { verifyJWT } from '@/lib/auth';

const PUBLIC_API_ROUTES = [
    '/api/chat',
    '/api/auth/register',
    '/api/auth/session',
    '/api/auth/batches',
    '/api/auth/login',
    '/api/auth/reset-password',
    '/api/feedback',
    '/api/setup',
    '/api/cv/public/',
    '/api/cv/admin/templates',
    '/api/saas/',
];

const isPublicAssetPath = (pathname: string) =>
    pathname.startsWith('/_next') ||
    pathname.startsWith('/images') ||
    pathname.startsWith('/cv/') ||
    pathname === '/favicon.ico';

const verifyAndGetRole = async (token: string): Promise<string | undefined> => {
    try {
        const payload = await verifyJWT(token);
        return payload.role;
    } catch {
        return undefined;
    }
};

// Reserved subdomains that route to SaaS-owner pages, not tenant portals
const RESERVED_SUBDOMAINS = new Set(['www', 'saas-admin', 'api', 'mail', 'ftp']);
const DEFAULT_TENANT_SLUG = 'tasm-skill';

function extractTenantSlug(host: string): string {
    const hostname = host.split(':')[0];
    const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || 'tasm-skill.asf.bd';

    // localhost or IP → use default tenant
    if (hostname === 'localhost' || /^\d+\.\d+\.\d+\.\d+$/.test(hostname)) {
        return DEFAULT_TENANT_SLUG;
    }

    const suffix = '.' + baseDomain;
    if (hostname.endsWith(suffix)) {
        const sub = hostname.slice(0, hostname.length - suffix.length);
        if (sub && !RESERVED_SUBDOMAINS.has(sub)) return sub;
    }

    // Main domain (no subdomain) → default tenant
    return DEFAULT_TENANT_SLUG;
}

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const host = request.headers.get('host') || '';

    // ── Tenant slug injection (no DB call — API routes resolve the slug) ──
    const tenantSlug = extractTenantSlug(host);
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-tenant-slug', tenantSlug);

    // ── SaaS admin routes — protected by separate saas-owner check ──
    if (pathname.startsWith('/saas-admin')) {
        const session = request.cookies.get(COOKIES.SESSION)?.value;
        const hasSession = typeof session === 'string' && session.split('.').length === 3 && session.length > 50;
        if (!hasSession) {
            return NextResponse.redirect(new URL('/login', request.url));
        }
        return NextResponse.next({ request: { headers: requestHeaders } });
    }

    if (isPublicAssetPath(pathname) || PUBLIC_API_ROUTES.some(route => pathname.startsWith(route))) {
        return NextResponse.next({ request: { headers: requestHeaders } });
    }

    const isDashboardPath = pathname.startsWith(APP_PATHS.DASHBOARD);
    const isStudentPath = pathname.startsWith(APP_PATHS.STUDENT_DASHBOARD);
    const isAuthPage = pathname === APP_PATHS.LOGIN || pathname === APP_PATHS.STUDENT_LOGIN;
    const isApiRequest = pathname.startsWith('/api');

    const session = request.cookies.get(COOKIES.SESSION)?.value;
    const hasSession = typeof session === 'string' && session.split('.').length === 3 && session.length > 50;
    const role = hasSession ? await verifyAndGetRole(session!) : undefined;

    if (isAuthPage && hasSession && role) {
        if (role === 'student') {
            return NextResponse.redirect(new URL(APP_PATHS.STUDENT_DASHBOARD, request.url));
        }
        return NextResponse.redirect(new URL(APP_PATHS.DASHBOARD, request.url));
    }

    if (!hasSession || !role) {
        if (isApiRequest) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        if (isStudentPath) {
            return NextResponse.redirect(new URL(APP_PATHS.STUDENT_LOGIN, request.url));
        }
        if (isDashboardPath) {
            return NextResponse.redirect(new URL(APP_PATHS.LOGIN, request.url));
        }
    }

    return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
    matcher: [
        '/dashboard/:path*',
        '/student-dashboard/:path*',
        '/saas-admin/:path*',
        '/login',
        '/student-login',
        '/api/:path*',
        '/cv/:path*',
    ],
};
