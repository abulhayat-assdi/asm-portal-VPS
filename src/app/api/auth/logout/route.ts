import { NextResponse } from 'next/server';
import { COOKIES } from '@/lib/constants';

/**
 * DELETE /api/auth/logout
 * Clears the session cookie.
 */
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

// Also support POST for legacy compatibility
export { DELETE as POST };
