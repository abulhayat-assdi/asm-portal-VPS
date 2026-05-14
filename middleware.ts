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
];

const isPublicAssetPath = (pathname: string) =>
    pathname.startsWith('/_next') ||
    pathname.startsWith('/images') ||
    pathname === '/favicon.ico';

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

    if (isPublicAssetPath(pathname) || PUBLIC_API_ROUTES.some(route => pathname.startsWith(route))) {
        return NextResponse.next();
    }

    const isDashboardPath = pathname.startsWith(APP_PATHS.DASHBOARD);
    const isStudentPath = pathname.startsWith(APP_PATHS.STUDENT_DASHBOARD);
    const isAuthPage = pathname === APP_PATHS.LOGIN || pathname === APP_PATHS.STUDENT_LOGIN;
    const isApiRequest = pathname.startsWith('/api');

    const session = request.cookies.get(COOKIES.SESSION)?.value;
    // A valid JWT has exactly 3 dot-separated parts
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
        '/dashboard/:path*',
        '/student-dashboard/:path*',
        '/login',
        '/student-login',
        '/api/:path*',
    ],
};
