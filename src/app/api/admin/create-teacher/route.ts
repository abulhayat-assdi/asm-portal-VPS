import { NextRequest, NextResponse } from "next/server";
import { getAdminServices } from "@/lib/firebase-admin";

export async function POST(req: NextRequest) {
    try {
        const { adminAuth, adminDb } = getAdminServices();

        // 1. Get Token from Cookie or Authorization Header
        let token = req.cookies.get("__session")?.value;
        const authHeader = req.headers.get("Authorization");

        if (!token && authHeader?.startsWith("Bearer ")) {
            token = authHeader.split("Bearer ")[1];
        }

        if (!token) {
            return NextResponse.json(
                { error: "Forbidden: Missing authentication token" },
                { status: 403 }
            );
        }

        let decodedToken;
        try {
            decodedToken = await adminAuth.verifyIdToken(token);
        } catch (authError: unknown) {
            console.error("Auth verification failed in create-teacher:", authError);
            const message = authError instanceof Error ? authError.message : String(authError);
            return NextResponse.json(
                { error: `Forbidden: Invalid session! (${message})` },
                { status: 403 }
            );
        }

        // 2. Check caller is admin or super_admin
        const callerDoc = await adminDb
            .collection("users")
            .doc(decodedToken.uid)
            .get();

        const callerRole = callerDoc.data()?.role;
        if (!callerDoc.exists || (callerRole !== "admin" && callerRole !== "super_admin")) {
            return NextResponse.json(
                { error: "Forbidden: Admin access required" },
                { status: 403 }
            );
        }

        const body = await req.json();
        const { teacherId, loginEmail, displayEmail, password, name, phone, isAdmin, order } = body;

        if (!loginEmail || !password || !name) {
            return NextResponse.json(
                { error: "Missing required fields (loginEmail, password, name)" },
                { status: 400 }
            );
        }

        // 3. If granting admin, check caller has super_admin role (via Custom Claims)
        if (isAdmin) {
            const callerClaimRole = decodedToken.role || callerRole;
            if (callerClaimRole !== "super_admin") {
                return NextResponse.json(
                    { error: "Forbidden: Only the portal owner (super_admin) can grant admin access." },
                    { status: 403 }
                );
            }
        }

        // 4. Validate and format phone number for E.164 if necessary
        let formattedPhone = phone || undefined;
        if (formattedPhone && formattedPhone.startsWith("01") && formattedPhone.length === 11) {
            formattedPhone = "+88" + formattedPhone;
        }

        // 5. Create User in Firebase Authentication using loginEmail
        const userRecord = await adminAuth.createUser({
            email: loginEmail,
            password,
            displayName: name,
            ...(formattedPhone ? { phoneNumber: formattedPhone } : {}),
        });

        try {
            // 6. Set custom claims
            const role = isAdmin ? "admin" : "teacher";
            await adminAuth.setCustomUserClaims(userRecord.uid, {
                role,
                admin: isAdmin === true,
                teacher: isAdmin !== true,
            });

            // 7. Create the user profile in Firestore (uses loginEmail)
            await adminDb.collection("users").doc(userRecord.uid).set({
                uid: userRecord.uid,
                email: loginEmail,
                displayName: name,
                role,
                teacherId: teacherId || null,
                order: Number(order) || 0,
                createdAt: new Date(),
            });
        } catch (dbError: unknown) {
            // Rollback: Delete the dangling auth user if DB operations fail
            console.error("Database operation failed, rolling back user creation:", dbError);
            await adminAuth.deleteUser(userRecord.uid);
            const message = dbError instanceof Error ? dbError.message : String(dbError);
            return NextResponse.json({ error: `Database error: ${message}` }, { status: 500 });
        }

        return NextResponse.json(
            { success: true, uid: userRecord.uid, message: "Teacher created successfully." },
            { status: 201 }
        );
    } catch (error: unknown) {
        console.error("Error creating teacher:", error);
        const message = error instanceof Error ? error.message : "Failed to create teacher account.";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
