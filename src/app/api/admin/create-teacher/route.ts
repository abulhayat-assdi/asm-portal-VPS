import { NextRequest, NextResponse } from "next/server";
import { getAdminServices } from "@/lib/firebase-admin";

export async function POST(req: NextRequest) {
    try {
        const { adminAuth, adminDb } = getAdminServices();

        const sessionCookie = req.cookies.get('__session')?.value;
        if (!sessionCookie) {
            return NextResponse.json({ error: "Forbidden: Missing session cookie" }, { status: 403 });
        }

        try {
            const decodedToken = await adminAuth.verifySessionCookie(sessionCookie, true);
            const callerDoc = await adminDb.collection("users").doc(decodedToken.uid).get();
            if (!callerDoc.exists || callerDoc.data()?.role !== 'admin') {
                return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
            }
        } catch (authError) {
            console.error("Auth verification failed:", authError);
            return NextResponse.json({ error: "Forbidden: Invalid session" }, { status: 403 });
        }

        const body = await req.json();
        const { email, password, name, phone, role } = body;

        if (!email || !password || !name) {
            return NextResponse.json(
                { error: "Missing required fields (email, password, name)" },
                { status: 400 }
            );
        }

        // Validate and format phone number for E.164 if necessary
        let formattedPhone = phone || undefined;
        if (formattedPhone && formattedPhone.startsWith("01") && formattedPhone.length === 11) {
            formattedPhone = "+88" + formattedPhone;
        }

        // 1. Create User in Firebase Authentication
        const userRecord = await adminAuth.createUser({
            email,
            password,
            displayName: name,
            phoneNumber: formattedPhone,
        });

        try {
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
        } catch (dbError) {
            // Rollback: Delete the dangling auth user if DB operations fail
            console.error("Database operation failed, rolling back user creation:", dbError);
            await adminAuth.deleteUser(userRecord.uid);
            throw dbError; // Re-throw to be caught by the outer catch block
        }

        return NextResponse.json(
            { success: true, uid: userRecord.uid, message: "Teacher created successfully." },
            { status: 201 }
        );
    } catch (error: any) {
        console.error("Error creating teacher:", error);
        return NextResponse.json(
            { error: "Failed to create teacher account. Please check the logs." },
            { status: 500 }
        );
    }
}
