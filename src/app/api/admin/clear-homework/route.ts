import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET — show counts before deletion
export async function GET() {
    const submissions = await prisma.homeworkSubmission.count();
    const assignments = await prisma.homeworkAssignment.count();
    return NextResponse.json({
        message: 'Call POST to delete all homework. This cannot be undone.',
        homeworkSubmissions: submissions,
        homeworkAssignments: assignments,
    });
}

// POST — delete all homework submissions and assignments
export async function POST() {
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
