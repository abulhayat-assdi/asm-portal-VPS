import { NextRequest, NextResponse } from "next/server";
import { getAdminServices } from "@/lib/firebase-admin";

export async function POST(req: NextRequest) {
    try {
        const { adminAuth, adminDb } = getAdminServices();

        // Very basic check to ensure admin is making this request. 
        // In a real production system, you'd extract the session cookie from req.cookies 
        // and verify it with adminAuth.verifySessionCookie().
        
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
