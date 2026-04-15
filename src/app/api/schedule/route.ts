import { NextRequest, NextResponse } from 'next/server';
import { getAdminServices } from "@/lib/firebase-admin";

export async function POST(req: NextRequest) {
    try {
        const sessionCookie = req.cookies.get('__session')?.value;
        if (!sessionCookie) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { adminAuth, adminDb } = getAdminServices();
        const decodedToken = await adminAuth.verifyIdToken(sessionCookie);
        const callerDoc = await adminDb.collection("users").doc(decodedToken.uid).get();

        if (!callerDoc.exists || callerDoc.data()?.role !== 'admin') {
            return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
        }

        const body = await req.json();

        if (Array.isArray(body)) {
            // Bulk Add Logic
            const validSchedules = body.filter(s => s.teacherId && s.teacherName);
            if (validSchedules.length === 0) {
                return NextResponse.json({ error: "No valid schedules with teacherId and teacherName provided" }, { status: 400 });
            }

            const batch = adminDb.batch();
            validSchedules.forEach(schedule => {
                const newDocRef = adminDb.collection("class_schedules").doc();
                batch.set(newDocRef, {
                    date: schedule.date?.trim() || "",
                    day: schedule.day?.trim() || "",
                    batch: schedule.batch?.trim() || "",
                    subject: schedule.subject?.trim() || "",
                    time: schedule.time?.trim() || "",
                    teacherId: schedule.teacherId?.trim() || "",
                    teacherName: schedule.teacherName?.trim() || "",
                    status: schedule.status || "Scheduled",
                    createdAt: new Date()
                });
            });

            await batch.commit();
            return NextResponse.json({ success: true, message: `Bulk added ${validSchedules.length} schedules successfully` });
        } else {
            // Single Object Logic
            if (!body.teacherId || !body.teacherName) {
                return NextResponse.json({ error: "teacherId and teacherName are required" }, { status: 400 });
            }

            await adminDb.collection("class_schedules").add({
                date: body.date?.trim() || "",
                day: body.day?.trim() || "",
                batch: body.batch?.trim() || "",
                subject: body.subject?.trim() || "",
                time: body.time?.trim() || "",
                teacherId: body.teacherId?.trim() || "",
                teacherName: body.teacherName?.trim() || "",
                status: body.status || "Scheduled",
                createdAt: new Date()
            });

            return NextResponse.json({ success: true, message: "Single schedule added successfully" });
        }

    } catch (error: unknown) {
        console.error('POST Error:', error);
        const message = error instanceof Error ? error.message : String(error);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
