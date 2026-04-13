import { NextRequest, NextResponse } from "next/server";
import { getAdminServices } from "@/lib/firebase-admin";

/**
 * POST /api/admin/update-teacher
 * Updates a teacher's auth email (if changed) and/or admin role.
 * Only called when email or isAdmin changes — other fields are updated via teacherService directly.
 */
export async function POST(req: NextRequest) {
    try {
        const { adminAuth, adminDb } = getAdminServices();

        // 1. Get Token
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
            const message = authError instanceof Error ? authError.message : String(authError);
            return NextResponse.json({ error: `Forbidden: Invalid session! (${message})` }, { status: 403 });
        }

        // 2. Check caller is admin or super_admin
        const callerDoc = await adminDb.collection("users").doc(decodedToken.uid).get();
        const callerRole = callerDoc.data()?.role;
        if (!callerDoc.exists || (callerRole !== "admin" && callerRole !== "super_admin")) {
            return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
        }

        const body = await req.json();
        const { firestoreDocId, newLoginEmail, isAdmin, teacherId } = body;

        if (!firestoreDocId) {
            return NextResponse.json({ error: "Missing firestoreDocId" }, { status: 400 });
        }

        // 3. If changing admin status, check caller has super_admin role (via Custom Claims)
        if (isAdmin !== undefined) {
            const callerClaimRole = decodedToken.role || callerRole;
            if (callerClaimRole !== "super_admin") {
                return NextResponse.json(
                    { error: "Forbidden: Only the portal owner (super_admin) can grant or revoke admin access." },
                    { status: 403 }
                );
            }
        }

        // 4. Find the corresponding Firebase Auth user by looking up the users collection
        // We search by the firestoreDocId which may NOT be the auth UID.
        // The teacher's Firestore doc id in "teachers" collection is different from "users" uid.
        // We need to find the auth user by email.
        // Strategy: find existing loginEmail from "users" collection that matches this teacher.
        // The teacher's "teachers" doc doesn't store the uid, so we locate via email.

        // Get the current teacher data from "teachers" collection
        const teacherDocRef = adminDb.collection("teachers").doc(firestoreDocId);
        const teacherDoc = await teacherDocRef.get();
        if (!teacherDoc.exists) {
            return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
        }

        // Current login email stored in users collection — find the auth user
        // The teacher's loginEmail is stored in teacherDoc as `loginEmail` (new field)
        // or falls back to `email` (old field, where login and display email were the same)
        const teacherData = teacherDoc.data()!;
        const currentLoginEmail: string = teacherData.loginEmail || teacherData.email;

        let authUid: string | null = null;
        try {
            const authUser = await adminAuth.getUserByEmail(currentLoginEmail);
            authUid = authUser.uid;
        } catch {
            // Auth user might not exist (old records), that's OK for display-only email changes
            console.warn(`Auth user not found for email: ${currentLoginEmail}`);
        }

        // 5. Update auth email if changed
        if (newLoginEmail && newLoginEmail !== currentLoginEmail && authUid) {
            await adminAuth.updateUser(authUid, { email: newLoginEmail });
            // Also update the users collection email
            await adminDb.collection("users").doc(authUid).update({ email: newLoginEmail });
        }

        // 6. Update role/claims if isAdmin changed
        if (isAdmin !== undefined && authUid) {
            const newRole = isAdmin ? "admin" : "teacher";
            await adminAuth.setCustomUserClaims(authUid, {
                role: newRole,
                admin: isAdmin === true,
                teacher: isAdmin !== true,
            });
            await adminDb.collection("users").doc(authUid).update({ role: newRole });
        }

        // 7. Update teacherId to assure they are tightly linked
        if (authUid && teacherId) {
             await adminDb.collection("users").doc(authUid).update({ teacherId });
        }

        return NextResponse.json({ success: true, message: "Teacher updated successfully." });
    } catch (error: unknown) {
        console.error("Error updating teacher:", error);
        const message = error instanceof Error ? error.message : "Failed to update teacher.";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
