import { PrismaClient } from '@prisma/client';

declare global {
  var _prisma: PrismaClient | undefined; // eslint-disable-line no-var
}

function createPrismaClient(): PrismaClient {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });
}

/**
 * Build-safe Prisma singleton.
 * - Uses globalThis in development to survive hot-reloads without exhausting connections.
 * - In production, creates a single instance per process.
 * - During Next.js build time, DATABASE_URL may be a dummy value — that's fine because
 *   PrismaClient is only *connected* when the first query runs, not on instantiation.
 */
export const prisma: PrismaClient =
  globalThis._prisma ?? (globalThis._prisma = createPrismaClient());
