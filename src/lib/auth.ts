import { SignJWT, jwtVerify } from 'jose';
import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { COOKIES } from './constants';
import { prisma } from './db';
import { getEffectivePermissions, PermissionKey } from './permissions';


export interface JWTPayload {
    id: string;
    email: string;
    displayName: string;
    role: string;
    teacherId?: string;
    studentBatchName?: string;
    studentRoll?: string;
    permissions?: string[];
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
        const payload = await verifyJWT(token);
        
        const dbUser = await prisma.user.findUnique({
            where: { id: payload.id },
            select: { role: true, permissions: true }
        });
        
        if (dbUser) {
            payload.role = dbUser.role;
            payload.permissions = getEffectivePermissions(dbUser.role, dbUser.permissions as string[]);
        }
        
        return payload;
    } catch {
        return null;
    }
}

export async function getServerSessionUser(): Promise<JWTPayload | null> {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get(COOKIES.SESSION)?.value;
        if (!token) return null;
        const payload = await verifyJWT(token);
        
        const dbUser = await prisma.user.findUnique({
            where: { id: payload.id },
            select: { role: true, permissions: true }
        });
        
        if (dbUser) {
            payload.role = dbUser.role;
            payload.permissions = getEffectivePermissions(dbUser.role, dbUser.permissions as string[]);
        }
        
        return payload;
    } catch {
        return null;
    }
}

export async function getSessionUserFromRequestOrBearer(request: NextRequest): Promise<JWTPayload | null> {
    try {
        let payload: JWTPayload | null = null;
        const cookieToken = request.cookies.get(COOKIES.SESSION)?.value;
        
        if (cookieToken) {
            payload = await verifyJWT(cookieToken);
        } else {
            const authHeader = request.headers.get('Authorization');
            if (authHeader?.startsWith('Bearer ')) {
                const bearerToken = authHeader.substring(7);
                payload = await verifyJWT(bearerToken);
            }
        }
        
        if (payload) {
            const dbUser = await prisma.user.findUnique({
                where: { id: payload.id },
                select: { role: true, permissions: true }
            });
            if (dbUser) {
                payload.role = dbUser.role;
                payload.permissions = getEffectivePermissions(dbUser.role, dbUser.permissions as string[]);
            }
            return payload;
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

export const hasRequiredPermission = (user: JWTPayload, permission: PermissionKey) => {
    if (user.role === 'super_admin') return true;
    if (!user.permissions) return false;
    return user.permissions.includes(permission);
};
