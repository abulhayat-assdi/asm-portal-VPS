export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { signJWT } from '@/lib/auth';
import { COOKIES } from '@/lib/constants';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
});

// Simple in-memory rate limiter (per IP, resets on server restart)
// For production, use Redis or a DB-backed approach
const loginAttempts = new Map<string, { count: number; resetAt: number }>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

function checkRateLimit(ip: string): boolean {
    const now = Date.now();
    const entry = loginAttempts.get(ip);

    if (!entry || entry.resetAt < now) {
        loginAttempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
        return true; // allowed
    }

    if (entry.count >= MAX_ATTEMPTS) {
        return false; // blocked
    }

    entry.count++;
    return true; // allowed
}

/**
 * POST /api/auth/login
 * Body: { email, password }
 * Sets an HttpOnly session cookie with our JWT.
 */
export async function POST(req: NextRequest) {
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';

    // Rate limiting
    if (!checkRateLimit(ip)) {
        return NextResponse.json(
            { error: 'Too many failed login attempts. Please wait 15 minutes and try again.' },
            { status: 429 }
        );
    }

    try {
        const body = await req.json();
        const parsed = loginSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                { error: 'Invalid email or password format.' },
                { status: 400 }
            );
        }

        const { email, password } = parsed.data;

        // 1. Find user in DB
        const user = await prisma.user.findUnique({
            where: { email: email.toLowerCase().trim(), deletedAt: null },
        });

        if (!user) {
            return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
        }

        // 2. Verify password
        const isValid = await bcrypt.compare(password, user.passwordHash);
        if (!isValid) {
            return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
        }

        // 3. Update last login
        await prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
        });

        // 4. Sign JWT
        const token = await signJWT({
            id: user.id,
            email: user.email,
            displayName: user.displayName,
            role: user.role,
            teacherId: user.teacherId ?? undefined,
            studentBatchName: user.studentBatchName ?? undefined,
            studentRoll: user.studentRoll ?? undefined,
        });

        // 5. Set HttpOnly cookie
        const response = NextResponse.json({
            success: true,
            user: {
                id: user.id,
                email: user.email,
                displayName: user.displayName,
                role: user.role,
                teacherId: user.teacherId,
                studentBatchName: user.studentBatchName,
                studentRoll: user.studentRoll,
                profileImageUrl: user.profileImageUrl,
            },
        });

        response.cookies.set(COOKIES.SESSION, token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 60 * 60 * 24, // 24 hours
        });

        return response;
    } catch (error) {
        console.error('[Login API] Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
