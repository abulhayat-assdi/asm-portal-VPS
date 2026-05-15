import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    // Require SETUP_SECRET to prevent unauthorized access
    const setupSecret = process.env.SETUP_SECRET;
    const providedSecret = req.nextUrl.searchParams.get('secret');

    if (!setupSecret || !providedSecret || providedSecret !== setupSecret) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    try {
        if (!prisma || !prisma.user) {
            throw new Error('Prisma client is not properly initialized.');
        }

        const { searchParams } = new URL(req.url);
        const action = searchParams.get('action');

        const email = 'mohammadabulhayatt@gmail.com';

        // action=check — just show current user state, no changes
        if (action === 'check') {
            const user = await prisma.user.findUnique({
                where: { email },
                select: { id: true, email: true, role: true, displayName: true, teacherId: true }
            });
            const hwCount = await prisma.homeworkSubmission.count();
            const assignCount = await prisma.homeworkAssignment.count();
            return NextResponse.json({ user, homeworkSubmissions: hwCount, homeworkAssignments: assignCount });
        }

        // action=fix-role — set role to super_admin
        if (action === 'fix-role') {
            const user = await prisma.user.update({
                where: { email },
                data: { role: 'super_admin' },
                select: { email: true, role: true, displayName: true }
            });
            return NextResponse.json({ success: true, message: 'Role updated to super_admin', user });
        }

        // default — create/reset admin account
        const password = 'Password@123';
        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.upsert({
            where: { email },
            update: { passwordHash: hashedPassword, role: 'super_admin', displayName: 'Abul Hayat' },
            create: { email, passwordHash: hashedPassword, role: 'super_admin', displayName: 'Abul Hayat' }
        });

        return NextResponse.json({
            success: true,
            message: 'Admin account created/reset with role: super_admin',
            user: { email: user.email, role: user.role },
        });
    } catch (error: any) {
        console.error('Setup Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
