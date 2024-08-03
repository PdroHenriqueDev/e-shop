import {describe, it, expect, vi, beforeEach, afterEach} from 'vitest';
import {PrismaClient} from '@prisma/client';
import prisma from './prisma';

vi.mock('@prisma/client', () => {
  const PrismaClientMock = vi.fn();

  return {PrismaClient: PrismaClientMock};
});

const prismaClientSingleton = () => {
  return new PrismaClient();
};

declare const globalThis: {
  prismaGlobal: ReturnType<typeof prismaClientSingleton>;
} & typeof global;

describe('Prisma Client Singleton', () => {
  beforeEach(() => {
    globalThis.prismaGlobal = undefined;
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('should create a new PrismaClient instance if none exists', () => {
    const prismaInstance = prisma;

    expect(PrismaClient).toHaveBeenCalled();
    expect(prismaInstance).toBeInstanceOf(PrismaClient);
  });

  it('should use the existing PrismaClient instance if it exists', () => {
    const firstInstance = prisma;
    const secondInstance = prisma;

    expect(PrismaClient).toHaveBeenCalledTimes(1);
    expect(firstInstance).toBe(secondInstance);
  });

  it('should not initialize prismaGlobal in production environment', async () => {
    vi.stubEnv('NODE_ENV', 'production');

    expect(globalThis.prismaGlobal).toBeUndefined();
    expect(PrismaClient).toHaveBeenCalledTimes(1);
  });
});
