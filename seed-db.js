const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    const email = 'mohammadabulhayatt@gmail.com';
    const password = 'Password@123'; // Default password
    const hashedPassword = await bcrypt.hash(password, 10);

    console.log('--- Initializing Database ---');

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
    console.log('✅ Super Admin created/updated:', user.email);

    // 2. Create Sample Blog Post
    const blog = await prisma.post.upsert({
        where: { slug: 'welcome-to-the-new-portal' },
        update: {},
        create: {
            title: 'Welcome to the New Portal',
            slug: 'welcome-to-the-new-portal',
            excerpt: 'We have successfully migrated our portal to a faster and more secure VPS environment.',
            content: '<p>Hello everyone! We are excited to announce that our new internal portal is now live on our self-hosted VPS.</p><p>This migration brings better performance and more control over our data.</p>',
            category: 'Update',
            status: 'published',
            publishedAt: new Date()
        }
    });
    console.log('✅ Sample blog post created:', blog.title);

    // 3. Create Sample Success Story
    const story = await prisma.successStory.create({
        data: {
            name: 'Sample Success',
            batch: 'Batch 01',
            role: 'Sales Manager',
            company: 'Tech Corp',
            story: 'This portal helped me manage my classes and resources effectively, leading to my career success.',
            isPublished: true
        }
    });
    console.log('✅ Sample success story created.');

    console.log('--- Database Setup Complete ---');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
