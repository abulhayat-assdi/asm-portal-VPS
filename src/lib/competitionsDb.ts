import { prisma } from "./db";

let dbCheckDone = false;

/**
 * Automatically ensures that tables 'competitions', 'competition_submissions', and 'competition_form_templates'
 * exist in PostgreSQL database. This prevents "table public.competitions does not exist" errors when
 * database migrations haven't been run manually on production.
 */
export async function ensureCompetitionsTablesExist() {
    if (dbCheckDone) return;
    try {
        await prisma.$executeRawUnsafe(`
            CREATE TABLE IF NOT EXISTS "competition_form_templates" (
                "id" TEXT NOT NULL PRIMARY KEY,
                "name" TEXT NOT NULL,
                "schema" JSONB NOT NULL,
                "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
            );
        `);

        await prisma.$executeRawUnsafe(`
            CREATE TABLE IF NOT EXISTS "competitions" (
                "id" TEXT NOT NULL PRIMARY KEY,
                "title" TEXT NOT NULL,
                "description" TEXT,
                "batch_name" TEXT NOT NULL,
                "schema" JSONB NOT NULL,
                "is_active" BOOLEAN NOT NULL DEFAULT true,
                "start_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "end_date" TIMESTAMP(3),
                "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
            );
        `);

        await prisma.$executeRawUnsafe(`
            CREATE INDEX IF NOT EXISTS "competitions_batch_name_idx" ON "competitions"("batch_name");
        `);

        await prisma.$executeRawUnsafe(`
            CREATE TABLE IF NOT EXISTS "competition_submissions" (
                "id" TEXT NOT NULL PRIMARY KEY,
                "competition_id" TEXT NOT NULL,
                "type" TEXT NOT NULL,
                "team_name" TEXT,
                "roll_number" TEXT NOT NULL,
                "student_name" TEXT NOT NULL,
                "data" JSONB NOT NULL,
                "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT "competition_submissions_competition_id_fkey" FOREIGN KEY ("competition_id") REFERENCES "competitions"("id") ON DELETE CASCADE ON UPDATE CASCADE
            );
        `);

        await prisma.$executeRawUnsafe(`
            CREATE INDEX IF NOT EXISTS "competition_submissions_competition_id_idx" ON "competition_submissions"("competition_id");
        `);

        await prisma.$executeRawUnsafe(`
            CREATE INDEX IF NOT EXISTS "competition_submissions_type_idx" ON "competition_submissions"("type");
        `);

        dbCheckDone = true;
    } catch (err) {
        console.warn("[CompetitionsDB] Auto schema check warning:", err);
    }
}
