export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser, isTeacherOrAdmin } from "@/lib/auth";

/**
 * GET /api/tracker
 * Fetch unique batch names for the filter.
 */
export async function GET() {
    try {
        const batches = await prisma.dailyTrackerReport.findMany({
            select: { batchName: true },
            distinct: ["batchName"],
        });
        const names = batches.map(b => b.batchName).filter(Boolean).sort();
        return NextResponse.json({ success: true, batches: names });
    } catch (err) {
        console.error("[Tracker API GET] Error:", err);
        return NextResponse.json({ success: false, batches: [] });
    }
}

/**
 * POST /api/tracker
 * Handles dashboard data retrieval, export data, and report submission.
 */
export async function POST(request: NextRequest) {
    try {
        const data = await request.json();

        // -- Dashboard Action --
        if (data.action === "getDashboardData") {
            const caller = await getSessionUser(request);
            if (!caller || !isTeacherOrAdmin(caller)) {
                return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
            }

            const { date, batch } = data.payload;
            if (!date || !batch) {
                return NextResponse.json({ success: false, message: "Date and batch required" });
            }

            const reports = await prisma.dailyTrackerReport.findMany({
                where: { batchName: batch, date },
            });

            const mapped = reports.map((d: any) => {
                const reportData = d.reportData as any;
                const tasks = reportData?.tasks || [];
                return {
                    id: d.id,
                    captain: reportData?.studentName || "",
                    score: reportData?.score || 0,
                    items: tasks.map((t: any, idx: number) => ({
                        number: idx + 1,
                        label: t.question,
                        status: t.status,
                        reason: t.reason,
                    })),
                };
            });

            return NextResponse.json({ success: true, reports: mapped });
        }

        // -- Export Action --
        if (data.action === "getExportData") {
            const caller = await getSessionUser(request);
            if (!caller || !isTeacherOrAdmin(caller)) {
                return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
            }

            const { batch, from, to } = data.payload;
            if (!batch || !from || !to) {
                return NextResponse.json({ success: false, message: "Missing export parameters" });
            }

            const reports = await prisma.dailyTrackerReport.findMany({
                where: {
                    batchName: batch,
                    date: { gte: from, lte: to },
                },
                orderBy: { date: "asc" },
            });

            const headers = ["Date", "Captains Name", "Batch", "Score"];
            const rows: any[] = [];

            reports.forEach((d: any, idx: number) => {
                const reportData = d.reportData as any;
                const tasks = reportData?.tasks || [];

                if (idx === 0) {
                    tasks.forEach((t: any) => headers.push(t.question));
                }

                const row = [d.date, reportData?.studentName || "", d.batchName, reportData?.score || 0];
                tasks.forEach((t: any) => row.push(t.status || ""));
                rows.push(row);
            });

            return NextResponse.json({ success: true, headers, rows, count: rows.length });
        }

        // -- Default: Submit Tracker Report --
        const { studentName, batchName, date, tasks, score } = data;

        if (!studentName || !batchName || !date || !tasks) {
            return NextResponse.json({ error: "Missing required fields for submission" }, { status: 400 });
        }

        const report = await prisma.dailyTrackerReport.create({
            data: {
                batchName,
                date,
                reportData: { studentName, tasks, score: score || 0 },
            },
        });

        return NextResponse.json({ success: true, id: report.id });
    } catch (err) {
        console.error("[Tracker API] Error:", err);
        const message = err instanceof Error ? err.message : "An internal error occurred.";
        return NextResponse.json({ success: false, message }, { status: 500 });
    }
}
