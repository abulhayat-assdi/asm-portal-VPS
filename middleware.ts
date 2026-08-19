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
    '/api/deployments/pixel',
    '/api/deployments/serve-site',
];

const isPublicAssetPath = (pathname: string) =>
    pathname.startsWith('/_next') ||
    pathname.startsWith('/images') ||
    pathname.startsWith('/cv/') ||
    pathname === '/favicon.ico';

function getStudentSubdomain(request: NextRequest): string | null {
    const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || '';
    const baseDomain = (process.env.NEXT_PUBLIC_BASE_DOMAIN || 'tasm-skill.asf.bd').toLowerCase();
    const hostWithoutPort = host.split(':')[0].toLowerCase();

    // Dev mode: myproject.localhost:3000
    if (hostWithoutPort.endsWith('.localhost')) {
        const parts = hostWithoutPort.split('.');
        if (parts.length > 1 && parts[0] !== 'localhost' && parts[0] !== 'www') {
            return parts[0];
        }
        return null;
    }

    // Production mode: myproject.tasm-skill.asf.bd
    if (hostWithoutPort.endsWith(baseDomain) && hostWithoutPort !== baseDomain) {
        const prefix = hostWithoutPort.slice(0, -(baseDomain.length + 1));
        const reserved = new Set(['www', 'api', 'admin', 'app', 'portal', 'mail']);
        if (prefix && !reserved.has(prefix)) {
            return prefix;
        }
    }

    return null;
}

const verifyAndGetRole = async (token: string): Promise<string | undefined> => {
    try {
        const payload = await verifyJWT(token);
        return payload.role;
    } catch {
        return undefined;
    }
};

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // 1. Check for student subdomain host
    const subdomain = getStudentSubdomain(request);
    if (subdomain) {
        // Rewrite to public serve-site route
        const serveUrl = new URL('/api/deployments/serve-site', request.url);
        serveUrl.searchParams.set('subdomain', subdomain);
        serveUrl.searchParams.set('path', pathname);
        return NextResponse.rewrite(serveUrl);
    }

    if (isPublicAssetPath(pathname) || PUBLIC_API_ROUTES.some(route => pathname.startsWith(route))) {
        return NextResponse.next();
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

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
};

