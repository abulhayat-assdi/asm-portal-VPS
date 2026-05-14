import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        console.log('--- Setup API Triggered ---');
        
        // Check if prisma is initialized
        if (!prisma || !prisma.user) {
            throw new Error('Prisma client is not properly initialized. Check your DATABASE_URL and Docker setup.');
        }

        const email = 'mohammadabulhayatt@gmail.com';
        const password = 'Password@123';
        const hashedPassword = await bcrypt.hash(password, 10);

        // 1. Create Super Admin
        const user = await prisma.user.upsert({
            where: { email },
            update: {
                passwordHash: hashedPassword,
                role: 'admin',
                displayName: 'Abul Hayat'
            },
            create: {
                email,
                passwordHash: hashedPassword,
                role: 'admin',
                displayName: 'Abul Hayat'
            }
        });

        return NextResponse.json({
            success: true,
            message: 'Database initialized and Admin created!',
            user: user.email,
        });
    } catch (error: any) {
        console.error('Setup Error:', error);
        return NextResponse.json({
            success: false,
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        }, { status: 500 });
    }
}
