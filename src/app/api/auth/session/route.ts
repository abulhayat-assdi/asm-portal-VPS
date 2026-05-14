import { NextRequest, NextResponse } from 'next/server';
import { COOKIES } from '@/lib/constants';

/**
 * POST /api/auth/session
 * Legacy compatibility endpoint — now just clears the old cookie on POST (no-op)
 * and sets a blank response. The real login is via /api/auth/login.
 *
 * DELETE /api/auth/session
 * Clears the session cookie (logout pathway).
 */
export async function POST() {
    // This endpoint existed to accept a Firebase ID token and set a cookie.
    // It's now a no-op since login is handled directly via /api/auth/login.
    return NextResponse.json({ success: true });
}

export async function DELETE() {
    const response = NextResponse.json({ success: true });
    response.cookies.set(COOKIES.SESSION, '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 0,
    });
    return response;
}
