import { NextRequest, NextResponse } from "next/server";
import { getAdminServices } from "@/lib/firebase-admin";
import type { auth } from "firebase-admin";

export async function POST(req: NextRequest) {
    try {
        const { adminAuth, adminDb } = getAdminServices();

        // 1. Get Token from Cookie or Authorization Header
        let token = req.cookies.get('__session')?.value;
        const authHeader = req.headers.get('Authorization');
        
        if (!token && authHeader?.startsWith('Bearer ')) {
            token = authHeader.split('Bearer ')[1];
        }

        if (!token) {
            return NextResponse.json({ error: "Forbidden: Missing authentication token" }, { status: 403 });
        }

        let decodedToken;
        try {
            decodedToken = await adminAuth.verifyIdToken(token);
        } catch (authError: unknown) {
            console.error("Auth verification failed in create-teacher:", authError);
            const message = authError instanceof Error ? authError.message : String(authError);
            return NextResponse.json({ 
                error: `Forbidden: Invalid session! (${message})` 
            }, { status: 403 });
        }

        try {
            const callerDoc = await adminDb.collection("users").doc(decodedToken.uid).get();
            if (!callerDoc.exists || callerDoc.data()?.role !== 'admin') {
                return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
            }
        } catch (dbError) {
            console.error("Database check failed:", dbError);
            return NextResponse.json({ error: "Forbidden: Database error" }, { status: 403 });
        }

        const body = await req.json();
        const { email, password, name, phone, role, order } = body;

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
        const createUserOptions: auth.CreateRequest = {
            email,
            password,
            displayName: name,
        };
        if (formattedPhone) {
            createUserOptions.phoneNumber = formattedPhone;
        }

        const userRecord = await adminAuth.createUser(createUserOptions);

        try {
            // 2. Set custom claims for easier role checking in APIs
            await adminAuth.setCustomUserClaims(userRecord.uid, { 
                role: role === "admin" ? "admin" : "teacher",
                admin: role === 'admin',
                teacher: role !== 'admin'
            });

            // 3. Create the user profile in Firestore
            await adminDb.collection("users").doc(userRecord.uid).set({
                uid: userRecord.uid,
                email: userRecord.email,
                displayName: userRecord.displayName,
                role: role === "admin" ? "admin" : "teacher",
                order: Number(order) || 0, // Store as number
                createdAt: new Date(),
            });
        } catch (dbError: unknown) {
            // Rollback: Delete the dangling auth user if DB operations fail
            console.error("Database operation failed, rolling back user creation:", dbError);
            await adminAuth.deleteUser(userRecord.uid);
            const message = dbError instanceof Error ? dbError.message : String(dbError);
            return NextResponse.json(
                { error: `Database error: ${message}` },
                { status: 500 }
            );
        }

        return NextResponse.json(
            { success: true, uid: userRecord.uid, message: "Teacher created successfully." },
            { status: 201 }
        );
    } catch (error: unknown) {
        console.error("Error creating teacher:", error);
        const message = error instanceof Error ? error.message : "Failed to create teacher account.";
        return NextResponse.json(
            { error: message },
            { status: 500 }
        );
    }
}
