const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding CV templates...');

    const templates = [
        {
            name: 'Classic Two Column',
            slug: 'classic-two-column',
            description: 'A professional two-column layout with a dark navy sidebar.',
            isActive: true,
            config: {
                primaryColor: '#1e3a5f',
                sidebarColor: '#1e3a5f',
                sidebarWidth: 35,
                fontFamily: 'Helvetica',
                photoShape: 'circle',
                showPhoto: true,
            },
        },
        {
            name: 'Modern Green',
            slug: 'modern-green',
            description: 'A contemporary design with an emerald green accent sidebar.',
            isActive: true,
            config: {
                primaryColor: '#059669',
                sidebarColor: '#059669',
                sidebarWidth: 33,
                fontFamily: 'Helvetica',
                photoShape: 'square',
                showPhoto: true,
            },
        },
    ];

    for (const template of templates) {
        await prisma.cvTemplate.upsert({
            where: { slug: template.slug },
            update: {},
            create: template,
        });
        console.log(`  ✓ ${template.name}`);
    }

    console.log('Seeding complete.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
