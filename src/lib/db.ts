import { PrismaClient } from '@prisma/client';

const prismaClientSingleton = () => {
  // Check if DATABASE_URL is present
  if (!process.env.DATABASE_URL) {
    console.warn('⚠️ DATABASE_URL is not set in environment variables.');
  }

  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });
};

declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') globalThis.prisma = prisma;

export { prisma };
