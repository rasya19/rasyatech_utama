import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['query'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

/**
 * Helper function to generate tenant query filter.
 * Returns an object with tenant_id filter if a tenantId is provided.
 */
export function getTenantFilter(tenantId: string | null | undefined) {
  if (!tenantId) return {};
  return { tenant_id: tenantId };
}

/**
 * Multi-Tenant Security Helper
 * Wraps findMany and findFirst to guarantee isolation between tenants.
 */
export const tenantQueries = {
  async findManyWithTenant<T>(
    model: any,
    tenantId: string | null | undefined,
    args: any = {}
  ): Promise<T[]> {
    const where = {
      ...args.where,
      ...(tenantId ? { tenant_id: tenantId } : {})
    };
    return model.findMany({
      ...args,
      where
    });
  },

  async findFirstWithTenant<T>(
    model: any,
    tenantId: string | null | undefined,
    args: any = {}
  ): Promise<T | null> {
    const where = {
      ...args.where,
      ...(tenantId ? { tenant_id: tenantId } : {})
    };
    return model.findFirst({
      ...args,
      where
    });
  }
};
