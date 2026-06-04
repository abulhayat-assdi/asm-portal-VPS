export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { signJWT } from '@/lib/auth';
import { COOKIES } from '@/lib/constants';
import { consumeImpersonationToken } from '@/lib/impersonation';
import { getTenantBySlug } from '@/lib/tenant';

/**
 * GET /api/auth/impersonate?t=[token]&redirect=[url]
 * One-time token exchange করে session cookie সেট করে।
 * saas-admin "Enter as Admin" বাটন এই URL-এ নতুন tab খোলে।
 */
export async function GET(req: NextRequest) {
    const { searchParams } = req.nextUrl;
    const token = searchParams.get('t');
    const redirectUrl = searchParams.get('redirect') || '/dashboard';

    if (!token) {
        return NextResponse.redirect(new URL('/login', req.url));
    }

    const entry = consumeImpersonationToken(token);
    if (!entry) {
        // Token expired বা invalid
        return NextResponse.redirect(new URL('/login?error=token_expired', req.url));
    }

    const user = await prisma.user.findUnique({
        where: { id: entry.userId, deletedAt: null },
    });
    if (!user) {
        return NextResponse.redirect(new URL('/login?error=user_not_found', req.url));
    }

    const tenant = await getTenantBySlug(entry.tenantSlug);

    const jwt = await signJWT({
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        tenantId: user.tenantId ?? undefined,
        tenantSlug: tenant?.slug ?? undefined,
        teacherId: user.teacherId ?? undefined,
        studentBatchName: user.studentBatchName ?? undefined,
        studentRoll: user.studentRoll ?? undefined,
    });

    const response = NextResponse.redirect(redirectUrl);
    response.cookies.set(COOKIES.SESSION, jwt, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24, // 24 ঘণ্টা — impersonation session
    });

    return response;
}
