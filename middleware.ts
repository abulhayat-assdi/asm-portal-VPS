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

// Reserved subdomains — not tenant portals
const RESERVED_SUBDOMAINS = new Set(['www', 'saas-admin', 'admin', 'api', 'mail', 'ftp']);
const DEFAULT_TENANT_SLUG = 'tasm-skill';
const ADMIN_SUBDOMAIN = 'admin';

function extractSubdomain(host: string): string | null {
    // Strip port if present (e.g. "admin.tasm-skill.asf.bd:443" → "admin.tasm-skill.asf.bd")
    const hostname = host.split(':')[0].toLowerCase();
    const baseDomain = (process.env.NEXT_PUBLIC_BASE_DOMAIN || 'tasm-skill.asf.bd').toLowerCase();

    // Production: admin.tasm-skill.asf.bd
    const suffix = '.' + baseDomain;
    if (hostname.endsWith(suffix)) {
        return hostname.slice(0, hostname.length - suffix.length) || null;
    }

    // Development: admin.localhost
    if (hostname.endsWith('.localhost')) {
        return hostname.slice(0, hostname.length - '.localhost'.length) || null;
    }

    return null;
}

function extractTenantSlug(host: string): string {
    const hostname = host.split(':')[0].toLowerCase();
    const baseDomain = (process.env.NEXT_PUBLIC_BASE_DOMAIN || 'tasm-skill.asf.bd').toLowerCase();

    if (hostname === 'localhost' || /^\d+\.\d+\.\d+\.\d+$/.test(hostname)) {
        return DEFAULT_TENANT_SLUG;
    }

    // Production subdomain
    const suffix = '.' + baseDomain;
    if (hostname.endsWith(suffix)) {
        const sub = hostname.slice(0, hostname.length - suffix.length);
        if (sub && !RESERVED_SUBDOMAINS.has(sub)) return sub;
    }

    // Development: xyz.localhost → tenant "xyz"
    if (hostname.endsWith('.localhost')) {
        const sub = hostname.slice(0, hostname.length - '.localhost'.length);
        if (sub && !RESERVED_SUBDOMAINS.has(sub)) return sub;
    }

    return DEFAULT_TENANT_SLUG;
}

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    // X-Forwarded-Host takes priority — Traefik/Coolify passes the real public hostname here
    const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || '';
    const subdomain = extractSubdomain(host);

    // ══════════════════════════════════════════════════════════════════════════
    // ADMIN SUBDOMAIN: admin.tasm-skill.asf.bd
    // Completely separate from main portal. Has own login page.
    // ══════════════════════════════════════════════════════════════════════════
    if (subdomain === ADMIN_SUBDOMAIN) {
        // Static assets & API calls pass through without path rewriting
        if (isPublicAssetPath(pathname) || pathname.startsWith('/api/')) {
            return NextResponse.next();
        }

        const session = request.cookies.get(COOKIES.SESSION)?.value;
        const hasSession = typeof session === 'string' && session.split('.').length === 3 && session.length > 50;

        // Map browser path → internal /saas-admin/* path
        // /login  →  /saas-admin/login  (dedicated admin login page)
        // /       →  /saas-admin        (dashboard)
        // /tenants → /saas-admin/tenants
        // Admin login page lives OUTSIDE saas-admin/ folder to avoid layout auth loop
        const ADMIN_LOGIN_PAGE = '/saas-admin-login';
        const ADMIN_DASHBOARD  = '/saas-admin';

        // No session → hard redirect to login page (rewrite was not working in production)
        if (!hasSession) {
            // Skip redirect if already on login page to avoid loop
            if (pathname === '/saas-admin-login') {
                return NextResponse.next();
            }
            const origin = request.nextUrl.origin;
            return NextResponse.redirect(new URL('/saas-admin-login', origin));
        }

        const origin = request.nextUrl.origin;

        // Already on login page but has session → go to dashboard
        if (pathname === '/saas-admin-login') {
            return NextResponse.redirect(new URL('/saas-admin', origin));
        }

        // Authenticated: redirect browser to /saas-admin/* paths
        const internalPath = pathname.startsWith('/saas-admin')
            ? pathname
            : `${ADMIN_DASHBOARD}${pathname === '/' ? '' : pathname}`;

        const rewriteUrl = request.nextUrl.clone();
        rewriteUrl.pathname = internalPath || ADMIN_DASHBOARD;
        const res = NextResponse.rewrite(rewriteUrl);
        res.headers.set('x-admin-domain', '1');
        res.headers.set('x-tenant-slug', DEFAULT_TENANT_SLUG);
        return res;
    }

    // ── Tenant slug injection ────────────────────────────────────────────────
    const tenantSlug = extractTenantSlug(host);
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-tenant-slug', tenantSlug);

    // ── Block /saas-admin on main domain (admin-only subdomain now) ───────────
    if (pathname.startsWith('/saas-admin')) {
        return NextResponse.json({ error: 'Not Found' }, { status: 404 });
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
        // Match all paths so admin subdomain rewrite works on any route
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
};
