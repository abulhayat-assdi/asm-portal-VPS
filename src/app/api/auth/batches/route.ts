import { NextRequest, NextResponse } from "next/server";
import { getAdminServices } from "@/lib/firebase-admin";

/**
 * GET /api/auth/batches
 * Public API route that proxies minimal batch/student data for registration.
 * Returns only non-sensitive fields (batchName, roll, name, batchType).
 * This replaces direct unauthenticated Firestore access to public_batch_students.
 *
 * Query params:
 *   - batchName (optional): filter by specific batch name
 *   - mode: "batches" (list unique batch names) | "students" (list students in batch)
 */
export async function GET(req: NextRequest) {
    try {
        const { adminDb } = getAdminServices();
        const { searchParams } = new URL(req.url);
        const mode = searchParams.get("mode") || "batches";
        const batchName = searchParams.get("batchName");

        const collectionRef = adminDb.collection("public_batch_students");

        if (mode === "batches") {
            // Return unique batch names only — no PII
            const snapshot = await collectionRef.get();
            const uniqueBatches = new Set<string>();

            snapshot.docs.forEach((doc) => {
                const data = doc.data();
                if (data.batchName) {
                    uniqueBatches.add(data.batchName);
                }
            });

            return NextResponse.json({
                batches: Array.from(uniqueBatches).sort(),
            });
        }

        if (mode === "students" && batchName) {
            // Return only minimal student info for registration dropdown
            const snapshot = await collectionRef.orderBy("roll", "asc").get();
            const students = snapshot.docs
                .map((doc) => {
                    const data = doc.data();
                    return {
                        batchName: data.batchName,
                        roll: data.roll,
                        name: data.name,
                        batchType: data.batchType || "",
                    };
                })
                .filter((s) => s.batchName === batchName);

            return NextResponse.json({ students });
        }

        // mode === "raw" — return batch metadata (name + status) for public pages
        const batchMap = new Map<string, { name: string; status: string }>();

        // Fetch from 'batches' collection
        try {
            const batchSnap = await adminDb.collection("batches").get();
            batchSnap.docs.forEach((doc) => {
                const data = doc.data();
                if (data.name) {
                    batchMap.set(data.name, {
                        name: data.name,
                        status: data.status || "",
                    });
                }
            });
        } catch (e) {
            console.error("Error fetching batches:", e);
        }

        // Supplement from public_batch_students
        try {
            const studentSnap = await collectionRef.get();
            studentSnap.docs.forEach((doc) => {
                const data = doc.data();
                if (data.batchName && !batchMap.has(data.batchName)) {
                    batchMap.set(data.batchName, {
                        name: data.batchName,
                        status: data.batchType || "",
                    });
                } else if (data.batchName && data.batchType) {
                    const existing = batchMap.get(data.batchName)!;
                    if (data.batchType === "Running") {
                        existing.status = "Running";
                    }
                }
            });
        } catch (e) {
            console.error("Error fetching public students:", e);
        }

        return NextResponse.json({
            batches: Array.from(batchMap.values()),
        });
    } catch (error) {
        console.error("[Batches API] Error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
