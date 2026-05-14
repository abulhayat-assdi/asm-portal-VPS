import { PrismaClient } from '@prisma/client';

let _prisma: PrismaClient | undefined;

// Use a Proxy to ensure PrismaClient is only instantiated when first accessed.
// This prevents instantiation during Next.js static analysis/page collection phases
// where the environment might not be fully initialized or might be mistaken for a browser.
export const prisma = new Proxy({} as PrismaClient, {
  get: (target, prop) => {
    if (typeof window !== 'undefined') {
      return undefined;
    }
    
    if (!_prisma) {
      _prisma = new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
      });
    }
    
    return (_prisma as any)[prop];
  }
});
