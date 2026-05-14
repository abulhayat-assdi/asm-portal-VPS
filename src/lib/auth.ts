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

// Get the secret as a Uint8Array (required by jose)
function getJWTSecret(): Uint8Array {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error('[Auth] JWT_SECRET environment variable is not set.');
    }
    return new TextEncoder().encode(secret);
}

/**
 * Sign a JWT token with the given payload.
 * Default expiry: 24 hours (configurable via JWT_EXPIRES_IN env).
 */
export async function signJWT(payload: JWTPayload): Promise<string> {
    const secret = getJWTSecret();
    const expiresIn = process.env.JWT_EXPIRES_IN || '24h';

    return new SignJWT({ ...payload })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime(expiresIn)
        .sign(secret);
}

/**
 * Verify a JWT token and return the payload.
 * Throws if the token is invalid or expired.
 */
export async function verifyJWT(token: string): Promise<JWTPayload> {
    const secret = getJWTSecret();
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as JWTPayload;
}

/**
 * Extract and verify the session user from the request cookie.
 * Returns null if no valid session exists (does NOT throw).
 */
export async function getSessionUser(request: NextRequest): Promise<JWTPayload | null> {
    try {
        const token = request.cookies.get(COOKIES.SESSION)?.value;
        if (!token) return null;
        return await verifyJWT(token);
    } catch {
        return null;
    }
}

/**
 * Server Component version: Extract and verify the session user from cookies().
 * Use this in React Server Components (RSCs).
 */
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


/**
 * Helper: require a valid session, returning the user or null.
 * Same as getSessionUser but also accepts Authorization: Bearer header
 * (for file uploads which send auth via XHR header).
 */
export async function getSessionUserFromRequestOrBearer(request: NextRequest): Promise<JWTPayload | null> {
    try {
        // 1. Try cookie first (standard web requests)
        const cookieToken = request.cookies.get(COOKIES.SESSION)?.value;
        if (cookieToken) {
            return await verifyJWT(cookieToken);
        }

        // 2. Try Authorization: Bearer header (XHR uploads)
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

/**
 * Role check helpers
 */
export const isAdmin = (user: JWTPayload) =>
    user.role === 'admin' || user.role === 'super_admin';

export const isSuperAdmin = (user: JWTPayload) =>
    user.role === 'super_admin';

export const isTeacherOrAdmin = (user: JWTPayload) =>
    user.role === 'teacher' || user.role === 'admin' || user.role === 'super_admin';
