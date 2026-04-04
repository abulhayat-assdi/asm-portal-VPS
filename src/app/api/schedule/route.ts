import { NextRequest, NextResponse } from 'next/server';
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import serviceAccount from '@/../serviceAccountKey.json'; // Import directly
import { getAdminServices } from "@/lib/firebase-admin";

// Config
const SHEET_ID = '10BxvXsxAjrA2nJ3ypns_LoP3y84VkZPLIfXrTr183eQ';

// Simple in-memory cache for Teacher Schedules
// Key: teacherId, Value: { data: classes[], timestamp: number }
const scheduleCache = new Map<string, { data: any[], timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function GET(req: NextRequest) {
    try {
        const sessionCookie = req.cookies.get('__session')?.value;
        if (!sessionCookie) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const { adminAuth } = getAdminServices();
        await adminAuth.verifyIdToken(sessionCookie);

        const searchParams = req.nextUrl.searchParams;
        const teacherId = searchParams.get('teacherId');

        const normalizedTeacherId = String(teacherId).trim();

        // 1. Check Cache
        const cached = scheduleCache.get(normalizedTeacherId);
        const now = Date.now();
        if (cached && (now - cached.timestamp < CACHE_TTL)) {
            return NextResponse.json({
                success: true,
                count: cached.data.length,
                data: cached.data,
                source: 'cache'
            });
        }

        // 2. Authenticate
        const serviceAccountAuth = new JWT({
            email: serviceAccount.client_email,
            key: serviceAccount.private_key,
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });

        // 3. Load the Sheet
        const doc = new GoogleSpreadsheet(SHEET_ID, serviceAccountAuth);
        await doc.loadInfo();

        const sheet = doc.sheetsByIndex[0]; // Gets the first tab (Worksheet 1)
        if (!sheet) {
            return NextResponse.json({ error: 'No sheet found in spreadsheet' }, { status: 404 });
        }

        // 4. Read Rows
        const rows = await sheet.getRows();

        // 5. Transform & Filter
        const classes = rows
            .filter(row => {
                const rowTeacherId = row.get('TeacherID');
                // If ID is 'ALL', return everything. Else filter.
                if (normalizedTeacherId === 'ALL') return true;
                return String(rowTeacherId).trim() === normalizedTeacherId;
            })
            .map(row => {
                return {
                    teacherId: row.get('TeacherID'),
                    teacherName: row.get('TeacherName'),
                    date: row.get('Date'),
                    day: row.get('Day'),
                    time: row.get('Time'),
                    batch: row.get('Batch'),
                    subject: row.get('Subject'),
                    status: row.get('Status') || 'Scheduled'
                };
            });

        // 6. Update Cache
        scheduleCache.set(normalizedTeacherId, {
            data: classes,
            timestamp: Date.now()
        });

        return NextResponse.json({
            success: true,
            count: classes.length,
            data: classes,
            source: 'network'
        });

    } catch (error: any) {
        console.error('Sheet Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// Mark Class as Completed (UPDATE Status)
export async function PUT(req: NextRequest) {
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
        const { teacherId, date, time, status } = body;

        if (!teacherId || !date || !time || !status) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const normalizedTeacherId = String(teacherId).trim();
        const normalizedDate = String(date).trim();
        const normalizedTime = String(time).trim();

        // 1. Authenticate
        const serviceAccountAuth = new JWT({
            email: serviceAccount.client_email,
            key: serviceAccount.private_key,
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });

        const doc = new GoogleSpreadsheet(SHEET_ID, serviceAccountAuth);
        await doc.loadInfo();
        const sheet = doc.sheetsByIndex[0];

        // 2. Find and Update Row
        const rows = await sheet.getRows();
        let updated = false;

        for (const row of rows) {
            const rowTeacherId = String(row.get('TeacherID')).trim();
            const rowDate = String(row.get('Date')).trim();
            const rowTime = String(row.get('Time')).trim();

            if (rowTeacherId === normalizedTeacherId && rowDate === normalizedDate && rowTime === normalizedTime) {
                row.set('Status', status);
                await row.save();
                updated = true;
                break;
            }
        }

        if (!updated) {
            return NextResponse.json({ error: 'Class not found to update' }, { status: 404 });
        }

        // 3. Invalidate Cache
        scheduleCache.delete(normalizedTeacherId);

        return NextResponse.json({ success: true, message: 'Class marked as completed' });

    } catch (error: any) {
        console.error('Update Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
