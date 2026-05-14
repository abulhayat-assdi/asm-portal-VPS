import { PrismaClient } from '@prisma/client';

let _prisma: PrismaClient | undefined;

/**
 * Build-safe Prisma client initialization.
 * During Next.js build time, DATABASE_URL might be missing.
 * We return a Proxy that only instantiates PrismaClient when a property is accessed,
 * and handles the case where the environment is not ready for a real connection.
 */
const getPrisma = (): PrismaClient => {
  if (typeof window !== 'undefined') return {} as PrismaClient;

  // If we are in a build environment without DATABASE_URL, return a dummy object
  // to prevent Prisma from throwing validation errors during static analysis.
  if (!process.env.DATABASE_URL && process.env.NODE_ENV === 'production') {
    return new Proxy({} as PrismaClient, {
      get: () => {
        return () => {
          console.warn('⚠️ Prisma accessed during build time without DATABASE_URL.');
          return Promise.resolve(null);
        };
      },
    });
  }

  if (!_prisma) {
    _prisma = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });
  }
  return _prisma;
};

export const prisma = new Proxy({} as PrismaClient, {
  get: (target, prop) => {
    const client = getPrisma();
    return (client as any)[prop];
  },
});
