import { NextRequest, NextResponse } from "next/server";
import { getAdminServices } from "@/lib/firebase-admin";
import { COOKIES } from "@/lib/constants";

/**
 * POST /api/auth/session
 * Receives a Firebase ID token, verifies it, and sets an HttpOnly session cookie.
 * This prevents XSS attacks from reading the session token via document.cookie.
 */
export async function POST(req: NextRequest) {
    try {
        const { adminAuth } = getAdminServices();

        const body = await req.json();
        const { idToken } = body;

        if (!idToken || typeof idToken !== "string") {
            return NextResponse.json(
                { error: "Missing or invalid idToken" },
                { status: 400 }
            );
        }

        // Verify the token is valid before setting the cookie
        try {
            await adminAuth.verifyIdToken(idToken);
        } catch {
            return NextResponse.json(
                { error: "Invalid token" },
                { status: 401 }
            );
        }

        // Set HttpOnly, Secure cookie via response headers
        const response = NextResponse.json({ success: true });
        response.cookies.set(COOKIES.SESSION, idToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge: 86400, // 24 hours
        });

        return response;
    } catch (error) {
        console.error("[Session API] Error setting session:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/auth/session
 * Clears the session cookie (for logout).
 */
export async function DELETE() {
    try {
        const response = NextResponse.json({ success: true });
        response.cookies.set(COOKIES.SESSION, "", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge: 0, // Expire immediately
        });

        return response;
    } catch (error) {
        console.error("[Session API] Error clearing session:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
