import { prisma } from '../lib/prisma';

export class TenantsService {
  static async getAll() {
    return prisma.tenant.findMany({
      orderBy: { updatedAt: 'desc' }
    });
  }

  static async getById(id: string) {
    return prisma.tenant.findUnique({
      where: { id }
    });
  }

  static async create(data: any) {
    return prisma.tenant.create({
      data: {
        ...data,
        status: data.status || 'active'
      }
    });
  }

  static async update(id: string, data: any) {
    return prisma.tenant.update({
      where: { id },
      data
    });
  }

  static async delete(id: string) {
    await prisma.tenant.delete({
      where: { id }
    });
    return { success: true };
  }
}
