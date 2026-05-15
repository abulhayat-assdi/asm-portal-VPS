export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { signJWT } from '@/lib/auth';
import { AUTH_ROLES, COOKIES } from '@/lib/constants';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const registerSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    name: z.string().min(1, 'Name is required'),
    batchName: z.string().optional(),
    roll: z.string().optional(),
});

// Rate limiter: max 5 registrations per IP per hour
const registerAttempts = new Map<string, { count: number; resetAt: number }>();
const MAX_REGISTER = 5;
const REGISTER_WINDOW_MS = 60 * 60 * 1000; // 1 hour

function checkRegisterRateLimit(ip: string): boolean {
    const now = Date.now();
    const entry = registerAttempts.get(ip);
    if (!entry || entry.resetAt < now) {
        registerAttempts.set(ip, { count: 1, resetAt: now + REGISTER_WINDOW_MS });
        return true;
    }
    if (entry.count >= MAX_REGISTER) return false;
    entry.count++;
    return true;
}

/**
 * POST /api/auth/register
 * Public endpoint — registers a new student account.
 */
export async function POST(req: NextRequest) {
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    if (!checkRegisterRateLimit(ip)) {
        return NextResponse.json(
            { error: 'Too many registration attempts. Please try again later.' },
            { status: 429 }
        );
    }

    try {
        const body = await req.json();
        const parsed = registerSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                { error: parsed.error.message },
                { status: 400 }
            );
        }

        const { email, password, name, batchName, roll } = parsed.data;
        const normalizedEmail = email.toLowerCase().trim();

        // 1. Check for existing account
        const existing = await prisma.user.findUnique({
            where: { email: normalizedEmail },
        });

        if (existing) {
            return NextResponse.json(
                { error: 'An account with this email already exists. Please log in instead.' },
                { status: 409 }
            );
        }

        // 2. Hash password
        const passwordHash = await bcrypt.hash(password, 12);

        // 3. Create user in DB
        const user = await prisma.user.create({
            data: {
                email: normalizedEmail,
                passwordHash,
                displayName: name,
                role: AUTH_ROLES.STUDENT,
                studentBatchName: batchName || null,
                studentRoll: roll || null,
                lastLoginAt: new Date(),
            },
        });

        // 4. Sign JWT and set cookie (auto-login after registration)
        const token = await signJWT({
            id: user.id,
            email: user.email,
            displayName: user.displayName,
            role: user.role,
            studentBatchName: user.studentBatchName ?? undefined,
            studentRoll: user.studentRoll ?? undefined,
        });

        const response = NextResponse.json(
            {
                success: true,
                uid: user.id,
                user: {
                    id: user.id,
                    email: user.email,
                    displayName: user.displayName,
                    role: user.role,
                    studentBatchName: user.studentBatchName,
                    studentRoll: user.studentRoll,
                },
            },
            { status: 201 }
        );

        response.cookies.set(COOKIES.SESSION, token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 60 * 60 * 24,
        });

        return response;
    } catch (error) {
        console.error('[Register API] Error:', error);
        const message = error instanceof Error ? error.message : 'Failed to register account';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
