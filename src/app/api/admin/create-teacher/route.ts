import { NextRequest, NextResponse } from "next/server";
import { getAdminServices } from "@/lib/firebase-admin";

export async function POST(req: NextRequest) {
    try {
        const { adminAuth, adminDb } = getAdminServices();

        const sessionCookie = req.cookies.get('__session')?.value;
        if (!sessionCookie) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        try {
            const decodedToken = await adminAuth.verifyIdToken(sessionCookie);
            const callerDoc = await adminDb.collection("users").doc(decodedToken.uid).get();
            if (!callerDoc.exists || callerDoc.data()?.role !== 'admin') {
                return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
            }
        } catch (authError) {
            console.error("Auth verification failed:", authError);
            return NextResponse.json({ error: "Unauthorized: Invalid session" }, { status: 401 });
        }

        const body = await req.json();
        const { email, password, name, phone, role } = body;

        if (!email || !password || !name) {
            return NextResponse.json(
                { error: "Missing required fields (email, password, name)" },
                { status: 400 }
            );
        }

        // 1. Create User in Firebase Authentication
        const userRecord = await adminAuth.createUser({
            email,
            password,
            displayName: name,
            phoneNumber: phone || undefined,
        });

        // 2. Set custom claims if this is an admin
        if (role === 'admin') {
            await adminAuth.setCustomUserClaims(userRecord.uid, { admin: true });
        } else {
            await adminAuth.setCustomUserClaims(userRecord.uid, { teacher: true });
        }

        // 3. Create the user profile in Firestore
        await adminDb.collection("users").doc(userRecord.uid).set({
            uid: userRecord.uid,
            email: userRecord.email,
            displayName: userRecord.displayName,
            role: role === "admin" ? "admin" : "teacher",
            createdAt: new Date(),
        });

        return NextResponse.json(
            { success: true, uid: userRecord.uid, message: "Teacher created successfully." },
            { status: 201 }
        );
    } catch (error: any) {
        console.error("Error creating teacher:", error);
        return NextResponse.json(
            { error: error.message || "Failed to create teacher account" },
            { status: 500 }
        );
    }
}
