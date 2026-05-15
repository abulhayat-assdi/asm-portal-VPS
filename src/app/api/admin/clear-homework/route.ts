import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSessionUser, isAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET — show counts before deletion (admin only)
export async function GET(req: NextRequest) {
    const user = await getSessionUser(req);
    if (!user || !isAdmin(user)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const submissions = await prisma.homeworkSubmission.count();
    const assignments = await prisma.homeworkAssignment.count();
    return NextResponse.json({
        message: 'Call POST to delete all homework. This cannot be undone.',
        homeworkSubmissions: submissions,
        homeworkAssignments: assignments,
    });
}

// POST — delete all homework submissions and assignments (admin only)
export async function POST(req: NextRequest) {
    const user = await getSessionUser(req);
    if (!user || !isAdmin(user)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    try {
        const deletedSubmissions = await prisma.homeworkSubmission.deleteMany({});
        const deletedAssignments = await prisma.homeworkAssignment.deleteMany({});
        return NextResponse.json({
            success: true,
            deleted: {
                submissions: deletedSubmissions.count,
                assignments: deletedAssignments.count,
            },
        });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
