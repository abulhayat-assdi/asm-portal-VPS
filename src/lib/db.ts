import { PrismaClient } from '@prisma/client';

let _prisma: PrismaClient | undefined;

const getPrisma = () => {
  if (typeof window !== 'undefined') return {} as PrismaClient;
  
  if (!_prisma) {
    try {
      _prisma = new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
      });
    } catch (e) {
      console.error('Failed to initialize PrismaClient:', e);
      return {} as PrismaClient;
    }
  }

  return _prisma;
};

// Export a proxy that lazy-loads the client
export const prisma = new Proxy({} as PrismaClient, {
  get: (target, prop) => {
    const client = getPrisma();
    return (client as any)[prop];
  }
});


