import { NextRequest, NextResponse } from "next/server";
import { getAdminServices } from "@/lib/firebase-admin";
import { COOKIES, AUTH_ROLES, COLLECTIONS } from "@/lib/constants";

export async function GET(req: NextRequest) {
    try {
        const { adminAuth, adminDb } = getAdminServices();

        // 1. Get Session Cookie
        const sessionCookie = req.cookies.get(COOKIES.SESSION)?.value;
        if (!sessionCookie) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // 2. Verify Token
        let decodedToken;
        try {
            decodedToken = await adminAuth.verifyIdToken(sessionCookie);
        } catch (err) {
            return NextResponse.json({ error: "Invalid session" }, { status: 401 });
        }

        const uid = decodedToken.uid;

        // 3. Fetch Firestore Profile
        const userDoc = await adminDb.collection(COLLECTIONS.USERS).doc(uid).get();
        if (!userDoc.exists) {
            return NextResponse.json({ error: "Profile not found" }, { status: 404 });
        }

        const profileData = userDoc.data() || {};
        const profile: Record<string, any> = {
            ...profileData,
            createdAt: profileData?.createdAt?.toDate() || new Date(),
            lastLogin: profileData?.lastLogin?.toDate() || new Date(),
        };

        // 4. Server-side Enrichment: Match teacher directory for all non-student users
        if (profile.role !== AUTH_ROLES.STUDENT) {
            try {
                const teachersSnapshot = await adminDb.collection(COLLECTIONS.TEACHERS).get();
                const allTeachers = teachersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

                // Match by loginEmail (portal login email) or display email
                const teacherMatch: any = allTeachers.find((t: any) =>
                    profile.email && (
                        t.loginEmail?.toLowerCase() === profile.email.toLowerCase() ||
                        t.email?.toLowerCase() === profile.email.toLowerCase()
                    )
                );

                if (teacherMatch) {
                    // Always sync teacherId from the teacher directory (source of truth)
                    if (teacherMatch.teacherId) {
                        profile.teacherId = teacherMatch.teacherId;
                        // Persistently save to Firestore users doc if missing or different
                        if (profileData.teacherId !== teacherMatch.teacherId) {
                            await adminDb.collection(COLLECTIONS.USERS).doc(uid).update({
                                teacherId: teacherMatch.teacherId
                            }).catch(() => { }); // silently ignore if update fails
                        }
                    }
                    if (!profile.profileImageUrl && teacherMatch.profileImageUrl) {
                        profile.profileImageUrl = teacherMatch.profileImageUrl;
                    }
                }
            } catch (enrichError) {
                console.error("[Profile API] Enrichment failed:", enrichError);
                // Continue anyway, enrichment is non-critical
            }
        }

        // 5. Sync Custom Claims if stale — ensures Firestore rules can rely on
        //    request.auth.token without expensive get() fallbacks (N+1 fix)
        try {
            const tokenClaims = decodedToken as Record<string, any>;
            const expectedClaims: Record<string, any> = {
                role: profile.role,
            };

            // For students, include identity claims used by exam_results rules
            if (profile.role === AUTH_ROLES.STUDENT) {
                expectedClaims.student = true;
                expectedClaims.studentRoll = profile.studentRoll || null;
                expectedClaims.studentBatchName = profile.studentBatchName || null;
            } else if (profile.role === AUTH_ROLES.SUPER_ADMIN) {
                expectedClaims.admin = true;
                expectedClaims.super_admin = true;
            } else if (profile.role === 'admin') {
                expectedClaims.admin = true;
                expectedClaims.teacher = false;
            } else if (profile.role === 'teacher') {
                expectedClaims.teacher = true;
                expectedClaims.admin = false;
            }

            // Check if any claim is out of sync
            const needsSync = Object.entries(expectedClaims).some(
                ([key, value]) => tokenClaims[key] !== value
            );

            if (needsSync) {
                await adminAuth.setCustomUserClaims(uid, expectedClaims);
                console.log(`[Profile API] Synced stale claims for ${uid}:`, expectedClaims);
            }
        } catch (claimsSyncError) {
            console.error("[Profile API] Claims sync failed:", claimsSyncError);
            // Non-critical — claims will be retried on next profile fetch
        }

        return NextResponse.json(profile);
    } catch (error) {
        console.error("[Profile API] Global error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
