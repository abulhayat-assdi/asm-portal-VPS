'use strict';

/**
 * Idempotent seed — safe to run on every container start.
 * Uses upsert so re-deploying never creates duplicates.
 */
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  // ── CV Templates ────────────────────────────────────────────────────────────
  const defaultConfig = {
    sidebarWidthPercent: 32,
    sidebarBgColor: '#1a2f4e',
    sidebarTextColor: '#ffffff',
    showProfilePhoto: true,
    profilePhotoSizePx: 80,
    profilePhotoShape: 'circle',
    contentBgColor: '#ffffff',
    nameColor: '#1a2f4e',
    nameFontSize: 22,
    sectionHeadingColor: '#1a2f4e',
    sectionHeadingFontSize: 8.5,
    bodyFontSize: 10.5,
    sidebarFontSize: 10,
    sidebarSections: ['skills', 'languages', 'hobbies'],
    accentColor: '#1a2f4e',
  };

  const template = await prisma.cvTemplate.upsert({
    where: { slug: 'classic-two-column' },
    create: {
      name: 'Classic Two-Column',
      slug: 'classic-two-column',
      description: 'Professional two-column CV with a dark navy sidebar',
      isActive: true,
      config: defaultConfig,
    },
    update: {
      name: 'Classic Two-Column',
      description: 'Professional two-column CV with a dark navy sidebar',
      isActive: true,
      config: defaultConfig,
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
