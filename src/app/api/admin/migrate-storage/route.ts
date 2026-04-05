import { NextRequest, NextResponse } from "next/server";
import { getAdminServices } from "@/lib/firebase-admin";
import { COOKIES, AUTH_ROLES } from "@/lib/constants";

/**
 * [Admin API] Migrate Firestore file links from Firebase Storage to local storage
 * POST /api/admin/migrate-storage
 */
export async function POST(request: NextRequest) {
    const session = request.cookies.get(COOKIES.SESSION)?.value;
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { adminAuth, adminDb } = getAdminServices();
        const decodedToken = await adminAuth.verifySessionCookie(session);
        
        if (decodedToken.role !== AUTH_ROLES.ADMIN) {
            return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
        }

        const stats = {
            homework: 0,
            resources: 0,
            moduleResources: 0
        };

        // 1. Migrate Homework Submissions
        const homeworkSnap = await adminDb.collection("homework_submissions").get();
        const homeworkPromises = homeworkSnap.docs.map(async (doc) => {
            const data = doc.data();
            if (data.fileUrl && data.fileUrl.includes("firebasestorage.googleapis.com")) {
                const storagePath = data.storagePath;
                if (storagePath) {
                    // Prefix with private/ to maintain security rules in the file API
                    const newPath = storagePath.startsWith("private/") ? storagePath : `private/${storagePath}`;
                    const newUrl = `/api/file?path=${encodeURIComponent(newPath)}`;
                    await doc.ref.update({ fileUrl: newUrl });
                    stats.homework++;
                }
            }
        });

        // 2. Migrate Global Resources
        const resourcesSnap = await adminDb.collection("resources").get();
        const resourcePromises = resourcesSnap.docs.map(async (doc) => {
            const data = doc.data();
            if (data.fileUrl && data.fileUrl.includes("firebasestorage.googleapis.com")) {
                const storagePath = data.storagePath;
                if (storagePath) {
                    // Prefix with public/ for resources
                    const newPath = storagePath.startsWith("public/") ? storagePath : `public/${storagePath}`;
                    const newUrl = `/api/file?path=${encodeURIComponent(newPath)}`;
                    await doc.ref.update({ fileUrl: newUrl });
                    stats.resources++;
                }
            }
        });

        // 3. Migrate Module Resources
        const moduleSnap = await adminDb.collection("module_resources").get();
        const modulePromises = moduleSnap.docs.map(async (doc) => {
            const data = doc.data();
            if (data.fileUrl && data.fileUrl.includes("firebasestorage.googleapis.com")) {
                const storagePath = data.storagePath;
                if (storagePath) {
                    // Prefix with public/ for module resources
                    const newPath = storagePath.startsWith("public/") ? storagePath : `public/${storagePath}`;
                    const newUrl = `/api/file?path=${encodeURIComponent(newPath)}`;
                    await doc.ref.update({ fileUrl: newUrl });
                    stats.moduleResources++;
                }
            }
        });

        await Promise.all([...homeworkPromises, ...resourcePromises, ...modulePromises]);

        console.log(`[Migration] Finished. Stats:`, stats);

        return NextResponse.json({ 
            success: true, 
            message: "Migration completed successfully", 
            stats 
        });

    } catch (error) {
        console.error("[Migration API] Error:", error);
        return NextResponse.json({ error: "Migration failed" }, { status: 500 });
    }
}
