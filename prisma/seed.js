'use strict';

/**
 * Idempotent seed — safe to run on every container start.
 * Uses upsert so re-deploying never creates duplicates.
 */
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  // ── CV Templates ────────────────────────────────────────────────────────────
  const template = await prisma.cvTemplate.upsert({
    where: { slug: 'classic-two-column' },
    create: {
      name: 'Classic Two-Column',
      slug: 'classic-two-column',
      description: 'Professional two-column CV with a dark navy sidebar',
      isActive: true,
    },
    update: {
      name: 'Classic Two-Column',
      description: 'Professional two-column CV with a dark navy sidebar',
      isActive: true,
    },
  });

  console.log(`[seed] CvTemplate ready: "${template.name}" (${template.id})`);
}

main()
  .catch((e) => {
    console.error('[seed] Failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
