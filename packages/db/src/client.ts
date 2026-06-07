import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import type { PrismaClient as PrismaClientType } from "../generated/prisma/client";

type GlobalWithPrisma = typeof globalThis & {
  mamalikPrisma?: PrismaClientType;
};

const globalForPrisma = globalThis as GlobalWithPrisma;

function createPrismaClient(): PrismaClientType {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL is required before using the Mamalik database client.");
  }

  return new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  });
}

export function getPrismaClient(): PrismaClientType {
  if (!globalForPrisma.mamalikPrisma) {
    globalForPrisma.mamalikPrisma = createPrismaClient();
  }

  return globalForPrisma.mamalikPrisma;
}

export type { PrismaClientType as MamalikPrismaClient };
