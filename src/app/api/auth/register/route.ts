import { NextRequest, NextResponse } from "next/server";
import { getAdminServices } from "@/lib/firebase-admin";
import { AUTH_ROLES, COLLECTIONS } from "@/lib/constants";

export async function POST(req: NextRequest) {
    try {
        const { adminAuth, adminDb } = getAdminServices();
        const body = await req.json();
        const { email, password, name, batchName, roll } = body;

        if (!email || !password || !name) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // 1. Create Auth User
        const userRecord = await adminAuth.createUser({
            email,
            password,
            displayName: name,
        });

        try {
            // 2. Set custom claims (includes studentRoll/studentBatchName for
            //    free Firestore rule evaluation — avoids N+1 get() calls)
            await adminAuth.setCustomUserClaims(userRecord.uid, { 
                role: AUTH_ROLES.STUDENT,
                student: true,
                studentRoll: roll || null,
                studentBatchName: batchName || null,
            });

            // 3. Create Firestore Profile
            await adminDb.collection(COLLECTIONS.USERS).doc(userRecord.uid).set({
                uid: userRecord.uid,
                email: userRecord.email,
                displayName: userRecord.displayName,
                role: AUTH_ROLES.STUDENT,
                studentBatchName: batchName || null,
                studentRoll: roll || null,
                createdAt: new Date(),
                lastLogin: new Date(),
            });

            return NextResponse.json({ success: true, uid: userRecord.uid }, { status: 201 });
        } catch (firestoreError) {
            console.error("[Register API] Firestore failed, rolling back Auth user:", firestoreError);
            await adminAuth.deleteUser(userRecord.uid);
            throw firestoreError;
        }
    } catch (error) {
        console.error("[Register API] Error:", error);
        const errorMessage = error instanceof Error ? error.message : "Failed to register account";
        return NextResponse.json(
            { error: errorMessage },
            { status: 500 }
        );
    }
}
