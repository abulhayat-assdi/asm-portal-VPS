import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function GET() {
    try {
        const email = 'mohammadabulhayatt@gmail.com';
        const password = 'Password@123';
        const hashedPassword = await bcrypt.hash(password, 10);

        console.log('--- Setup API Triggered ---');

        // 1. Create Super Admin
        const user = await prisma.user.upsert({
            where: { email },
            update: {
                passwordHash: hashedPassword,
                role: 'super_admin',
                displayName: 'Abul Hayat'
            },
            create: {
                email,
                passwordHash: hashedPassword,
                role: 'super_admin',
                displayName: 'Abul Hayat'
            }
        });

        // 2. Create Sample Blog
        await prisma.post.upsert({
            where: { slug: 'welcome' },
            update: {},
            create: {
                title: 'Welcome to the New Portal',
                slug: 'welcome',
                excerpt: 'Our new portal is now live.',
                content: '<p>Migration successful!</p>',
                status: 'published',
                publishedAt: new Date()
            }
        });

        return NextResponse.json({
            success: true,
            message: 'Database initialized and Admin created!',
            user: user.email,
            password: 'Password@123'
        });
    } catch (error: any) {
        console.error('Setup Error:', error);
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}
