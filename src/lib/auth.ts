import { SignJWT, jwtVerify } from 'jose';
import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { COOKIES } from './constants';


export interface JWTPayload {
    id: string;
    email: string;
    displayName: string;
    role: string;
    teacherId?: string;
    studentBatchName?: string;
    studentRoll?: string;
}

function getJWTSecret(): Uint8Array {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error('[Auth] JWT_SECRET environment variable is not set.');
    }
    return new TextEncoder().encode(secret);
}

export async function signJWT(payload: JWTPayload): Promise<string> {
    const secret = getJWTSecret();
    // Default to 30d to match SESSION_MAX_AGE cookie (was 24h — caused "expired token" failures)
    const expiresIn = process.env.JWT_EXPIRES_IN || '30d';

    return new SignJWT({ ...payload })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime(expiresIn)
        .sign(secret);
}

export async function verifyJWT(token: string): Promise<JWTPayload> {
    const secret = getJWTSecret();
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as JWTPayload;
}

export async function getSessionUser(request: NextRequest): Promise<JWTPayload | null> {
    try {
        const token = request.cookies.get(COOKIES.SESSION)?.value;
        if (!token) return null;
        return await verifyJWT(token);
    } catch {
        return null;
    }
}

export async function getServerSessionUser(): Promise<JWTPayload | null> {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get(COOKIES.SESSION)?.value;
        if (!token) return null;
        return await verifyJWT(token);
    } catch {
        return null;
    }
}

export async function getSessionUserFromRequestOrBearer(request: NextRequest): Promise<JWTPayload | null> {
    try {
        const cookieToken = request.cookies.get(COOKIES.SESSION)?.value;
        if (cookieToken) {
            return await verifyJWT(cookieToken);
        }

        const authHeader = request.headers.get('Authorization');
        if (authHeader?.startsWith('Bearer ')) {
            const bearerToken = authHeader.substring(7);
            return await verifyJWT(bearerToken);
        }

        return null;
    } catch {
        return null;
    }
}

export const isAdmin = (user: JWTPayload) =>
    user.role === 'admin' || user.role === 'super_admin';

export const isSuperAdmin = (user: JWTPayload) =>
    user.role === 'super_admin';

export const isTeacherOrAdmin = (user: JWTPayload) =>
    user.role === 'teacher' || user.role === 'admin' || user.role === 'super_admin';
